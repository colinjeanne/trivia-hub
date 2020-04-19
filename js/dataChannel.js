function emitError(message, channel) {
  const errorEvent = new Event("error");
  errorEvent.message = message;
  channel.dispatchEvent(errorEvent);
}

function dispatchGameEvent(data, channel) {
  const event = new Event(data.type);
  for (const [key, value] of Object.entries(data)) {
    if (key !== "type") {
      event[key] = value;
    }
  }

  channel.dispatchEvent(event);
}

function handleSocketMessage(data, channel) {
  const knownEvents = ["start", "question", "countDown", "results", "end"];
  if (knownEvents.includes(data.type)) {
    dispatchGameEvent(data, channel);
  } else if (data.type === "error") {
    emitError("Unknown game error", channel);
  } else {
    emitError("Unknown data type from server", channel);
  }
}

function sendData(data, socket) {
  socket.send(JSON.stringify(data));
}

class DataChannel extends EventTarget {
  constructor(serverUrl, name) {
    super();

    this.name = name;
    this.serverUrl = serverUrl;
    this.socket = null;
  }

  get readyState() {
    if (this.socket) {
      return this.socket.readyState;
    }

    return WebSocket.CLOSED;
  }

  connect() {
    if (this.socket) {
      this.socket.close();
    }

    this.socket = new WebSocket(this.serverUrl);
    this.socket.addEventListener("open", () => {
      sendData({ type: "setName", name: this.name }, this.socket);

      const connectedEvent = new Event("connected");
      this.dispatchEvent(connectedEvent);
    });

    this.socket.addEventListener("error", () =>
      emitError("Unknown socket error", this)
    );

    this.socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSocketMessage(data, this);
      } catch (e) {
        emitError("Invalid game message", this);
      }
    });
  }

  joinGame() {
    if (this.readyState !== WebSocket.OPEN) {
      emitError("Not connected", this);
      return;
    }

    sendData({ type: "join" }, this.socket);
  }

  answer(answerIndex) {
    if (this.readyState !== WebSocket.OPEN) {
      emitError("Not connected", this);
      return;
    }

    sendData({ type: "answer", answerIndex }, this.socket);
  }
}

// Make this work in both browser and Node environments
// eslint-disable-next-line no-undef
let _module = typeof module !== "undefined" ? module : {};

_module.exports = {
  DataChannel,
};
