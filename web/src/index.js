const Queue = require("bee-queue");
const redis = require("redis");
const WebSocket = require("ws");
const { generateId } = require("./generateId.js");
const { PlayerState } = require("./playerState.js");
const { RedisDataStore } = require("./redisDataStore.js");
const { DataChannel } = require("./dataChannel.js");

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL;

const redisClient = redis.createClient(REDIS_URL);

const workQueue = new Queue("trivia-queue", {
  getEvents: true,
  isWorker: false,
  redis: redisClient,
  removeOnFailure: true,
  removeOnSuccess: true,
  sendEvents: false,
});
const socketServer = new WebSocket.Server({ port: PORT });

const redisDataStore = new RedisDataStore(redisClient);
const playerState = new PlayerState();
let dataChannels = [];

const pingInterval = setInterval(() => {
  const inactiveChannels = dataChannels.filter((channel) => !channel.active);
  inactiveChannels.forEach((channel) => channel.socket.terminate());

  dataChannels = dataChannels.filter((channel) => channel.active);

  dataChannels.forEach((channel) => {
    channel.active = false;
    channel.socket.ping();
  });
}, 10000);

const MINIMUM_PLAYERS_PER_GAME = process.env.MINIMUM_PLAYERS_PER_GAME || 1;

async function joinGame(player) {
  const playerCount = await redisDataStore.addPlayerToWaitingArea(player);

  if (playerCount >= MINIMUM_PLAYERS_PER_GAME) {
    return startGame();
  }
}

async function startGame() {
  const {
    players,
    preempted,
  } = await redisDataStore.removePlayersFromWaitingArea();

  if (!preempted) {
    const gameId = generateId();
    return workQueue.createJob(players).setId(gameId).save();
  }
}

socketServer.on("connection", (ws) => {
  console.log("Client connected");

  let currentRound = 0;

  const channel = new DataChannel(ws);
  dataChannels.push(channel);

  channel.on("set name", (name) => {
    playerState.connect(name, channel);
  });

  channel.on("disconnected", (playerId) => {
    playerState.disconnect(playerId);
  });

  channel.on("join", () => {
    console.log("Joining game");
    currentRound = 0;

    const player = playerState.getPlayer(channel.id);
    joinGame(player);
  });

  channel.on("question", (round) => {
    currentRound = round;
  });

  channel.on("answer", (answerIndex) => {
    const player = playerState.getPlayer(channel.id);
    if (player.active) {
      redisDataStore.setPlayerAnswer(
        player.id,
        answerIndex,
        player.gameId,
        currentRound
      );
    } else {
      console.log(
        `Eliminated player attempted to answer playerId="${channel.id}"`
      );
    }
  });

  channel.on("eliminated", () => {
    playerState.eliminateFromGame(channel.id);
  });

  channel.on("invalid message", (message, error) => {
    console.log(
      `Encountered client error clientMessage="${message}" error="${error}"`
    );
  });

  channel.on("invalid game message", (message, error) => {
    console.error(
      `Encountered game error gameMessage="${message}" error="${error}"`
    );
  });
});

socketServer.on("close", () => {
  clearInterval(pingInterval);
});

workQueue.on("job failed", (jobId, err) => {
  console.error(`Job ${jobId} failed with error ${err.message}`);

  const players = playerState.getPlayersInGame(jobId);
  for (let player of players) {
    player.socket.gameError();
  }
});

workQueue.on("job progress", (jobId, message) => {
  if (message.type === "start") {
    for (const { id: playerId } of message.players) {
      playerState.joinGame(playerId, jobId);
    }
  }

  const players = playerState.getPlayersInGame(jobId);
  for (let player of players) {
    player.socket.processGameMessage(message);
  }
});

workQueue.ready().then(() => console.log("Started"));
