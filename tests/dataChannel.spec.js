const { DataChannel } = require("../js/dataChannel.js");
const { StubSocket } = require("./stubSocket.js");

describe("DataChannel", () => {
  let originalWebSocket;
  beforeEach(() => {
    originalWebSocket = global.WebSocket;
    global.WebSocket = StubSocket;
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
  });

  describe("readyState", () => {
    test("is CLOSED if not connected", () => {
      const dataChannel = new DataChannel("", "Washington");
      expect(dataChannel.readyState).toBe(StubSocket.CLOSED);
    });

    test("is the socket ready state if connected", () => {
      const dataChannel = new DataChannel("", "Washington");
      dataChannel.connect();

      expect(dataChannel.readyState).toBe(StubSocket.OPEN);

      dataChannel.socket.close();
      expect(dataChannel.readyState).toBe(StubSocket.CLOSED);
    });
  });

  describe("connect", () => {
    test("closes existing sockets", () => {
      const dataChannel = new DataChannel("", "Washington");
      dataChannel.connect();

      const originalSocket = dataChannel.socket;
      dataChannel.connect();

      expect(originalSocket.readyState).toBe(StubSocket.CLOSED);
      expect(originalSocket).not.toBe(dataChannel.socket);
      expect(dataChannel.readyState).toBe(StubSocket.OPEN);
    });

    test("sends the user name when the socket is opened", () => {
      const dataChannel = new DataChannel("", "Washington");
      dataChannel.addEventListener("connected", () => {
        expect(dataChannel.socket.sendCallback).toHaveBeenCalledWith({
          type: "setName",
          name: "Washington",
        });
      });

      dataChannel.connect();
      dataChannel.socket.dispatchEvent("open");
    });

    test("emits an error on socket errors", () => {
      const dataChannel = new DataChannel("", "Washington");
      dataChannel.addEventListener("error", (event) => {
        expect(event.message).toEqual("Unknown socket error");
      });

      dataChannel.connect();
      dataChannel.socket.dispatchEvent("error");
    });

    test("emits an error on non-JSON game messages", () => {
      const dataChannel = new DataChannel("", "Washington");
      dataChannel.addEventListener("error", (event) => {
        expect(event.message).toEqual("Invalid game message");
      });

      dataChannel.connect();
      dataChannel.socket.dispatchEvent("message", { data: "Hello" });
    });

    const gameMessageTypes = [
      "start",
      "question",
      "countDown",
      "results",
      "end",
    ];
    for (const messageType of gameMessageTypes) {
      test(`emits ${messageType} event on ${messageType} messages`, () => {
        const dataChannel = new DataChannel("", "Washington");
        dataChannel.addEventListener(messageType, (event) => {
          expect(event.foo).toEqual("bar");
        });

        dataChannel.connect();
        dataChannel.socket.message({ type: messageType, foo: "bar" });
      });
    }

    test("emits an error event on error messages", () => {
      const dataChannel = new DataChannel("", "Washington");
      dataChannel.addEventListener("error", (event) => {
        expect(event.message).toEqual("Unknown game error");
      });

      dataChannel.connect();
      dataChannel.socket.message({ type: "error" });
    });

    test("emits an error event on unknown message types", () => {
      const dataChannel = new DataChannel("", "Washington");
      dataChannel.addEventListener("error", (event) => {
        expect(event.message).toEqual("Unknown data type from server");
      });

      dataChannel.connect();
      dataChannel.socket.message({ type: "unknown" });
    });
  });

  describe("joinGame", () => {
    test("emits an error if not connected", () => {
      const dataChannel = new DataChannel("", "Washington");

      dataChannel.addEventListener("error", (event) => {
        expect(event.message).toEqual("Not connected");
      });

      dataChannel.joinGame();
    });

    test("send a join message if connected", () => {
      const dataChannel = new DataChannel("", "Washington");
      dataChannel.connect();
      dataChannel.joinGame();

      expect(dataChannel.socket.sendCallback).toHaveBeenCalledWith({
        type: "join",
      });
    });
  });
});
