#!/bin/bash
# Converts all segment WebM recordings to MP4, deploys to server, and lists results
set -e

SEGMENTS_DIR="./scripts/recordings/segments"
REMOTE="ilri-arm-uat:/home/sourav/apps/zorbit-platform/demos/segments"

echo "=== Converting segments to MP4 ==="

for mode in desktop mobile; do
  echo ""
  echo "--- $mode ---"
  ssh ilri-arm-uat "mkdir -p /home/sourav/apps/zorbit-platform/demos/segments/$mode"

  for dir in "$SEGMENTS_DIR/$mode"/*/; do
    name=$(basename "$dir")
    webm=$(ls "$dir"*.webm 2>/dev/null | head -1)
    if [ -n "$webm" ]; then
      out="$SEGMENTS_DIR/$mode/${name}.mp4"
      ffmpeg -y -i "$webm" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p "$out" 2>/dev/null
      dur=$(ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 "$out" | cut -d= -f2 | cut -d. -f1)
      size=$(ls -lh "$out" | awk '{print $5}')
      echo "  $mode/$name: ${dur}s, $size"
    fi
  done
done

echo ""
echo "=== Deploying to server ==="

for mode in desktop mobile; do
  rsync -avz "$SEGMENTS_DIR/$mode/"*.mp4 "$REMOTE/$mode/" 2>&1 | tail -2
done

echo ""
echo "=== Done! ==="
echo "Desktop: /demos/segments/desktop/"
echo "Mobile:  /demos/segments/mobile/"
