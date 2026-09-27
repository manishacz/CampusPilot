/*
# Create CampusPilot database schema

## Overview
Sets up the core database tables for CampusPilot — a campus workflow app
where students upload documents and get prioritized tasks extracted from them.

## New Tables

### 1. students
Stores student profile information used for eligibility matching.
- `id` (uuid, PK, references auth.users) — links to the Supabase auth user
- `name` (text) — full name
- `college` (text) — college/university name
- `branch` (text) — academic branch (CSE, IT, ECE, etc.)
- `graduation_year` (int) — expected graduation year
- `cgpa` (numeric) — current CGPA
- `preferred_language` (text, default 'en') — UI language preference
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. documents
Stores metadata for uploaded campus documents (notices, PDFs, etc.).
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, defaults to auth.uid()) — owner
- `filename` (text) — original file name
- `s3_key` (text) — S3 storage key
- `status` (text, default 'uploading') — uploading | processing | ready | failed
- `document_type` (text) — pdf, docx, xlsx, etc.
- `pages` (int, nullable) — number of pages
- `tasks_generated` (int, default 0) — count of tasks extracted
- `uploaded_at` (timestamptz)
- `created_at` (timestamptz)

### 3. tasks
Stores actionable tasks extracted from documents.
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, defaults to auth.uid()) — owner
- `document_id` (uuid, FK to documents, nullable) — source document
- `title` (text) — task title
- `category` (text) — placement | scholarship | exam | hostel | event
- `deadline` (timestamptz, nullable) — task deadline
- `eligibility` (jsonb, nullable) — { branches, graduation_year, min_cgpa }
- `requirements` (jsonb, nullable) — array of requirement strings
- `priority` (text, default 'medium') — high | medium | low
- `status` (text, default 'pending') — pending | in_progress | completed
- `justification` (text, nullable) — AI reasoning for priority
- `source_ref` (jsonb, nullable) — { document_id, page, bbox }
- `confidence` (text, default 'high') — high | medium | low
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Security
- RLS enabled on all three tables.
- Owner-scoped CRUD policies: each authenticated user can only access their own rows.
- `user_id` columns default to `auth.uid()` so inserts that omit the owner still work.
- No anon access — the app requires sign-in.

## Indexes
- `documents.user_id` — filter documents by owner
- `tasks.user_id` — filter tasks by owner
- `tasks.document_id` — join tasks to their source document
- `tasks.status` — filter by completion state
- `tasks.priority` — sort by priority
*/

-- ============================================================
-- STUDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  college text,
  branch text,
  graduation_year int,
  cgpa numeric(3,2),
  preferred_language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_student" ON students;
CREATE POLICY "select_own_student" ON students FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_student" ON students;
CREATE POLICY "insert_own_student" ON students FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_student" ON students;
CREATE POLICY "update_own_student" ON students FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_student" ON students;
CREATE POLICY "delete_own_student" ON students FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============================================================
-- DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  s3_key text,
  status text NOT NULL DEFAULT 'uploading',
  document_type text,
  pages int,
  tasks_generated int NOT NULL DEFAULT 0,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- ============================================================
-- TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'placement',
  deadline timestamptz,
  eligibility jsonb,
  requirements jsonb,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  justification text,
  source_ref jsonb,
  confidence text NOT NULL DEFAULT 'high',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_document_id ON tasks(document_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_students_updated_at ON students;
CREATE TRIGGER trigger_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON tasks;
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
