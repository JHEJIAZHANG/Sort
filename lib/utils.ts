import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Reminder timing display text
export function getReminderTimingText(timing: string): string {
  switch (timing) {
    case '15min':
      return '15分鐘前'
    case '30min':
      return '30分鐘前'
    case '1hour':
      return '1小時前'
    case '2hours':
      return '2小時前'
    case '1day':
      return '1天前'
    case '2days':
      return '2天前'
    case '1week':
      return '1週前'
    case 'default':
      return '使用統一設定'
    default:
      return '1週前'
  }
}

// Calculate notification time based on reminder timing
export function calculateNotificationTime(baseDate: Date, reminderTiming: string): Date {
  const notificationTime = new Date(baseDate)

  switch (reminderTiming) {
    case '15min':
      notificationTime.setMinutes(notificationTime.getMinutes() - 15)
      break
    case '30min':
      notificationTime.setMinutes(notificationTime.getMinutes() - 30)
      break
    case '1hour':
      notificationTime.setHours(notificationTime.getHours() - 1)
      break
    case '2hours':
      notificationTime.setHours(notificationTime.getHours() - 2)
      break
    case '1day':
      notificationTime.setDate(notificationTime.getDate() - 1)
      break
    case '2days':
      notificationTime.setDate(notificationTime.getDate() - 2)
      break
    case '1week':
      notificationTime.setDate(notificationTime.getDate() - 7)
      break
    default:
      // Default to 1 week prior per latest spec
      notificationTime.setDate(notificationTime.getDate() - 7)
      break
  }

  return notificationTime
}
