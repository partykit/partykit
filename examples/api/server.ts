/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import { Connection, OnBeforeHandler, Options, PartyServer } from "./api";

type Message = { text: string };

// Each party is now a class, so that it's clear we can create multiple
// instances of it.
export default class Chat extends PartyServer {
  // server can be configured via options on the class constructor, so
  // that we can configure the server without having to instantiate one
  static options: Options = {
    hibernate: false,
  };

  // edge worker methods can be defined as static methods on the class,
  // indicating clearly that they do not have state, and do not belong to the instance.
  static onBeforeConnect(req: Request) {
    return req;
  }

  static onBeforeRequest: OnBeforeHandler = (req) => req;

  // you can define arbitrary class fields to hold transient data
  messages: Message[] = [];

  // new lifcycle method: onStart will run after the class is instantiated.
  // this can be used instead of a constructor, because
  // a) constructors cannot be async so you can't e.g. await on storage
  // b) we don't need to expose constructor args to user
  // c) we can buffer incoming connections until the server is initialized
  async onStart() {
    this.messages = (await this.storage.get("messages")) ?? this.messages;
  }

  // room information is available on the class instance on `this`
  async onConnect(connection: Connection) {
    this.id;
    this.storage;
    this.connections;
  }

  async onRequest(req: Request) {
    return new Response(await req.text(), { status: 200 });
  }

  // onMessage, onClose and onError are now decoupled from hibernation -- they're more
  // convenient APIs for connection/message handling than attaching handlers in onConnect
  async onMessage(connection: Connection, message: string) {}
  async onClose(connection: Connection) {}
  async onError(connection: Connection, err: Error) {}

  // we'll need to store room id somewhere so the class instance can be constructed for alams
  async onAlarm() {}
}

// Problems
// No inference of method parameters
// No inference of static methods
// - Possible typos in method name
// - No autocomplete for methods
// Can't make constructor opaque
// Constructor parameter type is not autocompleted
