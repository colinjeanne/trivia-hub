# TriviaHub Game Worker

This project is the TriviaHub game worker. It is responsible for running a TriviaHub game. The worker listens for jobs on a `trivia-queue` BeeQueue.

The game periodically checks for answers to the current question in the `<gameId>:<round>` Redis key where `gameId` is the ID of the game and `round` is the current round. This key is a Redis hash keyed by played ID whose values are player answers represented by the 0-based index into the array of answers for the round's question. For example, if player `p1` want to pick the answer at index 1 then the value of the `p1` key would be `1`.

## Job Input

The job expects a list of player objects as input. A player object has two keys, `id` and `name`, which are the unique ID of the player and the (not necessarily unique) name of the player, respectively. Both values are strings. For example:

```json
[
  {
    "id": "p1",
    "name": "Washington"
  },
  {
    "id": "p2",
    "name": "Irving"
  },
  {
    "id": "p3",
    "name": "John"
  },
  {
    "id": "p4",
    "name": "Milton"
  }
]
```

## Job Progress Messages

This job reports several types of progress messages indicating the current state of the game. All messages are JSON objects with a `type` field indicating the type of message represented.

### `"type": "start"`

The game is about to start. This message contains two fields, `players` and `gameId`, representing the set of players playing the game and a unique ID for the game, respectively. `players` is in the same format as the set of players that is passed in to the game. `gameId` is a string.

#### Example

```json
{
  "type": "start",
  "players": [
    {
      "id": "p1",
      "name": "Washington"
    },
    {
      "id": "p2",
      "name": "Irving"
    },
    {
      "id": "p3",
      "name": "John"
    },
    {
      "id": "p4",
      "name": "Milton"
    }
  ],
  "gameId": "g1"
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

Results for the previous question are ready. Players can no longer submit answers for the question once its results have been posted. This message has six fields: the question in `question`, the list of answers in `answers`, and the current round in `round`, the index of the correct answer in `correctAnswerIndex`, the counts for each answer index in `answerCounts`, an array of eliminated player IDs in `eliminatedPlayerIds`.

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
  "correctAnswerIndex": 1,
  "answerCounts": {
    "0": 1,
    "1": 502,
    "2": 3
  },
  "eliminatedPlayerIds": [ "p5", "p87", "p355", "p12", "p154" ]
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
