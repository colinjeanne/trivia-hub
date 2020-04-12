const {
  countDown,
  getAnswerCounts,
  getPlayerAnswers,
  insertRandomlyInto,
} = require("../src/gameUtils.js");

describe("countDown", () => {
  jest.spyOn(global, "setTimeout");

  test("counts down with a step", async () => {
    const cb = jest.fn();

    await countDown(1000, 250, cb);

    expect(cb.mock.calls).toEqual([[1000], [750], [500], [250], [0]]);
  });
});

describe("getAnswerCounts", () => {
  test("counts how often each answer appears", () => {
    const playerAnswers = { "1": 0, "2": 0, "3": 1, "4": 2 };
    expect(getAnswerCounts(playerAnswers, [0, 1, 2])).toEqual({
      "0": 2,
      "1": 1,
      "2": 1,
    });
  });

  test("ignores impossible answers", () => {
    const playerAnswers = { "1": 0, "2": 1, "3": 2, "4": 3 };
    expect(getAnswerCounts(playerAnswers, [0, 1, 2])).toEqual({
      "0": 1,
      "1": 1,
      "2": 1,
    });
  });

  test("includes all possible answers", () => {
    const playerAnswers = { "1": 0, "2": 0, "3": 1, "4": 1 };
    expect(getAnswerCounts(playerAnswers, [0, 1, 2])).toEqual({
      "0": 2,
      "1": 2,
      "2": 0,
    });
  });
});

describe("getPlayerAnswers", () => {
  class StubRedisClient {
    constructor(data) {
      this.data = data;
    }

    hgetall(key, cb) {
      if (key in this.data) {
        return cb(undefined, this.data[key]);
      }

      return [];
    }
  }

  test("gets all player answers", async () => {
    const redisClient = new StubRedisClient({
      "1:0": ["1", "0", "2", "0", "3", "1"],
    });
    const answers = await getPlayerAnswers(redisClient, "1", 0);
    expect(answers).toEqual({ "1": 0, "2": 0, "3": 1 });
  });

  test("returns an empty answer object when no answers are given", async () => {
    const redisClient = new StubRedisClient({ "1:0": [] });
    const answers = await getPlayerAnswers(redisClient, "1", 0);
    expect(answers).toEqual({});
  });
});

describe("insertRandomlyInto", () => {
  test("inserts into the front", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0);

    expect(insertRandomlyInto(0, [1, 2])).toEqual([0, 1, 2]);
  });

  test("inserts into the middle", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0.34);

    expect(insertRandomlyInto(0, [1, 2])).toEqual([1, 0, 2]);
  });

  test("inserts at the end", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0.99);

    expect(insertRandomlyInto(0, [1, 2])).toEqual([1, 2, 0]);
  });

  test("inserts into an empty array", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0.99);

    expect(insertRandomlyInto(0, [])).toEqual([0]);
  });
});
