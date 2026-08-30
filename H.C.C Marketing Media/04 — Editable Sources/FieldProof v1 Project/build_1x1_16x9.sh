#!/usr/bin/env bash
set -euo pipefail
cd /tmp/hcc
U=/mnt/user-uploads
BOOT="$U/ScreenRecording_08-30-2026_16-22-32_1.mov"
CIPH="$U/ScreenRecording_08-30-2026_16-22-32_1-2.mov"
SOC="$U/ScreenRecording_08-30-2026_16-22-32_1-3.mov"
MONO=/nix/store/xbs17gmksi0pljxcs4l6gshklzpmv8gr-dejavu-fonts-2.37/share/fonts/truetype/DejaVuSansMono-Bold.ttf

# ratio: key outW outH cropH
build_ratio () {
  local K=$1 OW=$2 OH=$3 CH=$4; shift 4
  local i=0
  for spec in "$@"; do
    IFS='|' read -r IN SS T Y CAP <<< "$spec"
    i=$((i+1))
    local TXT=""
    if [ -n "$CAP" ]; then
      local BY=$((OH-110))
      TXT=",drawbox=x=0:y=${BY}:w=${OW}:h=110:color=0x04070A@0.85:t=fill,drawtext=fontfile=$MONO:text='$CAP':fontcolor=0x5FD8F5:fontsize=$((OW/34)):x=(w-text_w)/2:y=$((BY+34))"
    fi
    ffmpeg -v error -y -ss "$SS" -t "$T" -i "$IN" -an \
      -vf "crop=1320:${CH}:0:${Y},scale=${OW}:${OH}:flags=lanczos,setsar=1,fps=30,format=yuv420p${TXT}" \
      -c:v libx264 -crf 16 -preset medium "r${K}_s${i}.mp4"
  done
  : > "list_${K}.txt"
  for n in 1 2 3 4 5; do echo "file 'r${K}_s${n}.mp4'" >> "list_${K}.txt"; done
  echo "file 'ctav_${K}.mp4'" >> "list_${K}.txt"
  ffmpeg -v error -y -framerate 30 -i "cta${K}/f%04d.png" -vf "scale=${OW}:${OH},setsar=1,format=yuv420p" -c:v libx264 -crf 16 -preset medium "ctav_${K}.mp4"
  ffmpeg -v error -y -f concat -safe 0 -i "list_${K}.txt" -c copy "vv_${K}.mp4"
}

build_ratio 169 1920 1080 742 \
  "$BOOT|3.15|1.20|980|" \
  "$BOOT|15.60|0.70|1300|F O U R   O P E N   C A S E S" \
  "$SOC|8.60|1.80|1600|T A L K   Y O U R   W A Y   I N" \
  "$SOC|12.10|0.80|450|E V I D E N C E   F I L E D" \
  "$CIPH|11.00|2.60|1560|B R E A K   T H E   C I P H E R"

build_ratio 11 1080 1080 1320 \
  "$BOOT|3.15|1.20|800|" \
  "$BOOT|15.60|0.70|1250|F O U R   O P E N   C A S E S" \
  "$SOC|8.60|1.80|1300|T A L K   Y O U R   W A Y   I N" \
  "$SOC|12.10|0.80|420|E V I D E N C E   F I L E D" \
  "$CIPH|11.00|2.60|1300|B R E A K   T H E   C I P H E R"

ffmpeg -v error -y -i vv_169.mp4 -i bed.wav -c:v copy -c:a aac -b:a 160k -shortest HCC_Ad_FieldProof_16x9_1920x1080.mp4
ffmpeg -v error -y -i vv_11.mp4 -i bed.wav -c:v copy -c:a aac -b:a 160k -shortest HCC_Ad_FieldProof_1x1_1080x1080.mp4
ffmpeg -v error -y -i HCC_Ad_FieldProof_16x9_1920x1080.mp4 -vf "fps=1/1.6,scale=320:-1,tile=6x1" -frames:v 1 frames/c169.png
ffmpeg -v error -y -i HCC_Ad_FieldProof_1x1_1080x1080.mp4 -vf "fps=1/1.6,scale=240:-1,tile=6x1" -frames:v 1 frames/c11.png
