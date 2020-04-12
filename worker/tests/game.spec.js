const { Channel } = require("../src/channel.js");
const { processGame, processRound } = require("../src/game.js");
const { PlayerState } = require("../src/playerState.js");
const { StubRedisClient } = require("./stubRedisClient.js");

describe("processGame", () => {
  // This ensures the correct answer is always at index 0
  jest.spyOn(global.Math, "random").mockReturnValue(0);

  const questions = [
    {
      question: "1?",
      answer: "A1",
      diversions: ["X1", "Y1"],
    },
    {
      question: "2?",
      answer: "A2",
      diversions: ["X2", "Y2"],
    },
    {
      question: "3?",
      answer: "A3",
      diversions: ["X3", "Y3"],
    },
  ];

  const players = [
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

  let channelCallback;

  beforeEach(() => {
    jest.spyOn(global, "setTimeout").mockImplementation((cb) => cb());
    channelCallback = jest.fn();
  });

  test("has one round per question", async () => {
    const redisClient = new StubRedisClient({
      "1:0": ["p1", "0", "p2", "0", "p3", "0"],
      "1:1": ["p1", "0", "p2", "1", "p3", "0"],
      "1:2": ["p1", "0", "p3", "1"],
    });

    await processGame(1, players, redisClient, questions, channelCallback);

    const questionsPosed = channelCallback.mock.calls
      .map((call) => call[0])
      .filter((call) => call.type === "question").length;

    expect(questionsPosed).toBe(3);
  });

  test("ends the game early if there are no active players", async () => {
    const redisClient = new StubRedisClient({
      "1:0": ["p1", "0", "p2", "0", "p3", "0"],
      "1:1": ["p1", "1", "p2", "1", "p3", "1"],
      "1:2": ["p1", "0", "p3", "1"],
    });

    await processGame(1, players, redisClient, questions, channelCallback);

    const questionsPosed = channelCallback.mock.calls
      .map((call) => call[0])
      .filter((call) => call.type === "question").length;

    expect(questionsPosed).toBe(2);
    expect(channelCallback).toHaveBeenLastCalledWith({
      type: "end",
      winners: [],
    });
  });

  test("reports winning player names and IDs", async () => {
    const redisClient = new StubRedisClient({
      "1:0": ["p1", "0", "p2", "0", "p3", "0"],
      "1:1": ["p1", "0", "p2", "1", "p3", "1"],
      "1:2": ["p1", "0", "p3", "1"],
    });

    await processGame(1, players, redisClient, questions, channelCallback);

    const questionsPosed = channelCallback.mock.calls
      .map((call) => call[0])
      .filter((call) => call.type === "question").length;

    expect(questionsPosed).toBe(3);
    expect(channelCallback).toHaveBeenLastCalledWith({
      type: "end",
      winners: [
        {
          id: "p1",
          name: "Washington",
        },
      ],
    });
  });
});

describe("processRound", () => {
  // This ensures the correct answer is always at index 0
  jest.spyOn(global.Math, "random").mockReturnValue(0);

  const questions = [
    {
      question: "1?",
      answer: "A1",
      diversions: ["X1", "Y1"],
    },
    {
      question: "2?",
      answer: "A2",
      diversions: ["X2", "Y2"],
    },
  ];

  let channelCallback;

  beforeEach(() => {
    jest.spyOn(global, "setTimeout").mockImplementation((cb) => cb());
    channelCallback = jest.fn();
  });

  test("reports state to the channel", async () => {
    const redisClient = new StubRedisClient({
      "1:0": ["p1", "0", "p2", "0", "p3", "0"],
    });

    const playerState = new PlayerState([
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
    ]);

    const channel = new Channel(channelCallback);

    await processRound(
      "1",
      0,
      playerState,
      questions[0],
      redisClient,
      channel,
      () => channel.reportCountDown(0)
    );

    expect(channelCallback).toHaveBeenCalledTimes(3);
    expect(channelCallback).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "question",
      })
    );
    expect(channelCallback).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "countDown",
      })
    );
    expect(channelCallback).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        type: "results",
        answerCounts: { "0": 3, "1": 0, "2": 0 },
        eliminatedPlayerIds: [],
      })
    );
  });

  test("eliminates players who answer incorrectly", async () => {
    const redisClient = new StubRedisClient({
      "1:0": ["p1", "0", "p2", "1", "p3", "0"],
    });

    const playerState = new PlayerState([
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
    ]);

    const channel = new Channel(channelCallback);

    await processRound(
      "1",
      0,
      playerState,
      questions[0],
      redisClient,
      channel,
      () => channel.reportCountDown(0)
    );

    expect(channelCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "results",
        answerCounts: { "0": 2, "1": 1, "2": 0 },
        eliminatedPlayerIds: ["p2"],
      })
    );
  });
});
