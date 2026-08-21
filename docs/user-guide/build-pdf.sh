#!/usr/bin/env bash
# SETESS 학적 포털 사용자 가이드 PDF 생성
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
FONT="$ROOT/fonts/NotoSansKR-VF.ttf"
HTML="$ROOT/index.html"
OUT="$(cd "$ROOT/.." && pwd)/nami-user-guide.pdf"

mkdir -p "$ROOT/fonts"
if [[ ! -f "$FONT" ]]; then
  echo "Noto Sans KR 폰트를 받는 중…"
  curl -fsSL -o "$FONT" \
    "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf"
fi

CHROME="${CHROME:-}"
if [[ -z "$CHROME" ]]; then
  for c in google-chrome google-chrome-stable chromium chromium-browser; do
    if command -v "$c" >/dev/null 2>&1; then
      CHROME="$c"
      break
    fi
  done
fi
if [[ -z "$CHROME" ]]; then
  echo "Chrome/Chromium 이 필요합니다." >&2
  exit 1
fi

USER_DATA="$(mktemp -d)"
cleanup() { rm -rf "$USER_DATA"; }
trap cleanup EXIT

echo "PDF 생성: $OUT"
set +e
timeout 45 "$CHROME" \
  --headless=new \
  --disable-gpu \
  --no-sandbox \
  --disable-dev-shm-usage \
  --disable-extensions \
  --disable-background-networking \
  --user-data-dir="$USER_DATA" \
  --no-pdf-header-footer \
  --virtual-time-budget=8000 \
  --run-all-compositor-stages-before-draw \
  --print-to-pdf="$OUT" \
  "file://$HTML"
status=$?
set -e

if [[ ! -f "$OUT" || ! -s "$OUT" ]]; then
  echo "PDF 생성에 실패했습니다. (exit $status)" >&2
  exit 1
fi
if [[ "$status" -ne 0 && "$status" -ne 124 ]]; then
  echo "Chrome 경고 종료 코드: $status (PDF는 생성됨)" >&2
fi

ls -lh "$OUT"
