// the edge-runtime has some kind of problem with yjs/lib0
// that appears to go away in minified builds
// so we need to export all the stuff we need from yjs/lib0
// and generate a minified vendor bundle, which we then
// import in server.ts

export * as Y from "yjs";
export * as syncProtocol from "y-protocols/sync";
export * as awarenessProtocol from "y-protocols/awareness";
export * as encoding from "lib0/encoding";
export * as decoding from "lib0/decoding";
export * as map from "lib0/map";
