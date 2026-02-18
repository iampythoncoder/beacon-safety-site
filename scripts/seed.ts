import { createClient } from "@supabase/supabase-js";
import { buildFallbackCompetitions, buildFallbackPitches } from "../web/lib/opportunities";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function seed() {
  const { data: existingCompetitions, error: compReadError } = await supabase.from("competitions").select("name");
  if (compReadError) throw compReadError;
  const { data: existingPitches, error: pitchReadError } = await supabase.from("pitch_opportunities").select("name");
  if (pitchReadError) throw pitchReadError;

  const existingCompNames = new Set((existingCompetitions || []).map((row) => String(row.name).toLowerCase()));
  const existingPitchNames = new Set((existingPitches || []).map((row) => String(row.name).toLowerCase()));

  const competitions = buildFallbackCompetitions(420).filter(
    (item) => !existingCompNames.has(String(item.name).toLowerCase())
  );
  const pitches = buildFallbackPitches(180).filter(
    (item) => !existingPitchNames.has(String(item.name).toLowerCase())
  );

  if (competitions.length > 0) {
    const { error } = await supabase.from("competitions").insert(competitions);
    if (error) throw error;
    console.log(`Inserted ${competitions.length} competitions`);
  } else {
    console.log("Competitions already have fallback dataset coverage");
  }

  if (pitches.length > 0) {
    const { error } = await supabase.from("pitch_opportunities").insert(pitches);
    if (error) throw error;
    console.log(`Inserted ${pitches.length} pitch opportunities`);
  } else {
    console.log("Pitch opportunities already have fallback dataset coverage");
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
