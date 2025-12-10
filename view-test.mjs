#!/usr/bin/env node
import { readFileSync } from "fs";

const testIndex = Number.parseInt(process.argv[2]);
const data = JSON.parse(readFileSync("./feature_list.json", "utf-8"));
console.log(JSON.stringify(data[testIndex], null, 2));
