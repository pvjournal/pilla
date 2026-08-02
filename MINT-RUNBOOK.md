# Mint reference (the seed script performs this under `--mint`)

Interface (misty, as installed):
    ZENODO_TOKEN=$(cat ~/Documents/zenodo_token_20260612) \
      misty publish -m meta.json -f <artifact> [-f ...] --output result.json
    DOI=$(jq -r '.doi // empty' result.json)   # refuse to proceed if empty

Then the DOI is written back into README.md and CITATION.cff, PROVENANCE is
re-stamped, and the record-back commit is pushed. Deletion on Zenodo leaves a
tombstone; nothing here is irreversible without your typed MINT gate.

© 1993–2026 Abhishek Choudhary. All rights reserved.
