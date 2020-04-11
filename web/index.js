const Queue = require("bee-queue");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL;

const workQueue = new Queue("trivia-queue", {
  getEvents: true,
  isWorker: false,
  redis: REDIS_URL,
  removeOnFailure: true,
  removeOnSuccess: true,
  sendEvents: false,
});
const socketServer = new WebSocket.Server({ port: PORT });

let activeGame = null;

function handleSocketMessage(data) {
  let jsonData;
  try {
    jsonData = JSON.parse(data);
  } catch (e) {
    console.log("Invalid JSON sent");
    return;
  }

  if (jsonData.type === "join") {
    console.log("Joining a game");

    if (!activeGame) {
      console.log("Joining new game");
      workQueue
        .createJob()
        .save()
        .then((jobId) => (activeGame = jobId));
    } else {
      console.log(`Joining existing game ${activeGame}`);
    }
  } else {
    console.log(`Unknown message type: "${jsonData.type}"`);
  }
}

socketServer.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("close", () => console.log("Client disconnected"));

  ws.on("message", handleSocketMessage);
});

workQueue.on("job succeeded", (jobId) => {
  if (activeGame === jobId) {
    activeGame = null;
  }

  socketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({ type: "jobChange", event: "done", id: jobId })
      );
    }
  });
});

workQueue.on("job failed", (jobId, err) => {
  if (activeGame === jobId) {
    activeGame = null;
  }

  console.error(`Job ${jobId} failed with error ${err.message}`);
});

workQueue.on("job progress", (jobId, data) => {
  socketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "jobChange",
          event: "progress",
          id: jobId,
          ...data,
        })
      );
    }
  });
});

workQueue.ready().then(() => console.log("Started"));
