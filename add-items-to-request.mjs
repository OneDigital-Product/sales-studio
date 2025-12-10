#!/usr/bin/env node

/**
 * Directly patch an existing info_request to add multiple items
 * This is a workaround for UI testing purposes
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function main() {
  console.log("Adding items to existing request...\n");

  // Use Convex CLI to patch the request
  const patchCommand = `npx convex run info_requests:patchRequestAddItems '{"requestId":"<INSERT_ID>","newItems":[{"description":"Current benefits enrollment forms","category":"Benefits Documents"},{"description":"Updated W-4 forms for all employees","category":"Tax Forms"}]}'`;

  console.log("To add items to a request, you need to:");
  console.log("1. Find the request ID from the Convex dashboard");
  console.log("2. Create a helper mutation in convex/info_requests.ts");
  console.log("3. Run the mutation via Convex CLI");
  console.log(
    "\nAlternatively, we can test with the existing single-item requests."
  );
}

main().catch(console.error);
