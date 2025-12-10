#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

const clientId = "j975977fcxrj0cdrv8x3dv3dvn7x0fsg";

// Read and parse the census file manually
const fileContent = fs.readFileSync("test-census-valid.csv", "utf-8");
const lines = fileContent.trim().split("\n");
const headers = lines[0].split(",");
const rows = lines.slice(1).map((line) => {
  const values = line.split(",");
  const row = {};
  headers.forEach((header, i) => {
    row[header] = values[i];
  });
  return row;
});

console.log(`Parsed ${rows.length} rows from census file`);
console.log("Columns:", headers);

// Import census data using the saveCensus mutation
const result = await client.mutation(api.census.saveCensus, {
  clientId,
  fileName: "workflow-test-census.csv",
  columns: headers,
  rows,
});

console.log("Census data imported successfully!");
console.log("Census upload ID:", result);
