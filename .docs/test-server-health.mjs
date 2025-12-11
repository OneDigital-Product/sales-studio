#!/usr/bin/env node
import http from "http";

function checkServer(port) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      console.log(`Server on port ${port}: HTTP ${res.statusCode}`);
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log(`Response length: ${data.length} bytes`);
        if (data.length > 0) {
          console.log(`First 200 chars: ${data.substring(0, 200)}`);
        }
        resolve(true);
      });
    });
    req.on("error", (err) => {
      console.log(`Server on port ${port}: ERROR - ${err.message}`);
      reject(err);
    });
    req.setTimeout(5000, () => {
      console.log(`Server on port ${port}: TIMEOUT`);
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

async function main() {
  console.log("=== Checking Next.js Server Health ===\n");
  try {
    await checkServer(3000);
    console.log("\n✓ Server is responding");
  } catch (err) {
    console.log("\n✗ Server is not responding");
  }
}

main();
