const Queue = require("bee-queue");
const { Server } = require("ws");

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL;

const workQueue = new Queue("trivia-queue", {
  isWorker: false,
  redis: REDIS_URL,
  removeOnFailure: true,
  removeOnSuccess: true,
});
const socketServer = new Server({ port: PORT });

socketServer.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("close", () => console.log("Client disconnected"));

  ws.on("message", (data) => console.log(`Got data ${data}`));
});

workQueue.ready().then(() => console.log("Started"));
