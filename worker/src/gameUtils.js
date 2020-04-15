const { promisify } = require("util");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function countDown(ms, step, cb) {
  let timeLeft = ms;

  while (timeLeft > 0) {
    cb(timeLeft);
    timeLeft -= step;
    await sleep(step);
  }

  cb(timeLeft);
}

function getAnswerCounts(playerAnswers, possibleAnswers) {
  const answerCounts = possibleAnswers.reduce((counts, answer) => {
    counts[answer] = 0;
    return counts;
  }, {});

  return Object.values(playerAnswers).reduce((counts, answer) => {
    if (answer in counts) {
      ++counts[answer];
    }

    return counts;
  }, answerCounts);
}

async function getPlayerAnswers(redisClient, gameId, round) {
  const hgetall = promisify(redisClient.hgetall.bind(redisClient));

  const key = `${gameId}:${round}`;
  let playerAnswers = await hgetall(key);
  if (!playerAnswers) {
    playerAnswers = {};
  }

  for (let playerId of Object.keys(playerAnswers)) {
    playerAnswers[playerId] = parseInt(playerAnswers[playerId], 10);
  }

  return playerAnswers;
}

function insertRandomlyInto(value, arr) {
  const index = Math.floor(Math.random() * (arr.length + 1));
  const newArr = [...arr];
  newArr.splice(index, 0, value);

  return newArr;
}

module.exports = {
  countDown,
  getAnswerCounts,
  getPlayerAnswers,
  insertRandomlyInto,
};
