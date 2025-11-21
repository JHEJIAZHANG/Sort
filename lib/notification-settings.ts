export interface UserNotificationSettings {
  assignmentReminders: boolean
  examReminders: boolean
  assignmentReminderTiming: string
  examReminderTiming: string
  lineNotifications: boolean
  browserNotifications: boolean
  doNotDisturbEnabled: boolean
  doNotDisturbStart: string
  doNotDisturbEnd: string
}

export const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  assignmentReminders: true,
  examReminders: true,
  assignmentReminderTiming: "1week",
  examReminderTiming: "1week",
  lineNotifications: true,
  browserNotifications: true,
  doNotDisturbEnabled: false,
  doNotDisturbStart: "22:00",
  doNotDisturbEnd: "08:00",
}

export const mapNotificationSettingsFromApi = (data: any): UserNotificationSettings => ({
  assignmentReminders: typeof data?.assignmentReminders === "boolean" ? data.assignmentReminders : DEFAULT_NOTIFICATION_SETTINGS.assignmentReminders,
  examReminders: typeof data?.examReminders === "boolean" ? data.examReminders : DEFAULT_NOTIFICATION_SETTINGS.examReminders,
  assignmentReminderTiming: typeof data?.assignmentReminderTiming === "string" && data.assignmentReminderTiming.trim()
    ? data.assignmentReminderTiming
    : DEFAULT_NOTIFICATION_SETTINGS.assignmentReminderTiming,
  examReminderTiming: typeof data?.examReminderTiming === "string" && data.examReminderTiming.trim()
    ? data.examReminderTiming
    : DEFAULT_NOTIFICATION_SETTINGS.examReminderTiming,
  lineNotifications: typeof data?.lineNotifications === "boolean" ? data.lineNotifications : DEFAULT_NOTIFICATION_SETTINGS.lineNotifications,
  browserNotifications: typeof data?.browserNotifications === "boolean" ? data.browserNotifications : DEFAULT_NOTIFICATION_SETTINGS.browserNotifications,
  doNotDisturbEnabled: typeof data?.doNotDisturbEnabled === "boolean" ? data.doNotDisturbEnabled : DEFAULT_NOTIFICATION_SETTINGS.doNotDisturbEnabled,
  doNotDisturbStart: typeof data?.doNotDisturbStart === "string" && data.doNotDisturbStart ? data.doNotDisturbStart : DEFAULT_NOTIFICATION_SETTINGS.doNotDisturbStart,
  doNotDisturbEnd: typeof data?.doNotDisturbEnd === "string" && data.doNotDisturbEnd ? data.doNotDisturbEnd : DEFAULT_NOTIFICATION_SETTINGS.doNotDisturbEnd,
})

export const mapNotificationSettingsToApi = (settings: UserNotificationSettings) => ({
  assignment_reminders: settings.assignmentReminders,
  exam_reminders: settings.examReminders,
  assignment_reminder_timing: settings.assignmentReminderTiming,
  exam_reminder_timing: settings.examReminderTiming,
  line_notifications: settings.lineNotifications,
  browser_notifications: settings.browserNotifications,
  do_not_disturb_enabled: settings.doNotDisturbEnabled,
  do_not_disturb_start: settings.doNotDisturbStart || null,
  do_not_disturb_end: settings.doNotDisturbEnd || null,
})

