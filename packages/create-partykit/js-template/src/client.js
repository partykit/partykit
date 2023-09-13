/* eslint-env browser */
/* global PARTYKIT_HOST */

import "./styles.css";

import PartySocket from "partysocket";

let pingInterval;

/** @type {HTMLDivElement} - The DOM element to append all messages we get */
const output = document.getElementById("app");

/**
 * Helper function to add a new line to the DOM
 * @param {string} text - The text to be added
 */
function add(text) {
  output.appendChild(document.createTextNode(text));
  output.appendChild(document.createElement("br"));
}

/**
 * A PartySocket is like a WebSocket, but with more features.
 * It handles reconnection logic, buffering messages while it's offline, etc.
 * @type {PartySocket} - The connection object
 */
const conn = new PartySocket({
  host: PARTYKIT_HOST,
  room: "my-new-room",
});

/**
 * Event listener to handle received messages.
 * @param {Event} event - The message event
 */
conn.addEventListener("message", function (event) {
  add(`Received -> ${event.data}`);
});

/**
 * Event listener for when the connection opens.
 */
conn.addEventListener("open", function () {
  add("Connected!");
  add("Sending a ping every 2 seconds...");

  // TODO: make this more interesting / nice
  clearInterval(pingInterval);
  pingInterval = setInterval(function () {
    conn.send("ping");
  }, 1000);
});
