#!/usr/bin/env node

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function main() {
  console.log("Creating multi-item request for testing...\n");

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

  // Create request with 3 items
  console.log("Step 2: Creating info request with 3 items...");
  const items = [
    {
      description: "Updated salary information for all employees",
      category: "Payroll Data",
    },
    {
      description: "Current benefits enrollment forms",
      category: "Benefits Documents",
    },
    {
      description: "Updated W-4 forms for all employees",
      category: "Tax Forms",
    },
  ];

  const createCommand = `npx convex run info_requests:createInfoRequest '{"clientId":"${testClient._id}","requestedBy":"Automation Script","items":${JSON.stringify(items)},"notes":"Multi-item request for Feature #56 testing"}'`;

  const { stdout: resultOutput } = await execAsync(createCommand);
  const requestId = JSON.parse(resultOutput);

  console.log("✅ Successfully created request!");
  console.log(`Request ID: ${requestId}`);
  console.log("Total items: 3\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  console.error(err.stderr || "");
  process.exit(1);
});
