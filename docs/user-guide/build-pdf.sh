#!/usr/bin/env bash
# SETESS 학적 포털 사용자 가이드 PDF 생성 (WeasyPrint)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
HTML="$ROOT/index.html"
OUT="$(cd "$ROOT/.." && pwd)/nami-user-guide.pdf"
VF="$ROOT/fonts/NotoSansKR-VF.ttf"
REGULAR="$ROOT/fonts/NotoSansKR-Regular.ttf"
BOLD="$ROOT/fonts/NotoSansKR-Bold.ttf"

mkdir -p "$ROOT/fonts"
if [[ ! -f "$VF" ]]; then
  echo "Noto Sans KR 가변 폰트를 받는 중…"
  curl -fsSL -o "$VF" \
    "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf"
fi

if [[ ! -f "$REGULAR" || ! -f "$BOLD" ]]; then
  echo "정적 Regular/Bold 인스턴스를 만드는 중…"
  python3 -m fontTools.varLib.instancer "$VF" wght=400 -o "$REGULAR"
  python3 -m fontTools.varLib.instancer "$VF" wght=700 -o "$BOLD"
fi

echo "PDF 생성: $OUT"
python3 - "$HTML" "$OUT" <<'PY'
import sys
from weasyprint import HTML

html_path, out_path = sys.argv[1], sys.argv[2]
HTML(filename=html_path, encoding="utf-8").write_pdf(out_path)
print("wrote", out_path)
PY

ls -lh "$OUT"
