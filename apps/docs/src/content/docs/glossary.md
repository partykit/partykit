---
title: Glossary
description: Get a quick refresher on realtime collaborative tech
---

This page offers a glossary on key terms and concepts used in the PartyKit documentation.

<!--
## AI Agents

xyz -->
<!--
## Broadcast

xyz -->
<!--
## Client

xyz -->
<!--
## Connection

xyz -->
<!--
## CRDTs

xyz -->

## Durable Object

A piece of code running at the edge (worker) with persistent state that is infinitely scaleable (from Cloudflare). It is best suited for real time collaborative applications. [Learn more](https://www.cloudflare.com/developer-platform/durable-objects/).

<!--
## Multiparty

xyz -->
<!--
## Multiplayer

xyz -->
<!--
## Lobby

xyz -->

## Party

A single server instance - in other words, a single Durable Object.

## PartyServer

An instance code definition of the server.

## PartyWorker

A static code definition of the server which runs in a separate worker before connecting to the Party.

<!--
## Presence

xyz -->

## Room

An instance of a party, distinguishable by a unique id. For example, you may have a `user` party and every `user` will have its own id (which is reflected in the URL: `/parties/:party/:room-id` - and with an example: `/parties/user/ada`).

## Server

A single Durable Object, also called a "Party" in PartyKit.

<!--
## WebSockets

xyz -->
