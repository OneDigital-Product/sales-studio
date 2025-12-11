import { readFileSync } from "fs";

const data = JSON.parse(readFileSync("./feature_list.json", "utf-8"));
const test = data.find((t) =>
  t.description.includes("Desktop layout at 1920px")
);
console.log(JSON.stringify(test, null, 2));
