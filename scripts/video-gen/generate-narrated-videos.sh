#!/bin/bash
# =============================================================================
# Generate narrated slideshow videos for Zorbit modules
# Uses edge-tts for narration + ffmpeg for combining with title cards
#
# Prerequisites on server:
#   pip install edge-tts
#   apt install ffmpeg
#
# Usage:
#   bash generate-narrated-videos.sh
# =============================================================================

set -euo pipefail

DEMOS_DIR="/home/sourav/apps/zorbit-platform/demos"
TMP_DIR="/tmp/zorbit-video-gen"
VOICE="en-US-AriaNeural"

mkdir -p "$TMP_DIR"

# ---- Helper: generate TTS audio from text ----
gen_audio() {
  local text="$1"
  local out="$2"
  echo "  Generating audio: $out"
  edge-tts --voice "$VOICE" --text "$text" --write-media "$out" 2>/dev/null
}

# ---- Helper: generate a title-card video with audio ----
gen_title_card_video() {
  local title="$1"
  local subtitle="$2"
  local audio="$3"
  local output="$4"
  local duration
  duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$audio" 2>/dev/null | cut -d. -f1)
  duration=$((duration + 2))  # add 2 seconds padding

  ffmpeg -y -f lavfi \
    -i "color=c=#1e1b4b:s=1920x1080:d=${duration}" \
    -i "$audio" \
    -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-40:text='${title}',drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=30:fontcolor=#a5b4fc:x=(w-text_w)/2:y=(h+text_h)/2+20:text='${subtitle}'" \
    -c:v libx264 -preset ultrafast -tune stillimage -pix_fmt yuv420p \
    -c:a aac -b:a 128k -shortest \
    "$output" 2>/dev/null

  echo "  Created: $output (${duration}s)"
}

# =============================================================================
# PCG4 Videos
# =============================================================================
echo "=== PCG4 Videos ==="
PCG4_DIR="$DEMOS_DIR/pcg4"
mkdir -p "$PCG4_DIR"

# Video 1: PCG4 Overview
echo "Generating PCG4 Overview..."
gen_audio "Welcome to PCG4, the Product Configurator Generation 4. This is Zorbit's module for designing, reviewing, and deploying insurance product configurations. PCG4 provides a visual, step-by-step wizard that guides product analysts through the complete product configuration process. The eight-step configuration wizard covers everything from insurer details and product specifications, through plan creation, base configuration, encounter definitions, benefit structures, per-plan overrides, and finally review and publish. PCG4 supports 43 encounter types organized across 10 clinical categories. Every configuration goes through a Maker-Checker-Publisher approval workflow ensuring enterprise governance." \
  "$TMP_DIR/pcg4-overview.mp3"

gen_title_card_video "PCG4 - Product Configurator" "Enterprise Insurance Product Configuration" \
  "$TMP_DIR/pcg4-overview.mp3" "$PCG4_DIR/pcg4-overview.mp4"

# Video 2: PCG4 Configuration Deep-Dive
echo "Generating PCG4 Configuration Deep-Dive..."
gen_audio "In this video, we walk through creating a product configuration step by step. Step one is Insurer Details where you enter company information. Step two is Product Details for the product name, type, and dates. Step three is Create Plans where you define tiers like Bronze, Silver, Gold, and Platinum. Step four is Base Configuration for limits, deductibles, and out-of-pocket maximums. Step five is Encounters where you select which healthcare services the product covers. Step six is Benefits for copayments, coinsurance, and visit limits. Step seven is Overrides for per-plan customization. Step eight is Review and Publish where the system validates and submits for approval." \
  "$TMP_DIR/pcg4-deep-dive.mp3"

gen_title_card_video "PCG4 Configuration Deep-Dive" "8-Step Wizard Walkthrough" \
  "$TMP_DIR/pcg4-deep-dive.mp3" "$PCG4_DIR/pcg4-configuration-deep-dive.mp4"

# Video 3: PCG4 Encounters Taxonomy
echo "Generating PCG4 Encounters Taxonomy..."
gen_audio "The PCG4 encounter taxonomy defines 43 encounter types across 10 clinical categories. Preventive Care includes wellness exams and screenings. Primary Care covers office visits and telemedicine. Specialist Care includes cardiology, orthopedics, and dermatology. Emergency covers ER visits and ambulance. Hospital and Inpatient covers surgical procedures and ICU. Outpatient includes day surgery. Mental Health covers therapy and psychiatric care. Maternity includes prenatal and postnatal care. Rehabilitation covers physical and occupational therapy. Diagnostics includes lab tests and imaging. For each encounter type, you configure copays, coinsurance, prior authorization, and visit limits." \
  "$TMP_DIR/pcg4-encounters.mp3"

gen_title_card_video "Encounter Type Taxonomy" "43 Types across 10 Clinical Categories" \
  "$TMP_DIR/pcg4-encounters.mp3" "$PCG4_DIR/pcg4-encounters-taxonomy.mp4"

