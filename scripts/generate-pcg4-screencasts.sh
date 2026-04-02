#!/bin/bash
# =============================================================================
# Generate PCG4 Screencast Videos (REAL browser recordings)
#
# Steps per video:
#   1. Run Playwright script to record browser interaction -> webm -> raw mp4
#   2. Generate TTS narration with edge-tts AriaNeural
#   3. Combine video + audio with ffmpeg (stretch/loop video to match audio)
#   4. Generate thumbnail at duration/3 + 2
#   5. Deploy to server
#
# Prerequisites:
#   - Playwright 1.53+ with chromium browser
#   - ffmpeg
#   - edge-tts (pip install edge-tts)
#
# Usage:
#   bash scripts/generate-pcg4-screencasts.sh
# =============================================================================

set -euo pipefail

SCRIPTS_DIR="/Users/s/workspace/zorbit/02_repos/zorbit-unified-console/scripts"
REC_DIR="$SCRIPTS_DIR/recordings/pcg4"
VOICE="en-US-AriaNeural"
FINAL_DIR="$REC_DIR/final"

mkdir -p "$REC_DIR" "$FINAL_DIR"

# ---- Helper: get video duration in seconds ----
get_duration() {
  ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$1" 2>/dev/null | cut -d. -f1
}

# =============================================================================
# STEP 1: Record browser interactions
# =============================================================================
echo ""
echo "================================================================"
echo "  STEP 1: Recording browser interactions with Playwright"
echo "================================================================"

