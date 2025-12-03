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
  assignmentReminders: settings.assignmentReminders,
  examReminders: settings.examReminders,
  assignmentReminderTiming: settings.assignmentReminderTiming,
  examReminderTiming: settings.examReminderTiming,
  lineNotifications: settings.lineNotifications,
  browserNotifications: settings.browserNotifications,
  doNotDisturbEnabled: settings.doNotDisturbEnabled,
  doNotDisturbStart: settings.doNotDisturbStart || null,
  doNotDisturbEnd: settings.doNotDisturbEnd || null,
})

