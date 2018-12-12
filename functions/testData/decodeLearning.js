const data = require("./accuracyResults.json");
const fs = require("fs");
let result = 0;
let yes = 0;
let no = 0;
const MAP = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5
};
const parsed = data.map((d, i) => {
  if (d.result) {
    result++;
    yes++;
  } else {
    result--;
    no++;
  }
  return {
    x: i,
    percent: yes / (i + 1)
  };
});
const reduced = data.reduce(
  (accum, data) => {
    const acc = { ...accum };
    if (data.result) {
      acc.total++;
      acc.exact++;
    } else {
      const difference = Math.abs(MAP[data.actual] - MAP[data.modelScore]);
      if (difference === 1) {
        acc.oneAway++;
      }
      if (difference === 2) {
        acc.twoAway++;
      }
      if (difference === 3) {
        acc.threeAway++;
      }
      if (difference === 4) {
        acc.fourAway++;
      }
    }
    return acc;
  },
  {
    total: 0,
    exact: 0,
    oneAway: 0,
    twoAway: 0,
    threeAway: 0,
    fourAway: 0
  }
);
fs.writeFileSync("./parsedAccuracy.json", JSON.stringify(parsed), "utf8");
fs.writeFileSync(
  "./parsedAccuracyTotals.json",
  JSON.stringify(reduced),
  "utf8"
);
