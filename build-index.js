import fs from "fs";
import path from "path";
import readline from "readline";

const dataDir = path.resolve("idioms");
const outputPath = path.join(dataDir, "index.json");

async function buildIndex() {
  // Delete existing index.json if it exists
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
    console.log(`Deleted existing ${outputPath}`);
  }

  const index = {};

  // Get all NDJSON files in /idioms
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".ndjson"));

  for (const file of files) {
    const langPath = path.join(dataDir, file);
    const rl = readline.createInterface({
      input: fs.createReadStream(langPath),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line);
        if (!entry.body_parts || !Array.isArray(entry.body_parts)) continue;

        for (const part of entry.body_parts) {
          if (!index[part]) index[part] = [];
          index[part].push(entry.id);
        }
      } catch (err) {
        console.warn(`Skipping malformed line in ${file}:`, err.message);
      }
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log(`Index written to ${outputPath}`);
}

buildIndex().catch((err) => console.error("Error building index:", err));
