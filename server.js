const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// সব কানেক্টেড ক্লায়েন্ট রাখার জন্য
let senderSocket = null; // সেকেন্ডারি ফোন
const viewerSockets = new Set(); // প্রাইমারি ফোন/ব্রাউজার

const SECRET_KEY = "my-secret-key-123"; // এটা নিজের একটা শক্ত key দিয়ে বদলাও

wss.on("connection", (ws) => {
  console.log("New connection");

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      return;
    }

    // Authentication
    if (data.key !== SECRET_KEY) {
      ws.close();
      return;
    }

    if (data.role === "sender") {
      senderSocket = ws;
      console.log("Sender (secondary phone) connected");
    } else if (data.role === "viewer") {
      viewerSockets.add(ws);
      console.log("Viewer connected");
    } else if (data.role === "data") {
      // সেকেন্ডারি ফোন থেকে ডেটা এসেছে, সব viewer-কে পাঠাও
      viewerSockets.forEach((viewer) => {
        if (viewer.readyState === WebSocket.OPEN) {
          viewer.send(JSON.stringify(data.payload));
        }
      });
    }
  });

  ws.on("close", () => {
    if (ws === senderSocket) senderSocket = null;
    viewerSockets.delete(ws);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
