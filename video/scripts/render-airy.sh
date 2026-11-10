#!/bin/bash
# Renders both Airy launch films at full quality.
cd "$(dirname "$0")/.."
mkdir -p out
npx remotion render src/index.jsx AiryWide out/pdfsection-airy-16x9.mp4 --crf=16 --log=error > out/airy/r-wide.log 2>&1 || echo "FAIL wide"
echo "done wide"
npx remotion render src/index.jsx AiryVertical out/pdfsection-airy-9x16.mp4 --crf=16 --log=error > out/airy/r-vert.log 2>&1 || echo "FAIL vert"
echo ALLDONE
