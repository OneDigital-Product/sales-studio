#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(
  "https://valuable-wildcat-170.convex.cloud"
);

async function testRequirementsTab() {
  console.log("=== Feature #75: View required documents checklist ===\n");

  // Get Test Client
  const clients = await client.query(api.clients.getClients, {});
  const testClient = clients.find((c) => c.name === "Test Client");

  if (!testClient) {
    console.error("❌ Test Client not found");
    process.exit(1);
  }

  console.log(`✅ Found Test Client: ${testClient._id}`);

  // Get files for this client
  const files = await client.query(api.files.getFiles, {
    clientId: testClient._id,
  });

  console.log(`\n📁 Files uploaded: ${files.length}`);

  // Check which required categories exist
  const REQUIRED_CATEGORIES = ["census", "plan_summary", "renewal_letter"];
  const uploadedCategories = new Set(
    files.map((f) => f.category).filter((c) => c !== undefined)
  );

  console.log("\n=== Required Documents Status ===");
  for (const category of REQUIRED_CATEGORIES) {
    const status = uploadedCategories.has(category) ? "✅" : "❌";
    console.log(`${status} ${category}`);
  }

  const completeness = Math.round(
    (uploadedCategories.size / REQUIRED_CATEGORIES.length) * 100
  );
  console.log(`\n📊 Completeness: ${completeness}%`);

  console.log(
    "\n✅ Test complete - Requirements tab should display this information"
  );
  console.log(
    "\n📝 Next: Navigate to client detail page, click 'Requirements' tab to verify UI"
  );
}

testRequirementsTab().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
