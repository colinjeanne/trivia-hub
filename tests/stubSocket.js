class StubSocket {
  constructor(url) {
    this.url = url;
    this.listeners = {};
    this.readyState = StubSocket.OPEN;
    this.sendCallback = jest.fn();
  }

  send(data) {
    this.sendCallback(JSON.parse(data));
  }

  close() {
    this.readyState = StubSocket.CLOSED;
  }

  message(data) {
    this.dispatchEvent("message", { data: JSON.stringify(data) });
  }

  addEventListener(type, cb) {
    this.listeners[type] = cb;
  }

  dispatchEvent(type, event = {}) {
    this.listeners[type](event);
  }
}

StubSocket.OPEN = 1;
StubSocket.CLOSED = 4;

module.exports = {
  StubSocket,
};
