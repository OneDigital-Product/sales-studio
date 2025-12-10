#!/usr/bin/env node

// This script marks the first file in the database as verified for testing
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Get all files
const files = await client.query("files:getFilesForClient", {
  clientId: "jd7db6qxgr4efb3xmwd9tqhqzh6nz9rx",
});

if (files && files.length > 0) {
  const firstFile = files[0];
  console.log("Found file:", firstFile.name);
  console.log("File ID:", firstFile._id);
  console.log("Is verified:", firstFile.isVerified);
  console.log("Verified by:", firstFile.verifiedBy);
} else {
  console.log("No files found");
}
