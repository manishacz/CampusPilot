/*
# Adapt CampusPilot Supabase schema to auth-only + profile role

## Summary
Removes the `documents` and `tasks` tables — AWS DynamoDB is the source of
truth for those. Replaces the `students` table with a `profiles` table that
stores only user identity and academic preference data used for eligibility
matching. The Supabase database now only holds authentication context and
user profile data.

## Tables removed
- `documents` — owned by AWS DynamoDB / S3
- `tasks` — owned by AWS DynamoDB / LangGraph

## Tables replaced
- `students` → `profiles` (same purpose, aligned field names matching the
  frontend ProfilePage: full_name, college, branch, graduation_year, cgpa,
  preferred_language, avatar_url)

## Security
- RLS remains enabled on `profiles`
- Four separate owner-scoped policies (SELECT / INSERT / UPDATE / DELETE)
- `auth.uid() = id` predicate — no cross-user access
- No anon access — app requires sign-in
*/

-- Remove AWS-owned tables (frontend never queries these via Supabase)
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Remove old students table (replaced by profiles below)
DROP TABLE IF EXISTS students CASCADE;

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  college text,
  branch text,
  graduation_year int,
  cgpa numeric(3,2),
  preferred_language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
