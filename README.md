# HabitForge

Daily habit tracker web app — React + Vite + Supabase + Tailwind. Earn XP, build streaks, climb ranks.

## Stack
- **React 18** + **Vite 5**
- **Tailwind CSS v3**
- **Supabase** (Auth + Postgres + RLS)
- **Zustand** for state
- **React Router v6**
- **react-calendar** + **Recharts** for views
- **lucide-react** + **emoji-picker-react**
- **Web Notifications API** for reminders

## Setup

1. Install deps
   ```bash
   npm install
   ```

2. **Run the schema migration in Supabase** (one-time, idempotent — safe to re-run)

   Open the Supabase dashboard → **SQL Editor** → **New query**, paste the contents
   of [`supabase/migrations/0001_habit_columns.sql`](./supabase/migrations/0001_habit_columns.sql),
   and click **Run**. This adds every column the app needs (`color`, `icon`,
   `frequency_days`, `day_off_enabled`, `reminder_time`, `xp_earned`, etc.),
   recreates the RLS policies, and reloads the PostgREST schema cache.

   > If you see `Could not find the 'color' column of 'habits' in the schema
   > cache`, this migration fixes it.

3. Set your Supabase keys in `.env`
   ```
   VITE_SUPABASE_URL=https://ntwcinwdemqrgirtlwqb.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. Run
   ```bash
   npm run dev
   ```

5. Build
   ```bash
   npm run build
   ```

## Features (8 screens)

| # | Screen | Route |
|---|--------|-------|
| 01 | Login / Signup | `/login` |
| 02 | Dashboard | `/dashboard` |
| 03 | Add / Edit Habit | `/habits/new`, `/habits/:id/edit` |
| 04 | Habit Detail | `/habits/:id` |
| 05 | Calendar | `/calendar` |
| 06 | Stats | `/stats` |
| 07 | Settings | `/settings` |
| 08 | Welcome / Name | modal on first login |

## XP System

| Event | XP |
|------|----|
| Complete a habit | +10 |
| Perfect Day (all scheduled habits done) | +25 |
| 7-day streak | +50 |
| 30-day streak | +150 |
| 1.5× multiplier | active after 7-day streak |

## Ranks

| Rank | XP | Perk |
|------|----|------|
| Beginner | 0 | Default |
| Consistent | 200 | Custom reminder per habit |
| Disciplined | 600 | Habit categories |
| Elite | 1,500 | Dark theme |
| Master | 3,500 | Streak Shield |
| Legend | 7,000 | Custom accent color |

## Streak Rules
- **Increments**: 1+ habit completed on a scheduled day
- **Day Off**: marks the day, streak safe, 0 XP
- **Resets**: a scheduled day with no completion and no day-off

## Folder structure

```
src/
  lib/         supabase.js, constants.js
  store/       authStore.js, habitsStore.js, xpStore.js
  hooks/       useAuth.js, useHabits.js, useXP.js, useStreak.js
  utils/       dateHelpers.js, xpCalc.js, streakCalc.js, notifications.js
  components/  Layout, Modal, HabitCard, XPBar, StreakBadge, HeatMap, WeekChart, ProtectedRoute, NameSetupModal
  pages/       Login, Dashboard, HabitForm, HabitDetail, Calendar, Stats, Settings
  App.jsx
  main.jsx
  index.css
```

## Notifications
The Web Notifications API fires reminders while the tab is open. Enable from the Settings screen, then set per-habit times in the habit form. For persistent background notifications, wire up a Service Worker + Push API on the Supabase side (out of MVP scope).

## Deployment (Vercel)
1. Push to GitHub
2. Import the repo in Vercel
3. Add the two env vars
4. Deploy

## Notes
- DB schema (5 tables) and signup trigger are already set up on the Supabase project — no changes required.
- RLS scopes every row to the signed-in user.
- First signup auto-creates a `user_profiles` row. The welcome modal captures the display name once.
