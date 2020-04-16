const redis = require("redis-mock");
const { RedisDataStore } = require("../src/redisDataStore.js");

const WAITING_AREA_KEY = "web:waiting";

describe("RedisDataStore", () => {
  let redisDataStore;
  let redisClient;
  beforeEach(() => {
    redisClient = redis.createClient();

    // redis-mock doesn't yet implement watch so we'll add a simple
    // implementation here that just resolves.
    redisClient.watch = (key, cb) => cb(undefined);

    redisDataStore = new RedisDataStore(redisClient);
  });

  afterEach((done) => {
    redisClient.flushall();
    redisClient.quit(done);
  });

  describe("addPlayerToWaitingArea", () => {
    test("adds a player to an empty waiting area", async () => {
      const player = { id: "A", name: "Washington" };
      const waitingPlayerCount = await redisDataStore.addPlayerToWaitingArea(
        player
      );

      expect(waitingPlayerCount).toBe(1);
    });

    test("adds a player to the end of the waiting area", async () => {
      const p1 = { id: "A", name: "Washington" };
      await redisDataStore.addPlayerToWaitingArea(p1);

      const p2 = { id: "B", name: "Irving" };
      const waitingPlayerCount = await redisDataStore.addPlayerToWaitingArea(
        p2
      );

      expect(waitingPlayerCount).toBe(2);

      const lastPlayer = await new Promise((resolve) => {
        redisClient.rpop(WAITING_AREA_KEY, (err, result) => resolve(result));
      });

      expect(lastPlayer).toEqual("B:Irving");
    });
  });

  // This method has a lot of logic to handle concurrent usage of the waiting
  // area. Since these tests don't allow for concurrent usage they aren't
  // sufficient to test the most interesting cases this method handles.
  describe("removePlayersFromWaitingArea", () => {
    async function getPlayersInWaitingArea(maximumPlayers) {
      return await new Promise((resolve) => {
        redisClient.lrange(
          WAITING_AREA_KEY,
          0,
          maximumPlayers,
          (err, results) => resolve(results)
        );
      });
    }

    test("removes from an empty waiting area", async () => {
      const {
        players,
        preempted,
      } = await redisDataStore.removePlayersFromWaitingArea();

      expect(preempted).toBe(false);
      expect(players).toEqual([]);
    });

    test("removes from the front", async () => {
      const waitingPlayers = [
        {
          id: "p1",
          name: "Washington",
        },
        {
          id: "p2",
          name: "Irving",
        },
        {
          id: "p3",
          name: "John",
        },
      ];

      await redisDataStore.addPlayerToWaitingArea(waitingPlayers[0]);
      await redisDataStore.addPlayerToWaitingArea(waitingPlayers[1]);
      await redisDataStore.addPlayerToWaitingArea(waitingPlayers[2]);

      const {
        players,
        preempted,
      } = await redisDataStore.removePlayersFromWaitingArea();

      expect(preempted).toBe(false);
      expect(players).toEqual(waitingPlayers);

      const remainingPlayers = await getPlayersInWaitingArea(10);
      expect(remainingPlayers).toEqual([]);
    });
  });

  describe("setPlayerAnswer", () => {
    async function getPlayerAnswer(playerId, gameId, round) {
      const key = `${gameId}:${round}`;
      return await new Promise((resolve) => {
        redisClient.hmget(key, playerId, (err, result) =>
          resolve(parseInt(result[0], 10))
        );
      });
    }

    test("adds an answer to a nonexisting key", async () => {
      redisDataStore.setPlayerAnswer("A", 0, "G", 1);

      const answerIndex = await getPlayerAnswer("A", "G", 1);
      expect(answerIndex).toBe(0);
    });

    test("adds an answer to an existing key", async () => {
      redisDataStore.setPlayerAnswer("A", 0, "G", 1);
      redisDataStore.setPlayerAnswer("B", 2, "G", 1);

      const answerIndex = await getPlayerAnswer("B", "G", 1);
      expect(answerIndex).toBe(2);
    });

    test("overwrites existing answers", async () => {
      redisDataStore.setPlayerAnswer("A", 0, "G", 1);
      redisDataStore.setPlayerAnswer("A", 2, "G", 1);

      const answerIndex = await getPlayerAnswer("A", "G", 1);
      expect(answerIndex).toBe(2);
    });
  });
});
