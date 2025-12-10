#!/usr/bin/env node
import { readFileSync } from "fs";

const data = JSON.parse(readFileSync("./feature_list.json", "utf-8"));
data.forEach((test, i) => {
  if (!test.passes) {
    console.log(`#${i}: ${test.description}`);
  }
});
