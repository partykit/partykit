// TODO: lose this eslint-disable
/* eslint-disable @typescript-eslint/no-explicit-any */

/*!
 * Reconnecting WebSocket
 * by Pedro Ladaria <pedro.ladaria@gmail.com>
 * https://github.com/pladaria/reconnecting-websocket
 * License MIT
 */

import type { TypedEventTarget } from "./type-helper";

if (!globalThis.EventTarget || !globalThis.Event) {
  console.error(`
  PartySocket requires a global 'EventTarget' class to be available!
  You can polyfill this global by adding this to your code before any partysocket imports: 
  
  \`\`\`
  import 'partysocket/event-target-polyfill';
  \`\`\`
  Please file an issue at https://github.com/partykit/partykit if you're still having trouble.
`);
}

export class ErrorEvent extends Event {
  public message: string;
  public error: Error;
  constructor(error: Error, target: any) {
    super("error", target);
    this.message = error.message;
    this.error = error;
  }
}

export class CloseEvent extends Event {
  public code: number;
  public reason: string;
  public wasClean = true;
  constructor(code = 1000, reason = "", target: any) {
    super("close", target);
    this.code = code;
    this.reason = reason;
  }
}
export interface WebSocketEventMap {
  close: CloseEvent;
  error: ErrorEvent;
  message: MessageEvent;
  open: Event;
}

const Events = {
  Event,
  ErrorEvent,
  CloseEvent
};

function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg);
  }
}

function cloneEventBrowser(e: Event) {
  return new (e as any).constructor(e.type, e) as Event;
}

function cloneEventNode(e: Event) {
  if ("data" in e) {
    const evt = new MessageEvent(e.type, e);
    return evt;
  }

  if ("code" in e || "reason" in e) {
    const evt = new CloseEvent(
      // @ts-expect-error we need to fix event/listener types
      (e.code || 1999) as number,
      // @ts-expect-error we need to fix event/listener types
      (e.reason || "unknown reason") as string,
      e
    );
    return evt;
  }

  if ("error" in e) {
    const evt = new ErrorEvent(e.error as Error, e);
    return evt;
  }

  const evt = new Event(e.type, e);
  return evt;
}

const isNode =
  typeof process !== "undefined" &&
  typeof process.versions?.node !== "undefined" &&
  typeof document === "undefined";

const cloneEvent = isNode ? cloneEventNode : cloneEventBrowser;

export type Options = {
  WebSocket?: any;
  maxReconnectionDelay?: number;
  minReconnectionDelay?: number;
  reconnectionDelayGrowFactor?: number;
  minUptime?: number;
  connectionTimeout?: number;
  maxRetries?: number;
  maxEnqueuedMessages?: number;
  startClosed?: boolean;
  debug?: boolean;
  debugLogger?: (...args: any[]) => void;
};

const DEFAULT = {
  maxReconnectionDelay: 10000,
  minReconnectionDelay: 1000 + Math.random() * 4000,
  minUptime: 5000,
  reconnectionDelayGrowFactor: 1.3,
  connectionTimeout: 4000,
  maxRetries: Infinity,
  maxEnqueuedMessages: Infinity,
  startClosed: false,
  debug: false
};

let didWarnAboutMissingWebSocket = false;

export type UrlProvider = string | (() => string) | (() => Promise<string>);
export type ProtocolsProvider =
  | null
  | string
  | string[]
  | (() => string | string[] | null)
  | (() => Promise<string | string[] | null>);

export type Message = string | ArrayBuffer | Blob | ArrayBufferView;

export default class ReconnectingWebSocket extends (EventTarget as TypedEventTarget<WebSocketEventMap>) {
  private _ws: WebSocket | undefined;
  private _retryCount = -1;
  private _uptimeTimeout: ReturnType<typeof setTimeout> | undefined;
  private _connectTimeout: ReturnType<typeof setTimeout> | undefined;
  private _shouldReconnect = true;
  private _connectLock = false;
  private _binaryType: BinaryType = "blob";
  private _closeCalled = false;
  private _messageQueue: Message[] = [];

