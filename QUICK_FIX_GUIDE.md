# 快速修復指南：作業繳交狀態顯示問題

## 問題
作業詳情頁面中，學生列表為空，沒有顯示已繳交和未繳交的學生。

## 快速診斷步驟

### 1. 打開瀏覽器開發者工具
按 F12，切換到 Console 標籤

### 2. 進入作業詳情頁面
導航到任一課程的作業詳情頁面

### 3. 查看 Console 日誌

你會看到一系列的日誌輸出。**重點關注以下幾個關鍵日誌：**

#### ✅ 檢查點 1: API 是否成功呼叫
```
[ApiService] getAssignmentSubmissionStatus 開始
[ApiService] 使用的 line_user_id: "..."
[ApiService] 請求 payload: { ... }
```

**如果沒有看到這些日誌** → 前端沒有正確呼叫 API，檢查組件是否正確載入

#### ✅ 檢查點 2: API 是否返回資料
```
[ApiService] API 回應結果: { ... }
[TeacherAssignmentDetail] API 完整回應: { ... }
```

**如果看到 `error` 欄位** → API 呼叫失敗，查看錯誤訊息

#### ✅ 檢查點 3: results 陣列是否有資料
```
[TeacherAssignmentDetail] results 陣列長度: X
```

**如果長度是 0** → 後端沒有返回資料，需要檢查後端

#### ✅ 檢查點 4: 是否找到第一筆結果
```
[TeacherAssignmentDetail] 找到第一筆結果
[TeacherAssignmentDetail] 角色: "teacher"
```

**如果沒有看到「找到第一筆結果」** → results 陣列為空或格式不正確

#### ✅ 檢查點 5: 學生列表是否有資料
```
[TeacherAssignmentDetail] 未繳交學生數: X
[TeacherAssignmentDetail] 已繳交學生數: Y
[TeacherAssignmentDetail] 合併後的學生列表 (長度): Z
```

**如果都是 0** → 後端沒有返回學生資料

#### ✅ 檢查點 6: 是否成功設定狀態
```
[TeacherAssignmentDetail] 設定統計資料: { ... }
[TeacherAssignmentDetail] 設定學生列表，數量: Z
```

**如果沒有看到這些日誌** → 資料解析失敗

#### ✅ 檢查點 7: 渲染狀態
```
[TeacherAssignmentDetail] 渲染狀態檢查: {
  loading: false,
  error: null,
  studentsLength: Z,
  filteredStudentsLength: Z,
  stats: { ... }
}
```

**如果 studentsLength 是 0** → 學生列表為空
**如果 loading 是 true** → 還在載入中
**如果 error 不是 null** → 有錯誤發生

## 常見問題和解決方案

### 問題 1: results 陣列長度為 0

**原因：** 後端沒有返回資料

**解決方案：**
1. 檢查課程 ID 和作業 ID 是否正確
2. 確認用戶是教師角色
3. 檢查後端日誌
4. 確認 Google Classroom 連接狀態

**後端檢查：**
```bash
# 查看後端日誌
tail -f /path/to/django/logs/debug.log | grep "get_submissions_status"
```

### 問題 2: 學生列表數量為 0 但統計數字正確

**原因：** 後端沒有返回 `unsubmitted_students` 或 `submitted_students` 欄位

**解決方案：**
1. 查看 `[TeacherAssignmentDetail] first result:` 的完整內容
2. 確認是否有 `unsubmitted_students` 和 `submitted_students` 欄位
3. 檢查後端的資料映射邏輯

**檢查 API 回應：**
在 Console 中執行：
```javascript
// 複製 [TeacherAssignmentDetail] first result: 後面的 JSON
const firstResult = { /* 貼上 JSON */ }
console.log('unsubmitted_students:', firstResult.unsubmitted_students)
console.log('submitted_students:', firstResult.submitted_students)
```

### 問題 3: 學生資料缺少必要欄位

**原因：** 學生物件缺少 `userId`、`name` 或 `emailAddress`

**解決方案：**
1. 查看 `[TeacherAssignmentDetail] 未繳交學生:` 和 `[TeacherAssignmentDetail] 已繳交學生:` 的內容
2. 確認每個學生都有必要欄位
3. 檢查後端的學生資料提取邏輯

**檢查學生資料：**
在 Console 中執行：
```javascript
// 複製 [TeacherAssignmentDetail] 未繳交學生: 後面的 JSON
const unsubmittedStudents = [ /* 貼上 JSON */ ]
unsubmittedStudents.forEach((s, i) => {
  console.log(`學生 ${i}:`, {
    hasUserId: !!s.userId,
    hasName: !!s.name,
    hasEmail: !!s.emailAddress
  })
})
```

### 問題 4: API 回應有錯誤

**原因：** 後端 API 返回錯誤

**解決方案：**
1. 查看錯誤訊息
2. 確認 Google Classroom 授權是否有效
3. 檢查後端日誌

**常見錯誤：**
- `未授權` → 需要重新連接 Google 帳號
- `權限不足` → 用戶不是教師角色
- `課程不存在` → 課程 ID 不正確
- `作業不存在` → 作業 ID 不正確

## 臨時解決方案

如果後端暫時無法修復，可以使用模擬資料：

### 1. 在 teacher-assignment-detail.tsx 中添加模擬資料

在 `useEffect` 的 `catch` 區塊後面添加：

```typescript
// 臨時：使用模擬資料
if (process.env.NODE_ENV === 'development') {
  console.warn('[TeacherAssignmentDetail] 使用模擬資料')
  const mockStudents: StudentSubmission[] = [
    {
      id: "1",
      name: "測試學生1",
      email: "student1@example.com",
      submitted: true,
      submittedAt: new Date(),
      status: "submitted"
    },
    {
      id: "2",
      name: "測試學生2",
      email: "student2@example.com",
      submitted: false,
      status: "missing"
    }
  ]
  setStudents(mockStudents)
  setStats({
    total: 2,
    submitted: 1,
    unsubmitted: 1,
    rate: 50
  })
}
```

## 需要更多幫助？

如果問題仍然存在，請提供以下資訊：

1. **Console 完整日誌**
   - 從 `[TeacherAssignmentDetail] 開始載入...` 開始
   - 到 `[TeacherAssignmentDetail] 渲染狀態檢查:` 結束
   - 複製所有日誌內容

2. **Network 標籤中的 API 請求**
   - 找到 `/api/classroom/submissions/status/` 請求
   - 複製 Request Payload 和 Response

3. **後端日誌**（如果可以訪問）
   - 搜尋 `get_submissions_status`
   - 複製相關日誌

將這些資訊提供給開發團隊以便進一步診斷。

## 相關文件

- `HOW_TO_DEBUG_SUBMISSION_STATUS.md` - 詳細的調試指南
- `TEST_SUBMISSION_API.md` - API 測試腳本
- `test-submission-status.tsx` - 測試組件
