const { Channel } = require("../src/channel.js");

describe("Channel", () => {
  test("startGame reports the players and the gameId to the channel", () => {
    const cb = jest.fn();
    const channel = new Channel(cb);

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

    channel.startGame(players, "A");
    expect(cb.mock.calls).toEqual([
      [
        {
          type: "start",
          players,
          gameId: "A",
        },
      ],
    ]);
  });

  test("postQuestion posts a question to the channel", () => {
    const cb = jest.fn();
    const channel = new Channel(cb);

    channel.poseQuestion("?", ["A", "B", "C"], 1);
    expect(cb.mock.calls).toEqual([
      [
        {
          type: "question",
          question: "?",
          answers: ["A", "B", "C"],
          round: 1,
        },
      ],
    ]);
  });

  test("reportCountDown reports the time left to the channel", () => {
    const cb = jest.fn();
    const channel = new Channel(cb);

    channel.reportCountDown(500);
    expect(cb.mock.calls).toEqual([
      [
        {
          type: "countDown",
          timeLeft: 500,
        },
      ],
    ]);
  });

  test("reportResults reports results to the channel", () => {
    const cb = jest.fn();
    const channel = new Channel(cb);

    channel.reportResults(
      "?",
      ["A", "B", "C"],
      2,
      { "0": 1, "1": 2, "2": 500 },
      ["p1", "p2", "p3"],
      1
    );
    expect(cb.mock.calls).toEqual([
      [
        {
          type: "results",
          question: "?",
          answers: ["A", "B", "C"],
          correctAnswerIndex: 2,
          answerCounts: { "0": 1, "1": 2, "2": 500 },
          eliminatedPlayerIds: ["p1", "p2", "p3"],
          round: 1,
        },
      ],
    ]);
  });

  test("endGame reports winners to the channel", () => {
    const cb = jest.fn();
    const channel = new Channel(cb);

    channel.endGame({ p1: "Washington", p2: "Irving", p3: "John" });
    expect(cb.mock.calls).toEqual([
      [
        {
          type: "end",
          winners: { p1: "Washington", p2: "Irving", p3: "John" },
        },
      ],
    ]);
  });
});
