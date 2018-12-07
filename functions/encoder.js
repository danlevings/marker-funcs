const tm = require("text-miner");
const Thesaurus = require("thesaurus");
const WordPOS = require("wordpos");
// const SpellChecker = require("spellchecker");
const wordpos = new WordPOS();

var exports = (module.exports = {});

exports.encodeAnswer = async (
  answerText,
  keywords,
  maxWordCount,
  answerScore
) => {
  // Parse text
  const terms = getTerms(answerText);
  const parsedKeywords = await wordpos.getPOS(keywords);

  // Get word count
  const wordCount = terms.data[0].reduce((acc, d) => acc + d, 0);
  // Get number of spelling errors
  const spellingErrorCount = getNSpellingErrors(answerText);

  // Get used keywords
  const usedKeywords = getUsedKeywords(terms, parsedKeywords.nouns);

  // Get corpus stats
  const wordStats = await wordpos.getPOS(answerText);

  const input = {
    wordCount: wordCount / maxWordCount,
    spellingErrors: spellingErrorCount / wordCount,
    nouns: wordStats.nouns.length / wordCount,
    adjectives: wordStats.adjectives.length / wordCount,
    verbs: wordStats.verbs.length / wordCount,
    usedKeywords:
      parsedKeywords.nouns.length === 0
        ? 1
        : usedKeywords.length / parsedKeywords.nouns.length
  };

  if (!answerScore) {
    return input;
  }

  const output = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    [answerScore]: 1
  };

  return {
    input,
    output
  };
};

const getTerms = text => {
  const corpus = new tm.Corpus(text);

  corpus
    .clean()
    .removeNewlines()
    .removeInvalidCharacters()
    .trim();

  return new tm.DocumentTermMatrix(corpus);
};

const getNSpellingErrors = text => {
  // const spellingErrors = SpellChecker.checkSpelling(text);
  // let spellingErrorCount = 0;
  // spellingErrors.forEach(err => {
  //   const word = text.substr(err.start, err.end - err.start);
  //   if (SpellChecker.getCorrectionsForMisspelling(word).length > 2) {
  //     spellingErrorCount += 1;
  //   }
  // });
  // return spellingErrorCount;
  return 0;
};

const getUsedKeywords = (terms, keywords) => {
  // Compare to keywords
  let expandedKeywords = [...keywords];
  const usedKeywords = {};
  keywords.forEach(word => {
    expandedKeywords = [...Thesaurus.find(word)];
    expandedKeywords.forEach(keyword => {
      if (terms.vocabulary.includes(keyword)) {
        usedKeywords[word] = true;
      }
    });
  });

  return Object.keys(usedKeywords);
};

// console.log("ok");

// const example = {
//   maxWordCount: 750,
//   keywords: ["Joseph Pulitzer", "future", "career"],
//   text: `For more people, the future is uncertain; the direction their life will take is not spelled out for them. Each person is responsible for the choices she will make that will determine the course of her life. One of the choices that has an incredible impact on her life is what she will choose for her career.
// This can be a difficult decision to make, as it will affect almost every aspect of a person’s life to some degree. Most people are also not fortunate enough to receive a startling revelation directing them on the right course for their lives. Instead, the most powerful way that a person is able to determine her direction is not through an earthshaking revelation but through the quite confidence that this is what she is called to do and to be.
// In the same way, I have never received any startling revelations that I should pursue a career in journalism, but as I look back on my life, I am able to see that there were many little steps along the way that have led me to this choice. I have often heard my parents tell the story of how, on my first day of kindergarten, I came home crying because I had not been taught how to read. I have always loved to read and from that has developed a great respect and fascination for the written word.
// Joseph Pulitzer stated the purpose of a journalist should be to “Put it before them briefly so they will read it, clearly so they will appreciate it, picturesquely so they will remember it, and above all, accurately so they will be guided by its light.” His words serve as a reminder for me of the many different dimension of writing. Journalism encompasses both creativity and technicality. It is a way of expressing individuality and of communicating with others.
// Many of my personal qualities convince me that a career in journalism is my calling. I find that I am a person who responds well to challenges. Perhaps it is because of my competitive nature that challenges motivate me. And I discover that my biggest competitor is usually myself. I think this is why I enjoy trying to combine both the creative and technical aspects of writing. Each time I begin to write, I am presented with a fresh challenge.

// Every day that I libe, I realize more the impact other people have on me and the impact I have on them. Writing is a very personal way of reaching out to people I may never meet, but who I am still connected to because of our identities as human beings. Journalism allows the opportunity for the sharing of information, thoughts, feelings and ideas between people from all walks of lives. It enables people to see things through another’s eyes and gain new perspectives on the world around them.
// It is because of the many dimensions of journalism that I desire to pursue a career in this field. I feel that as a journalist, I will be able to use the talents that I already have, as well as learn new ones. I believe it is a chance for me to be an instrument to bring people together.`
// };

// console.log(
//   encodeAnswer(example.text, example.keywords, example.maxWordCount, "A").then(
//     console.log
//   )
// );
