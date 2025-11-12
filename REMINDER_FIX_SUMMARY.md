# 作業提醒功能修復總結

## 問題描述
作業詳情頁面的「提醒未繳交」按鈕一直顯示「目前沒有未繳交學生」，但實際上有未繳交的學生。

## 根本原因
1. **後端函數缺失**：`teacher_send_assignment_reminder` 函數在 `views.py` 中未實現
2. **API 路徑不匹配**：
   - 前端調用：`/api/v2/teacher/assignments/reminder/`
   - 後端路由：`/api/classroom/teacher/send-assignment-reminder/`

## 修復內容

### 1. 後端修復

#### 新增 `teacher_send_assignment_reminder` 函數
位置：`ntub v2 2/ntub v2/classroomai/course/views.py`

功能：
- 驗證教師身份
- 獲取未繳交學生列表（如果未指定 student_ids）
- 發送 LINE 提醒給已綁定的學生
- 記錄 Email 提醒失敗（Email 功能待實現）
- 返回提醒結果統計

#### 新增路由別名
位置：`ntub v2 2/ntub v2/classroomai/course/urls.py`

```python
path("api/teacher/assignments/reminder/", teacher_send_assignment_reminder, name="teacher_send_assignment_reminder_alias"),
```

### 2. 前端修復

#### 修正 API 調用
位置：`coursemanagement/services/apiService.ts`

修改 `sendAssignmentReminder` 方法，添加 `'other'` 參數以使用正確的 API 前綴：

```typescript
static async sendAssignmentReminder(courseId: string, assignmentId: string, studentIds?: string[]) {
  if (!this.lineUserId) {
    this.bootstrapLineUserId()
  }
  return this.request('/teacher/assignments/reminder/', {
    method: 'POST',
    body: JSON.stringify({
      line_user_id: this.lineUserId,
      course_id: String(courseId),
      coursework_id: String(assignmentId),
      student_ids: studentIds
    })
  }, 'other')  // 添加此參數
}
```

## 功能流程

### 提醒所有未繳交學生
1. 前端調用 `getAssignmentSubmissionStatus` 獲取作業繳交狀態
2. 從返回的 `unsubmitted_students` 中提取 `userId`
3. 調用 `sendAssignmentReminder` 發送提醒
4. 後端驗證教師身份
5. 查找學生的 LINE 帳號並發送提醒
6. 返回提醒結果

### 提醒選定學生
1. 用戶在前端勾選未繳交的學生
2. 前端收集選定學生的 ID
3. 調用 `sendAssignmentReminder` 並傳入 student_ids
4. 後端直接對指定學生發送提醒

## 數據流

```
前端 (teacher-assignment-detail.tsx)
  ↓
  調用 ApiService.getAssignmentSubmissionStatus()
  ↓
後端 (/api/classroom/submissions/status/)
  ↓
  返回 { results: [{ unsubmitted_students: [...] }] }
  ↓
前端提取 userId
  ↓
  調用 ApiService.sendAssignmentReminder(courseId, assignmentId, studentIds)
  ↓
後端 (/api/teacher/assignments/reminder/)
  ↓
  驗證教師身份
  ↓
  獲取學生資訊
  ↓
  查找 LINE 帳號
  ↓
  發送 LINE 提醒
  ↓
  返回結果統計
```

## 注意事項

1. **LINE 綁定**：只有綁定了 LINE 帳號的學生才能收到提醒
2. **Email 功能**：目前 Email 提醒功能尚未實現，未綁定 LINE 的學生會被記錄為失敗
3. **權限驗證**：後端會驗證調用者是否為課程教師
4. **錯誤處理**：前端和後端都有完整的錯誤處理和日誌記錄

## 測試建議

1. 測試提醒所有未繳交學生
2. 測試提醒選定的學生
3. 測試沒有未繳交學生的情況
4. 測試非教師用戶的權限驗證
5. 測試學生未綁定 LINE 的情況

## 後續改進

1. 實現 Email 提醒功能
2. 添加提醒歷史記錄
3. 支持自定義提醒訊息
4. 添加提醒頻率限制（避免騷擾）
