const { promisify } = require("util");

const WAITING_AREA_KEY = "web:waiting";
const WAITING_AREA_LOCK_KEY = "web:waiting:lock";

class RedisDataStore {
  constructor(redisClient) {
    this.redisClient = redisClient;

    this._llen = promisify(this.redisClient.llen.bind(this.redisClient));
    this._lrange = promisify(this.redisClient.lrange.bind(this.redisClient));
    this._rpush = promisify(this.redisClient.rpush.bind(this.redisClient));
    this._watch = promisify(this.redisClient.watch.bind(this.redisClient));
  }

  async addPlayerToWaitingArea(player) {
    const playerWithId = `${player.id}:${player.name}`;
    return await this._rpush(WAITING_AREA_KEY, playerWithId);
  }

  async removePlayersFromWaitingArea() {
    await this._watch(WAITING_AREA_LOCK_KEY);

    const playerCount = await this._llen(WAITING_AREA_KEY);
    const playerData = await this._lrange(WAITING_AREA_KEY, 0, playerCount - 1);

    const players = playerData.map((playerWithId) => {
      const [playerId, playerName] = playerWithId.split(":");
      return {
        id: playerId,
        name: playerName,
      };
    });

    const preempted = await new Promise((resolve, reject) => {
      this.redisClient
        .multi()

        // Remove the first playerCount indicies from the list
        // (keep everything from index playerCount to the end)
        .ltrim(WAITING_AREA_KEY, playerCount, -1)
        .incr(WAITING_AREA_LOCK_KEY)
        .exec((err, results) => {
          if (err) {
            reject(err);
          } else if (results === null) {
            console.log("Game started by another instance");
            resolve(true);
          } else {
            resolve(false);
          }
        });
    });

    return Promise.resolve({ players, preempted });
  }

  async setPlayerAnswer(playerId, answerIndex, gameId, round) {
    const key = `${gameId}:${round}`;

    return new Promise((resolve, reject) => {
      this.redisClient
        .multi()
        .hset(key, playerId, answerIndex)
        .expire(key, 20)
        .exec((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  }
}

module.exports = {
  RedisDataStore,
};
