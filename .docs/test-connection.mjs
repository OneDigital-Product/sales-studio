#!/usr/bin/env node
import http from "http";

const testPort = (port) =>
  new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      console.log(`Port ${port}: Status ${res.statusCode}`);
      resolve(true);
    });
    req.on("error", (e) => {
      console.log(`Port ${port}: ${e.message}`);
      resolve(false);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      console.log(`Port ${port}: Timeout`);
      resolve(false);
    });
  });

(async () => {
  console.log("Testing server connectivity...");
  await testPort(3000);
  await testPort(3001);
  await testPort(3002);
})();
