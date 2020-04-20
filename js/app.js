"use strict";

/* global DataChannel:readonly, React:readonly */

const Pages = {
  ENTER_NAME: 0,
  CONNECTING: 1,
  JOIN_GAME: 2,
  WAITING_AREA: 3,
  STARTING_GAME: 4,
  QUESTION: 5,
  RESULTS: 6,
  WINNERS: 7,
  ERROR: 8,
};

const e = React.createElement;

const Ripple = () => e("div", { className: "lds-ripple" }, e("div"), e("div"));

function CountDown(props) {
  const [timeLeft, setTimeLeft] = React.useState(props.timeLeft);

  if (props.timeLeft > timeLeft + 1000) {
    setTimeLeft(props.timeLeft);
  }

  React.useEffect(() => {
    const timerId =
      timeLeft > 0 &&
      setInterval(() => {
        const newTimeLeft = Math.min(timeLeft - 100, props.timeLeft);
        setTimeLeft(newTimeLeft);
      }, 100);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  const secondsLeft = timeLeft / 1000;

  return e(
    "div",
    { className: "count-down-timer" },
    e("div", null, props.title),
    e("div", { id: "count-down-timer" }, secondsLeft.toFixed(1))
  );
}

function EnterNamePage(props) {
  const [name, setName] = React.useState("");
  const inputRef = React.useRef(null);

  return e(
    "div",
    { className: "enter-page" },
    e("input", {
      onChange: (event) => setName(event.currentTarget.value),
      maxLength: 40,
      minLength: 3,
      pattern: "^[A-Za-z0-9_ ]{3,40}$",
      placeholder: "What's your name?",
      ref: inputRef,
      value: name,
    }),
    e(
      "button",
      {
        disabled: !inputRef.current || !inputRef.current.validity.valid,
        onClick: (event) =>
          event.currentTarget.validity.valid && props.chooseName(name),
      },
      "Enter"
    )
  );
}

function ConnectingPage() {
  return e(Ripple);
}

function JoinGamePage(props) {
  return e(
    "button",
    {
      className: "join-game-button",
      onClick: () => props.onJoin(),
    },
    "Join a game!"
  );
}

function WaitingAreaPage() {
  return e(
    "div",
    { className: "waiting-area" },
    e("div", null, "Waiting for a new game..."),
    e(Ripple)
  );
}

function StartingGamePage(props) {
  if (props.timeLeft === null) {
    return null;
  }

  return e(CountDown, {
    timeLeft: props.timeLeft,
    title: "Get ready! The game's about to start!",
  });
}

function QuestionPage(props) {
  const [chosenIndex, setChosenIndex] = React.useState(null);

  const answers = props.questionData.answers.map((answer, answerIndex) =>
    e(
      "li",
      {
        key: answer,
      },
      e(
        "button",
        {
          className: answerIndex === chosenIndex ? "chosen-answer" : undefined,
          disabled: props.eliminated,
          onClick: () => {
            setChosenIndex(answerIndex);
            props.onAnswer(answerIndex);
          },
        },
        answer
      )
    )
  );
  return e(
    "div",
    { className: "question-page" },
    e("div", { className: "question" }, props.questionData.question),
    e(CountDown, { timeLeft: props.timeLeft, title: "Time left" }),
    e("ol", { className: "answers" }, answers)
  );
}

function ResultsPage(props) {
  const answers = props.questionData.answers.map((answer, index) =>
    e(
      "li",
      {
        key: answer,
      },
      e(
        "div",
        {
          className:
            index === props.resultsData.correctAnswerIndex
              ? "results-answer correct-answer"
              : "results-answer",
        },
        e("span", null, answer),
        e("span", null, props.resultsData.answerCounts[index])
      )
    )
  );
  return e(
    "div",
    { className: "results-page" },
    e("div", { className: "question" }, props.questionData.question),
    e(CountDown, { timeLeft: props.timeLeft, title: "Next round" }),
    e("ol", { className: "answers" }, answers)
  );
}

function WinnersPage(props) {
  const winners = props.winners.map((winner) =>
    e("li", { key: winner.id }, winner.name)
  );

  const playAgain = e("button", { onClick: props.onPlayAgain }, "Play again!");

  if (winners.length === 0) {
    return e(
      "div",
      { className: "winners" },
      e(
        "div",
        null,
        "No one was able to answer all questions. Better luck next time!"
      ),
      playAgain
    );
  }

  return e(
    "div",
    { className: "winners" },
    e("div", null, "Congratulations to our winners!"),
    e("ul", { className: "winners" }, winners),
    playAgain
  );
}

function ErrorPage(props) {
  return e(
    "div",
    { className: "error" },
    e("div", null, "An error occurred!"),
    e("div", null, props.errorMessage)
  );
}

function PlayerCount(props) {
  if (!props.answerCounts) {
    return null;
  }

  const playerCount = Object.values(props.answerCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  return e("div", { className: "player-count" }, `👤 ${playerCount}`);
}

// This is expected to be in the global scope
// eslint-disable-next-line no-unused-vars
function App(props) {
  const [page, setPage] = React.useState(Pages.ENTER_NAME);
  const [dataChannel, setDataChannel] = React.useState(null);
  const [timeLeft, setTimeLeft] = React.useState(null);
  const [questionData, setQuestionData] = React.useState({});
  const [resultsData, setResultsData] = React.useState({});
  const [eliminated, setEliminated] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [winners, setWinners] = React.useState([]);

  function handleChooseName(name) {
    const newDataChannel = new DataChannel(props.url, name);
    newDataChannel.addEventListener("connected", () => {
      setPage(Pages.JOIN_GAME);
      console.log("Connected!");
    });
    newDataChannel.addEventListener("error", (event) => {
      setErrorMessage(event.message);
      setPage(Pages.ERROR);
    });

    newDataChannel.addEventListener("start", () => {
      setEliminated(false);
      setPage(Pages.STARTING_GAME);
    });

    newDataChannel.addEventListener("question", (event) => {
      setQuestionData({
        question: event.question,
        answers: event.answers,
      });
      setTimeLeft(null);
      setPage(Pages.QUESTION);
    });

    newDataChannel.addEventListener("countDown", (event) => {
      setTimeLeft(event.timeLeft);
    });

    newDataChannel.addEventListener("results", (event) => {
      if (event.eliminated) {
        setEliminated(event.eliminated);
      }
      setResultsData({
        correctAnswerIndex: event.correctAnswerIndex,
        answerCounts: event.answerCounts,
      });
      setTimeLeft(null);
      setPage(Pages.RESULTS);
    });

    newDataChannel.addEventListener("end", (event) => {
      setWinners(event.winners);
      setPage(Pages.WINNERS);
    });

    setDataChannel(newDataChannel);
    setPage(Pages.CONNECTING);

    newDataChannel.connect();
  }

  function handleJoinGame() {
    dataChannel.joinGame();
    setPage(Pages.WAITING_AREA);
  }

  function handleAnswer(answerIndex) {
    dataChannel.answer(answerIndex);
  }

  let pageSection;
  if (page === Pages.ENTER_NAME) {
    pageSection = e(EnterNamePage, { chooseName: handleChooseName });
  } else if (page === Pages.CONNECTING) {
    pageSection = e(ConnectingPage);
  } else if (page === Pages.JOIN_GAME) {
    pageSection = e(JoinGamePage, { onJoin: handleJoinGame });
  } else if (page === Pages.WAITING_AREA) {
    pageSection = e(WaitingAreaPage);
  } else if (page === Pages.STARTING_GAME) {
    pageSection = e(StartingGamePage, { timeLeft });
  } else if (page === Pages.QUESTION) {
    pageSection = e(QuestionPage, {
      eliminated,
      onAnswer: handleAnswer,
      questionData,
      timeLeft,
    });
  } else if (page === Pages.RESULTS) {
    pageSection = e(ResultsPage, { questionData, resultsData, timeLeft });
  } else if (page === Pages.WINNERS) {
    pageSection = e(WinnersPage, {
      onPlayAgain: () => {
        setQuestionData({});
        setResultsData({});
        setPage(Pages.JOIN_GAME);
      },
      winners,
    });
  } else if (page === Pages.ERROR) {
    pageSection = e(ErrorPage, { message: errorMessage });
  } else {
    pageSection = e(ErrorPage, { message: "Unknown error" });
  }

  return e(
    React.Fragment,
    null,
    e(PlayerCount, { answerCounts: resultsData.answerCounts }),
    pageSection
  );
}
