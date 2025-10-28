const fs = require('fs');
const path = 'services/apiService.ts';
let s = fs.readFileSync(path, 'utf8');
// createAssignment mapping after payload creation
s = s.replace(
  /const payload: any = \{ line_user_id: this.lineUserId, \.\.\.data \}/,
  (match) => match + `\n    // 統一提醒鍵名：camelCase -> snake_case\n    if (typeof payload.customReminderTiming !== 'undefined') {\n      payload.custom_reminder_timing = payload.customReminderTiming\n      delete payload.customReminderTiming\n    }\n    if (typeof payload.notificationTime !== 'undefined') {\n      payload.notification_time = payload.notificationTime\n      delete payload.notificationTime\n    }`
);
// updateAssignment mapping after payload creation
s = s.replace(
  /const payload: any = \{ line_user_id: this.lineUserId, assignment_id: assignmentId, \.\.\.data \}/,
  (match) => match + `\n    // 統一提醒鍵名：camelCase -> snake_case\n    if (typeof payload.customReminderTiming !== 'undefined') {\n      payload.custom_reminder_timing = payload.customReminderTiming\n      delete payload.customReminderTiming\n    }\n    if (typeof payload.notificationTime !== 'undefined') {\n      payload.notification_time = payload.notificationTime\n      delete payload.notificationTime\n    }`
);
// createExam mapping: rewrite function body
s = s.replace(
  /static async createExam\(data: any\) \{[\s\S]*?\n\s*return this.request\('\/exams\/', \{[\s\S]*?JSON\.stringify\(data\)[\s\S]*?\}\)[\s\S]*?\n\s*\}/,
  () => `  static async createExam(data: any) {\n    // 統一提醒鍵名：camelCase -> snake_case\n    const payload: any = { ...data }\n    if (typeof payload.customReminderTiming !== 'undefined') {\n      payload.custom_reminder_timing = payload.customReminderTiming\n      delete payload.customReminderTiming\n    }\n    if (typeof payload.notificationTime !== 'undefined') {\n      payload.notification_time = payload.notificationTime\n      delete payload.notificationTime\n    }\n    return this.request('/exams/', {\n      method: 'POST',\n      body: JSON.stringify(payload)\n    })\n  }`
);
// updateExam mapping: rewrite function body
s = s.replace(
  /static async updateExam\(examId: string, data: any\) \{[\s\S]*?\n\s*return this.request\(`/exams/\$\{examId\}/`, \{[\s\S]*?JSON\.stringify\(data\)[\s\S]*?\}\)[\s\S]*?\n\s*\}/,
  () => `  static async updateExam(examId: string, data: any) {\n    // 統一提醒鍵名：camelCase -> snake_case\n    const payload: any = { ...data }\n    if (typeof payload.customReminderTiming !== 'undefined') {\n      payload.custom_reminder_timing = payload.customReminderTiming\n      delete payload.customReminderTiming\n    }\n    if (typeof payload.notificationTime !== 'undefined') {\n      payload.notification_time = payload.notificationTime\n      delete payload.notificationTime\n    }\n    return this.request(\`/exams/${examId}/\`, {\n      method: 'PATCH',\n      body: JSON.stringify(payload)\n    })\n  }`
);
fs.writeFileSync(path, s);
console.log('Patched', path);
