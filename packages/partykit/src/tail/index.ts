import type { Outcome } from "./filters";

/**
 * Everything captured by the trace worker and sent to us via
 * `partykit tail` is structured JSON that deserializes to this type.
 */
export type TailEventMessage = {
  /**
   * Whether the execution of this worker succeeded or failed
   */
  outcome: Outcome;

  /**
   * The name of the script we're tailing
   */
  scriptName?: string;

  /**
   * Any exceptions raised by the worker
   */
  exceptions: {
    /**
     * The name of the exception.
     */
    name: string;

    /**
     * The error message
     */
    message: unknown;

    /**
     * When the exception was raised/thrown
     */
    timestamp: number;
  }[];

  /**
   * Any logs sent out by the worker
   */
  logs: {
    message: unknown[];
    level: string; // TODO: make this a union of possible values
    timestamp: number;
  }[];

  /**
   * When the event was triggered
   */
  eventTimestamp: number;

  /**
   * The event that triggered the worker. In the case of an HTTP request,
   * this will be a RequestEvent. If it's a cron trigger, it'll be a
   * ScheduledEvent. If it's a durable object alarm, it's an AlarmEvent.
   * If it's a email, it'a an EmailEvent
   *
   * Until workers-types exposes individual types for export, we'll have
   * to just re-define these types ourselves.
   */
  event:
    | RequestEvent
    | ScheduledEvent
    | AlarmEvent
    | EmailEvent
    | undefined
    | null;
};

/**
 * A request that triggered worker execution
 */

export type RequestEvent = {
  request: Pick<Request, "url" | "method" | "headers"> & {
    /**
     * Cloudflare-specific properties
     * https://developers.cloudflare.com/workers/runtime-apis/request#incomingrequestcfproperties
     */
    cf: {
      /**
       * How long (in ms) it took for the client's TCP connection to make a
       * round trip to the worker and back. For all my gamers out there,
       * this is the request's ping
       */
      clientTcpRtt?: number;

      /**
       * Longitude and Latitude of where the request originated from
       */
      longitude?: string;
      latitude?: string;

      /**
       * What cipher was used to establish the TLS connection
       */
      tlsCipher: string;

      /**
       * Which continent the request came from.
       */
      continent?: "NA";

      /**
       * ASN of the incoming request
       */
      asn: number;

      /**
       * The country the incoming request is coming from
       */
      country?: string;

      /**
       * The TLS version the connection used
       */
      tlsVersion: string;

      /**
       * The colo that processed the request (i.e. the airport code
       * of the closest city to the server that spun up the worker)
       */
      colo: string;

      /**
       * The timezone where the request came from
       */
      timezone?: string;

      /**
       * The city where the request came from
       */
      city?: string;

      /**
       * The browser-requested prioritization information in the request object
       */
      requestPriority?: string;

      /**
       * Which version of HTTP the request came over e.g. "HTTP/2"
       */
      httpProtocol: string;

      /**
       * The region where the request originated from
       */
      region?: string;
      regionCode?: string;

      /**
       * The organization which owns the ASN of the incoming request, for example, Google Cloud.
       */
      asOrganization: string;

      /**
       * Metro code (DMA) of the incoming request, for example, "635".
       */
      metroCode?: string;

      /**
       * Postal code of the incoming request, for example, "78701".
       */
      postalCode?: string;
    };
  };
};

/**
 * An event that was triggered at a certain time
 */
export type ScheduledEvent = {
  /**
   * The cron pattern that matched when this event fired
   */
  cron: string;

  /**
   * The time this worker was scheduled to run.
   * For some reason, this doesn't...work correctly when we
   * do it directly as a Date. So parse it later on your own.
   */
  scheduledTime: number;
};

/**
 * A event that was triggered from a durable object alarm
 */
export type AlarmEvent = {
  /**
   * The datetime the alarm was scheduled for.
   *
   * This is sent as an ISO timestamp string (different than ScheduledEvent.scheduledTime),
   * you should parse it later on on your own.
   */
  scheduledTime: string;
};

/**
 * An event that was triggered from an email
 */
export type EmailEvent = {
  /**
   * Who sent the email
   */
  mailFrom: string;

  /**
   * Who was the email sent to
   */
  rcptTo: string;

  /**
   * Size of the email in bytes
   */
  rawSize: number;
};
