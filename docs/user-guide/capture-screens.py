#!/usr/bin/env python3
"""Capture each Nami portal screen and build a screenshot PDF."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GUIDE = Path(__file__).resolve().parent
SHOT_DIR = GUIDE / "screenshots"
PDF_PATH = ROOT / "docs" / "nami-screen-captures.pdf"
BASE = os.environ.get("NAMI_CAPTURE_BASE", "http://127.0.0.1:3000")
COOKIE = "nami_demo_role"

SCREENS = [
    {"file": "01-login.png", "title": "로그인", "path": "/ko/login", "role": None, "width": 1280, "height": 900},
    {"file": "02-register.png", "title": "회원가입", "path": "/ko/register", "role": None, "width": 1280, "height": 900},
    {"file": "03-privacy.png", "title": "개인정보 이용약관", "path": "/ko/privacy", "role": None, "width": 1280, "height": 1400},
    {"file": "04-home-student.png", "title": "홈 (학생)", "path": "/ko/home", "role": "STUDENT", "width": 1440, "height": 1100},
    {"file": "05-profile.png", "title": "프로필", "path": "/ko/profile", "role": "STUDENT", "width": 1440, "height": 1400},
    {"file": "06-change-password.png", "title": "비밀번호 변경", "path": "/ko/change-password", "role": "STUDENT", "width": 1280, "height": 900},
    {"file": "07-enroll.png", "title": "수강신청", "path": "/ko/enroll", "role": "STUDENT", "width": 1440, "height": 900},
    {"file": "08-grades.png", "title": "내 성적", "path": "/ko/grades", "role": "STUDENT", "width": 1440, "height": 900},
    {"file": "09-enrollment.png", "title": "내 학적", "path": "/ko/enrollment", "role": "STUDENT", "width": 1440, "height": 1400},
    {"file": "10-notices.png", "title": "공지사항", "path": "/ko/notices", "role": "STUDENT", "width": 1440, "height": 900},
    {"file": "11-notice-detail.png", "title": "공지 상세", "path": "/ko/notices/demo-notice-1", "role": "STUDENT", "width": 1440, "height": 900},
    {"file": "12-home-professor.png", "title": "홈 (교수)", "path": "/ko/home", "role": "PROFESSOR", "width": 1440, "height": 1100},
    {"file": "13-teaching.png", "title": "담당 강의", "path": "/ko/teaching", "role": "PROFESSOR", "width": 1440, "height": 900},
    {"file": "14-teaching-course.png", "title": "강의 수강생 · 성적", "path": "/ko/teaching/demo-course-1", "role": "PROFESSOR", "width": 1440, "height": 1100},
    {"file": "15-teaching-student.png", "title": "학생 학적 조회", "path": "/ko/teaching/students/demo-student", "role": "PROFESSOR", "width": 1440, "height": 1100},
    {"file": "16-home-admin.png", "title": "홈 (관리자)", "path": "/ko/home", "role": "ADMIN", "width": 1440, "height": 1200},
    {"file": "17-admin-users.png", "title": "사용자 관리", "path": "/ko/admin/users", "role": "ADMIN", "width": 1440, "height": 1400},
    {"file": "18-admin-user-detail.png", "title": "사용자 상세", "path": "/ko/admin/users/demo-student", "role": "ADMIN", "width": 1440, "height": 1600},
    {"file": "19-admin-courses.png", "title": "강의 관리", "path": "/ko/admin/courses", "role": "ADMIN", "width": 1440, "height": 1200},
    {"file": "20-admin-course-detail.png", "title": "강의 수정", "path": "/ko/admin/courses/demo-course-1", "role": "ADMIN", "width": 1440, "height": 1000},
    {"file": "21-admin-enrollments.png", "title": "학적 관리", "path": "/ko/admin/enrollments", "role": "ADMIN", "width": 1440, "height": 1200},
    {"file": "22-admin-enrollment-detail.png", "title": "학적 상세", "path": "/ko/admin/enrollments/demo-record-1", "role": "ADMIN", "width": 1440, "height": 1500},
    {"file": "23-admin-notices.png", "title": "공지사항 (관리자)", "path": "/ko/notices", "role": "ADMIN", "width": 1440, "height": 1200},
    {"file": "24-admin-change-logs.png", "title": "최근 변경", "path": "/ko/admin/change-logs", "role": "ADMIN", "width": 1440, "height": 1000},
]


def wait_for_server(url: str, timeout: float = 120) -> None:
    deadline = time.time() + timeout
    last_error = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=3) as response:
                if response.status < 500:
                    return
        except (urllib.error.URLError, TimeoutError, ConnectionError) as error:
            last_error = error
        time.sleep(1)
    raise SystemExit(f"개발 서버가 응답하지 않습니다: {url} ({last_error})")


def capture() -> None:
    from playwright.sync_api import sync_playwright

    SHOT_DIR.mkdir(parents=True, exist_ok=True)
    chrome = os.environ.get("CHROME", "/usr/bin/google-chrome")
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=chrome if os.path.exists(chrome) else None,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
            headless=True,
        )
        for screen in SCREENS:
            context = browser.new_context(
                viewport={"width": screen["width"], "height": min(screen["height"], 1200)},
                locale="ko-KR",
            )
            if screen["role"]:
                context.add_cookies(
                    [
                        {
                            "name": COOKIE,
                            "value": screen["role"],
                            "url": BASE,
                        }
                    ]
                )
            page = context.new_page()
            url = BASE + screen["path"]
            print(f"capture {screen['title']} {url}", flush=True)
            page.goto(url, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(400)
            dest = SHOT_DIR / screen["file"]
            page.screenshot(path=str(dest), full_page=True)
            context.close()
        browser.close()


def build_pdf() -> None:
    from weasyprint import HTML

    font_regular = GUIDE / "fonts" / "NotoSansKR-Regular.ttf"
    font_face = ""
    if font_regular.exists():
        font_face = f"""
        @font-face {{
          font-family: "Noto Sans KR";
          src: url("{font_regular.as_uri()}") format("truetype");
          font-weight: 400;
        }}
        """
        bold = GUIDE / "fonts" / "NotoSansKR-Bold.ttf"
        if bold.exists():
            font_face += f"""
            @font-face {{
              font-family: "Noto Sans KR";
              src: url("{bold.as_uri()}") format("truetype");
              font-weight: 700;
            }}
            """

    cards = []
    for index, screen in enumerate(SCREENS, start=1):
        image = SHOT_DIR / screen["file"]
        if not image.exists():
            raise SystemExit(f"스크린샷이 없습니다: {image}")
        cards.append(
            f"""
            <section class="page">
              <header>
                <span class="num">{index:02d}</span>
                <div>
                  <h1>{screen["title"]}</h1>
                  <p class="path">{screen["path"]}</p>
                </div>
              </header>
              <img src="{image.as_uri()}" alt="{screen["title"]}" />
            </section>
            """
        )

    html = f"""<!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <style>
        {font_face}
        @page {{ size: A4 landscape; margin: 10mm; }}
        * {{ box-sizing: border-box; }}
        body {{
          margin: 0;
          font-family: "Noto Sans KR", sans-serif;
          color: #16324f;
        }}
        .cover, .page {{ page-break-after: always; }}
        .cover {{
          min-height: 180mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 12mm;
        }}
        .cover h1 {{ font-size: 32pt; margin: 8mm 0 4mm; }}
        .cover p {{ color: #52606d; font-size: 12pt; }}
        header {{
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6mm;
        }}
        .num {{
          width: 28px; height: 28px; border-radius: 50%;
          background: #16324f; color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 10pt; font-weight: 700;
        }}
        h1 {{ font-size: 16pt; margin: 0; }}
        .path {{
          margin: 2px 0 0;
          font-size: 9pt;
          color: #5b4b8a;
          font-family: ui-monospace, monospace;
        }}
        img {{
          width: 100%;
          max-height: 170mm;
          object-fit: contain;
          object-position: top;
          border: 1px solid #d9e2ec;
          background: #f7f3eb;
        }}
      </style>
    </head>
    <body>
      <section class="cover">
        <p>SETESS · NAMI</p>
        <h1>학적 포털 화면 캡처</h1>
        <p>각 화면을 실제 포털 UI에서 캡처했습니다. 로그인 전 공개 화면, 학생·교수·관리자 역할별 화면이 포함됩니다.</p>
        <p>경로 예: /ko/login · 캡처일: 2026년 8월</p>
      </section>
      {''.join(cards)}
    </body>
    </html>
    """
    HTML(string=html, base_url=str(GUIDE)).write_pdf(str(PDF_PATH))
    print("wrote", PDF_PATH, "size", PDF_PATH.stat().st_size)


def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1] == "--pdf-only":
        build_pdf()
        return
    wait_for_server(BASE + "/ko/login")
    capture()
    build_pdf()


if __name__ == "__main__":
    main()
