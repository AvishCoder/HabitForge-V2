-- HabitForge — schema patch
-- Adds the columns the web app reads/writes that may be missing from the
-- initial table definitions. Safe to re-run (uses IF NOT EXISTS / DO blocks).
--
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- After running, the PostgREST schema cache picks up new columns within a
-- few seconds. If you still see "Could not find column ... in schema cache",
-- go to Settings → API → click "Reload schema" (or wait ~30s).

----------------------------------------------------------------------
-- habits
----------------------------------------------------------------------
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS icon              text        DEFAULT '🎯',
  ADD COLUMN IF NOT EXISTS color             text        DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS frequency_days    integer[]   DEFAULT ARRAY[0,1,2,3,4,5,6],
  ADD COLUMN IF NOT EXISTS day_off_enabled   boolean     DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_time     time,
  ADD COLUMN IF NOT EXISTS is_archived       boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at        timestamptz DEFAULT now();

----------------------------------------------------------------------
-- completions
----------------------------------------------------------------------
ALTER TABLE public.completions
  ADD COLUMN IF NOT EXISTS completed_date    date,
  ADD COLUMN IF NOT EXISTS is_day_off        boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS xp_earned         integer     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at        timestamptz DEFAULT now();

-- Unique constraint that lets us use upsert(..., onConflict: 'habit_id,completed_date')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'completions_habit_date_unique'
  ) THEN
    ALTER TABLE public.completions
      ADD CONSTRAINT completions_habit_date_unique UNIQUE (habit_id, completed_date);
  END IF;
END$$;

----------------------------------------------------------------------
-- user_profiles
----------------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS display_name             text,
  ADD COLUMN IF NOT EXISTS default_reminder_time    time,
  ADD COLUMN IF NOT EXISTS avatar_url               text,
  ADD COLUMN IF NOT EXISTS created_at               timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at               timestamptz DEFAULT now();

----------------------------------------------------------------------
-- notifications
----------------------------------------------------------------------
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS habit_id       uuid REFERENCES public.habits(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reminder_time  time,
  ADD COLUMN IF NOT EXISTS enabled        boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at     timestamptz DEFAULT now();

-- Helpful index for the scheduler
CREATE INDEX IF NOT EXISTS notifications_user_time
  ON public.notifications (user_id, reminder_time);

----------------------------------------------------------------------
-- xp_log
----------------------------------------------------------------------
ALTER TABLE public.xp_log
  ADD COLUMN IF NOT EXISTS amount      integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reason      text,
  ADD COLUMN IF NOT EXISTS earned_at   timestamptz DEFAULT now();

----------------------------------------------------------------------
-- helpful indexes
----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS habits_user_idx        ON public.habits (user_id);
CREATE INDEX IF NOT EXISTS completions_user_date  ON public.completions (user_id, completed_date DESC);
CREATE INDEX IF NOT EXISTS completions_habit_date ON public.completions (habit_id, completed_date DESC);
CREATE INDEX IF NOT EXISTS xp_log_user_time       ON public.xp_log (user_id, earned_at DESC);

----------------------------------------------------------------------
-- RLS — make sure all tables are locked down per-user.
-- If RLS is already enabled, these statements are no-ops.
----------------------------------------------------------------------
ALTER TABLE public.habits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_log         ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent) for clarity.
DO $$
DECLARE p text;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN
      ('habits','completions','user_profiles','notifications','xp_log')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I',
      p, split_part(p, '_on_', 1));
  END LOOP;
END$$;

-- Recreate simple owner-only policies (re-run safe — they replace the above)
CREATE POLICY habits_all         ON public.habits        FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY completions_all    ON public.completions   FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY profile_all        ON public.user_profiles FOR ALL USING (id       = auth.uid()) WITH CHECK (id       = auth.uid());
CREATE POLICY notifications_all  ON public.notifications FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY xp_log_all         ON public.xp_log        FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

----------------------------------------------------------------------
-- Auto-create user_profiles row on signup
-- (in case the original trigger is missing or you wiped the table)
----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, created_at, updated_at)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Force PostgREST to reload the schema cache so the new columns are visible
NOTIFY pgrst, 'reload schema';
