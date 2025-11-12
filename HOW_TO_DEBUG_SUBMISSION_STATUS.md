# 如何調試作業繳交狀態顯示問題

## 問題描述
作業詳情頁面中，學生繳交狀態列表為空，沒有顯示已繳交和未繳交的學生。

## 已添加的調試功能

### 1. 詳細的 Console 日誌
在以下位置添加了詳細的日誌輸出：
- `ApiService.getAssignmentSubmissionStatus` - API 請求和回應
- `TeacherAssignmentDetail` useEffect - 資料載入和解析過程

### 2. 測試組件
創建了 `test-submission-status.tsx` 測試組件，可以獨立測試 API。

## 調試步驟

### 步驟 1: 打開開發者工具
1. 在瀏覽器中按 F12
2. 切換到 Console 標籤
3. 清空現有日誌（點擊 🚫 圖標）

### 步驟 2: 進入作業詳情頁面
1. 導航到任一課程的作業詳情頁面
2. 觀察 Console 中的日誌輸出

### 步驟 3: 檢查日誌輸出

你應該會看到以下日誌序列：

```
[TeacherAssignmentDetail] 開始載入作業繳交狀態... { courseId: "...", assignmentId: "..." }
[ApiService] getAssignmentSubmissionStatus 開始 { courseId: "...", assignmentId: "..." }
[ApiService] 使用的 line_user_id: "..."
[ApiService] 請求 payload: { ... }
[API] Making request to: /api/classroom/submissions/status/
[ApiService] API 回應結果: { ... }
[TeacherAssignmentDetail] API 完整回應: { ... }
[TeacherAssignmentDetail] data: { ... }
[TeacherAssignmentDetail] results 陣列長度: X
[TeacherAssignmentDetail] results: [ ... ]
[TeacherAssignmentDetail] first result: { ... }
[TeacherAssignmentDetail] 找到第一筆結果
[TeacherAssignmentDetail] 角色: "teacher"
[TeacherAssignmentDetail] 統計資料: { ... }
[TeacherAssignmentDetail] 未繳交學生數: X
[TeacherAssignmentDetail] 未繳交學生: [ ... ]
[TeacherAssignmentDetail] 已繳交學生數: Y
[TeacherAssignmentDetail] 已繳交學生: [ ... ]
[TeacherAssignmentDetail] 合併後的學生列表 (長度): Z
[TeacherAssignmentDetail] 合併後的學生列表: [ ... ]
[TeacherAssignmentDetail] 設定統計資料: { ... }
[TeacherAssignmentDetail] 設定學生列表，數量: Z
```

### 步驟 4: 診斷問題

根據日誌輸出，找出問題所在：

#### 情況 1: API 回應錯誤
**症狀：** 看到 `[TeacherAssignmentDetail] API 錯誤: ...`

**可能原因：**
- 後端 API 返回錯誤
- 課程 ID 或作業 ID 不正確
- 用戶沒有權限

**解決方法：**
1. 檢查錯誤訊息
2. 確認課程 ID 和作業 ID 是否正確
3. 檢查後端日誌

#### 情況 2: results 陣列為空
**症狀：** `[TeacherAssignmentDetail] results 陣列長度: 0`

**可能原因：**
- 後端沒有返回資料
- 課程或作業不存在
- Google Classroom API 查詢失敗

**解決方法：**
1. 檢查 `[TeacherAssignmentDetail] data:` 的完整內容
2. 查看後端日誌
3. 確認 Google Classroom 連接狀態

#### 情況 3: 沒有找到第一筆結果
**症狀：** `[TeacherAssignmentDetail] 沒有找到第一筆結果`

**可能原因：**
- results 陣列為空
- 資料格式不正確

**解決方法：**
1. 檢查 `[TeacherAssignmentDetail] results:` 的內容
2. 確認後端回應格式

#### 情況 4: 學生列表為空
**症狀：** 
- `[TeacherAssignmentDetail] 未繳交學生數: 0`
- `[TeacherAssignmentDetail] 已繳交學生數: 0`
- 但統計資料顯示有學生

