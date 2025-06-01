#!/usr/bin/env -S deno run -A --env-file=./.env

import os from "node:os";
import * as fs from "jsr:@std/fs";
import * as path from "jsr:@std/path";
import { QBittorrent } from "npm:@ctrl/qbittorrent";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// handle to the async file upload processor
let processor: number = 0;

// list of files to be handled by upload processor
const todo: Record<string, string> = {};

// Client configuration to use
const clientConfig = {
  baseUrl: Deno.env.get("QB_URL"),
  username: Deno.env.get("QB_USER"),
  password: Deno.env.get("QB_PASS"),
};

const client = new QBittorrent(clientConfig);

/**
 * Get a normalized watch directory (substitutes ~ for home directory)
 */
function getWatchDir() {
  const dir = Deno.env.get("WATCH_DIR") || "~/Downloads";
  const home = os.homedir();
  return dir.replace(/^~/, home).replace(/[\\\/]+/, "/");
}

/**
 * Upload .torrent file to the qbittorrent site
 * @param file path to the .torrent file to upload
 */
async function processFile(file: string) {
  try {
    await sleep(500); // wait half a second for the file to settle
    console.log(`Processing File: ${path.basename(file)}`);
    const result = await client.addTorrent(await Deno.readFile(file));
    if (result) {
      await Deno.remove(file);
      console.log("Processed: ", file);
    }
  } catch (err) {
    console.error("Error processing file:", file, err);
    await fs.move(file, `${file}.failed`);
  }
}

/**
 * Process todo queue
 */
async function processFiles() {
  try {
    while (true) {
      const file = Object.keys(todo)[0];
      if (!file) return;
      if (await fs.exists(file)) {
        await processFile(file);
      }
      delete todo[file]; // remove from todo list
    }
  } catch (err) {
    console.error(err);
  }
}

/**
 * Process all the .torrent files in the specified directory
 * @param directory Path to the directory to process
 */
async function processDirectory(directory: string) {
  console.log("Checking for .torrent files in: ", directory);
  const torrentFiles = fs.expandGlob(path.join(directory, "*.torrent"));
  for await (const file of torrentFiles) {
    await processFile(file.path);
  }
}

/**
 * Watch for .torrent files in specified directory
 * @param directory Path to the directory to watch
 */
async function watchDirectory(directory: string) {
  // listen for .torrent files in watch directory
  console.log("Watching for .torrent files in: ", directory);
  const watcher = Deno.watchFs(directory);
  for await (const event of watcher) {
    // console.log(">>>> event", event);
    for (const path of event.paths) {
      if ((/.torrent$/i).test(path)) {
        todo[path] = path;

        // wait at least 1 second to start processor, handle delays on file changes
        clearTimeout(processor);
        processor = setTimeout(processFiles, 1000);
      }
    }
  }
}

/**
 * Main entry point function
 */
async function main() {
  const watchDir = getWatchDir();

  await processDirectory(watchDir);
  await watchDirectory(watchDir);
}

// if the file is called directly, run main
if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    Deno.exit(1);
  });
}
