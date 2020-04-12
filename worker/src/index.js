const Queue = require("bee-queue");
const redis = require("redis");
const { processGame } = require("./game.js");
const { fetchQuestions } = require("./questions.js");

const REDIS_URL = process.env.REDIS_URL;
const MAX_GAMES_PER_JOB = 10;

const redisClient = redis.createClient(REDIS_URL);

const workQueue = new Queue("trivia-queue", {
  getEvents: false,
  redis: redisClient,
  removeOnFailure: true,
  removeOnSuccess: true,
  sendEvents: true,
});

async function runGame(job) {
  try {
    const gameId = job.id;
    const players = job.data;

    const questions = fetchQuestions();
    await processGame(
      gameId,
      players,
      redisClient,
      questions,
      job.reportProgress.bind(job)
    );
  } catch (e) {
    console.error(`Unhandled exception ${e.message}`);
  }
}

workQueue.ready().then(() => workQueue.process(MAX_GAMES_PER_JOB, runGame));
