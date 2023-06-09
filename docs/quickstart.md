# Quickstart

_This page is a stub. There's more to come._

## Before you start

1. Ensure you have Node v. 17 or higher installed:

```bash
node -v
```

If the version is lower than 17, update Node.

2. Install the `partykit` package:

```bash
npm install partykit@beta
```

## Your first app

To get started with PartyKit, you can explore any of the demos in the [examples directory](https://github.com/partykit/partykit/tree/main/examples).

Alternatively, follow these steps:

1. Create a file which will contain the server code:

```bash
touch src/server.ts
```

2. Run the dev server:

```bash
npx partykit dev src/server.ts
```

To verify that the connection works, in your browser, open `http://127.0.0.1:1999/` - you should see a blank page with "No onRequest handler" printed, which is because the server file contains no code.

3. Build your application. You can explore the "Examples" [directory](https://github.com/partykit/partykit/tree/main/examples) for inspiration, or read the [API reference page](https://github.com/partykit/partykit/blob/main/docs/reference.md) to understand the available methods.

---

Questions? Ideas? Reach out to us on [Discord](https://discord.gg/KDZb7J4uxJ) or [Twitter](https://twitter.com/partykit_io)!
