/**
 * Taiwan timezone utility functions
 * All date operations should use these functions to ensure consistent Taiwan timezone (UTC+8) handling
 */

/**
 * Get current Taiwan time
 */
export function getTaiwanTime(): Date {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const taiwanTime = new Date(utc + 8 * 3600000) // UTC+8 for Taiwan
  return taiwanTime
}

/**
 * Convert any date to Taiwan timezone
 */
export function toTaiwanTime(date: Date): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000
  const taiwanTime = new Date(utc + 8 * 3600000) // UTC+8 for Taiwan
  return taiwanTime
}

/**
 * Check if two dates are the same day in Taiwan timezone
 */
export function isSameDayTaiwan(date1: Date, date2: Date): boolean {
  const taiwan1 = toTaiwanTime(date1)
  const taiwan2 = toTaiwanTime(date2)

  return (
    taiwan1.getFullYear() === taiwan2.getFullYear() &&
    taiwan1.getMonth() === taiwan2.getMonth() &&
    taiwan1.getDate() === taiwan2.getDate()
  )
}

/**
 * Get days difference in Taiwan timezone
 */
export function getDaysDifferenceTaiwan(date1: Date, date2: Date): number {
  const taiwan1 = toTaiwanTime(date1)
  const taiwan2 = toTaiwanTime(date2)

  // Reset time to start of day for accurate day comparison
  const day1 = new Date(taiwan1.getFullYear(), taiwan1.getMonth(), taiwan1.getDate())
  const day2 = new Date(taiwan2.getFullYear(), taiwan2.getMonth(), taiwan2.getDate())

  return Math.ceil((day2.getTime() - day1.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Check if date is today in Taiwan timezone
 */
export function isTodayTaiwan(date: Date): boolean {
  return isSameDayTaiwan(date, new Date())
}

/**
 * Check if date is tomorrow in Taiwan timezone
 */
export function isTomorrowTaiwan(date: Date): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return isSameDayTaiwan(date, tomorrow)
}

/**
 * Calculate exam end time (exam start time + duration in minutes)
 */
export function getExamEndTime(examDate: Date, durationMinutes: number): Date {
  const endTime = new Date(examDate)
  endTime.setMinutes(endTime.getMinutes() + durationMinutes)
  return endTime
}

/**
 * Check if exam has ended in Taiwan timezone
 */
export function isExamEndedTaiwan(examDate: Date, durationMinutes: number): boolean {
  const nowTaiwan = getTaiwanTime()
  const examStartTaiwan = toTaiwanTime(examDate)

  // Calculate exam end time in Taiwan timezone
  const examEndTime = new Date(examStartTaiwan.getTime() + durationMinutes * 60000)

  // Use millisecond comparison for precise time checking
  const nowMs = nowTaiwan.getTime()
  const examEndMs = examEndTime.getTime()

  console.log("[v0] Exam deadline check:", {
    nowTaiwan: nowTaiwan.toISOString(),
    examStartTaiwan: examStartTaiwan.toISOString(),
    examEndTime: examEndTime.toISOString(),
    durationMinutes,
    isEnded: nowMs > examEndMs,
  })

  return nowMs > examEndMs
}

/**
 * Get days difference to exam end time in Taiwan timezone
 */
export function getDaysToExamEndTaiwan(examDate: Date, durationMinutes: number): number {
  const examEndTime = getExamEndTime(examDate, durationMinutes)
  const nowTaiwan = getTaiwanTime()
  return getDaysDifferenceTaiwan(nowTaiwan, examEndTime)
}

/**
 * Get exam due time display text (similar to assignment due time)
 */
export function getExamDueTimeText(examDate: Date, durationMinutes: number): string {
  const examEndTime = getExamEndTime(examDate, durationMinutes)
  const daysToEnd = getDaysToExamEndTaiwan(examDate, durationMinutes)

  if (daysToEnd < 0) return "已結束"
  if (isTodayTaiwan(examEndTime)) return "今天結束"
  if (isTomorrowTaiwan(examEndTime)) return "明天結束"
  return `${daysToEnd}天後結束`
}
