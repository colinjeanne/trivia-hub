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

module.exports = {
  StubRedisClient,
};
