const { PlayerState } = require("../src/playerState.js");

describe("PlayerState", () => {
  describe("processAnswers", () => {
    test("eliminates players who answered incorrectly", () => {
      const players = [
        { id: "1", name: "Washington" },
        { id: "2", name: "Irving" },
        { id: "3", name: "John" },
        { id: "4", name: "Milton" },
      ];
      const playerState = new PlayerState(players);
      const eliminatedPlayerIds = playerState.processAnswers(
        { "1": 0, "2": 1, "3": 1, "4": 2 },
        1
      );
      expect(eliminatedPlayerIds).toEqual(["1", "4"]);
    });

    test("eliminates unknown players", () => {
      const players = [{ id: "1", name: "Washington" }];
      const playerState = new PlayerState(players);
      const eliminatedPlayerIds = playerState.processAnswers(
        { "1": 1, "2": 1, "3": 0 },
        1
      );
      expect(eliminatedPlayerIds).toEqual(["2", "3"]);
    });

    test("eliminates players that didn't answer", () => {
      const players = [
        { id: "1", name: "Washington" },
        { id: "2", name: "Irving" },
      ];
      const playerState = new PlayerState(players);
      const eliminatedPlayerIds = playerState.processAnswers({ "1": 1 }, 1);
      expect(eliminatedPlayerIds).toEqual(["2"]);
    });
  });

  describe("activePlayers", () => {
    test("includes the active players", () => {
      const players = [
        { id: "1", name: "Washington" },
        { id: "2", name: "Irving" },
      ];
      const playerState = new PlayerState(players);
      expect(playerState.activePlayers).toEqual(players);
    });

    test("excludes the inactive players", () => {
      const players = [
        { id: "1", name: "Washington" },
        { id: "2", name: "Irving" },
      ];
      const playerState = new PlayerState(players);
      playerState.processAnswers({ "1": 0, "2": 1 }, 1);

      expect(playerState.activePlayers).toEqual([{ id: "2", name: "Irving" }]);
    });

    test("is empty when there are no players", () => {
      const playerState = new PlayerState([]);
      expect(playerState.activePlayers).toHaveLength(0);
    });
  });

  describe("hasActivePlayers", () => {
    test("is true when there are active players", () => {
      const playerState = new PlayerState([{ id: "1", name: "David" }]);
      expect(playerState.hasActivePlayers).toBe(true);
    });

    test("is false when there are no active players", () => {
      const playerState = new PlayerState([{ id: "1", name: "David" }]);
      playerState.processAnswers({ "1": 0 }, 1);

      expect(playerState.hasActivePlayers).toBe(false);
    });

    test("is false when there are no players", () => {
      const playerState = new PlayerState([]);
      expect(playerState.hasActivePlayers).toBe(false);
    });
  });
});