echo ""
echo "--- Video 1: PCG4 Overview ---"
# Clean old webm files first so we pick up the right one
rm -f "$REC_DIR"/*.webm 2>/dev/null || true
node "$SCRIPTS_DIR/pcg4-video1-overview.mjs"
echo ""

echo "--- Video 2: PCG4 Deep-Dive ---"
rm -f "$REC_DIR"/*.webm 2>/dev/null || true
node "$SCRIPTS_DIR/pcg4-video2-deep-dive.mjs"
echo ""

echo "--- Video 3: PCG4 Encounters ---"
rm -f "$REC_DIR"/*.webm 2>/dev/null || true
node "$SCRIPTS_DIR/pcg4-video3-encounters.mjs"
echo ""

# =============================================================================
# STEP 2: Generate TTS narration
# =============================================================================
echo ""
echo "================================================================"
echo "  STEP 2: Generating TTS narration with edge-tts"
echo "================================================================"

edge-tts --voice "$VOICE" \
  --file "$REC_DIR/narration-overview.txt" \
  --write-media "$REC_DIR/narration-overview.mp3" 2>/dev/null
echo "  Generated: narration-overview.mp3"

edge-tts --voice "$VOICE" \
  --file "$REC_DIR/narration-deep-dive.txt" \
  --write-media "$REC_DIR/narration-deep-dive.mp3" 2>/dev/null
echo "  Generated: narration-deep-dive.mp3"

edge-tts --voice "$VOICE" \
  --file "$REC_DIR/narration-encounters.txt" \
  --write-media "$REC_DIR/narration-encounters.mp3" 2>/dev/null
echo "  Generated: narration-encounters.mp3"

# =============================================================================
# STEP 3: Combine video + audio
# =============================================================================
echo ""
echo "================================================================"
echo "  STEP 3: Combining video + audio with ffmpeg"
echo "================================================================"

combine_video_audio() {
  local video_in="$1"
  local audio_in="$2"
  local output="$3"
  local name="$4"

  if [ ! -f "$video_in" ]; then
    echo "  WARNING: $video_in not found, skipping $name"
    return
  fi
  if [ ! -f "$audio_in" ]; then
    echo "  WARNING: $audio_in not found, skipping $name"
    return
  fi

  local audio_dur
  audio_dur=$(get_duration "$audio_in")
  local video_dur
  video_dur=$(get_duration "$video_in")

  echo "  $name: video=${video_dur}s, audio=${audio_dur}s"

  # Strategy: if video is shorter than audio, slow it down to match.
  # If video is longer, trim it to audio length.
  # Add 2s padding at end.
  local target_dur=$((audio_dur + 2))

  if [ "$video_dur" -lt "$target_dur" ] && [ "$video_dur" -gt 0 ]; then
    # Slow down video to match audio using setpts
    local speed
    speed=$(echo "scale=4; $target_dur / $video_dur" | bc)
    echo "  Slowing video by ${speed}x to match audio"
    ffmpeg -y -i "$video_in" -i "$audio_in" \
      -filter_complex "[0:v]setpts=${speed}*PTS[v]" \
      -map "[v]" -map 1:a \
      -c:v libx264 -preset fast -crf 23 \
      -c:a aac -b:a 128k \
      -movflags +faststart \
      -shortest \
      "$output" 2>/dev/null
  else
    # Video is long enough — just use shortest
    ffmpeg -y -i "$video_in" -i "$audio_in" \
      -c:v libx264 -preset fast -crf 23 \
      -c:a aac -b:a 128k \
      -movflags +faststart \
      -shortest \
      "$output" 2>/dev/null
  fi

  echo "  Created: $output"
}

combine_video_audio \
  "$REC_DIR/pcg4-overview-raw.mp4" \
  "$REC_DIR/narration-overview.mp3" \
  "$FINAL_DIR/pcg4-overview.mp4" \
  "PCG4 Overview"

combine_video_audio \
  "$REC_DIR/pcg4-deep-dive-raw.mp4" \
  "$REC_DIR/narration-deep-dive.mp3" \
  "$FINAL_DIR/pcg4-configuration-deep-dive.mp4" \
  "PCG4 Deep-Dive"

combine_video_audio \
  "$REC_DIR/pcg4-encounters-raw.mp4" \
  "$REC_DIR/narration-encounters.mp3" \
  "$FINAL_DIR/pcg4-encounters-taxonomy.mp4" \
  "PCG4 Encounters"

# =============================================================================
# STEP 4: Generate thumbnails
# =============================================================================
echo ""
echo "================================================================"
echo "  STEP 4: Generating thumbnails"
echo "================================================================"

gen_thumbnail() {
  local video="$1"
  local thumb="$2"
  local name="$3"

  if [ ! -f "$video" ]; then
    echo "  WARNING: $video not found, skipping thumbnail for $name"
    return
  fi

  local dur
  dur=$(get_duration "$video")
  local seek=$((dur / 3 + 2))

  ffmpeg -y -i "$video" -ss "$seek" -vframes 1 \
    -vf "scale=640:360" \
    "$thumb" 2>/dev/null

  echo "  Thumbnail: $thumb (at ${seek}s)"
}

gen_thumbnail "$FINAL_DIR/pcg4-overview.mp4" "$FINAL_DIR/pcg4-overview-thumb.jpg" "Overview"
gen_thumbnail "$FINAL_DIR/pcg4-configuration-deep-dive.mp4" "$FINAL_DIR/pcg4-deep-dive-thumb.jpg" "Deep-Dive"
gen_thumbnail "$FINAL_DIR/pcg4-encounters-taxonomy.mp4" "$FINAL_DIR/pcg4-encounters-thumb.jpg" "Encounters"

# =============================================================================
# STEP 5: Create manifest
# =============================================================================
echo ""
echo "================================================================"
echo "  STEP 5: Creating manifest"
echo "================================================================"

get_dur_or_default() {
  if [ -f "$1" ]; then
    get_duration "$1"
  else
    echo "$2"
  fi
}

DUR1=$(get_dur_or_default "$FINAL_DIR/pcg4-overview.mp4" 100)
DUR2=$(get_dur_or_default "$FINAL_DIR/pcg4-configuration-deep-dive.mp4" 120)
DUR3=$(get_dur_or_default "$FINAL_DIR/pcg4-encounters-taxonomy.mp4" 90)

cat > "$FINAL_DIR/manifest.json" << MANIFEST
[
  {
    "file": "pcg4-overview.mp4",
    "title": "PCG4 Product Management Overview",
    "thumbnail": "pcg4-overview-thumb.jpg",
    "timestamp": "$(date +%Y-%m-%d)",
    "duration": ${DUR1},
    "chapters": [
      { "title": "Login & Guide Page", "startMs": 0 },
      { "title": "Capabilities Overview", "startMs": 10000 },
      { "title": "Presentation Slides", "startMs": 25000 },
      { "title": "Lifecycle Stages", "startMs": 45000 },
      { "title": "Configurations List", "startMs": 60000 },
      { "title": "Reference Library", "startMs": 70000 },
      { "title": "Coverage Mapper", "startMs": 85000 }
    ]
  },
  {
    "file": "pcg4-configuration-deep-dive.mp4",
    "title": "PCG4 Configuration Deep-Dive",
    "thumbnail": "pcg4-deep-dive-thumb.jpg",
    "timestamp": "$(date +%Y-%m-%d)",
    "duration": ${DUR2},
    "chapters": [
      { "title": "Configurations Dashboard", "startMs": 0 },
      { "title": "Step 1: Insurer Details", "startMs": 15000 },
      { "title": "Step 2: Product Details", "startMs": 30000 },
      { "title": "Step 3: Create Plans", "startMs": 40000 },
      { "title": "Step 4: Base Config", "startMs": 50000 },
      { "title": "Step 5: Encounters", "startMs": 60000 },
      { "title": "Step 6: Benefits", "startMs": 75000 },
      { "title": "Step 7: Overrides", "startMs": 90000 },
      { "title": "Step 8: Review & Publish", "startMs": 105000 }
    ]
  },
  {
    "file": "pcg4-encounters-taxonomy.mp4",
    "title": "PCG4 Encounter Taxonomy",
    "thumbnail": "pcg4-encounters-thumb.jpg",
    "timestamp": "$(date +%Y-%m-%d)",
    "duration": ${DUR3},
    "chapters": [
      { "title": "Coverage Mapper", "startMs": 0 },
      { "title": "Encounters Admin", "startMs": 15000 },
      { "title": "Taxonomy Presentation", "startMs": 30000 },
      { "title": "Encounter Config Step", "startMs": 50000 },
      { "title": "Benefits Setup", "startMs": 70000 }
    ]
  }
]
MANIFEST

echo "  Created: $FINAL_DIR/manifest.json"

# =============================================================================
# STEP 6: Deploy to server
# =============================================================================
echo ""
echo "================================================================"
echo "  STEP 6: Deploying to server"
echo "================================================================"

REMOTE_DIR="/home/sourav/apps/zorbit-platform/zorbit-unified-console/demos/pcg4"

ssh sovpn "mkdir -p $REMOTE_DIR" 2>/dev/null && \
  rsync -az --progress \
    "$FINAL_DIR/" \
    "sovpn:$REMOTE_DIR/" && \
  echo "  Deployed to sovpn:$REMOTE_DIR/" || \
  echo "  WARNING: Deploy failed (server not reachable?). Files are in $FINAL_DIR/"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "================================================================"
echo "  DONE!"
echo "================================================================"
echo ""
echo "  Final videos:"
echo "    $FINAL_DIR/pcg4-overview.mp4"
echo "    $FINAL_DIR/pcg4-configuration-deep-dive.mp4"
echo "    $FINAL_DIR/pcg4-encounters-taxonomy.mp4"
echo ""
echo "  Narration ingredients:"
echo "    $REC_DIR/narration-overview.txt"
echo "    $REC_DIR/narration-deep-dive.txt"
echo "    $REC_DIR/narration-encounters.txt"
echo ""
echo "  Thumbnails:"
echo "    $FINAL_DIR/pcg4-overview-thumb.jpg"
echo "    $FINAL_DIR/pcg4-deep-dive-thumb.jpg"
echo "    $FINAL_DIR/pcg4-encounters-thumb.jpg"
echo ""
