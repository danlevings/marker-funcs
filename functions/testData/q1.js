var fs = require("fs");
var tabson = require("tabson");

tabson("./q1.tsv", { type: "object", sep: "\t" }, function(
  error,
  header,
  data
) {
  //Check for error
  if (error) {
    return console.error(error.message);
  }

  //Save the file
  fs.writeFileSync(
    "./q1.json",
    JSON.stringify(
      data.map(d => ({ ...d, id: d.id, answer: d.answer, score: d.final }))
    ),
    "utf8"
  );

  // file.json content:
  // [
  //   {"col1":"element1.1","col2":"element1.2","col3":"element1.3","col4":"element1.4"},
  //   {"col1":"element2.1","col2":"element2.2","col3":"element2.3","col4":"element2.4"},
  //   {"col1":"element3.1","col2":"element3.2","col3":"element3.3","col4":"element3.4"}
  // ]
});
