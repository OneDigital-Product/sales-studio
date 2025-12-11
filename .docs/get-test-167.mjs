#!/usr/bin/env node
import { readFileSync } from "fs";

const data = JSON.parse(readFileSync("./feature_list.json", "utf-8"));
console.log(JSON.stringify(data[167], null, 2));