**可能原因：**
- `unsubmitted_students` 或 `submitted_students` 欄位不存在
- 欄位不是陣列格式
- 後端沒有正確填充學生資料

**解決方法：**
1. 檢查 `[TeacherAssignmentDetail] first result:` 的完整內容
2. 確認是否有 `unsubmitted_students` 和 `submitted_students` 欄位
3. 檢查後端的資料映射邏輯

#### 情況 5: 學生資料缺少必要欄位
**症狀：** 學生列表有資料但顯示「未知學生」

**可能原因：**
- 學生資料缺少 `name`、`userId` 或 `emailAddress` 欄位

**解決方法：**
1. 檢查 `[TeacherAssignmentDetail] 未繳交學生:` 和 `[TeacherAssignmentDetail] 已繳交學生:` 的內容
2. 確認每個學生物件都有必要欄位
3. 檢查後端的學生資料提取邏輯

## 使用測試組件

如果你想獨立測試 API，可以使用測試組件：

### 1. 在頁面中引入測試組件

```tsx
import { TestSubmissionStatus } from "@/components/test-submission-status"

// 在頁面中使用
<TestSubmissionStatus />
```

### 2. 填寫測試資料
- LINE User ID: 你的教師帳號 LINE User ID
- 課程 ID: 要測試的課程 ID
- 作業 ID: 要測試的作業 ID

### 3. 點擊「測試 API」
查看頁面上的結果和 Console 中的詳細日誌。

## 預期的 API 回應格式

正確的 API 回應應該是：

```json
{
  "data": {
    "query_mode": "batch",
    "total_queries": 1,
    "successful_queries": 1,
    "results": [
      {
        "course_id": "123",
        "coursework_id": "456",
        "course_name": "課程名稱",
        "homework_title": "作業標題",
        "role": "teacher",
        "statistics": {
          "total_students": 10,
          "submitted": 5,
          "unsubmitted": 5,
          "completion_rate": 50.0,
          "status_counts": {
            "TURNED_IN": 3,
            "RETURNED": 2,
            "CREATED": 4,
            "NEW": 1
          }
        },
        "unsubmitted_students": [
          {
            "name": "學生1",
            "userId": "student1_id",
            "emailAddress": "student1@example.com"
          }
        ],
        "submitted_students": [
          {
            "name": "學生2",
            "userId": "student2_id",
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

## 檢查後端

如果前端日誌顯示 API 回應有問題，需要檢查後端：

### 1. 檢查後端日誌
```bash
# Django 開發伺服器
tail -f /path/to/django/logs/debug.log

# 或 Docker 容器
docker logs -f <container_name>
```

### 2. 查找關鍵字
- `get_submissions_status`
- `Google Classroom API`
- `unsubmitted_students`
- `submitted_students`

### 3. 檢查 Google Classroom API 回應
確認後端是否成功查詢 Google Classroom API，以及回應格式是否正確。

## 常見解決方案

### 解決方案 1: 後端沒有正確設定 role
如果 `first.role` 不是 "teacher"，前端現在會忽略角色檢查，直接嘗試解析資料。

### 解決方案 2: 學生列表欄位名稱不一致
確認後端使用的欄位名稱：
- `unsubmitted_students` (不是 `unsubmittedStudents`)
- `submitted_students` (不是 `submittedStudents`)

### 解決方案 3: 學生資料缺少必要欄位
確認每個學生物件都有：
- `userId` (不是 `user_id` 或 `id`)
- `name` (不是 `fullName` 或 `displayName`)
- `emailAddress` (不是 `email`)

## 需要幫助？

如果問題仍然存在，請提供：
1. Console 中的完整日誌（從 `[TeacherAssignmentDetail] 開始載入...` 到最後）
2. Network 標籤中的 API 請求和回應
3. 後端日誌（如果可以訪問）

將這些資訊提供給開發團隊以便進一步診斷。