  private _debugLogger = console.log.bind(console);

  protected _url: UrlProvider;
  protected _protocols?: ProtocolsProvider;
  protected _options: Options;

  constructor(
    url: UrlProvider,
    protocols?: ProtocolsProvider,
    options: Options = {}
  ) {
    super();
    this._url = url;
    this._protocols = protocols;
    this._options = options;
    if (this._options.startClosed) {
      this._shouldReconnect = false;
    }
    if (this._options.debugLogger) {
      this._debugLogger = this._options.debugLogger;
    }
    this._connect();
  }

  static get CONNECTING() {
    return 0;
  }
  static get OPEN() {
    return 1;
  }
  static get CLOSING() {
    return 2;
  }
  static get CLOSED() {
    return 3;
  }

  get CONNECTING() {
    return ReconnectingWebSocket.CONNECTING;
  }
  get OPEN() {
    return ReconnectingWebSocket.OPEN;
  }
  get CLOSING() {
    return ReconnectingWebSocket.CLOSING;
  }
  get CLOSED() {
    return ReconnectingWebSocket.CLOSED;
  }

  get binaryType() {
    return this._ws ? this._ws.binaryType : this._binaryType;
  }

  set binaryType(value: BinaryType) {
    this._binaryType = value;
    if (this._ws) {
      this._ws.binaryType = value;
    }
  }

  /**
   * Returns the number or connection retries
   */
  get retryCount(): number {
    return Math.max(this._retryCount, 0);
  }

  /**
   * The number of bytes of data that have been queued using calls to send() but not yet
   * transmitted to the network. This value resets to zero once all queued data has been sent.
   * This value does not reset to zero when the connection is closed; if you keep calling send(),
   * this will continue to climb. Read only
   */
  get bufferedAmount(): number {
    const bytes = this._messageQueue.reduce((acc, message) => {
      if (typeof message === "string") {
        acc += message.length; // not byte size
      } else if (message instanceof Blob) {
        acc += message.size;
      } else {
        acc += message.byteLength;
      }
      return acc;
    }, 0);
    return bytes + (this._ws ? this._ws.bufferedAmount : 0);
  }

  /**
   * The extensions selected by the server. This is currently only the empty string or a list of
   * extensions as negotiated by the connection
   */
  get extensions(): string {
    return this._ws ? this._ws.extensions : "";
  }

  /**
   * A string indicating the name of the sub-protocol the server selected;
   * this will be one of the strings specified in the protocols parameter when creating the
   * WebSocket object
   */
  get protocol(): string {
    return this._ws ? this._ws.protocol : "";
  }

  /**
   * The current state of the connection; this is one of the Ready state constants
   */
  get readyState(): number {
    if (this._ws) {
      return this._ws.readyState;
    }
    return this._options.startClosed
      ? ReconnectingWebSocket.CLOSED
      : ReconnectingWebSocket.CONNECTING;
  }

  /**
   * The URL as resolved by the constructor
   */
  get url(): string {
    return this._ws ? this._ws.url : "";
  }

  /**
   * Whether the websocket object is now in reconnectable state
   */
  get shouldReconnect(): boolean {
    return this._shouldReconnect;
  }

  /**
   * An event listener to be called when the WebSocket connection's readyState changes to CLOSED
   */
  public onclose: ((event: CloseEvent) => void) | null = null;

  /**
   * An event listener to be called when an error occurs
   */
  public onerror: ((event: ErrorEvent) => void) | null = null;

  /**
   * An event listener to be called when a message is received from the server
   */
  public onmessage: ((event: MessageEvent) => void) | null = null;

  /**
   * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
   * this indicates that the connection is ready to send and receive data
   */
  public onopen: ((event: Event) => void) | null = null;

  /**
   * Closes the WebSocket connection or connection attempt, if any. If the connection is already
   * CLOSED, this method does nothing
   */
  public close(code = 1000, reason?: string) {
    this._closeCalled = true;
    this._shouldReconnect = false;
    this._clearTimeouts();
    if (!this._ws) {
      this._debug("close enqueued: no ws instance");
      return;
    }
    if (this._ws.readyState === this.CLOSED) {
      this._debug("close: already closed");
      return;
    }
    this._ws.close(code, reason);
  }

