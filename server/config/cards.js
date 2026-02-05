const CARDS_DB = [
  // JOY CARDS - Have tasks
  {
    id: "j1",
    color: "joy",
    value: "1",
    title: "DANCE",
    text: "DO YOUR BEST DANCE MOVE FOR 10 SECONDS. ASK THEM TO REPEAT. IF THEY GET IT WRONG THEY DRAW 2 CARDS, IF THEY GET IT RIGHT YOU DRAW 2 CARDS.",
    type: "task",
  },
  {
    id: "j2",
    color: "joy",
    value: "2",
    title: "SING & DANCE",
    text: "PLAY YOUR FAVORITE SONG AND SING TO ME WHILE STARING INTO MY EYES AND GIVING ME A LAP DANCE FOR 20 SECONDS OR DRAW 2 CARDS",
    type: "task",
  },
  {
    id: "j3",
    color: "joy",
    value: "3",
    title: "ACT",
    text: "MAKE LOVE TO THE NEAREST PILLOW FOR 30 SECONDS. I WILL DIRECT. IF I DONT LIKE YOUR PERFORMANCE. DRAW 2 CARDS",
    type: "task",
  },
  {
    id: "j4",
    color: "joy",
    value: "4",
    title: "MEMORY",
    text: "ASK THEM WHEN THEY STARTED LIKING YOU AND WHAT YOU DID RIGHT OR WRONG.",
    type: "task",
  },
  {
    id: "j6",
    color: "joy",
    value: "6",
    title: "ACT",
    text: "MAKE ME LAUGH IN 10 SECONDS OR DRAW 2 CARDS",
    type: "task",
  },
  // PASSION CARDS - Have tasks
  {
    id: "p2",
    color: "passion",
    value: "2",
    title: "LIPS",
    text: "KISS ME FOR 30 SECONDS WITHOUT OPENING YOUR EYES.",
    type: "task",
  },
  {
    id: "p7",
    color: "passion",
    value: "7",
    title: "INTIMATE",
    text: "KISS MY MOST SENSITIVE PART FOR 3 MINUTES. IF I JUMP, I DRAW 2.",
    type: "task",
  },
  // CARE CARDS - Have tasks
  {
    id: "c4",
    color: "care",
    value: "4",
    title: "HEALTH",
    text: "PARTNER MUST DO 10 PUSHUPS, 25 CRUNCHES AND 10 DIPS.",
    type: "task",
  },
  // GROWTH CARDS - Have tasks
  {
    id: "g1",
    color: "growth",
    value: "1",
    title: "GROWTH",
    text: "TELL ME 3 THINGS I DO THAT MAKE YOU UNCOMFORTABLE/COMFORTABLE.",
    type: "task",
  },
  // WILD CARDS - No tasks, special effects
  {
    id: "w1",
    color: "wild",
    value: "W",
    title: "WILD",
    text: "CHOOSE THE NEXT COLOR.",
    type: "wild",
    effect: "color",
  },
  {
    id: "w3",
    color: "wild",
    value: "+4",
    title: "WILD +4",
    text: "OPPONENT DRAWS 4 CARDS & YOU CHOOSE NEXT COLOR.",
    type: "wild",
    effect: "draw4",
  },
  {
    id: "w9",
    color: "wild",
    value: "⊘",
    title: "SKIP",
    text: "SKIP OPPONENT'S TURN. PLAY AGAIN!",
    type: "wild",
    effect: "skip",
  },
  {
    id: "w11",
    color: "wild",
    value: "⇄2",
    title: "SWAP 2",
    text: "SWAP 2 RANDOM CARDS WITH YOUR PARTNER.",
    type: "wild",
    effect: "swap2",
  },
  {
    id: "w12",
    color: "wild",
    value: "⇄1",
    title: "SWAP 1",
    text: "SWAP 1 RANDOM CARD WITH YOUR PARTNER.",
    type: "wild",
    effect: "swap1",
  },
];

const createDeck = () => {
  let deck = [];
  [...CARDS_DB, ...CARDS_DB, ...CARDS_DB].forEach((c) => {
    deck.push({ ...c, uid: Math.random().toString(36).substr(2, 9) });
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const dealInitialCards = (deck) => {
  const p1Hand = deck.splice(0, 7);
  const p2Hand = deck.splice(0, 7);

  let startCard = deck.pop();
  while (startCard.color === "wild") {
    deck.unshift(startCard);
    startCard = deck.pop();
  }

  return { p1Hand, p2Hand, startCard, remainingDeck: deck };
};

module.exports = { CARDS_DB, createDeck, dealInitialCards };
