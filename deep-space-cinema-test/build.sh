#!/bin/sh
# Journey Through the Unknown (Deep Space Cinema test film): rebuild in one command: sh build.sh
# Writes to ${OUT:-<this folder>/out} and the film to ${OUT:-<this folder>}/journey-through-the-unknown.mp4
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${OUT:-$HERE/out}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
mkdir -p "$OUT"
cd "$LIB"
# Linux without a GPU: software WebGL (slow but works)
[ "$(uname)" = Darwin ] || export LEMO_ANGLE=${LEMO_ANGLE:-swiftshader}
echo "== 1. events"
node core/render/events.mjs "$HERE" --out "$HERE/events.json"
echo "== 2. sound design + loudness (−14 LUFS) → $OUT/mix.wav"
OUTDIR="$OUT" "$LIB/.venv/bin/python" "$HERE/mix.py"
echo "== 3. picture (three.js, 2× supersampling)"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$OUT/video.mp4"
echo "== 4. mux"
if [ "$(ffmpeg -version | sed -n '1s/^ffmpeg version n\{0,1\}\([0-9]*\)\..*/\1/p')" -ge 7 ] 2>/dev/null; then
  sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$OUT/journey-through-the-unknown.mp4" 24 1.5
else
  # ffmpeg 6.x: mix.py already normalised the loudness, so only encode (mux.sh needs ffmpeg 7)
  ffmpeg -y -loglevel error -i "$OUT/video.mp4" -i "$OUT/mix.wav" -map 0:v -map 1:a -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p \
    -vf "noise=alls=3:allf=t" -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT/journey-through-the-unknown.mp4"
fi
echo "film: $OUT/journey-through-the-unknown.mp4"
