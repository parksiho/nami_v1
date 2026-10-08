# Supabase 마이그레이션 이력과 보안 적용

프로젝트 ref: `qorbssjmmwxnrgimfohb`

이 문서는 운영 데이터베이스에 **아직 적용하지 않은** 작업 순서입니다.
`supabase db push` 로 아래 repair 를 건너뛰면, 이미 스키마에 반영된 두 마이그레이션을 다시 실행하려다 실패하거나 이력이 더 어긋납니다.

## 원격 이력과 저장소 파일 (2026-10-08 확인)

`supabase_migrations.schema_migrations` 컬럼은 `version` (text, PK), `name` (text, null 허용), `statements` (text[], null 허용) 입니다.

기록된 3건의 version / name 은 저장소 파일명과 일치합니다. 불일치는 없습니다.

| version | name | 저장소 파일 |
| --- | --- | --- |
| `20260730000000` | `init` | `supabase/migrations/20260730000000_init.sql` |
| `20260730000001` | `fix_rls_student_courses` | `supabase/migrations/20260730000001_fix_rls_student_courses.sql` |
| `20260731000000` | `profile_student_number_semester` | `supabase/migrations/20260731000000_profile_student_number_semester.sql` |

아래 두 파일은 운영 DB에 손으로 적용되어 있습니다. `profiles.is_active` (boolean, not null, default true) 와 관련 FK 의 `ON DELETE CASCADE` / `ON DELETE SET NULL` 이 이미 있습니다. **파일은 수정하지 말고, SQL 을 다시 실행하지 마세요.** 이력만 applied 로 표시합니다.

| version | name | 저장소 파일 |
| --- | --- | --- |
| `20260803000000` | `profile_is_active` | `supabase/migrations/20260803000000_profile_is_active.sql` |
| `20260803010000` | `profile_delete_cascades` | `supabase/migrations/20260803010000_profile_delete_cascades.sql` |

## 1. 이력 repair

저장소 루트에서, 위 두 파일과 `20261008130454_harden_function_execute_and_search_path.sql` 이 있는 체크아웃으로 실행합니다.

```bash
supabase link --project-ref qorbssjmmwxnrgimfohb
supabase migration repair --status applied 20260803000000
supabase migration repair --status applied 20260803010000
supabase migration list
```

`migration list` 에서 위 두 version 은 local 과 remote 가 모두 있고, `20261008130454` 는 local 에만 있어야 합니다.

CLI 를 쓸 수 없을 때의 동등한 INSERT 입니다. `repair` 가 로컬 파일에서 `statements` 까지 채우므로 CLI 를 우선합니다. 이 INSERT 는 version / name 만 맞춥니다. `statements` 는 null 이어도 `db push` 는 version 으로만 비교합니다.

```sql
insert into supabase_migrations.schema_migrations (version, name)
values
  ('20260803000000', 'profile_is_active'),
  ('20260803010000', 'profile_delete_cascades')
on conflict (version) do nothing;
```

확인:

```sql
select version, name
from supabase_migrations.schema_migrations
order by version;
```

## 2. 보안 마이그레이션 적용

repair 가 끝난 뒤에만 실행합니다. 아직 없는 `20261008130454_harden_function_execute_and_search_path` 만 적용됩니다.

```bash
supabase db push
```

적용 후 version `20261008130454`, name `harden_function_execute_and_search_path` 가 이력에 보여야 합니다.

이 마이그레이션이 바꾸는 EXECUTE:

| 함수 | anon | PUBLIC | authenticated | service_role |
| --- | --- | --- | --- | --- |
| `auth_role()`, `is_admin()`, `is_professor_of_course(uuid)`, `is_professor_of_student(uuid)` | 회수 | 회수 | 유지 (명시적 GRANT) | 유지 (명시적 GRANT) |
| `handle_new_user()` | 회수 | 회수 | 회수 | 회수 |

`set_updated_at()` 은 `search_path = public` 으로 고정합니다. 운영 DB 의 public 함수 중 search_path 가 없던 함수는 이것뿐입니다. 마이그레이션은 그 외 public 함수도 같은 방식으로 고정합니다.

`/ko/login`, `/ko/register`, `/ko/privacy`, locale 루트는 테이블을 읽지 않습니다. 로그아웃 상태의 직접 REST 조회 중 helper 를 호출하는 SELECT 정책이 있는 테이블(`profiles`, `student_courses`, `enrollment_records`, `enrollment_history`, `change_logs`)은 빈 결과 대신 permission denied 가 날 수 있습니다. 앱 페이지는 그 경로를 쓰지 않습니다. `courses` / `notices` 의 SELECT 와 공개 아바타 URL 은 helper 없이도 허용됩니다.

## 3. 비밀번호 규칙 (마이그레이션 아님)

Free 플랜에서는 유출 비밀번호 차단을 켤 수 없습니다. 길이 8, 문자 조건은 대시보드에서 설정합니다. 이 저장소의 `supabase/config.toml` 은 로컬 설정이며, `supabase config push` 는 다른 Auth 설정까지 덮어쓸 수 있으니 쓰지 마세요.

1. [Authentication → Providers → Email](https://supabase.com/dashboard/project/qorbssjmmwxnrgimfohb/auth/providers?provider=Email) 을 엽니다. 비밀번호 강도는 이 화면에 있습니다. 예전 대시보드는 Authentication → Settings (`/settings/auth`) 의 Password 구역입니다.
2. **Minimum password length** 를 `8` 로 설정합니다.
3. **Password requirements** (Required characters) 를 **Letters and digits** 로 설정합니다. config.toml 값 `letters_digits` 와 같고, 문자 집합은 `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ` 와 `0123456789` 입니다. 대소문자 구분이나 기호는 요구하지 않습니다.
4. Leaked password protection (HaveIBeenPwned) 은 끄고 둡니다.
5. Save 합니다.

이미 있는 사용자는 기존 비밀번호로 로그인할 수 있습니다. 가입, 비밀번호 변경, 관리자의 사용자 생성은 이 규칙을 만족하지 않으면 `weak_password` 로 거절됩니다.
