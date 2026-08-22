-- Roles infrastructure
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- mock_exams
DROP POLICY IF EXISTS "Authenticated can insert mock exams" ON public.mock_exams;
DROP POLICY IF EXISTS "Authenticated can update mock exams" ON public.mock_exams;
DROP POLICY IF EXISTS "Authenticated can delete mock exams" ON public.mock_exams;
CREATE POLICY "Admins manage mock exams" ON public.mock_exams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- mock_questions
DROP POLICY IF EXISTS "Authenticated can insert mock questions" ON public.mock_questions;
DROP POLICY IF EXISTS "Authenticated can update mock questions" ON public.mock_questions;
DROP POLICY IF EXISTS "Authenticated can delete mock questions" ON public.mock_questions;
CREATE POLICY "Admins manage mock questions" ON public.mock_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- practice_questions
DROP POLICY IF EXISTS "Authenticated can manage practice questions" ON public.practice_questions;
CREATE POLICY "Admins manage practice questions" ON public.practice_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- reading_passages
DROP POLICY IF EXISTS "Authenticated can insert passages" ON public.reading_passages;
DROP POLICY IF EXISTS "Authenticated can update passages" ON public.reading_passages;
DROP POLICY IF EXISTS "Authenticated can delete passages" ON public.reading_passages;
CREATE POLICY "Admins manage passages" ON public.reading_passages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- vocab_words
DROP POLICY IF EXISTS "Authenticated can manage vocab words" ON public.vocab_words;
CREATE POLICY "Admins manage vocab words" ON public.vocab_words FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));