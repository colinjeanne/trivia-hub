const { Channel } = require("./channel.js");
const {
  countDown,
  getAnswerCounts,
  getPlayerAnswers,
  insertRandomlyInto,
} = require("./gameUtils.js");
const { PlayerState } = require("./playerState.js");

function makeCountDown(ms, step, channel) {
  return () => countDown(ms, step, channel.reportCountDown.bind(channel));
}

async function processRound(
  gameId,
  round,
  playerState,
  question,
  redisClient,
  channel,
  gameTimer
) {
  console.log(`Starting round gameId="${gameId}" round=${round}`);

  const answers = insertRandomlyInto(question.answer, question.diversions);
  const correctAnswerIndex = answers.findIndex(
    (answer) => answer === question.answer
  );

  channel.poseQuestion(question.question, answers, round);

  await gameTimer();

  const playerAnswers = await getPlayerAnswers(redisClient, gameId, round);
  const eliminatedPlayerIds = playerState.processAnswers(
    playerAnswers,
    correctAnswerIndex
  );

  channel.reportResults(
    question.question,
    answers,
    correctAnswerIndex,
    getAnswerCounts(playerAnswers, Array.from(answers.keys())),
    eliminatedPlayerIds,
    round
  );

  console.log(`Ending round gameId="${gameId}" round=${round}`);

  return playerState.hasActivePlayers;
}

async function processGame(
  gameId,
  players,
  redisClient,
  questions,
  channelCallback
) {
  console.log(`Starting game gameId="${gameId}"`);

  const channel = new Channel(channelCallback);
  const gameTimer = makeCountDown(10000, 1000, channel);
  const playerState = new PlayerState(players);

  const curryRound = (round, question) =>
    processRound(
      gameId,
      round,
      playerState,
      question,
      redisClient,
      channel,
      gameTimer
    );

  channel.startGame(players, gameId);

  await gameTimer();

  for (let round = 0; round < questions.length; ++round) {
    const question = questions[round];
    const hasActivePlayers = await curryRound(round, question);

    if (!hasActivePlayers) {
      break;
    }

    if (round < questions.length - 1) {
      await gameTimer();
    }
  }

  channel.endGame(playerState.activePlayers);

  console.log(`Ending game gameId="${gameId}"`);
}

module.exports = {
  processGame,

  // This is only exposed for testing purposes
  processRound,
};
