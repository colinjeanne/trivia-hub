class Channel {
  constructor(channelCallback) {
    this.channelCallback = channelCallback;
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