# =============================================================================
# Fee Management Video
# =============================================================================
echo ""
echo "=== Fee Management Video ==="
FEE_DIR="$DEMOS_DIR/fee-management"
mkdir -p "$FEE_DIR"

gen_audio "Welcome to Fee Management, the module that handles the complete fee lifecycle. Fee Management supports multiple fee types including administration fees, policy fees, endorsement fees, and cancellation fees. The module automates invoice generation based on configurable schedules and policy events. Payment tracking supports bank transfers, credit cards, direct debit, and cheques. Statement generation provides periodic summaries showing charges, payments, and outstanding balances. Overdue alerts trigger automated email reminders and escalation to collections. The fee configuration engine supports flat amounts, percentages, tiered calculations, and formula-based methods." \
  "$TMP_DIR/fee-management.mp3"

gen_title_card_video "Fee Management" "Invoicing, Payments and Statements" \
  "$TMP_DIR/fee-management.mp3" "$FEE_DIR/fee-management-overview.mp4"

# =============================================================================
# Claims Core Video
# =============================================================================
echo ""
echo "=== Claims Core Video ==="
CLAIMS_DIR="$DEMOS_DIR/claims"
mkdir -p "$CLAIMS_DIR"

gen_audio "Welcome to Claims Core, the full lifecycle claims management module. Claims Core supports 10 claim types across health, motor, and property lines. It integrates with 5 provider types: hospitals, garages, loss assessors, third-party administrators, and reinsurers. The claims lifecycle moves from first notification of loss, through initiation, assessment, adjudication, settlement, and closure. The adjudication engine verifies policy terms, validates coverage, calculates deductibles, and applies copays automatically. Settlement processing supports cashless claims to providers, reimbursement to insured, and partial settlements. The claims dashboard provides real-time metrics on open claims, cycle times, and settlement ratios." \
  "$TMP_DIR/claims.mp3"

gen_title_card_video "Claims Core" "Full Lifecycle Claims Management" \
  "$TMP_DIR/claims.mp3" "$CLAIMS_DIR/claims-overview.mp4"

# =============================================================================
# Create manifests
# =============================================================================
echo ""
echo "=== Creating manifests ==="

cat > "$PCG4_DIR/manifest.json" << 'MANIFEST'
[
  {
    "file": "pcg4-overview.mp4",
    "title": "PCG4 Overview",
    "thumbnail": "",
    "timestamp": "2026-03-27",
    "duration": 60,
    "chapters": [
      { "title": "Introduction", "startMs": 0 },
      { "title": "8-Step Wizard", "startMs": 15000 },
      { "title": "Encounter Types", "startMs": 30000 },
      { "title": "Approval Workflow", "startMs": 45000 }
    ]
  },
  {
    "file": "pcg4-configuration-deep-dive.mp4",
    "title": "Configuration Deep-Dive",
    "thumbnail": "",
    "timestamp": "2026-03-27",
    "duration": 75,
    "chapters": [
      { "title": "Insurer & Product", "startMs": 0 },
      { "title": "Plans & Base Config", "startMs": 18000 },
      { "title": "Encounters & Benefits", "startMs": 36000 },
      { "title": "Overrides & Publish", "startMs": 54000 }
    ]
  },
  {
    "file": "pcg4-encounters-taxonomy.mp4",
    "title": "Encounters Taxonomy",
    "thumbnail": "",
    "timestamp": "2026-03-27",
    "duration": 60,
    "chapters": [
      { "title": "Overview", "startMs": 0 },
      { "title": "Clinical Categories", "startMs": 10000 },
      { "title": "Configuration Options", "startMs": 40000 }
    ]
  }
]
MANIFEST

cat > "$FEE_DIR/manifest.json" << 'MANIFEST'
[
  {
    "file": "fee-management-overview.mp4",
    "title": "Fee Management Overview",
    "thumbnail": "",
    "timestamp": "2026-03-27",
    "duration": 60,
    "chapters": [
      { "title": "Introduction", "startMs": 0 },
      { "title": "Fee Types", "startMs": 10000 },
      { "title": "Invoicing", "startMs": 25000 },
      { "title": "Payments & Statements", "startMs": 40000 }
    ]
  }
]
MANIFEST

cat > "$CLAIMS_DIR/manifest.json" << 'MANIFEST'
[
  {
    "file": "claims-overview.mp4",
    "title": "Claims Core Overview",
    "thumbnail": "",
    "timestamp": "2026-03-27",
    "duration": 65,
    "chapters": [
      { "title": "Introduction", "startMs": 0 },
      { "title": "Claim Types", "startMs": 10000 },
      { "title": "Lifecycle Stages", "startMs": 25000 },
      { "title": "Adjudication & Settlement", "startMs": 40000 }
    ]
  }
]
MANIFEST

echo ""
echo "=== Done! ==="
echo "PCG4 videos: $PCG4_DIR/"
echo "Fee Management: $FEE_DIR/"
echo "Claims Core: $CLAIMS_DIR/"
echo ""
echo "To deploy, sync from admin-console public/demos to server demos dir."
