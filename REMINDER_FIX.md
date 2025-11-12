# 作業提醒功能修復

## 問題描述

在作業詳情頁面中，點擊「提醒未繳交」按鈕時，系統顯示「目前沒有未繳交學生」，但實際上有未繳交的學生。

## 問題原因

前端在調用提醒 API 之前，會先調用 `getAssignmentSubmissionStatus` 來獲取未繳交學生名單，然後提取學生 ID 傳遞給後端。但這個流程存在以下問題：

1. **多餘的 API 調用**：前端先查詢一次未繳交學生，然後再傳遞給後端，而後端會再次查詢
2. **數據不一致**：前端查詢的結果可能與後端查詢的結果不一致（時間差）
3. **複雜的錯誤處理**：如果前端查詢失敗，整個提醒流程就會中斷

## 解決方案

### 1. 簡化前端邏輯

修改 `handleRemindAll` 函數，不再預先查詢未繳交學生名單，直接調用提醒 API：

```typescript
const handleRemindAll = async () => {
  try {
    setReminding(true)
    console.log('[Reminder] 開始提醒所有未繳交學生...')
    
    // 不傳遞 student_ids 參數，讓後端自動查詢所有未繳交學生
    const resp = await ApiService.sendAssignmentReminder(assignment.courseId, assignment.id)
    
    // 檢查後端回應
    if (data?.total_students === 0) {
      alert("目前沒有未繳交學生可提醒")
      return
    }
    
    // 顯示成功訊息
    const totalNotified = (data?.line_notified || 0) + (data?.email_notified || 0)
    alert(`已成功發送提醒給 ${totalNotified} 位未繳交的學生`)
  } catch (error) {
    console.error("[Reminder] 提醒未繳交學生失敗:", error)
    alert(`提醒失敗：${error instanceof Error ? error.message : '請稍後重試'}`)
  } finally {
    setReminding(false)
  }
}
```

### 2. 優化 API 調用

修改 `sendAssignmentReminder` 方法，使 `student_ids` 參數真正可選：

```typescript
static async sendAssignmentReminder(courseId: string, assignmentId: string, studentIds?: string[]) {
  const payload: any = {
    line_user_id: this.lineUserId,
    course_id: String(courseId),
    coursework_id: String(assignmentId)
  }
  // 只有在提供 studentIds 時才加入參數
  if (studentIds && studentIds.length > 0) {
    payload.student_ids = studentIds
  }
  return this.request('/teacher/assignments/reminder/', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
```

## 後端邏輯

後端 `teacher_send_assignment_reminder` 函數的邏輯：

1. 從 Google Classroom API 獲取作業的所有提交狀態
2. 篩選出狀態為 `NEW`、`CREATED` 或 `RECLAIMED_BY_STUDENT` 的學生（未繳交）
3. 如果前端提供了 `student_ids`，則只提醒指定的學生
4. 如果沒有提供 `student_ids`，則提醒所有未繳交的學生
5. 對每個學生：
   - 優先發送 LINE 通知（如果學生有綁定 LINE）
   - 如果 LINE 失敗或沒有綁定，發送 Email 通知
6. 返回提醒結果統計

## 測試建議

1. **測試場景 1**：有未繳交學生時點擊「提醒未繳交」
   - 預期：顯示成功訊息，包含提醒的學生數量
   
2. **測試場景 2**：所有學生都已繳交時點擊「提醒未繳交」
   - 預期：顯示「目前沒有未繳交學生可提醒」
   
3. **測試場景 3**：選擇特定學生後點擊「提醒選定學生」
   - 預期：只提醒選定的學生

4. **測試場景 4**：部分學生有 LINE，部分沒有
   - 預期：有 LINE 的收到 LINE 通知，沒有的收到 Email

## 相關文件

- 前端組件：`coursemanagement/components/teacher-assignment-detail.tsx`
- API 服務：`coursemanagement/services/apiService.ts`
- 後端視圖：`ntub v2 2/ntub v2/classroomai/course/views.py` (line 3815)
- API 路由：`ntub v2 2/ntub v2/classroomai/api_v2/urls.py`
