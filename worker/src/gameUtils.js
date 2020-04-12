const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function countDown(ms, step, cb) {
  let timeLeft = ms;

  while (timeLeft > 0) {
    cb(timeLeft);
    timeLeft -= step;
    await sleep(step);
  }

  cb(timeLeft);
}

function insertRandomlyInto(value, arr) {
  const index = Math.floor(Math.random() * (arr.length + 1));
  const newArr = [...arr];
  newArr.splice(index, 0, value);

  return newArr;
}

module.exports = {
  countDown,
  insertRandomlyInto,
};
