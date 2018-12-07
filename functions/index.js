const brain = require("brain.js");
const firebase = require("firebase-admin");
const serviceAccount = require("./secret.json");
const functions = require("firebase-functions");
const {
  getQuestionWithAnswers,
  getAnswer,
  getQuestion
} = require("./firebaseHelpers");
const { encodeAnswer } = require("./encoder");

const config = {
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://marker-6d055.firebaseio.com",
  storageBucket: "gs://marker-6d055.appspot.com",
  projectId: "marker-6d055"
};
firebase.initializeApp(config);
const settings = { timestampsInSnapshots: true };
firebase.firestore().settings(settings);

var exports = (module.exports = {});

/**
 * When a user submits an answer:
 *  If a question has a model related to it:
 *      Run the model
 *      Get and save the results in modelResults
 *      When a review goes to review, check the modelResults table to see if any exist.
 *
 * When a user reviews an answer:
 *  If the question has >10 reviews:
 *      Use those X reviews as training data
 *          (Input:
 *              Word count (WordCount / MaxWordCount),
 *              Related noun count: (KeywordsUsed/MaxKeywordsUsed), (use thesarus on KeyWords to get more keywords)
 *              Spelling mistakes: (SpellingMistakes / WordCount),
 *      Create model, run model on review, save model to json, store jsonfile location in firebase
 *
 */

// exports.onAnswer = functions.https.onCall(async ({ questionId, answerId }) => {
exports.onAnswer = async ({ questionId, answerId }) => {
  const question = await getQuestion(questionId);
  const answer = await getAnswer(answerId);

  if (!question) {
    console.log("Invalid questionId supplied", questionId);
    return null;
  }

  if (!answer) {
    console.log("Invalid answerId supplied", answerId);
    return null;
  }

  if (!question.model) {
    console.log("This question doesn't have a model yet", questionId);
    return null;
  }

  let net = new brain.NeuralNetwork();
  net.fromJSON(JSON.parse(question.model));

  const encodedAnswer = await encodeAnswer(
    answer.answer,
    question.keywords,
    question.maxWordCount
  );
  let modelResults = net.run(encodedAnswer);
  console.log(encodedAnswer);
  console.log("Model results ", modelResults);
  firebase
    .firestore()
    .collection("modelResults")
    .doc(answerId)
    .set({
      answerId,
      questionId,
      modelResults
    });

  return modelResults;
};

exports.onReview = functions.https.onCall(async ({ questionId, answerId }) => {
  // Get question and answer from firebase
  const { question, answers } = await getQuestionWithAnswers(questionId);
  const answer = await getAnswer(answerId);

  // If question has more than 10 reviewed answers
  if (!answers.filter(answer => answer.isReviewed).length > 5) {
    console.log(`Question currently has ${answer.length}, will not review`);
    return;
  }

  //    Create new neural network
  let net = new brain.NeuralNetwork();

  //    Get training data from reviewed answers
  const trainingDataPromises = answers
    .filter(answer => answer.isReviewed)
    .map(answer =>
      encodeAnswer(
        answer.answer,
        question.keywords,
        question.maxWordCount,
        answer.score
      )
    );
  const trainingData = await Promise.all(trainingDataPromises);

  const trainingResults = net.train(trainingData);
  console.log("New model trained:", trainingResults);

  // Run with the most recently added datum
  const encodedAnswer = await encodeAnswer(
    answer.answer,
    question.keywords,
    question.maxWordCount
  );

  let modelResults = net.run(encodedAnswer);

  console.log("Model results ", modelResults);

  // Store model results data
  firebase
    .firestore()
    .collection("modelResults")
    .doc(answerId)
    .set({
      answerId,
      questionId,
      modelResults
    });

  const todaysDate = new Date(Date.now()).toLocaleString();
  const fileName = `models/${todaysDate}-${questionId}.json`;
  // Store model json data
  const model = JSON.stringify(net.toJSON());

  // Store whole model in firebase
  await firebase
    .firestore()
    .collection("questions")
    .doc(questionId)
    .update({
      model
    });

  return modelResults;
});

exports
  .onAnswer({
    questionId: "JFPIUDFrQiGDFXE1Tyfn",
    answerId: "dYG7bdFo04ZeYwUpJjuP"
  })
  .then(console.log);
// exports.onReview("4ulGL3j6ZYl10InESptD", "muLwGB4C6aDeHfZITE1G").then(console.log);
