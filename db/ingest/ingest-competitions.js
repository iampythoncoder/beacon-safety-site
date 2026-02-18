import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse";

dotenv.config({ path: path.resolve("../../api/.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in api/.env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const filePath = process.argv[2] || path.resolve("./templates/competitions.csv");

const parser = fs.createReadStream(filePath).pipe(
  parse({
    columns: true,
    skip_empty_lines: true,
    trim: true
  })
);

const records = [];
for await (const row of parser) {
  records.push({
    name: row.name,
    category: row.category,
    domain_focus: row.domain_focus,
    stage_fit: row.stage_fit,
    eligibility_age_min: row.eligibility_age_min ? Number(row.eligibility_age_min) : null,
    eligibility_age_max: row.eligibility_age_max ? Number(row.eligibility_age_max) : null,
    team_size_max: row.team_size_max ? Number(row.team_size_max) : null,
    requires_demo: row.requires_demo === "true",
    requires_plan: row.requires_plan === "true",
    judging_focus: row.judging_focus,
    deadline: row.deadline || null,
    application_link: row.application_link,
    location: row.location,
    notes: row.notes,
    data_status: row.data_status || "not available"
  });
}

const batchSize = 500;
for (let i = 0; i < records.length; i += batchSize) {
  const batch = records.slice(i, i + batchSize);
  const { error } = await supabase.from("competitions").insert(batch);
  if (error) {
    console.error("Insert failed", error);
    process.exit(1);
  }
  console.log(`Inserted ${Math.min(i + batchSize, records.length)} / ${records.length}`);
}

console.log("Competition ingestion complete.");
