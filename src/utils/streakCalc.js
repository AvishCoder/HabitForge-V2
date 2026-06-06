import { parseISO, differenceInCalendarDays, format, subDays, isAfter } from 'date-fns'

// Given a list of completions [{completed_date, is_day_off}] and a schedule
// (array of weekday numbers), compute the current streak.
export const calcStreak = (completions, schedule = [0,1,2,3,4,5,6]) => {
  if (!completions || completions.length === 0) return 0
  const valid = completions
    .filter((c) => c.completed_date)
    .reduce((acc, c) => {
      const k = c.completed_date
      if (!acc[k]) {
        acc[k] = c
      } else if (c.is_day_off && !acc[k].is_day_off) {
        acc[k] = c
      }
      return acc
    }, {})

  let streak = 0
  let cursor = new Date()
  cursor.setHours(0,0,0,0)
  const today = new Date()
  today.setHours(0,0,0,0)

  // If today has nothing scheduled or no entry, start counting from yesterday
  const todayKey = format(today, 'yyyy-MM-dd')
  if (!valid[todayKey]) {
    cursor = subDays(cursor, 1)
  }

  // Walk backwards day by day
  for (let i = 0; i < 3650; i++) {
    const key = format(cursor, 'yyyy-MM-dd')
    const day = cursor.getDay()
    const scheduled = schedule.includes(day)

    if (!scheduled) {
      // Skip non-scheduled days
      cursor = subDays(cursor, 1)
      continue
    }

    const entry = valid[key]
    if (entry) {
      // completed or day off — streak safe
      streak += 1
      cursor = subDays(cursor, 1)
    } else {
      break
    }
  }
  return streak
}

export const calcBestStreak = (completions, schedule = [0,1,2,3,4,5,6]) => {
  if (!completions || completions.length === 0) return 0
  const valid = completions
    .filter((c) => c.completed_date)
    .reduce((acc, c) => {
      const k = c.completed_date
      if (!acc[k] || (c.is_day_off && !acc[k].is_day_off)) acc[k] = c
      return acc
    }, {})

  const keys = Object.keys(valid).sort()
  if (keys.length === 0) return 0
  let best = 0
  let run = 0
  let prev = null

  for (const k of keys) {
    const cur = parseISO(k)
    if (!prev) {
      run = 1
    } else {
      // walk forward counting scheduled days between
      const days = differenceInCalendarDays(cur, prev)
      let scheduledInBetween = 0
      for (let i = 1; i < days; i++) {
        const d = new Date(prev)
        d.setDate(d.getDate() + i)
        if (schedule.includes(d.getDay())) scheduledInBetween += 1
      }
      if (scheduledInBetween === 0 && days === 1) {
        run += 1
      } else if (scheduledInBetween > 0) {
        // check that every scheduled day in between had an entry
        let ok = true
        for (let i = 1; i < days; i++) {
          const d = new Date(prev)
          d.setDate(d.getDate() + i)
          const dk = format(d, 'yyyy-MM-dd')
          if (schedule.includes(d.getDay()) && !valid[dk]) { ok = false; break }
        }
        run = ok ? run + scheduledInBetween + 1 : 1
      } else {
        run = 1
      }
    }
    best = Math.max(best, run)
    prev = cur
  }
  return best
}

export const isDayScheduled = (date, schedule) => {
  if (!schedule || schedule.length === 0) return true
  return schedule.includes(new Date(date).getDay())
}
