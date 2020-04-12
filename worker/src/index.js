const Queue = require("bee-queue");

const REDIS_URL = process.env.REDIS_URL;
const MAX_GAMES_PER_JOB = 10;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runGame(job) {
  console.log(`Starting game: ${job.id}`);

  let timeLeft = 10000;

  while (timeLeft > 0) {
    job.reportProgress({ timeLeft });
    timeLeft -= 100;
    await sleep(100);
  }

  console.log(`Ending game: ${job.id}`);
}

const workQueue = new Queue("trivia-queue", {
  getEvents: false,
  redis: REDIS_URL,
  removeOnFailure: true,
  removeOnSuccess: true,
  sendEvents: true,
});

workQueue.ready().then(() => workQueue.process(MAX_GAMES_PER_JOB, runGame));
