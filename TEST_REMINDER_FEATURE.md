# 測試作業提醒功能指南

## 前置條件

1. 確保後端服務正在運行
2. 確保前端開發服務器正在運行
3. 確保有一個教師帳號已登入
4. 確保有至少一個課程和一個作業
5. 確保有學生已加入課程但未繳交作業

## 測試步驟

### 1. 查看作業繳交狀態

1. 登入教師帳號
2. 進入「教師」頁面
3. 點擊一個課程
4. 點擊一個作業查看詳情
5. 確認可以看到：
   - 繳交率進度條
   - 已繳交/未繳交統計卡片
   - 學生繳交狀態列表

### 2. 測試「提醒未繳交」按鈕

#### 測試場景 A：有未繳交學生

1. 確認作業詳情頁面顯示有未繳交的學生
2. 點擊「提醒未繳交」按鈕
3. 在彈出的確認對話框中點擊「確認提醒」
4. 觀察：
   - 按鈕應該顯示載入狀態
   - 應該出現成功提示：「已發送提醒給所有未繳交的學生」
   - 或部分失敗提示：「提醒已執行，但部分通知失敗（含 Email）」

#### 測試場景 B：沒有未繳交學生

1. 選擇一個所有學生都已繳交的作業
2. 點擊「提醒未繳交」按鈕
3. 應該出現提示：「目前沒有未繳交學生可提醒」

### 3. 測試「提醒選定學生」功能

1. 在學生列表中勾選一個或多個未繳交的學生
2. 點擊「提醒選定學生」按鈕
3. 觀察：
   - 應該出現成功提示：「已發送提醒給選定學生」
   - 或失敗提示

### 4. 驗證 LINE 提醒

如果學生已綁定 LINE：
1. 檢查學生的 LINE 帳號
2. 應該收到提醒訊息，格式如下：
   ```
   📢 作業提醒
   
   課程：[課程名稱]
   作業：[作業標題]
   
   請記得完成並繳交作業！
   ```

## 檢查後端日誌

### 成功的提醒日誌

```
[Reminder] 收到提醒請求: course_id=123, coursework_id=456, student_ids=[]
[Reminder] 找到 3 位未繳交學生
[Reminder] 處理學生: 張三 (student1@example.com)
[Reminder] 已發送 LINE 提醒給: 張三
[Reminder] 處理學生: 李四 (student2@example.com)
[Reminder] 已發送 LINE 提醒給: 李四
[Reminder] 提醒完成: {'success': True, 'reminded_count': 2, ...}
```

### 失敗的提醒日誌

```
[Reminder] 學生未綁定 LINE，嘗試發送 Email: 王五
[Reminder] 處理學生 789 失敗: ...
```

## 常見問題排查

### 問題 1：按鈕顯示「目前沒有未繳交學生」但實際有

**可能原因**：
- 前端無法正確解析後端返回的數據
- 後端 `get_submissions_status` 返回的數據結構不正確

**排查步驟**：
1. 打開瀏覽器開發者工具的 Console
2. 查看 `[Reminder] 查詢狀態回應:` 日誌
3. 檢查 `unsubmitted_students` 陣列是否為空
4. 檢查 `userId` 欄位是否存在

### 問題 2：提醒發送失敗

**可能原因**：
- 學生未綁定 LINE 帳號
- LINE Bot API Token 無效
- 網路連接問題

**排查步驟**：
1. 檢查後端日誌中的錯誤訊息
2. 確認學生的 email 是否在 LineProfile 表中
3. 確認 CHANNEL_TOKEN 環境變數是否正確設置

### 問題 3：權限不足錯誤

**可能原因**：
- 用戶不是課程的教師
- Google Classroom API 權限不足

**排查步驟**：
1. 確認用戶的 email 是否在課程的教師列表中
2. 檢查 Google OAuth scope 是否包含必要的權限

## API 端點測試

### 使用 curl 測試

```bash
# 測試提醒 API
curl -X POST http://localhost:8000/api/teacher/assignments/reminder/ \
  -H "Content-Type: application/json" \
  -d '{
    "line_user_id": "YOUR_LINE_USER_ID",
    "course_id": "COURSE_ID",
    "coursework_id": "COURSEWORK_ID",
    "student_ids": ["STUDENT_ID_1", "STUDENT_ID_2"]
  }'
```

### 預期回應

成功：
```json
{
  "success": true,
  "message": "提醒已發送給 2 位學生",
  "reminded_count": 2,
  "failed_count": 0,
  "total_students": 2,
  "course_name": "數學課",
  "homework_title": "第一章作業"
}
```

部分失敗：
```json
{
  "success": true,
  "message": "提醒已發送給 1 位學生",
  "reminded_count": 1,
  "failed_count": 1,
  "total_students": 2,
  "course_name": "數學課",
  "homework_title": "第一章作業",
  "email_errors": ["王五 (student3@example.com): 未綁定 LINE 且 Email 功能未實現"]
}
```

## 成功標準

- ✅ 可以正確顯示未繳交學生數量
- ✅ 「提醒未繳交」按鈕可以正常工作
- ✅ 「提醒選定學生」按鈕可以正常工作
- ✅ 已綁定 LINE 的學生可以收到提醒
- ✅ 未綁定 LINE 的學生會被記錄為失敗
- ✅ 錯誤訊息清晰明確
- ✅ 後端日誌記錄完整
