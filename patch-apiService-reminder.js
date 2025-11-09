const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, 'services/apiService.ts');
let src = fs.readFileSync(filePath, 'utf8');
let updated = src;

// createAssignment: insert mapping after course_id conversion and before status default
updated = updated.replace(
  /delete payload\.course\n\s*}\n\s*\/\/ 確保 status 有默認值/, 
  match => {
    const mapping = `delete payload.course\n    }\n    // 映射提醒欄位：customReminderTiming -> custom_reminder_timing；notificationTime -> notification_time\n    if (Object.prototype.hasOwnProperty.call(payload, 'customReminderTiming') && payload.customReminderTiming !== undefined) {\n      payload.custom_reminder_timing = payload.customReminderTiming\n      delete payload.customReminderTiming\n    }\n    if (Object.prototype.hasOwnProperty.call(payload, 'notificationTime') && payload.notificationTime !== undefined) {\n      payload.notification_time = payload.notificationTime\n      delete payload.notificationTime\n    }\n    // 確保 status 有默認值`;
    return mapping;
  }
);

// updateAssignment: insert mapping after course_id conversion and before request
updated = updated.replace(
  /delete payload\.course\n\s*}\n\s*const resp/, 
  match => {
    const mapping = `delete payload.course\n    }\n    // 映射提醒欄位：customReminderTiming -> custom_reminder_timing；notificationTime -> notification_time\n    if (Object.prototype.hasOwnProperty.call(payload, 'customReminderTiming') && payload.customReminderTiming !== undefined) {\n      payload.custom_reminder_timing = payload.customReminderTiming\n      delete payload.customReminderTiming\n    }\n    if (Object.prototype.hasOwnProperty.call(payload, 'notificationTime') && payload.notificationTime !== undefined) {\n      payload.notification_time = payload.notificationTime\n      delete payload.notificationTime\n    }\n    const resp`;
    return mapping;
  }
);

// createExam: replace body to include mapping
updated = updated.replace(
  /static async createExam\(data: any\) \{[\s\S]*?\n\s*}\n\n\s*static async updateExam/,
  segment => {
    const replaced = `static async createExam(data: any) {\n    const payload: any = { ...data }\n    if (Object.prototype.hasOwnProperty.call(payload, 'customReminderTiming') && payload.customReminderTiming !== undefined) {\n      payload.custom_reminder_timing = payload.customReminderTiming\n      delete payload.customReminderTiming\n    }\n    if (Object.prototype.hasOwnProperty.call(payload, 'notificationTime') && payload.notificationTime !== undefined) {\n      payload.notification_time = payload.notificationTime\n      delete payload.notificationTime\n    }\n    return this.request('/exams/', {\n      method: 'POST',\n      body: JSON.stringify(payload)\n    })\n  }\n\n  static async updateExam`;
    return replaced;
  }
);

// updateExam: replace body to include mapping
updated = updated.replace(
  /static async updateExam\(examId: string, data: any\) \{[\s\S]*?\n\s*}\n\n\s*static async updateExamStatus/,
  segment => {
    const replaced = `static async updateExam(examId: string, data: any) {\n    const payload: any = { ...data }\n    if (Object.prototype.hasOwnProperty.call(payload, 'customReminderTiming') && payload.customReminderTiming !== undefined) {\n      payload.custom_reminder_timing = payload.customReminderTiming\n      delete payload.customReminderTiming\n    }\n    if (Object.prototype.hasOwnProperty.call(payload, 'notificationTime') && payload.notificationTime !== undefined) {\n      payload.notification_time = payload.notificationTime\n      delete payload.notificationTime\n    }\n    return this.request(\`/exams/${examId}/\`, {\n      method: 'PATCH',\n      body: JSON.stringify(payload)\n    })\n  }\n\n  static async updateExamStatus`;
    return replaced;
  }
);

if (updated === src) {
  console.error('No changes applied. Patterns not matched.');
  process.exit(2);
}
fs.writeFileSync(filePath, updated);
console.log('apiService.ts updated with reminder field mappings.');
