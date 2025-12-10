import fs from "fs";

const data = JSON.parse(fs.readFileSync("./feature_list.json", "utf8"));
data.forEach((f, i) => {
  if (!f.passes) {
    console.log(`${i}. [${f.category}] ${f.description}`);
  }
});
