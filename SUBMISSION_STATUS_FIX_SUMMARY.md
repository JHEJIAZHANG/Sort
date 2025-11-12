# 作業繳交狀態修復總結

## 修復內容

### 1. 增強前端日誌輸出

#### 修改的檔案
- `coursemanagement/components/teacher-assignment-detail.tsx`
- `coursemanagement/components/teacher-course-detail.tsx`

#### 修改內容
在以下函數中添加了詳細的 console.log 輸出：

1. **teacher-assignment-detail.tsx**
   - `useEffect` (載入作業繳交狀態) - 追蹤 API 呼叫和資料解析的每一步
   - `handleRemindAll` - 追蹤提醒流程

2. **teacher-course-detail.tsx**
   - `handleRemindUnsubmitted` - 追蹤提醒流程

### 2. 日誌輸出內容

#### 載入作業繳交狀態
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

#### 提醒未繳交學生
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

## 使用方法

### 1. 打開瀏覽器開發者工具
- Chrome/Edge: 按 F12 或右鍵 -> 檢查
- 切換到 Console 標籤

### 2. 測試作業詳情頁面
1. 進入任一課程的作業詳情頁面
2. 查看 Console 中的日誌
3. 確認 API 回應格式是否正確

### 3. 測試提醒功能
1. 點擊「提醒未繳交」按鈕
2. 查看 Console 中的日誌
3. 確認是否正確提取學生 ID

## 預期的 API 回應格式

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

## 常見問題

### 問題 1: 學生列表為空
**症狀:** 統計數字正確但學生列表為空

**可能原因:**
1. API 回應中缺少 `unsubmitted_students` 或 `submitted_students` 欄位
2. 欄位不是陣列格式
3. 後端沒有正確解析學生資料

**解決方法:**
1. 查看 Console 中的 API 回應
2. 確認 `first.unsubmitted_students` 和 `first.submitted_students` 是否存在
3. 檢查後端日誌

### 問題 2: 提醒功能顯示「沒有未繳交學生」
**症狀:** 明明有未繳交學生但無法提醒

**可能原因:**
1. 學生資料中缺少 `userId` 欄位
2. `userId` 為空字串或 null
3. 後端沒有正確提取學生 ID

**解決方法:**
1. 查看 Console 中的「未繳交學生原始資料」
2. 確認每個學生都有 `userId` 欄位
3. 檢查後端的資料映射邏輯

## 相關文件

- `DEBUG_SUBMISSION_STATUS.md` - 詳細的調試指南
- `TEST_SUBMISSION_API.md` - API 測試腳本

## 下一步

如果問題仍然存在，請：
1. 執行 `TEST_SUBMISSION_API.md` 中的測試腳本
2. 收集 Console 中的完整日誌
3. 檢查後端日誌
4. 提供以上資訊以便進一步診斷
