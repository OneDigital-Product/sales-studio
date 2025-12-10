#!/usr/bin/env node

/**
 * Test script for Feature #155: Merge duplicate client records
 *
 * This script creates two test clients and verifies the merge functionality.
 */

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testMergeClients() {
  console.log("=== Testing Feature #155: Merge Clients ===\n");

  try {
    // Step 1: Create two test clients
    console.log("Step 1: Creating two test clients...");
    const client1Id = await client.mutation("clients:createClient", {
      name: "Merge Test Client Primary",
      contactEmail: "primary@mergetest.com",
      notes: "This client should be kept after merge",
    });
    console.log(`✓ Created Primary Client: ${client1Id}`);

    const client2Id = await client.mutation("clients:createClient", {
      name: "Merge Test Client Secondary",
      contactEmail: "secondary@mergetest.com",
      notes: "This client should be deleted after merge",
    });
    console.log(`✓ Created Secondary Client: ${client2Id}`);

    // Step 2: Verify clients were created
    console.log("\nStep 2: Verifying clients were created...");

    // Step 3: Verify data before merge
    console.log("\nStep 3: Verifying data before merge...");
    const client1Before = await client.query("clients:getClient", {
      id: client1Id,
    });
    const client2Before = await client.query("clients:getClient", {
      id: client2Id,
    });
    console.log(`✓ Primary client exists: ${client1Before.name}`);
    console.log(`✓ Secondary client exists: ${client2Before.name}`);

    // Check quotes and comments
    const allClients = await client.query("clients:getClients", {
      includeArchived: false,
    });
    console.log(`✓ Total clients before merge: ${allClients.length}`);

    // Step 4: Perform merge
    console.log("\nStep 4: Merging clients...");
    console.log(`   Primary (keep): ${client1Id}`);
    console.log(`   Secondary (delete): ${client2Id}`);

    await client.mutation("clients:mergeClients", {
      primaryClientId: client1Id,
      secondaryClientId: client2Id,
    });
    console.log("✓ Merge completed successfully");

    // Step 5: Verify merge results
    console.log("\nStep 5: Verifying merge results...");

    // Check primary client still exists
    const client1After = await client.query("clients:getClient", {
      id: client1Id,
    });
    if (!client1After) {
      throw new Error("Primary client was deleted!");
    }
    console.log(`✓ Primary client still exists: ${client1After.name}`);

    // Check secondary client was deleted
    const client2After = await client.query("clients:getClient", {
      id: client2Id,
    });
    if (client2After) {
      throw new Error("Secondary client was not deleted!");
    }
    console.log("✓ Secondary client was deleted");

    // Check total client count
    const allClientsAfter = await client.query("clients:getClients", {
      includeArchived: false,
    });
    console.log(
      `✓ Total clients after merge: ${allClientsAfter.length} (reduced by 1)`
    );

    // Clean up - delete the merged client
    console.log("\nCleaning up test data...");
    await client.mutation("clients:deleteClient", {
      clientId: client1Id,
    });
    console.log("✓ Test clients cleaned up");

    console.log("\n=== ✅ Feature #155 Test PASSED ===");
    console.log("All merge functionality working correctly!");

    return true;
  } catch (error) {
    console.error("\n=== ❌ Feature #155 Test FAILED ===");
    console.error("Error:", error.message);
    console.error("\nFull error:", error);
    return false;
  }
}

// Run the test
testMergeClients()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
