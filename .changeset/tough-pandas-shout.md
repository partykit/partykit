---
"partykit": patch
---

feat: add `ctx` to `onConnect`

## `onConnect(connection, room, context){}`

Developers want access to additional metadata available on every connection. For example, to implement a rate limiter, they need access to the IP address of the client. They may want access to the user agent, some cookie values, or any of the special `cf` properties like geo information, etc. Most of this information is available on the request object when the connection is made, but we don't actually expose that to the developer right now. I propose we do that.

We can expose a third parameter to the `onConnect` method that is the `context` object. For now it'll just be an onject with a single property `request` that is the request object. In the future we can add more properties to this object.

```js
onConnect(connection, room, context) {
  const { request } = context;
  const { headers } = request;
  const ip = headers['x-forwarded-for'];
  // do something with the ip
}
```

Now, the hibernation api variant doesn't include `onConnect` at all. So, we'll need to add that to the hibernation api. So, I also propose that we let folks add an optional `onConnect` method when defining a party. Calling `connection.addEventListener` with that variant will silently do nothing, but maybe we could override that to throw an error instead. Importantly, folks should be able to call `.serializeAttachment` in the `onConnect` method, and recover that data in the `onMessage` method.

```js
export default {
  onConnect(connection, room, context) {
    const { request } = context;
    const { headers } = request;
    const ip = headers["x-forwarded-for"];
    connection.serializeAttachment({ ip });
    // do something with the ip
  },
  onMessage(message, connection, room) {
    const { ip } = connection.deserializeAttachment();
    // do something with the ip
  },
};
```

This PR adds the context object to `onConnect`. After we land the hibernation api, we can do the additional work mentioned.
