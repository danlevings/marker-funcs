const firebase = require("firebase-admin");

var exports = (module.exports = {});

exports.getAnswer = async answerId => {
  return firebase
    .firestore()
    .collection("answers")
    .doc(answerId)
    .get()
    .then(doc => ({ ...doc.data(), id: doc.id }));
};

exports.getQuestion = async questionId =>
  firebase
    .firestore()
    .collection("questions")
    .doc(questionId)
    .get()
    .then(doc => ({ ...doc.data(), id: doc.id }));

exports.getQuestionWithAnswers = async questionId => {
  const question = await firebase
    .firestore()
    .collection("questions")
    .doc(questionId)
    .get()
    .then(doc => ({ ...doc.data(), id: doc.id }))
    .catch(console.error);

  const answers = await firebase
    .firestore()
    .collection("answers")
    .where("questionId", "==", questionId)
    .get()
    .then(snapshot => snapshot.docs.map(d => ({ ...d.data(), id: d.id })))
    .catch(console.error);

  return { question, answers };
};

exports.newItem = async (type, content) => {
  const ref = firebase
    .firestore()
    .collection(type)
    .doc();
  await ref.set(content);
  return ref.id;
};
