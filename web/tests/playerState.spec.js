const { PlayerState } = require("../src/playerState.js");

describe("PlayerState", () => {
  test("getPlayer finds a known player", () => {
    const playerState = new PlayerState();
    playerState.connect("Washington", { id: "p1" });

    expect(playerState.getPlayer("p1")).toEqual({
      id: "p1",
      name: "Washington",
      socket: { id: "p1" },
      gameId: null,
      active: false,
    });
  });

  test("getPlayer does not find an unknown player", () => {
    const playerState = new PlayerState();

    expect(playerState.getPlayer("unknown")).not.toBeDefined();
  });

  test("getPlayersInGame finds all players in a game", () => {
    const playerState = new PlayerState();
    playerState.connect("Washington", { id: "p1" });
    playerState.connect("Irving", { id: "p2" });
    playerState.connect("John", { id: "p3" });

    playerState.joinGame("p1", "G1");
    playerState.joinGame("p2", "G2");
    playerState.joinGame("p3", "G1");

    expect(playerState.getPlayersInGame("G1")).toEqual([
      expect.objectContaining({ id: "p1" }),
      expect.objectContaining({ id: "p3" }),
    ]);
  });

  test("getPlayersInGame returns empty for unknown games", () => {
    const playerState = new PlayerState();
    playerState.connect("Washington", { id: "p1" });
    playerState.connect("Irving", { id: "p2" });
    playerState.connect("John", { id: "p3" });

    playerState.joinGame("p1", "G1");
    playerState.joinGame("p2", "G1");
    playerState.joinGame("p3", "G1");

    expect(playerState.getPlayersInGame("G2")).toEqual([]);
  });

  test("disconnect removes existing players", () => {
    const playerState = new PlayerState();
    playerState.connect("Washington", { id: "p1" });
    expect(playerState.getPlayer("p1")).toBeDefined();

    playerState.disconnect("p1");

    expect(playerState.getPlayer("p1")).not.toBeDefined();
  });

  test("disconnect is idempotent", () => {
    const playerState = new PlayerState();
    playerState.connect("Washington", { id: "p1" });

    playerState.disconnect("p1");
    playerState.disconnect("p1");

    expect(playerState.getPlayer("p1")).not.toBeDefined();
  });

  test("joinGame joins existing players to a game", () => {
    const playerState = new PlayerState();
    playerState.connect("Washington", { id: "p1" });

    playerState.joinGame("p1", "G");

    expect(playerState.getPlayer("p1")).toEqual(
      expect.objectContaining({
        gameId: "G",
        active: true,
      })
    );
  });

  test("joinGame ignores nonexisting players", () => {
    const playerState = new PlayerState();

    playerState.joinGame("unknown", "G");

    expect(playerState.getPlayer("p1")).not.toBeDefined();
  });

  test("eliminateFromGame makes a player as no longer active in a game", () => {
    const playerState = new PlayerState();
    playerState.connect("Washington", { id: "p1" });

    playerState.joinGame("p1", "G");
    playerState.eliminateFromGame("p1")

    expect(playerState.getPlayer("p1")).toEqual(
      expect.objectContaining({
        gameId: "G",
        active: false,
      })
    );
  });

  test("eliminateFromGame ignores nonexisting players", () => {
    const playerState = new PlayerState();

    playerState.eliminateFromGame("unknown");

    expect(playerState.getPlayer("p1")).not.toBeDefined();
  });
});
