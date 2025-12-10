#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

const clientId = "j97cymvab3cjzvzszyv3b68xjs7x02cw";

// Step 1: Generate upload URL
const uploadUrl = await client.mutation(api.files.generateUploadUrl, {});
console.log("Got upload URL");

// Step 2: Upload the file
const fileContent = fs.readFileSync("test-census-valid.csv");
const blob = new Blob([fileContent], { type: "text/csv" });

const uploadResponse = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": "text/csv" },
  body: fileContent,
});

const { storageId } = await uploadResponse.json();
console.log("File uploaded, storage ID:", storageId);

// Step 3: Save file metadata
await client.mutation(api.files.saveFile, {
  storageId,
  clientId,
  name: "test-census-valid.csv",
  type: "census",
  category: "census",
  relevantTo: ["PEO", "ACA"],
  isRequired: true,
});

console.log("Census file saved successfully!");
console.log("Now you need to import it through the UI");
