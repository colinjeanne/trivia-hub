class StubRedisClient {
  constructor(data = {}) {
    this.data = data;
  }

  hgetall(key, cb) {
    return cb(undefined, this.data[key] || null);
  }
}

module.exports = {
  StubRedisClient,
};
