const Queue = require("bee-queue");
const express = require("express");
const { Server } = require("ws");

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL;

const httpServer = express();
const workQueue = new Queue("trivia-queue", {
  isWorker: false,
  redis: REDIS_URL,
  removeOnFailure: true,
  removeOnSuccess: true,
});
const socketServer = new Server({ server: httpServer });

httpServer.get("/", (req, res) => res.send("OK"));

socketServer.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("close", () => console.log("Client disconnected"));

  ws.on("message", (data) => console.log(`Got data ${data}`));
});

workQueue
  .ready()
  .then(() =>
    httpServer.listen(PORT, () => console.log(`Listening on ${PORT}`))
  );
