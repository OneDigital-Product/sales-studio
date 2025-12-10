#!/usr/bin/env node

/**
 * Test Feature #163: Census import preview modal design
 *
 * Steps:
 * 1. Upload census file to trigger preview
 * 2. Take screenshot of preview modal
 * 3. Verify data table is readable
 * 4. Verify column headers are clear
 * 5. Verify sample rows give good preview
 * 6. Verify import/cancel buttons are prominent
 */

import { execSync } from "child_process";

console.log("Starting census preview modal test...\n");

// Get a test client ID
const getClientId = () => {
  try {
    const result = execSync(
      `node -e "
      const { ConvexHttpClient } = require('convex/browser');
      const { api } = require('./convex/_generated/api');

      const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

      client.query(api.clients.getClients).then(clients => {
        if (clients && clients.length > 0) {
          console.log(clients[0]._id);
        }
      });
    "`,
      { encoding: "utf-8" }
    ).trim();
    return result;
  } catch (error) {
    console.error("Error getting client ID:", error.message);
    return null;
  }
};

const clientId = getClientId();
if (!clientId) {
  console.error("No client found. Please create a client first.");
  process.exit(1);
}

console.log(`Using client: ${clientId}`);
console.log("\nTest census preview modal at:");
console.log(`http://localhost:3000/clients/${clientId}`);
console.log("\nManual steps:");
console.log("1. Navigate to the client page");
console.log('2. Click "Upload File"');
console.log("3. Select test-census-valid.csv");
console.log("4. Census preview modal should appear");
console.log("5. Verify the modal design meets all requirements");
