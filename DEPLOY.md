# Nami — 배포 스모크 체크리스트

프로덕션(Vercel) + Supabase 연결 후, 설계 문서 **시나리오 1·3·7·9**를 수동으로 확인합니다.

**사전 조건:** 마이그레이션 적용, Vercel env 설정, Supabase URL allowlist, 최소 1명 `ADMIN` 계정.

---

## 시나리오 1 — 학생 가입 · 로그인 · 홈 · 언어 전환

| # | 단계 | 기대 결과 |
|---|------|-----------|
| 1.1 | `{VERCEL_URL}/ko/register` 에서 새 학생 계정 생성 | 가입 성공, 로그인 가능 |
| 1.2 | `/ko/login` 으로 로그인 | `/ko/home` (STUDENT 홈)으로 이동 |
| 1.3 | 헤더 네비 확인 | 수강신청·내 성적·내 학적·공지 링크 표시; `/admin/*` 링크 **없음** |
| 1.4 | 헤더에서 `en` / `es` 로 locale 전환 | URL prefix 변경, UI 문자열 번역됨 |
| 1.5 | 로그아웃 후 재로그인 | 세션·홈 정상 |

---

## 시나리오 3 — 학생 수강신청 · 중복 방지

**사전:** ADMIN 이 `/admin/courses` 에 현재 학기(`NEXT_PUBLIC_CURRENT_*`) 강의 1개 이상 등록.

| # | 단계 | 기대 결과 |
|---|------|-----------|
| 3.1 | 학생으로 `/ko/enroll` 접속 | 개설 강의 목록 표시 |
| 3.2 | 강의 1개 신청 | 성공 메시지, 목록에 반영 |
| 3.3 | 동일 강의 재신청 시도 | 버튼 비활성 또는 중복 오류 |
| 3.4 | `/ko/grades` 또는 홈 요약 | 신청/수강 상태 반영 |

---

## 시나리오 7 — 공지 작성 · 전 역할 노출

**사전:** ADMIN 계정.

| # | 단계 | 기대 결과 |
|---|------|-----------|
| 7.1 | ADMIN `/ko/notices` 에서 공지 작성 | 저장 성공 |
| 7.2 | STUDENT `/ko/notices` | 방금 공지 목록·상세에 표시 |
| 7.3 | PROFESSOR `/ko/notices` | 동일 공지 표시 |
| 7.4 | 각 역할 `/ko/home` | 공지 미리보기(있는 경우) 정상 |

---

## 시나리오 9 — Vercel URL 외부 접속 · 로그인

| # | 단계 | 기대 결과 |
|---|------|-----------|
| 9.1 | `localhost` 가 아닌 **Vercel 프로덕션 URL** 접속 | 앱 로드(HTTPS) |
| 9.2 | `/ko/login` 에서 기존 계정 로그인 | 쿠키 세션 유지, `/ko/home` 이동 |
| 9.3 | 새 탭/시크릿 창에서 보호 경로(`/ko/profile`) | 미로그인 시 `/login` 리다이렉트 |
| 9.4 | Supabase Dashboard → Authentication → Logs | 프로덕션 origin 에서 로그인 이벤트 기록 |

---

## 실패 시 빠른 점검

- **로그인 후 즉시 로그아웃:** Supabase **Site URL** / **Redirect URLs** 에 Vercel 도메인(`https://*.vercel.app/**`) 포함 여부
- **데이터·RLS 오류:** `supabase/migrations/20260730000000_init.sql` 적용 여부
- **관리자 메뉴 없음:** `profiles.role = 'ADMIN'` 확인 (README «첫 ADMIN» 절)
- **사용자 생성 불가:** Vercel 에 `SUPABASE_SERVICE_ROLE_KEY` (Production) 설정 여부
