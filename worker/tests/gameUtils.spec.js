const { countDown, insertRandomlyInto } = require("../src/gameUtils.js");

describe("countDown", () => {
  jest.spyOn(global, "setTimeout");

  test("counts down with a step", async () => {
    const cb = jest.fn();

    await countDown(1000, 250, cb);

    expect(cb.mock.calls).toEqual([[1000], [750], [500], [250], [0]]);
  });
});

describe("insertRandomlyInto", () => {
  test("inserts into the front", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0);

    expect(insertRandomlyInto(0, [1, 2])).toEqual([0, 1, 2]);
  });

  test("inserts into the middle", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0.34);

    expect(insertRandomlyInto(0, [1, 2])).toEqual([1, 0, 2]);
  });

  test("inserts at the end", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0.99);

    expect(insertRandomlyInto(0, [1, 2])).toEqual([1, 2, 0]);
  });

  test("inserts into an empty array", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0.99);

    expect(insertRandomlyInto(0, [])).toEqual([0]);
  });
});
