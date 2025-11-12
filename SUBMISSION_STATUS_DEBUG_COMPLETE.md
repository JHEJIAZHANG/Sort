# 作業繳交狀態調試 - 完整修復

## 已完成的修改

### 1. 增強的日誌輸出

#### 修改的檔案
- `coursemanagement/services/apiService.ts`
- `coursemanagement/components/teacher-assignment-detail.tsx`
- `coursemanagement/components/teacher-course-detail.tsx`

#### 添加的日誌
所有關鍵步驟都添加了詳細的 console.log，包括：
- API 請求參數
- API 回應內容
- 資料解析過程
- 狀態設定
- 渲染狀態

### 2. 創建的輔助工具

#### 測試組件
- `test-submission-status.tsx` - 獨立的 API 測試組件

#### 文件
- `HOW_TO_DEBUG_SUBMISSION_STATUS.md` - 詳細的調試指南
- `QUICK_FIX_GUIDE.md` - 快速修復指南
- `TEST_SUBMISSION_API.md` - API 測試腳本
- `DEBUG_SUBMISSION_STATUS.md` - 調試步驟
- `SUBMISSION_STATUS_FIX_SUMMARY.md` - 修復總結

## 如何使用

### 方法 1: 查看 Console 日誌（推薦）

1. **打開開發者工具**
   - 按 F12
   - 切換到 Console 標籤

2. **進入作業詳情頁面**
   - 導航到任一課程的作業詳情頁面

3. **查看日誌輸出**
   - 按照 `QUICK_FIX_GUIDE.md` 中的檢查點逐一檢查
   - 找出問題所在

### 方法 2: 使用測試組件

1. **在頁面中引入測試組件**
   ```tsx
   import { TestSubmissionStatus } from "@/components/test-submission-status"
   
   // 在頁面中使用
   <TestSubmissionStatus />
   ```

2. **填寫測試資料**
   - LINE User ID
   - 課程 ID
   - 作業 ID

3. **點擊「測試 API」**
   - 查看頁面上的結果
   - 查看 Console 中的詳細日誌

### 方法 3: 使用瀏覽器 Console 腳本

參考 `TEST_SUBMISSION_API.md` 中的測試腳本，直接在 Console 中執行。

## 預期的日誌輸出

當一切正常時，你應該看到以下日誌序列：

```
[TeacherAssignmentDetail] 開始載入作業繳交狀態... { courseId: "...", assignmentId: "..." }
[ApiService] getAssignmentSubmissionStatus 開始 { courseId: "...", assignmentId: "..." }
[ApiService] 使用的 line_user_id: "U..."
[ApiService] 請求 payload: { line_user_id: "U...", course_coursework_pairs: [...] }
[API] Making request to: /api/classroom/submissions/status/
[ApiService] API 回應結果: { data: { results: [...] } }
[TeacherAssignmentDetail] API 完整回應: { data: { results: [...] } }
[TeacherAssignmentDetail] data: { results: [...] }
[TeacherAssignmentDetail] results 陣列長度: 1
[TeacherAssignmentDetail] results: [{ course_id: "...", role: "teacher", ... }]
[TeacherAssignmentDetail] first result: { course_id: "...", role: "teacher", ... }
[TeacherAssignmentDetail] 找到第一筆結果
[TeacherAssignmentDetail] 角色: "teacher"
[TeacherAssignmentDetail] 統計資料: { total_students: 10, submitted: 5, ... }
[TeacherAssignmentDetail] 未繳交學生數: 5
[TeacherAssignmentDetail] 未繳交學生: [{ userId: "...", name: "...", ... }]
[TeacherAssignmentDetail] 已繳交學生數: 5
[TeacherAssignmentDetail] 已繳交學生: [{ userId: "...", name: "...", ... }]
[TeacherAssignmentDetail] 合併後的學生列表 (長度): 10
[TeacherAssignmentDetail] 合併後的學生列表: [...]
[TeacherAssignmentDetail] 設定統計資料: { total: 10, submitted: 5, ... }
[TeacherAssignmentDetail] 設定學生列表，數量: 10
[TeacherAssignmentDetail] 渲染狀態檢查: { loading: false, error: null, studentsLength: 10, ... }
```

## 常見問題診斷

### 問題 1: 沒有任何日誌輸出
**原因：** 組件沒有正確載入或 useEffect 沒有執行

**解決方案：**
1. 確認頁面是否正確渲染
2. 檢查 assignment 物件是否有 courseId 和 id
3. 檢查瀏覽器 Console 是否有其他錯誤

### 問題 2: API 回應有 error 欄位
**原因：** 後端 API 返回錯誤

**解決方案：**
1. 查看錯誤訊息
2. 檢查後端日誌
3. 確認 Google Classroom 授權狀態

### 問題 3: results 陣列為空
**原因：** 後端沒有返回資料

**解決方案：**
1. 確認課程 ID 和作業 ID 是否正確
2. 確認用戶是教師角色
3. 檢查後端的 Google Classroom API 查詢

### 問題 4: 學生列表為空但統計數字正確
**原因：** 後端沒有返回學生列表欄位

**解決方案：**
1. 檢查 API 回應中是否有 `unsubmitted_students` 和 `submitted_students` 欄位
2. 確認欄位是陣列格式
3. 檢查後端的資料映射邏輯

### 問題 5: 學生顯示「未知學生」
**原因：** 學生資料缺少必要欄位

**解決方案：**
1. 檢查學生物件是否有 `userId`、`name`、`emailAddress` 欄位
2. 確認欄位名稱正確（不是 `user_id` 或 `email`）
3. 檢查後端的學生資料提取邏輯

## 後端檢查清單

如果前端日誌顯示問題在後端，請檢查：

### 1. API 端點
- URL: `/api/classroom/submissions/status/`
- 方法: POST
- 權限: AllowAny

### 2. 請求格式
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

### 3. 回應格式
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
          "completion_rate": 50.0
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

### 4. 後端日誌檢查
```bash
# 查看 Django 日誌
tail -f /path/to/django/logs/debug.log | grep -A 20 "get_submissions_status"

# 查看 Google Classroom API 呼叫
tail -f /path/to/django/logs/debug.log | grep -A 10 "Google Classroom"
```

## 下一步

1. **按照 QUICK_FIX_GUIDE.md 進行快速診斷**
2. **根據日誌輸出找出問題所在**
3. **如果是後端問題，提供日誌給後端團隊**
4. **如果是前端問題，檢查資料解析邏輯**

## 需要幫助？

如果問題仍然存在，請提供：
1. Console 中的完整日誌（從開始到結束）
2. Network 標籤中的 API 請求和回應
3. 後端日誌（如果可以訪問）

將這些資訊提供給開發團隊以便進一步診斷。
