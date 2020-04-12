class PlayerState {
  constructor(players) {
    this.activePlayerIds = players.map((player) => player.id);
    this.players = players.reduce((aggregate, player) => {
      aggregate[player.id] = player.name;

      return aggregate;
    }, {});
  }

  processAnswers(playerAnswers, correctAnswer) {
    const seenPlayers = this.activePlayerIds.reduce((state, playerId) => {
      state[playerId] = false;
      return state;
    }, {});

    const activePlayerIds = [];
    const eliminatedPlayerIds = [];
    for (let [playerId, playerAnswer] of Object.entries(playerAnswers)) {
      if (playerAnswer !== correctAnswer || !(playerId in this.players)) {
        eliminatedPlayerIds.push(playerId);
        seenPlayers[playerId] = true;
      } else {
        activePlayerIds.push(playerId);
        seenPlayers[playerId] = true;
      }
    }

    for (let [playerId, seen] of Object.entries(seenPlayers)) {
      if (!seen) {
        eliminatedPlayerIds.push(playerId);
      }
    }

    this.activePlayerIds = activePlayerIds;
    return eliminatedPlayerIds;
  }

  get activePlayers() {
    return this.activePlayerIds.map((playerId) => ({
      id: playerId,
      name: this.players[playerId],
    }));
  }

  get hasActivePlayers() {
    return this.activePlayerIds.length > 0;
  }
}

module.exports = {
  PlayerState,
};
