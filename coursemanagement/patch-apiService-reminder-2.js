const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, 'services/apiService.ts');
let src = fs.readFileSync(filePath, 'utf8');
let updated = src;

function insertBefore(str, marker, insertion) {
  const idx = str.indexOf(marker);
  if (idx === -1) return null;
  return str.slice(0, idx) + insertion + marker + str.slice(idx + marker.length);
}

// createAssignment: insert mapping before the status default comment
{
  const marker = '    // 確保 status 有默認值';
  const insertion = `    // 映射提醒欄位：customReminderTiming -> custom_reminder_timing；notificationTime -> notification_time\n    if (Object.prototype.hasOwnProperty.call(payload, 'customReminderTiming') && payload.customReminderTiming !== undefined) {\n      payload.custom_reminder_timing = payload.customReminderTiming\n      delete payload.customReminderTiming\n    }\n    if (Object.prototype.hasOwnProperty.call(payload, 'notificationTime') && payload.notificationTime !== undefined) {\n      payload.notification_time = payload.notificationTime\n      delete payload.notificationTime\n    }\n`;
  const res = insertBefore(updated, marker, insertion);
  if (res) updated = res; else console.warn('createAssignment marker not found');
}

// updateAssignment: insert mapping before the request call
{
  const marker = "    const resp = await this.request<any>('/web/assignments/update/', {";
  const insertion = `    // 映射提醒欄位：customReminderTiming -> custom_reminder_timing；notificationTime -> notification_time\n    if (Object.prototype.hasOwnProperty.call(payload, 'customReminderTiming') && payload.customReminderTiming !== undefined) {\n      payload.custom_reminder_timing = payload.customReminderTiming\n      delete payload.customReminderTiming\n    }\n    if (Object.prototype.hasOwnProperty.call(payload, 'notificationTime') && payload.notificationTime !== undefined) {\n      payload.notification_time = payload.notificationTime\n      delete payload.notificationTime\n    }\n`;
  const res = insertBefore(updated, marker, insertion);
  if (res) updated = res; else console.warn('updateAssignment marker not found');
}

// createExam: replace body
{
  const original = `static async createExam(data: any) {\n    return this.request('/exams/', {\n      method: 'POST',\n      body: JSON.stringify(data)\n    })\n  }`;
  const replacement = `static async createExam(data: any) {\n    const payload: any = { ...data }\n    if (Object.prototype.hasOwnProperty.call(payload, 'customReminderTiming') && payload.customReminderTiming !== undefined) {\n      payload.custom_reminder_timing = payload.customReminderTiming\n      delete payload.customReminderTiming\n    }\n    if (Object.prototype.hasOwnProperty.call(payload, 'notificationTime') && payload.notificationTime !== undefined) {\n      payload.notification_time = payload.notificationTime\n      delete payload.notificationTime\n    }\n    return this.request('/exams/', {\n      method: 'POST',\n      body: JSON.stringify(payload)\n    })\n  }`;
  if (updated.includes(original)) updated = updated.replace(original, replacement); else console.warn('createExam block not found');
}

// updateExam: replace body
{
  const original = `static async updateExam(examId: string, data: any) {\n    return this.request(\`/exams/${'examId'}\`/, {\n      method: 'PATCH',\n      body: JSON.stringify(data)\n    })\n  }`;
  // The above template literal trick won't match. Build explicit from file.
}
{
  const original = `static async updateExam(examId: string, data: any) {\n    return this.request(\`/exams/\${'examId'}\`/, {\n      method: 'PATCH',\n      body: JSON.stringify(data)\n    })\n  }`;
}
{
  // Fallback: match the simpler literal we saw in file
  const original2 = "static async updateExam(examId: string, data: any) {\n    return this.request(`/exams/${examId}/`, {\n      method: 'PATCH',\n      body: JSON.stringify(data)\n    })\n  }";
  const replacement2 = "static async updateExam(examId: string, data: any) {\n    const payload: any = { ...data }\n    if (Object.prototype.hasOwnProperty.call(payload, 'customReminderTiming') && payload.customReminderTiming !== undefined) {\n      payload.custom_reminder_timing = payload.customReminderTiming\n      delete payload.customReminderTiming\n    }\n    if (Object.prototype.hasOwnProperty.call(payload, 'notificationTime') && payload.notificationTime !== undefined) {\n      payload.notification_time = payload.notificationTime\n      delete payload.notificationTime\n    }\n    return this.request(`/exams/${examId}/`, {\n      method: 'PATCH',\n      body: JSON.stringify(payload)\n    })\n  }";
  if (updated.includes(original2)) updated = updated.replace(original2, replacement2); else console.warn('updateExam block not found');
}

if (updated === src) {
  console.error('No changes applied.');
  process.exit(2);
}
fs.writeFileSync(filePath, updated);
console.log('apiService.ts updated with reminder field mappings (v2).');
