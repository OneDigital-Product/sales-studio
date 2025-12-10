#!/usr/bin/env node

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function main() {
  console.log("Setting up multi-item request for testing...\n");

  // Get Test Client ID first
  console.log("Step 1: Getting Test Client info...");
  const { stdout: clientsOutput } = await execAsync(
    "npx convex run clients:getClients"
  );
  const clients = JSON.parse(clientsOutput);
  const testClient = clients.find((c) => c.name === "Test Client");

  if (!testClient) {
    console.log("Test Client not found!");
    return;
  }

  console.log(`Found Test Client: ${testClient._id}\n`);

  // Get info requests for this client
  console.log("Step 2: Getting info requests...");
  const { stdout: requestsOutput } = await execAsync(
    `npx convex run info_requests:getInfoRequests '{"clientId":"${testClient._id}"}'`
  );
  const requests = JSON.parse(requestsOutput);

  if (requests.length === 0) {
    console.log("No requests found!");
    return;
  }

  console.log(`Found ${requests.length} requests`);
  const firstRequest = requests[0];
  console.log(`First request ID: ${firstRequest._id}`);
  console.log(`Current items: ${firstRequest.items.length}\n`);

  // Add items to the first request
  console.log("Step 3: Adding items to request...");
  const newItems = [
    {
      description: "Current benefits enrollment forms",
      category: "Benefits Documents",
    },
    {
      description: "Updated W-4 forms for all employees",
      category: "Tax Forms",
    },
  ];

  const addCommand = `npx convex run info_requests:addItemsToRequest '{"requestId":"${firstRequest._id}","newItems":${JSON.stringify(newItems)}}'`;
  await execAsync(addCommand);

  console.log("✅ Successfully added 2 items to the request!");
  console.log("The request now has 3 total items.\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
