# TriviaHub Web Frontend

This project is the TriviaHub web frontend. It is responsible for connecting cliets to a game. The web frontend posts game jobs to and listens for job progress on a `trivia-queue` BeeQueue.

When players answer questions those answers are placed in the `<gameId>:<round>` Redis key where `gameId` is the ID of the game and `round` is the current round. This key is a Redis hash keyed by played ID whose values are player answers represented by the 0-based index into the array of answers for the round's question. For example, if player `p1` want to pick the answer at index 1 then the value of the `p1` key would be `1`.

The web frontends maintain a waiting area for clients that wish to join a game at the `web:waiting` Redis key. This key is a Redis list where each element is a string of the form `<playerId>:<playerName>` where `playerId` is the unique ID of the player and `playerName` is the player's name. This key is cooperatively managed which new players are added to the end of the list. When a new game is started a web frontend watches the `web:waiting:lock` key and then attempts to remove players from the front of the list which incrementing that key in a single transaction. If the watch fails then it knows a different web frontend successfully created a game with those players and it drops its operation.

The web service will periodically ping its clients to ensure they are still available. Clients that don't respond in time are terminated.

## Incoming Client Messages

Clients connect to the web frontend over a websocket. The web frontend listens for various messages from the clients connected to it. All messages are JSON-formatted strings with a `type` field to indicate what type of message it is.

### `"type": "setName"`

The client is setting their name. This message contains a single field, `name`, representing the name of the user. Names must be a minimum of 3 and a maximum of 40 alphanumeric characters with `_` and spaces allowed.

#### Example

```json
{
  "type": "setName",
  "name": "Washington"
}
```

### `"type": "join"`

The client wishes to join a game.

#### Example

```json
{
  "type": "join"
}
```

### `"type": "answer"`

The client is answering a question. This message contains a single field, `answerIndex`, representing the 0-based index into the array of answers the client is choosing.

#### Example

```json
{
  "type": "answer",
  "answerIndex": 1
}
```

## Outgoing Client Messages

The web frontend reports various messages over the client's websocket. All messages are JSON-formatted strings with a `type` field to indicate what type of message it is.

### `"type": "start"`

The game is about to start.

#### Example

```json
{
  "type": "start"
}
```

### `type: "question"`

The game is posing a new question. Once message has been passed the players have a limited amount of time to submit answers. This message has three fields: the question in `question`, the list of answers in `answers`, and the current round in `round`.

#### Example

```json
{
  "type": "question",
  "question": "Who was the first president of the United States?",
  "answers": [
    "Abraham Lincoln",
    "George Washington",
    "John Adams"
  ],
  "round": 3
}
```

### `type: "countDown"`

The count down timer synchronization. This message is sent periodically while a count down is running so that clients can synchronize their own count downs. It has a single field, `timeLeft` which is an integer representing the number of milliseconds left in the count down.

#### Example

```json
{
  "type": "countDown",
  "timeLeft": 3000
}
```

### `type: "results"`

Results for the previous question are ready. Players can no longer submit answers for the question once its results have been posted. This message has six fields: the question in `question`, the list of answers in `answers`, and the current round in `round`, the index of the correct answer in `correctAnswerIndex`, the counts for each answer index in `answerCounts`, whether the client was eliminated in `eliminated`.

#### Example

```json
{
  "type": "results",
  "question": "Who was the first president of the United States?",
  "answers": [
    "Abraham Lincoln",
    "George Washington",
    "John Adams"
  ],
  "round": 3,
  "correctAnswerIndex": 2,
  "answerCounts": {
    "0": 1,
    "1": 502,
    "2": 3
  },
  "eliminated": true
}
```

### `type: "end"`

The game has ended. It has a single field, `winners` containing an array of player objects in the same format as the job's input. These players successfully answered every question correctly. The game may end early if all players have been eliminated in which case this is an empty array.

#### Example

```json
{
  "type": "end",
  "players": [
    {
      "id": "p1",
      "name": "Washington"
    },
    {
      "id": "p4",
      "name": "Milton"
    }
  ]
}
```

### `type: "error"`

The game has experience an unknown error and has come to an end.

#### Example

```json
{
  "type": "error"
}
```
