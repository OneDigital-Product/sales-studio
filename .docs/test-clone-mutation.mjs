#!/usr/bin/env node
/**
 * Test if cloneCensus mutation is accessible at runtime
 */

const testUrl = "http://localhost:3000";

console.log("Testing if cloneCensus mutation exists...");
console.log("Opening browser console and checking api.census.cloneCensus");
console.log("\nInstructions:");
console.log("1. Open http://localhost:3000 in browser");
console.log("2. Open browser console (F12)");
console.log('3. Type: window.__CONVEX__ || "Convex not loaded"');
console.log("4. If loaded, inspect the API to see if cloneCensus exists");
console.log(
  "\nAlternatively, this mutation may exist in the deployed Convex backend"
);
console.log("even if the TypeScript definitions are stale.");
