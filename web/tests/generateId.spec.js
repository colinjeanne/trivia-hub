const { generateId } = require("../src/generateId.js");

describe("generateId", () => {
  test("it generates a random string", () => {
    expect(generateId()).toMatch(/^[0-9a-f]{32}$/);
  });
});
