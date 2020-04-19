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
    e("span", null, props.title),
    e("span", { id: "count-down-timer" }, secondsLeft.toFixed(1))
  );
}

function EnterNamePage(props) {
  const [name, setName] = React.useState("");

  return e(
    "div",
    null,
    e("div", null, "Welcome to TriviaHub"),
    e(
      "label",
      null,
      "What's your name?",
      e("input", {
        onChange: (event) => setName(event.currentTarget.value),
        value: name,
      })
    ),
    e("button", { onClick: () => props.chooseName(name) }, "Enter")
  );
}

function ConnectingPage() {
  return e(Ripple);
}

function JoinGamePage(props) {
  return e("button", { onClick: () => props.onJoin() }, "Join a game!");
}

function WaitingAreaPage() {
  return e("div", null, e("div", null, "Waiting for a new game..."), e(Ripple));
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
  const answers = props.questionData.answers.map((answer, answerIndex) =>
    e(
      "li",
      {
        disabled: props.eliminated,
        key: answer,
        onClick: () => props.onAnswer(answerIndex),
      },
      answer
    )
  );
  return e(
    "div",
    null,
    e("div", { className: "question" }, props.questionData.question),
    e(CountDown, { timeLeft: props.timeLeft, title: "Time left" }),
    e("ol", { className: "answers" }, answers)
  );
}

function ResultsPage(props) {
  const answers = props.questionData.answers.map((answer) =>
    e(
      "li",
      {
        disabled: props.eliminated,
        key: answer,
      },
      answer
    )
  );
  return e(
    "div",
    null,
    e("div", { className: "question" }, props.questionData.question),
    e(CountDown, { timeLeft: props.timeLeft, title: "Next round" }),
    e("ol", { className: "answers" }, answers)
  );
}

function WinnersPage(props) {
  const winners = props.winners.map((winner, winnerIndex) =>
    e("li", { key: `${winner}-${winnerIndex}` }, winner)
  );
  return e("ul", null, winners);
}

function ErrorPage(props) {
  return e(
    "div",
    { className: "error" },
    e("div", null, "An error occurred!"),
    e("div", null, props.errorMessage)
  );
}

// This is expected to be in the global scope
// eslint-disable-next-line no-unused-vars
function App(props) {
  const [page, setPage] = React.useState(Pages.ENTER_NAME);
  const [dataChannel, setDataChannel] = React.useState(null);
  const [timeLeft, setTimeLeft] = React.useState(null);
  const [questionData, setQuestionData] = React.useState(null);
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

  if (page === Pages.ENTER_NAME) {
    return e(EnterNamePage, { chooseName: handleChooseName });
  } else if (page === Pages.CONNECTING) {
    return e(ConnectingPage);
  } else if (page === Pages.JOIN_GAME) {
    return e(JoinGamePage, { onJoin: handleJoinGame });
  } else if (page === Pages.WAITING_AREA) {
    return e(WaitingAreaPage);
  } else if (page === Pages.STARTING_GAME) {
    return e(StartingGamePage, { timeLeft });
  } else if (page === Pages.QUESTION) {
    return e(QuestionPage, {
      eliminated,
      onAnswer: handleAnswer,
      questionData,
      timeLeft,
    });
  } else if (page === Pages.RESULTS) {
    return e(ResultsPage, { questionData, timeLeft });
  } else if (page === Pages.WINNERS) {
    return e(WinnersPage, { winners });
  } else if (page === Pages.ERROR) {
    return e(ErrorPage, { message: errorMessage });
  }

  return e(ErrorPage, { message: "Unknown error" });
}
