# Socket.IO protocol compliance test

## How to use

```
$ deno run index.ts --allow-net
```

and then use the test suite
[here](https://github.com/socketio/socket.io-protocol#test-suite) to check the
compliance of the implementation:

```
$ npm test

> socket.io-protocol-test-suite@0.0.1 test
> mocha test-suite.js



  Engine.IO protocol
    handshake
      HTTP long-polling
        ✔ should successfully open a session
        ✔ should fail with an invalid 'EIO' query parameter
        ✔ should fail with an invalid 'transport' query parameter
        ✔ should fail with an invalid request method
      WebSocket
        ✔ should successfully open a session
        ✔ should fail with an invalid 'EIO' query parameter
        ✔ should fail with an invalid 'transport' query parameter
    heartbeat
      HTTP long-polling
        ✔ should send ping/pong packets (930ms)
        ✔ should close the session upon ping timeout (514ms)
      WebSocket
        ✔ should send ping/pong packets (909ms)
        ✔ should close the session upon ping timeout (507ms)
    close
      HTTP long-polling
        ✔ should forcefully close the session
      WebSocket
        ✔ should forcefully close the session
    upgrade
      ✔ should successfully upgrade from HTTP long-polling to WebSocket
      ✔ should ignore HTTP requests with same sid after upgrade
      ✔ should ignore WebSocket connection with same sid after upgrade

  Socket.IO protocol
    connect
      ✔ should allow connection to the main namespace
      ✔ should allow connection to the main namespace with a payload
      ✔ should allow connection to a custom namespace
      ✔ should allow connection to a custom namespace with a payload
      ✔ should disallow connection to an unknown namespace
      ✔ should disallow connection with an invalid handshake (505ms)
    disconnect
      ✔ should disconnect from the main namespace (305ms)
      ✔ should connect then disconnect from a custom namespace (307ms)
    message
      ✔ should send a plain-text packet
      ✔ should send a packet with binary attachments
      ✔ should send a plain-text packet with an ack
      ✔ should send a packet with binary attachments and an ack
      ✔ should close the connection upon invalid format (unknown packet type) (505ms)
      ✔ should close the connection upon invalid format (invalid payload format) (508ms)
      ✔ should close the connection upon invalid format (invalid ack id) (507ms)


  31 passing (6s)
```
