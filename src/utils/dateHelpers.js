import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subDays, parseISO, isSameDay, addDays, differenceInCalendarDays } from 'date-fns'

export const todayISO = () => format(new Date(), 'yyyy-MM-dd')

export const formatDate = (d, fmt = 'EEE, MMM d') => {
  const date = typeof d === 'string' ? parseISO(d) : d
  return format(date, fmt)
}

export const formatTime = (time) => {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 || 12
  return `${display}:${m} ${ampm}`
}

export const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export const weekDays = (date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 0 })
  return eachDayOfInterval({ start, end: addDays(start, 6) })
}

export const monthDays = (date = new Date()) => {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return eachDayOfInterval({ start, end })
}

export const lastNDays = (n) => {
  return eachDayOfInterval({ start: subDays(new Date(), n - 1), end: new Date() })
}

export const isToday = (d) => isSameDay(typeof d === 'string' ? parseISO(d) : d, new Date())

export const isFuture = (d) => {
  const date = typeof d === 'string' ? parseISO(d) : d
  return differenceInCalendarDays(date, new Date()) > 0
}

export const dayOfWeek = (d = new Date()) => {
  const date = typeof d === 'string' ? parseISO(d) : d
  return date.getDay()
}

export const dateKey = (d) => format(typeof d === 'string' ? parseISO(d) : d, 'yyyy-MM-dd')

export const weekRange = (date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 0 })
  const end = endOfWeek(date, { weekStartsOn: 0 })
  return { start, end }
}
