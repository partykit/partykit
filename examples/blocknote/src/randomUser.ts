const colors = [
  "#958DF1",
  "#F98181",
  "#FBBC88",
  "#FAF594",
  "#70CFF8",
  "#94FADB",
  "#B9F18D"
];

// some random gpt generated names
const names = [
  "Lorem Ipsumovich",
  "Typy McTypeface",
  "Collabo Rative",
  "Edito Von Editz",
  "Wordsworth Writywrite",
  "Docu D. Mentor",
  "Scrivener Scribblesworth",
  "Digi Penman",
  "Ernest Wordway",
  "Sir Typalot",
  "Comic Sans-Serif",
  "Miss Spellcheck",
  "Bullet Liston",
  "Autonomy Backspace",
  "Ctrl Zedson"
];

const getRandomElement = <T>(list: T[]) =>
  list[Math.floor(Math.random() * list.length)];

const getRandomColor = () => getRandomElement(colors);
const getRandomName = () => getRandomElement(names);

export const getRandomUser = () => ({
  name: getRandomName(),
  color: getRandomColor()
});
