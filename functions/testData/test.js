const firebase = require("firebase-admin");
const fs = require("fs");
const { onAnswer, onReview } = require("../index");
const { newItem } = require("../firebaseHelpers");

const testData = require("./q1.json");

let count = 0;

const SCORE_MAP = {
  2: "E",
  3: "E",
  4: "D",
  5: "D",
  6: "C",
  7: "C",
  8: "C",
  9: "B",
  10: "B",
  11: "A",
  12: "A"
};

const biggestProperty = obj => {
  let maxVal;
  let maxKey;
  for (let [key, value] of Object.entries(obj)) {
    if (!maxVal || value > maxVal) {
      maxVal = value;
      maxKey = key;
    }
  }
  return [maxKey, maxVal];
};

const learningProgressResults = [];
const questionId = "4ulGL3j6ZYl10InESptD";
const int = setInterval(async () => {
  count++;
  console.log("STARTING ", count);
  if (!testData[count] || count > 200) {
    clearInterval(int);
    fs.writeFileSync(
      "./learningProgressResults.json",
      JSON.stringify(learningProgressResults),
      "utf8"
    );
    console.log("Finished");
  }
  const { id, answer, score } = testData[count];
  // On Answer
  const answerId = await newItem("answers", {
    answer,
    author: {
      name: "Test",
      uid: "Test"
    },
    comments: "",
    isReviewed: false,
    questionId,
    score: null
  });

  const modelResults = await onAnswer.run({ questionId, answerId });
  const modelScore = biggestProperty(modelResults)[0];
  learningProgressResults.push({
    actual: SCORE_MAP[score],
    modelResults,
    modelScore,
    result: SCORE_MAP[score] === modelScore
  });
  await firebase
    .firestore()
    .collection("answers")
    .doc(answerId)
    .update({
      comments: id,
      isReviewed: true,
      score: SCORE_MAP[score]
    });

  // On review
  await onReview.run({ questionId, answerId });
}, 2000);
