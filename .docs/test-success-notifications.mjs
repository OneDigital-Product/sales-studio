#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ||
    "https://caring-jellyfish-527.convex.cloud"
);

async function testSuccessNotifications() {
  console.log("=== Testing Success Notifications ===\n");

  try {
    // Test 1: Create a client (success action)
    console.log("Test 1: Creating a client...");
    const clientId = await client.mutation(api.clients.createClient, {
      name: "Toast Test Client",
      contactEmail: "toast@test.com",
      notes: "Testing success notifications",
    });
    console.log(`✓ Client created: ${clientId}`);
    console.log("   Expected: Green success toast with checkmark icon\n");

    // Test 2: Update client (success action)
    console.log("Test 2: Updating client...");
    await client.mutation(api.clients.updateClient, {
      id: clientId,
      name: "Toast Test Client Updated",
      contactEmail: "updated@test.com",
      notes: "Updated notes",
    });
    console.log("✓ Client updated");
    console.log(
      "   Expected: Green success toast 'Client information updated successfully'\n"
    );

    // Test 3: Create a quote (success action)
    console.log("Test 3: Creating a PEO quote...");
    await client.mutation(api.quotes.updateQuoteStatus, {
      clientId,
      type: "PEO",
      status: "not_started",
      isBlocked: false,
    });
    console.log("✓ Quote created");
    console.log(
      "   Expected: Green success toast 'PEO quote created successfully'\n"
    );

    // Test 4: Update quote status
    console.log("Test 4: Updating quote status...");
    await client.mutation(api.quotes.updateQuoteStatus, {
      clientId,
      type: "PEO",
      status: "intake",
      isBlocked: false,
    });
    console.log("✓ Quote status updated");
    console.log(
      "   Expected: Green success toast 'PEO quote status updated to Intake'\n"
    );

    console.log("=== All Success Actions Completed ===");
    console.log("\nTo verify the UI:");
    console.log("1. Open http://localhost:3000 in a browser");
    console.log("2. Perform actions (upload file, edit client, update quote)");
    console.log("3. Check for green success notifications in top-right corner");
    console.log("4. Verify checkmark icon is present");
    console.log("5. Verify auto-dismiss after ~4 seconds");
    console.log("6. Verify notifications are visible but not obtrusive");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testSuccessNotifications();
