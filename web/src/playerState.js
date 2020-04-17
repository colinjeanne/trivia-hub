class PlayerState {
  constructor() {
    this.players = {};
  }

  getPlayer(playerId) {
    return this.players[playerId];
  }

  getPlayersInGame(gameId) {
    return Object.values(this.players).filter(
      (player) => player.gameId === gameId
    );
  }

  connect(playerName, socket) {
    this.players[socket.id] = {
      id: socket.id,
      name: playerName,
      socket: socket,
      gameId: null,
      active: false,
    };

    return socket.id;
  }

  disconnect(playerId) {
    delete this.players[playerId];
  }

  joinGame(playerId, gameId) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.gameId = gameId;
      player.active = true;
    }
  }

  eliminateFromGame(playerId) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.active = false;
    }
  }
}

module.exports = {
  PlayerState,
};
