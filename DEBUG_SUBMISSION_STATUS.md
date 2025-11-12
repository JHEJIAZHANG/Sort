# 作業繳交狀態調試指南

## 問題描述
1. 作業詳情頁面無法顯示已繳交和未繳交學生（列表為空）
2. 提醒未交作業功能顯示「目前沒有未交學生可以提醒」

## 已修復的內容

### 1. 增強日誌輸出
在以下組件中添加了詳細的 console.log：
- `teacher-assignment-detail.tsx` - 作業詳情頁面
- `teacher-course-detail.tsx` - 課程詳情頁面的提醒功能

### 2. 修改位置

#### teacher-assignment-detail.tsx
- **useEffect (載入作業繳交狀態)**: 添加了完整的日誌追蹤，從 API 呼叫到資料解析的每一步
- **handleRemindAll**: 添加了提醒流程的詳細日誌

#### teacher-course-detail.tsx
- **handleRemindUnsubmitted**: 添加了完整的日誌追蹤，包括 API 回應和資料解析

## 調試步驟

### 步驟 1: 打開瀏覽器開發者工具
1. 在 Chrome/Edge 中按 F12 或右鍵 -> 檢查
2. 切換到 Console 標籤

### 步驟 2: 測試作業詳情頁面
1. 進入任一課程的作業詳情頁面
2. 查看 Console 中的日誌，應該會看到：
   ```
   [TeacherAssignmentDetail] 開始載入作業繳交狀態...
   [TeacherAssignmentDetail] API 回應: {...}
   [TeacherAssignmentDetail] data: {...}
   [TeacherAssignmentDetail] results: [...]
   [TeacherAssignmentDetail] first result: {...}
   [TeacherAssignmentDetail] 統計資料: {...}
   [TeacherAssignmentDetail] 未繳交學生數: X
   [TeacherAssignmentDetail] 已繳交學生數: Y
   [TeacherAssignmentDetail] 合併後的學生列表: [...]
   ```

### 步驟 3: 檢查 API 回應格式
查看日誌中的 API 回應，確認格式是否符合預期：

**預期格式：**
```json
{
  "data": {
    "results": [
      {
        "course_id": "123",
        "coursework_id": "456",
        "role": "teacher",
        "statistics": {
          "total_students": 10,
          "submitted": 5,
          "unsubmitted": 5,
          "completion_rate": 50
        },
        "unsubmitted_students": [
          {
            "userId": "student1",
            "name": "學生1",
            "emailAddress": "student1@example.com"
          }
        ],
        "submitted_students": [
          {
            "userId": "student2",
            "name": "學生2",
            "emailAddress": "student2@example.com",
            "submittedAt": "2024-01-01T10:00:00Z",
            "isLate": false
          }
        ]
      }
    ]
  }
}
```

### 步驟 4: 測試提醒功能
1. 在課程詳情或作業詳情頁面點擊「提醒未繳交」按鈕
2. 查看 Console 中的日誌：
   ```
   [Reminder] 開始查詢未繳交學生名單...
   [Reminder] API 回應: {...}
   [Reminder] statusData: {...}
   [Reminder] results 陣列: [...]
   [Reminder] 第一筆結果: {...}
   [Reminder] 未繳交學生原始資料: [...]
   [Reminder] 提取的學生 ID: [...]
   [Reminder] 準備發送提醒給 X 位學生
   [Reminder] sendAssignmentReminder 回應: {...}
   ```

## 常見問題排查

### 問題 1: API 回應為空或格式不正確
**症狀：** Console 顯示 `results: []` 或 `first result: null`

**可能原因：**
1. 後端 API 沒有正確返回資料
2. 課程 ID 或作業 ID 不正確
3. 用戶沒有教師權限

**解決方法：**
1. 檢查 Network 標籤中的 API 請求
2. 確認請求 URL 和參數是否正確
3. 檢查後端日誌

### 問題 2: 學生列表為空但統計數字正確
**症狀：** `統計資料: { total_students: 10, ... }` 但 `未繳交學生數: 0` 和 `已繳交學生數: 0`

**可能原因：**
1. `unsubmitted_students` 或 `submitted_students` 欄位不存在
2. 欄位格式不正確（不是陣列）

**解決方法：**
檢查 API 回應中的 `first.unsubmitted_students` 和 `first.submitted_students` 是否存在且為陣列

### 問題 3: 提醒功能顯示「沒有未繳交學生」但實際有未繳交學生
**症狀：** 統計顯示有未繳交學生，但點擊提醒時顯示沒有

**可能原因：**
1. `unsubmitted_students` 陣列中的學生沒有 `userId` 欄位
2. `userId` 為空字串或 null

**解決方法：**
查看日誌中的「未繳交學生原始資料」和「提取的學生 ID」，確認資料格式

## 後端 API 檢查清單

如果前端日誌顯示 API 回應有問題，請檢查後端：

1. **API 端點**: `/api/classroom/submissions/status/`
2. **請求方法**: POST
3. **請求體**:
   ```json
   {
     "line_user_id": "U1234567890abcdef",
     "course_coursework_pairs": [
       {
         "course_id": "123",
         "coursework_id": "456"
       }
     ]
   }
   ```

4. **檢查後端日誌**:
   - 是否成功查詢 Google Classroom API
   - 是否正確解析學生名單
   - 是否正確分類已繳交和未繳交學生

## 聯絡資訊
如果問題仍然存在，請提供：
1. Console 中的完整日誌
2. Network 標籤中的 API 請求和回應
3. 後端日誌（如果可以訪問）
