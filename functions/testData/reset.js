const firebase = require("firebase-admin");
const { onAnswer, onReview } = require("../index");

const reset = async () => {
  var answersToDelete = firebase
    .firestore()
    .collection("answers")
    .where("author.uid", "==", "Test2");
  answersToDelete.get().then(querySnapshot => {
    querySnapshot.forEach(doc => {
      doc.ref.delete();
    });
  });

  var modelResults = firebase.firestore().collection("modelResults");
  const querySnapshot = await modelResults.get();

  querySnapshot.forEach(async doc => {
    await firebase
      .firestore()
      .collection("answers")
      .doc(doc.data().answerId)
      .get()
      .then(d => {
        if (!d.exists) {
          d.ref.delete();
        }
      });
  });
};

reset();
