const EventEmitter = require("events");
const { generateId } = require("./generateId.js");

function validateName(name) {
  return /^[A-Za-z0-9_ ]{3,40}$/.test(name);
}

function validateAnswerIndex(answerIndex) {
  return Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex < 10;
}

function processMessage(message, channel) {
  let jsonData;
  try {
    jsonData = JSON.parse(message);
  } catch (e) {
    channel.emit("invalid message", message, e.message, channel);
  }

  if (jsonData.type === "setName" && validateName(jsonData.name)) {
    channel.emit("set name", jsonData.name, channel);
  } else if (jsonData.type === "join") {
    channel.emit("join", channel);
  } else if (
    jsonData.type === "answer" &&
    validateAnswerIndex(jsonData.answerIndex)
  ) {
    channel.emit("answer", jsonData.answerIndex, channel);
  } else {
    channel.emit("invalid message", message, "Invalid type or data", channel);
  }
}

function sendDataToClient(socket, data) {
  socket.send(JSON.stringify(data));
}

class DataChannel extends EventEmitter {
  constructor(socket) {
    super();

    this.socket = socket;
    this.active = true;
    this.id = generateId();

    this.socket.on("close", () => {
      this.active = false;
      this.emit("disconnected", this.id, this);
    });
    this.socket.on("message", (message) => processMessage(message, this));
    this.socket.on("pong", () => (this.active = true));
  }

  processGameMessage(message) {
    if (message.type === "start") {
      sendDataToClient(this.socket, { type: "start" });
    } else if (message.type === "question") {
      this.emit("question", message.round, this);

      sendDataToClient(this.socket, {
        type: "question",
        question: message.question,
        answers: message.answers,
        round: message.round,
      });
    } else if (message.type === "countDown") {
      sendDataToClient(this.socket, {
        type: "countDown",
        timeLeft: message.timeLeft,
      });
    } else if (message.type === "results") {
      const eliminated = message.eliminatedPlayerIds.includes(this.id);
      if (eliminated) {
        this.emit("eliminated", this);
      }

      sendDataToClient(this.socket, {
        type: "results",
        question: message.question,
        answers: message.answers,
        correctAnswerIndex: message.correctAnswerIndex,
        answerCounts: message.answerCounts,
        eliminated,
        round: message.round,
      });
    } else if (message.type === "end") {
      sendDataToClient(this.socket, {
        type: "end",
        winners: message.winners,
      });
    } else {
      this.emit("invalid game message", message.type, "Unknown type", this);
    }
  }

  gameError() {
    sendDataToClient(this.socket, {
      type: "error",
    });
  }
}

module.exports = {
  DataChannel,
};
