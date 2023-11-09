# Engine.IO protocol compliance test

## How to use

```
$ deno run index.ts --allow-net
```

and then use the test suite
[here](https://github.com/socketio/engine.io-protocol#test-suite) to check the
compliance of the implementation:

```
$ npm test

> engine.io-protocol-test-suite@0.0.1 test
> mocha test-suite.js



  Engine.IO protocol
    handshake
      HTTP long-polling
        ✔ successfully opens a session
        ✔ fails with an invalid 'EIO' query parameter
        ✔ fails with an invalid 'transport' query parameter
        ✔ fails with an invalid request method
      WebSocket
        ✔ successfully opens a session
        ✔ fails with an invalid 'EIO' query parameter
        ✔ fails with an invalid 'transport' query parameter
    message
      HTTP long-polling
        ✔ sends and receives a payload containing one plain text packet
        ✔ sends and receives a payload containing several plain text packets
        ✔ sends and receives a payload containing plain text and binary packets
        ✔ closes the session upon invalid packet format
        ✔ closes the session upon duplicate poll requests
      WebSocket
        ✔ sends and receives a plain text packet
        ✔ sends and receives a binary packet
        ✔ closes the session upon invalid packet format
    heartbeat
      HTTP long-polling
        ✔ sends ping/pong packets (922ms)
        ✔ closes the session upon ping timeout (509ms)
      WebSocket
        ✔ sends ping/pong packets (908ms)
        ✔ closes the session upon ping timeout (508ms)
    close
      HTTP long-polling
        ✔ forcefully closes the session
      WebSocket
        ✔ forcefully closes the session
    upgrade
      ✔ successfully upgrades from HTTP long-polling to WebSocket
      ✔ ignores HTTP requests with same sid after upgrade
      ✔ ignores WebSocket connection with same sid after upgrade


  24 passing (3s)
```
