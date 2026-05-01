import fs from "node:fs";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const filePath = "raw_geo.json";

type CityLimitSign = {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
};

type osmResult = {
  version: number;
  generator: string;
  elements: CityLimitSign[];
};

const supabaseUrl = "https://swlmbqkfghkuxtfouvos.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseKey) throw new Error("Missing SUPABASE_KEY");

const supabase = createClient(supabaseUrl, supabaseKey);

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function insertData(elements: CityLimitSign[]) {
  const CHUNK_SIZE = 3000;
  const chunks = chunkArray(elements, CHUNK_SIZE);

  console.log(
    `Inserting ${elements.length} records in ${chunks.length} chunks...`,
  );

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Map to match your table's column names
    const rows = chunk.map((el) => ({
      osm_id: el.id,
      tags: el.tags,
      location: `POINT(${el.lon} ${el.lat})`, // longitude first, no comma
    }));

    const { error } = await supabase.from("city_limit_signs").insert(rows);

    if (error) {
      console.error(`Chunk ${i + 1} failed:`, error.message);
      throw error;
    }

    console.log(`Chunk ${i + 1}/${chunks.length} inserted`);
  }

  console.log("Done!");
}

fs.readFile(filePath, "utf-8", async (err, jsonString: string) => {
  if (err) {
    console.error(err);
    return;
  }

  const data: osmResult = JSON.parse(jsonString);
  await insertData(data.elements);
});