  /**
   * Closes the WebSocket connection or connection attempt and connects again.
   * Resets retry counter;
   */
  public reconnect(code?: number, reason?: string) {
    this._shouldReconnect = true;
    this._closeCalled = false;
    this._retryCount = -1;
    if (!this._ws || this._ws.readyState === this.CLOSED) {
      this._connect();
    } else {
      this._disconnect(code, reason);
      this._connect();
    }
  }

  /**
   * Enqueue specified data to be transmitted to the server over the WebSocket connection
   */
  public send(data: Message) {
    if (this._ws && this._ws.readyState === this.OPEN) {
      this._debug("send", data);
      this._ws.send(data);
    } else {
      const { maxEnqueuedMessages = DEFAULT.maxEnqueuedMessages } =
        this._options;
      if (this._messageQueue.length < maxEnqueuedMessages) {
        this._debug("enqueue", data);
        this._messageQueue.push(data);
      }
    }
  }

  private _debug(...args: unknown[]) {
    if (this._options.debug) {
      this._debugLogger("RWS>", ...args);
    }
  }

  private _getNextDelay() {
    const {
      reconnectionDelayGrowFactor = DEFAULT.reconnectionDelayGrowFactor,
      minReconnectionDelay = DEFAULT.minReconnectionDelay,
      maxReconnectionDelay = DEFAULT.maxReconnectionDelay
    } = this._options;
    let delay = 0;
    if (this._retryCount > 0) {
      delay =
        minReconnectionDelay *
        Math.pow(reconnectionDelayGrowFactor, this._retryCount - 1);
      if (delay > maxReconnectionDelay) {
        delay = maxReconnectionDelay;
      }
    }
    this._debug("next delay", delay);
    return delay;
  }

