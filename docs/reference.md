## API

The PartyKit runtime is a modern standards-based JavaScript runtime based on the [`workerd`](https://github.com/cloudflare/workerd) runtime by Cloudflare that powers [Cloudflare Workers](https://workers.cloudflare.com/) In addition to running modern JavaScript, it also supports [TypeScript](https://www.typescriptlang.org/), thousands of modules from [the npm registry](https://www.npmjs.com/), and [WebAssembly modules](https://webassembly.org/).

You can write a PartyKit entrypoint that looks like this:

```ts
import { PartyKitServer, PartyKitRoom } from "partykit/server";

export default {
  async onConnect(connection, room: PartyKitRoom) {
    // `connection` is a WebSocket object, but with a few extra properties
    // and methods. See the PartyKitConnection type for more details.
    connection.send("Hello, world!"); // Send a message to the client
    connection.addEventListener("message", (event) => {
      console.log(event.data); // Log a message from the client
    });
  },
  async onRequest(request: Request, room: PartyKitRoom) {
    // ...
  },
} satisfies PartyKitServer;
```

**_onConnect_**: This function `onConnect` will be called whenever a new client (usually a browser, but it can be any device that can make WebSocket connections) connects to your project. The `connection` argument is a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) object that you can use to send and recieve messages to/from the client (with a couple of additional properties). The `room` argument is an object that contains information about the room that the client is in. It has the following properties:

**_id:_** _string_

A string that uniquely identifies the room. This is usually associated with a single document, drawing, game session, or other collaborative experience. For example, if you're building a collaborative drawing app, this would be the id of the drawing that the client is currently viewing.

**_connections_**: Map<string, {id: string, socket: PartyKitConnection}>

A Map of connection IDs to all the connections in the room. The ID is usually associated with a single client. For example, if you're building a collaborative drawing app, this would be the id of the user that's currently viewing the drawing. You can either specify this id yourself by passing a `_pk` query param in the WebSocket connection, or let PartyKit generate one for you.

**_env_**: Record<string, any>

A map of all the environment variables that you've set for your project. See the [vars](#vars) section for more details.

**_storage_**: (TODO, see [Durable Objects storage API](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/#transactional-storage-api) as a reference)

**_internalID_**: _string_

This too is a string that uniquely identifies the room, but it's not meant to be directly used by your application. It's used internally by the PartyKit platform to identify the room.

From a client (like your browser app), you can connect to the server like this:

```js
// during local development
const ws = new WebSocket("ws://localhost:1999/party/room-id");
// and for production
const ws = new WebSocket("wss://my-project.my-user.partykit.dev/party/room-id");

ws.send('hello world') // send a message to the server

ws.addEventListener('message', event) => {
  console.log(event.data) // log the message from the server
}
```

**_onRequest_**: The function `onRequest` will be called whenever a client makes an HTTP request to your project. The `request` argument is a [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object that you can use to get information about the request, and the `room` argument is the same as the one in `onConnect`.

## Commands

This is a reference for the commands you can can run in your terminal. They're all prefixed by `npx` which is a utility that comes with `node` and `npm`. It's a way to run commands from packages you have installed locally.

### login

`npx partykit login` will authenticate you with the PartyKit service. You'll need to do this before running `deploy` to push your code on to the platform, or when running the `env` commands to manage your environment variables. Running this command will open a browser window where you can authenticate yourself with your GitHub account.

### logout

`npx partykit logout` will log you out of the PartyKit service.

### dev

`npx partykit dev` will start a local development server. This will watch your code for changes, and automatically restart the server when you make changes. It will use the file specified in the `main` field in your `partykit.json` file as the entrypoint for your project. Alternately, you can pass the entrypoint as an argument to the command, like this: `npx partykit dev src/server.ts`

### deploy

`npx partykit deploy` will deploy your code on to the PartyKit platform. It will use the file specified in the `main` field in your `partykit.json` file as the entrypoint for your project, and the `name` field as the name of the project. Alternately, you can pass the entrypoint and name as arguments to the command, like this: `npx partykit deploy src/server.ts --name my-project`

### tail

`npx partykit tail` will tail the logs for your project. This is useful for debugging issues, while looking at live traffic including logs and errors. You can also pass the name of the project as an argument to the command, like this: `npx partykit tail --name my-project`

### list

`npx partykit list` will list all the projects that you've published on to the platform.

### delete

`npx partykit delete` will delete a project that you've published on to the platform. You can also pass the name of the project as an argument to the command, like this: `npx partykit delete --name my-project`

### env (TODO)

## Configuration

This is a reference of all the fields you can add to your `partykit.json` file to configure the behaviour of your project.

**name**: The name of your project. This is used to identify your project on the platform, and is also used to generate the url for your project (typically `https://<name>.<user>.partykit.dev`) For example:

```json
{
  "name": "my-project"
}
```

Alternately, you can pass this as an argument to the `dev` or `deploy` commands, like this: `npx partykit dev --name my-project`

**main**: The entrypoint for your project. This is where you'd define a default export as specified by the [PartyKit API](#api). Example: `"main": "src/server.ts"`

**vars**: A list of environment variables that you want to set for your project. These are available on the `room` object as `room.env`. Example:

```json
{
  "vars": {
    "MY_VAR": "my value",
    "some-nested-object": {
      "a": 123,
      "b": "hello"
    }
  }
}
```

With a configuration like that, you could then access the variable in your code like this:

```ts
export default {
  onConnect(connection, room) {
    console.log(room.env.MY_VAR); // "my value"
    console.log(room.env["some-nested-object"].a); // 123
  },
};
```

**define**: A list of constants that you want to set for your project. Any globals with these names will be substituted with the values you provide here. For example:

```json
{
  "define": {
    "MY_CONSTANT": "my value"
  }
}
```

With a configuration like that, you could then access the variable in your code like this:

```ts
export default {
  onConnect(connection, room) {
    console.log(MY_CONSTANT); // "my value"
  },
};
```

**build**: Occasionally, you'll want to run some custom commands before running the server, as well as when you make changes to your code, and finally before you deploy your code on to the platform. You can define those commands here with an object that has the following properties:

- **command**: The command to run.
- **watch**: A directory to watch for changes. If any files in this directory change, the command will be run again.
- **cwd**: The directory to run the command in. Defaults to the directory of your `partykit.json` file.

So for example, a `build` object that runs `npm run build` and watches the `src` directory would look like this:

```json
{
  "build": {
    "command": "npm run build",
    "watch": "src"
  }
}
```
