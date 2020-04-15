class Channel {
  constructor(channelCallback) {
    this.channelCallback = channelCallback;
  }

  startGame(players, gameId) {
    this.channelCallback({
      type: "start",
      players,
      gameId,
    });
  }

  poseQuestion(question, answers, round) {
    this.channelCallback({
      type: "question",
      question,
      answers,
      round,
    });
  }

  reportCountDown(timeLeft) {
    this.channelCallback({
      type: "countDown",
      timeLeft,
    });
  }

  reportResults(
    question,
    answers,
    correctAnswerIndex,
    answerCounts,
    eliminatedPlayerIds,
    round
  ) {
    this.channelCallback({
      type: "results",
      question,
      answers,
      correctAnswerIndex,
      answerCounts,
      eliminatedPlayerIds,
      round,
    });
  }

  endGame(winners) {
    this.channelCallback({
      type: "end",
      winners,
    });
  }
}

module.exports = {
  Channel,
};