  private _wait(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, this._getNextDelay());
    });
  }

  private _getNextProtocols(
    protocolsProvider: ProtocolsProvider | null
  ): Promise<string | string[] | null> {
    if (!protocolsProvider) return Promise.resolve(null);

    if (
      typeof protocolsProvider === "string" ||
      Array.isArray(protocolsProvider)
    ) {
      return Promise.resolve(protocolsProvider);
    }

    if (typeof protocolsProvider === "function") {
      const protocols = protocolsProvider();
      if (!protocols) return Promise.resolve(null);

      if (typeof protocols === "string" || Array.isArray(protocols)) {
        return Promise.resolve(protocols);
      }

      // @ts-expect-error redundant check
      if (protocols.then) {
        return protocols;
      }
    }

    throw Error("Invalid protocols");
  }

  private _getNextUrl(urlProvider: UrlProvider): Promise<string> {
    if (typeof urlProvider === "string") {
      return Promise.resolve(urlProvider);
    }
    if (typeof urlProvider === "function") {
      const url = urlProvider();
      if (typeof url === "string") {
        return Promise.resolve(url);
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (url.then) {
        return url;
      }

      // return url;
    }
    throw Error("Invalid URL");
  }

  private _connect() {
    if (this._connectLock || !this._shouldReconnect) {
      return;
    }
    this._connectLock = true;

    const {
      maxRetries = DEFAULT.maxRetries,
      connectionTimeout = DEFAULT.connectionTimeout
    } = this._options;

    if (this._retryCount >= maxRetries) {
      this._debug("max retries reached", this._retryCount, ">=", maxRetries);
      return;
    }

    this._retryCount++;

    this._debug("connect", this._retryCount);
    this._removeListeners();

    this._wait()
      .then(() =>
        Promise.all([
          this._getNextUrl(this._url),
          this._getNextProtocols(this._protocols || null)
        ])
      )
      .then(([url, protocols]) => {
        // close could be called before creating the ws
        if (this._closeCalled) {
          this._connectLock = false;
          return;
        }
        if (
          !this._options.WebSocket &&
          typeof WebSocket === "undefined" &&
          !didWarnAboutMissingWebSocket
        ) {
          console.error(`‼️ No WebSocket implementation available. You should define options.WebSocket. 

For example, if you're using node.js, run \`npm install ws\`, and then in your code:

import PartySocket from 'partysocket';
import WS from 'ws';

const partysocket = new PartySocket({
  host: "127.0.0.1:1999",
  room: "test-room",
  WebSocket: WS
});

`);
          didWarnAboutMissingWebSocket = true;
        }
        const WS: typeof WebSocket = this._options.WebSocket || WebSocket;
        this._debug("connect", { url, protocols });
        this._ws = protocols ? new WS(url, protocols) : new WS(url);

        this._ws.binaryType = this._binaryType;
        this._connectLock = false;
        this._addListeners();

        this._connectTimeout = setTimeout(
          () => this._handleTimeout(),
          connectionTimeout
        );
      })
      // via https://github.com/pladaria/reconnecting-websocket/pull/166
      .catch((err) => {
        this._connectLock = false;
        this._handleError(new Events.ErrorEvent(Error(err.message), this));
      });
  }

  private _handleTimeout() {
    this._debug("timeout event");
    this._handleError(new Events.ErrorEvent(Error("TIMEOUT"), this));
  }

  private _disconnect(code = 1000, reason?: string) {
    this._clearTimeouts();
    if (!this._ws) {
      return;
    }
    this._removeListeners();
    try {
      this._ws.close(code, reason);
      this._handleClose(new Events.CloseEvent(code, reason, this));
    } catch (error) {
      // ignore
    }
  }

  private _acceptOpen() {
    this._debug("accept open");
    this._retryCount = 0;
  }

  private _handleOpen = (event: Event) => {
    this._debug("open event");
    const { minUptime = DEFAULT.minUptime } = this._options;

    clearTimeout(this._connectTimeout);
    this._uptimeTimeout = setTimeout(() => this._acceptOpen(), minUptime);

    assert(this._ws, "WebSocket is not defined");

    this._ws.binaryType = this._binaryType;

    // send enqueued messages (messages sent before websocket open event)
    this._messageQueue.forEach((message) => this._ws?.send(message));
    this._messageQueue = [];

    if (this.onopen) {
      this.onopen(event);
    }
    this.dispatchEvent(cloneEvent(event));
  };

  private _handleMessage = (event: MessageEvent) => {
    this._debug("message event");

    if (this.onmessage) {
      this.onmessage(event);
    }
    this.dispatchEvent(cloneEvent(event));
  };

  private _handleError = (event: ErrorEvent) => {
    this._debug("error event", event.message);
    this._disconnect(
      undefined,
      event.message === "TIMEOUT" ? "timeout" : undefined
    );

    if (this.onerror) {
      this.onerror(event);
    }
    this._debug("exec error listeners");
    this.dispatchEvent(cloneEvent(event));

    this._connect();
  };

  private _handleClose = (event: CloseEvent) => {
    this._debug("close event");
    this._clearTimeouts();

    if (this._shouldReconnect) {
      this._connect();
    }

    if (this.onclose) {
      this.onclose(event);
    }
    this.dispatchEvent(cloneEvent(event));
  };

  private _removeListeners() {
    if (!this._ws) {
      return;
    }
    this._debug("removeListeners");
    this._ws.removeEventListener("open", this._handleOpen);
    this._ws.removeEventListener("close", this._handleClose);
    this._ws.removeEventListener("message", this._handleMessage);
    // @ts-expect-error we need to fix event/listerner types
    this._ws.removeEventListener("error", this._handleError);
  }

  private _addListeners() {
    if (!this._ws) {
      return;
    }
    this._debug("addListeners");
    this._ws.addEventListener("open", this._handleOpen);
    this._ws.addEventListener("close", this._handleClose);
    this._ws.addEventListener("message", this._handleMessage);
    // @ts-expect-error we need to fix event/listener types
    this._ws.addEventListener("error", this._handleError);
  }

  private _clearTimeouts() {
    clearTimeout(this._connectTimeout);
    clearTimeout(this._uptimeTimeout);
  }
}
