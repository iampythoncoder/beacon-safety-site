# LaunchLab Data Ingestion

This pipeline loads large datasets into Supabase from CSV.

## Setup
```
cd /Users/saatviksantosh/Documents/New project/db/ingest
npm install
```

## Competitions
Put your CSV at `templates/competitions.csv` (or pass a path). Then:
```
node ingest-competitions.js /path/to/competitions.csv
```

## Pitch Opportunities
Put your CSV at `templates/pitch_opportunities.csv` (or pass a path). Then:
```
node ingest-pitches.js /path/to/pitches.csv
```

## Required columns
See the templates in `/Users/saatviksantosh/Documents/New project/db/ingest/templates`.

## Notes
- The script reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `/Users/saatviksantosh/Documents/New project/api/.env`.
- Use only verified data; set `data_status=verified` or `not available`.
