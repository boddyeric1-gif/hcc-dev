#!/usr/bin/env bash
set -euo pipefail
cd /tmp/hcc
U=/mnt/user-uploads
BOOT="$U/ScreenRecording_08-30-2026_16-22-32_1.mov"
CIPH="$U/ScreenRecording_08-30-2026_16-22-32_1-2.mov"
SOC="$U/ScreenRecording_08-30-2026_16-22-32_1-3.mov"
MONO=/nix/store/xbs17gmksi0pljxcs4l6gshklzpmv8gr-dejavu-fonts-2.37/share/fonts/truetype/DejaVuSansMono-Bold.ttf
CROP="crop=1320:2347:0:400,scale=1080:1920:flags=lanczos,setsar=1,fps=30,format=yuv420p"

seg () { # in ss t out caption
  local IN=$1 SS=$2 T=$3 OUT=$4 CAP=$5
  local TXT=""
  if [ -n "$CAP" ]; then
    TXT=",drawbox=x=0:y=1660:w=1080:h=110:color=0x04070A@0.82:t=fill,drawtext=fontfile=$MONO:text='$CAP':fontcolor=0x5FD8F5:fontsize=38:x=(w-text_w)/2:y=1700"
  fi
  ffmpeg -v error -y -ss "$SS" -t "$T" -i "$IN" -an -vf "${CROP}${TXT}" -c:v libx264 -crf 16 -preset medium "$OUT"
}

seg "$BOOT" 3.15 1.20 s1.mp4 ""
seg "$BOOT" 15.60 0.70 s2.mp4 "F O U R   O P E N   C A S E S"
seg "$SOC"  8.60 1.80 s3.mp4 "T A L K   Y O U R   W A Y   I N"
seg "$SOC"  12.10 0.80 s4.mp4 "E V I D E N C E   F I L E D"
seg "$CIPH" 11.00 2.60 s5.mp4 "B R E A K   T H E   C I P H E R"

ffmpeg -v error -y -framerate 30 -i cta916/f%04d.png -vf "scale=1080:1920,setsar=1,format=yuv420p" -c:v libx264 -crf 16 -preset medium s6.mp4

printf "file 's1.mp4'\nfile 's2.mp4'\nfile 's3.mp4'\nfile 's4.mp4'\nfile 's5.mp4'\nfile 's6.mp4'\n" > list.txt
ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy video_916.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 video_916.mp4
