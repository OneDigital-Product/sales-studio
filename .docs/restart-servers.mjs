#!/usr/bin/env node
import { exec } from "child_process";
import fs from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);

async function restart() {
  console.log("Stopping existing processes...");

  // Find and kill Next.js processes
  try {
    const { stdout } = await execAsync(
      "ps aux | grep next-server | grep -v grep"
    );
    const pids = stdout
      .trim()
      .split("\n")
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        return parts[1];
      });

    for (const pid of pids) {
      console.log(`Killing process ${pid}...`);
      try {
        await execAsync(`kill -9 ${pid}`);
      } catch (e) {
        console.log(`Could not kill ${pid}: ${e.message}`);
      }
    }
  } catch (e) {
    console.log("No next-server processes found");
  }

  // Remove lock file
  console.log("Removing lock file...");
  try {
    fs.unlinkSync(".next/dev/lock");
    console.log("Lock file removed");
  } catch (e) {
    console.log("No lock file to remove");
  }

  console.log("\nServers stopped. Please run: bun run dev:all");
}

restart();
