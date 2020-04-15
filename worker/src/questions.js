function fetchQuestions() {
  // This function is a stand in for a function that would fetch trivia
  // questions from some source.
  return [
    {
      question: "Which company is Wile E. Coyote's primary supplier?",
      answer: "ACME",
      diversions: ["ACNE", "Ace Hardware"],
    },
    {
      question:
        "Where should choking victims place their hands to ask for help?",
      answer: "Around the throat",
      diversions: ["Over the eyes", "On the hips"],
    },
    {
      question: "Which of these dance names describes a fashionable dot?",
      answer: "Polka",
      diversions: ["Hora", "Swing"],
    },
    {
      question:
        'In what "language" would you say "ello-hay" to great your friends?',
      answer: "Pig Latin",
      diversions: ["Duck Latin", "Dog Latin"],
    },
    {
      question: 'Which part of a chicken is commonly called the "drumstick"?',
      answer: "Leg",
      diversions: ["Breast", "Wing"],
    },
    {
      question:
        'What is the only position on a football team that can be "sacked"?',
      answer: "Quaterback",
      diversions: ["Center", "Wide receiver"],
    },
    {
      question:
        "What god of love is often depicted as a chubby winged infant with a bow and arrow?",
      answer: "Cupid",
      diversions: ["Mercury", "Poseidon"],
    },
    {
      question:
        "What Steven Spielberg film climaxes at a place called Devil's Tower?",
      answer: "Close Encounters of the Third Kind",
      diversions: ["E.T: The Extra-Terrestrial", "Raiders of the Lost Ark"],
    },
    {
      question:
        "In what US town did the famous 1881 shoot-out at the O.K. Corral take place?",
      answer: "Tombstone",
      diversions: ["El Paso", "Dodge City"],
    },
    {
      question: "Which of the following months has no US federal holiday?",
      answer: "August",
      diversions: ["February", "November"],
    },
    {
      question: "What mythological beast is reborn from its own ashes?",
      answer: "Phoenix",
      diversions: ["Dragon", "Golem"],
    },
    {
      question: "Who developed the first effective vaccine against polio?",
      answer: "Jonas Salk",
      diversions: ["Albert Sabin", "Louis Pasteur"],
    },
    {
      question: "Which of the following is not a monotheistic religion?",
      answer: "Hinduism",
      diversions: ["Islam", "Judaism"],
    },
    {
      question:
        "What architect designed the glass pyramid in the courtyard of the Louvre?",
      answer: "I.M. Pei",
      diversions: ["Philip Johnson", "Frank Gehry"],
    },
    {
      question:
        'Which of these US Presidents appeared on the television series "Laugh-In"?',
      answer: "Richard Nixon",
      diversions: ["Gerald Ford", "Jimmy Carter"],
    },
  ];
}

module.exports = {
  fetchQuestions,
};
