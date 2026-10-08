# Nami

남미연합신학교 학사·학적 포털 (Next.js + Supabase + Vercel).

## 로컬 실행

```bash
cd nami
npm install
cp .env.local.example .env.local   # Windows: Copy-Item .env.local.example .env.local
# .env.local 에 Supabase URL / anon key 입력
npm run dev
```

브라우저: [http://localhost:3000](http://localhost:3000) (기본 locale: `/ko`).

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |
| `npm test` | Vitest |

Supabase env 가 비어 있어도 UI는 렌더됩니다. 데이터·인증·변경(mutation)은 «설정되지 않음» 안내 또는 명확한 오류를 반환합니다.

---

## 환경 변수

`.env.local.example` 을 복사해 `.env.local` 을 만듭니다.

| 변수 | 필수 | 설명 |
|------|:----:|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ● | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ● | anon key (브라우저·서버 SSR) |
| `SUPABASE_SERVICE_ROLE_KEY` | ○ | 서버 전용. `/admin/users` 에서 **사용자 생성** 시 필요. 클라이언트·`NEXT_PUBLIC_*` 에 넣지 마세요 |
| `NEXT_PUBLIC_CURRENT_YEAR` | ○ | 현재 학년도 (기본 `2026`) |
| `NEXT_PUBLIC_CURRENT_SEMESTER` | ○ | 현재 학기 `1` 또는 `2` (기본 `1`) |

---

## Supabase 프로젝트 · 마이그레이션

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성 (리전 선택).
2. **Project Settings → API** 에서 URL, `anon`, `service_role` 키를 `.env.local` / Vercel 에 입력.
3. 스키마·RLS·Storage(`avatars`) 적용 — **택 1:**

### A. Supabase CLI (권장)

```bash
npm i -g supabase
supabase login
cd nami
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

운영 프로젝트 `qorbssjmmwxnrgimfohb` 는 마이그레이션 이력이 저장소와 어긋나 있습니다.
`db push` 전에 [supabase/README.md](supabase/README.md) 의 repair 순서를 따르세요.

### B. SQL Editor

Dashboard → **SQL Editor** → `supabase/migrations/20260730000000_init.sql` 전체 붙여넣기 → Run.

이미 초기 마이그레이션을 적용한 프로젝트는 이어서
`supabase/migrations/20260730000001_fix_rls_student_courses.sql` 을 실행합니다.

4. **Authentication → Providers → Email** 이 활성인지 확인.

---

## Supabase URL allowlist (로컬 + Vercel)

**Authentication → URL Configuration**

| 항목 | 값 (예시) |
|------|-----------|
| Site URL | `https://<your-app>.vercel.app` |
| Redirect URLs | `http://localhost:3000/**` |
| | `https://<your-app>.vercel.app/**` |
| | `https://*.vercel.app/**` (프리뷰 배포용) |

로컬만 쓸 때는 Site URL 을 `http://localhost:3000` 으로 두고, 프로덕션 배포 후 Vercel URL 로 갱신합니다.

---

## 첫 ADMIN 계정 만들기

가입 시 `profiles.role` 은 트리거로 `STUDENT` 가 됩니다. 최신 마이그레이션 적용 후
**첫 관리자**는 Supabase Dashboard의 SQL Editor(`postgres`/`supabase_admin` 실행 컨텍스트)에서
한 번 승격합니다. 일반 로그인 사용자의 직접 역할 변경은 계속 차단되며,
서버의 `service_role` 요청도 부트스트랩에 사용할 수 있습니다.

1. 앱에서 `/ko/register` 로 계정 생성 (또는 Supabase Dashboard → Authentication → Add user).
2. Dashboard → **SQL Editor**:

```sql
update public.profiles
set role = 'ADMIN'
where email = 'your-admin@example.com';
```

3. 해당 계정으로 로그인 → `/ko/admin/users` 등 관리자 메뉴 접근 확인.
4. (선택) Vercel·로컬 `.env.local` 에 `SUPABASE_SERVICE_ROLE_KEY` 를 넣으면 관리자 UI에서 추가 사용자(교수·학생·관리자) 생성 가능.

---

## Vercel 배포

1. **GitHub:** `nami` 저장소를 원격에 push (사용자 계정·권한 필요).
2. [vercel.com](https://vercel.com) → **Add New Project** → GitHub 리포 import, Root Directory = `nami` (모노레포면 해당 하위 경로).
3. **Environment Variables** (Production · Preview · Development 동일 권장):

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_CURRENT_YEAR`
   - `NEXT_PUBLIC_CURRENT_SEMESTER`
   - `SUPABASE_SERVICE_ROLE_KEY` (관리자 사용자 생성용, Production 에만 넣어도 됨)

4. Deploy → 배포 URL 확인.
5. Supabase **Site URL / Redirect URLs** 에 위 Vercel 도메인 반영 (allowlist 절).
6. [DEPLOY.md](./DEPLOY.md) 스모크 체크리스트(시나리오 1·3·7·9) 실행.

`vercel.json` 은 Next.js 기본 설정으로 충분하여 별도 파일은 두지 않습니다.

---

## 프로젝트 구조 (요약)

- `app/[locale]/` — App Router, `(app)` 역할별 레이아웃·페이지
- `components/` — AppHeader, RoleNav, 폼 등
- `lib/supabase/` — client / server / middleware
- `lib/domain/` — 학기·enum
- `messages/` — ko / en / es (next-intl)
- `supabase/migrations/` — Postgres 스키마 + RLS

---

## 관련 문서

- [DEPLOY.md](./DEPLOY.md) — 프로덕션 스모크 체크리스트
- 설계: `docs/superpowers/specs/2026-07-30-nami-design.md`
