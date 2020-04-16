class StubRedisClient {
  constructor(data = {}) {
    this.data = data;
  }

  hgetall(key, cb) {
    cb(undefined, this.data[key] || null);
  }
}

module.exports = {
  StubRedisClient,
};
