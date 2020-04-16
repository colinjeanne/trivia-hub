const EventEmitter = require("events");
const { DataChannel } = require("../src/dataChannel.js");

class StubSocket extends EventEmitter {
  constructor() {
    super();

    this.sendCallback = jest.fn();
  }

  send(data) {
    this.sendCallback(JSON.parse(data));
  }

  pong() {
    this.emit("pong");
  }

  sendFromClient(data, raw = false) {
    const formattedData = raw ? data : JSON.stringify(data);
    this.emit("message", formattedData);
  }

  close() {
    this.emit("close");
  }
}

describe("DataChannel", () => {
  let socket;
  let dataChannel;
  beforeEach(() => {
    socket = new StubSocket();
    dataChannel = new DataChannel(socket);
  });

  describe("processGameMessage", () => {
    test("sends start messages", () => {
      dataChannel.processGameMessage({ type: "start" });

      expect(socket.sendCallback).toHaveBeenLastCalledWith({ type: "start" });
    });

    test("sends and emits question messages", () => {
      const message = {
        type: "question",
        question: "?",
        answers: ["A", "B", "C"],
        round: 0,
      };

      return new Promise((resolve) => {
        dataChannel.on("question", (round) => {
          expect(round).toBe(0);
          resolve();
        });

        dataChannel.processGameMessage(message);

        expect(socket.sendCallback).toHaveBeenLastCalledWith({
          type: "question",
          question: "?",
          answers: ["A", "B", "C"],
          round: 0,
        });
      });
    });

    test("sends count down messages", () => {
      const message = { type: "countDown", timeLeft: 100 };
      dataChannel.processGameMessage(message);

      expect(socket.sendCallback).toHaveBeenLastCalledWith(message);
    });

    test("sends results messages", () => {
      const message = {
        type: "results",
        question: "?",
        answers: ["A", "B", "C"],
        correctAnswerIndex: 0,
        answerCounts: { "0": 1, "1": 0, "2": 0 },
        eliminatedPlayerIds: [],
        round: 0,
      };

      dataChannel.processGameMessage(message);

      expect(socket.sendCallback).toHaveBeenLastCalledWith({
        type: "results",
        question: "?",
        answers: ["A", "B", "C"],
        correctAnswerIndex: 0,
        answerCounts: { "0": 1, "1": 0, "2": 0 },
        eliminated: false,
        round: 0,
      });
    });

    test("emits eliminated events when eliminated", () => {
      const message = {
        type: "results",
        question: "?",
        answers: ["A", "B", "C"],
        correctAnswerIndex: 0,
        answerCounts: { "0": 1, "1": 0, "2": 0 },
        eliminatedPlayerIds: [dataChannel.id],
        round: 0,
      };

      return new Promise((resolve) => {
        dataChannel.on("eliminated", () => {
          resolve();
        });

        dataChannel.processGameMessage(message);

        expect(socket.sendCallback).toHaveBeenLastCalledWith({
          type: "results",
          question: "?",
          answers: ["A", "B", "C"],
          correctAnswerIndex: 0,
          answerCounts: { "0": 1, "1": 0, "2": 0 },
          eliminated: true,
          round: 0,
        });
      });
    });

    test("sends end messages", () => {
      const message = { type: "end", winners: [] };
      dataChannel.processGameMessage(message);

      expect(socket.sendCallback).toHaveBeenLastCalledWith(message);
    });

    test("emits invalid game messages on unknown messages", () => {
      return new Promise((resolve) => {
        dataChannel.on("invalid game message", (messageType, errorMessage) => {
          expect(messageType).toEqual("unknown");
          expect(errorMessage).toEqual("Unknown type");
          resolve();
        });

        dataChannel.processGameMessage({ type: "unknown" });
      });
    });
  });

  describe("gameError", () => {
    test("sends a game error message to the client", () => {
      dataChannel.gameError();

      expect(socket.sendCallback).toHaveBeenLastCalledWith({ type: "error" });
    });
  });

  describe("client message processing", () => {
    test("emits disconnected when the socket is closed", () => {
      return new Promise((resolve) => {
        dataChannel.on("disconnected", () => {
          expect(dataChannel.active).toBe(false);
          resolve();
        });

        expect(dataChannel.active).toBe(true);
        socket.close();
      });
    });

    test("marks itself as active when receiving a pong message", () => {
      dataChannel.active = false;
      socket.pong();

      expect(dataChannel.active).toBe(true);
    });

    test("emits invalid message for non-JSON messages", () => {
      return new Promise((resolve) => {
        dataChannel.on("invalid message", (message, errorMessage) => {
          expect(errorMessage).not.toEqual("Invalid type or data");
          resolve();
        });

        socket.sendFromClient("Hello", true);
      });
    });

    test("emits invalid message for messages without a type", () => {
      return new Promise((resolve) => {
        dataChannel.on("invalid message", (message, errorMessage) => {
          expect(errorMessage).toEqual("Invalid type or data");
          resolve();
        });

        socket.sendFromClient({});
      });
    });

    test("emits set name events for valid names", () => {
      return new Promise((resolve) => {
        dataChannel.on("set name", (name) => {
          expect(name).toEqual("Washington");
          resolve();
        });

        socket.sendFromClient({ type: "setName", name: "Washington" });
      });
    });

    test("emits invalid message for short names", () => {
      return new Promise((resolve) => {
        dataChannel.on("invalid message", (message, errorMessage) => {
          expect(errorMessage).toEqual("Invalid type or data");
          resolve();
        });

        socket.sendFromClient({ type: "setName", name: "WI" });
      });
    });

    test("emits invalid message for long names", () => {
      return new Promise((resolve) => {
        dataChannel.on("invalid message", (message, errorMessage) => {
          expect(errorMessage).toEqual("Invalid type or data");
          resolve();
        });

        socket.sendFromClient({ type: "setName", name: "W".repeat(41) });
      });
    });

    test("emits invalid message for names with invalid characters", () => {
      return new Promise((resolve) => {
        dataChannel.on("invalid message", (message, errorMessage) => {
          expect(errorMessage).toEqual("Invalid type or data");
          resolve();
        });

        socket.sendFromClient({ type: "setName", name: "!!!!" });
      });
    });

    test("emits join events", () => {
      return new Promise((resolve) => {
        dataChannel.on("join", (channel) => {
          expect(channel).toBe(dataChannel);
          resolve();
        });

        socket.sendFromClient({ type: "join" });
      });
    });

    test("emits answer events for valid answer indices", () => {
      return new Promise((resolve) => {
        dataChannel.on("answer", (answerIndex) => {
          expect(answerIndex).toBe(1);
          resolve();
        });

        socket.sendFromClient({ type: "answer", answerIndex: 1 });
      });
    });

    test("emits invalid message for non-numeric answer indices", () => {
      return new Promise((resolve) => {
        dataChannel.on("invalid message", (message, errorMessage) => {
          expect(errorMessage).toEqual("Invalid type or data");
          resolve();
        });

        socket.sendFromClient({ type: "answer", answerIndex: "W" });
      });
    });

    test("emits invalid message for negative answer indices", () => {
      return new Promise((resolve) => {
        dataChannel.on("invalid message", (message, errorMessage) => {
          expect(errorMessage).toEqual("Invalid type or data");
          resolve();
        });

        socket.sendFromClient({ type: "answer", answerIndex: -1 });
      });
    });

    test("emits invalid message for very large answer indices", () => {
      return new Promise((resolve) => {
        dataChannel.on("invalid message", (message, errorMessage) => {
          expect(errorMessage).toEqual("Invalid type or data");
          resolve();
        });

        socket.sendFromClient({ type: "answer", answerIndex: 11 });
      });
    });
  });
});
