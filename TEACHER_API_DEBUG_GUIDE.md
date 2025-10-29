# 教師 API Debug 指南

## 問題診斷

根據日誌分析，發現以下問題：

### 1. 前端調用了錯誤的 API（瀏覽器緩存）
**日誌顯示：**
```
GET /api/v2/web/courses/list/?line_user_id=...
GET /api/v2/web/assignments/list/?line_user_id=...
```

**應該調用：**
```
GET /api/courses/?line_user_id=...
GET /api/teacher/assignments/?line_user_id=...
```

**原因：** 瀏覽器或 Next.js 緩存了舊的編譯文件

### 2. 課程被過濾掉了
**日誌顯示：**
```
🔍 getTeacherCourses: 最終課程數量: 1
🔍 getTeacherCourses: Google Classroom 課程數量: 0
```

你的課程是本地課程（`is_google_classroom: false`），但代碼過濾掉了非 Google Classroom 課程。

### 3. 後端返回正確但前端沒收到
**後端日誌：**
```
✅ 成功處理作業:
- 總課程數: 4
- 總作業數: 2
```

**前端日誌：**
```
✅ 教師資料載入成功:
  - 課程數量: 0
  - 作業數量: 0
```

## 解決方案

### 步驟 1: 清除所有緩存

```bash
# 在前端目錄執行
cd coursemanagement

# 刪除 Next.js 緩存
rm -rf .next

# 刪除 node_modules 緩存（可選，如果問題持續）
rm -rf node_modules/.cache

# 重新啟動開發服務器
npm run dev
```

### 步驟 2: 清除瀏覽器緩存

1. 打開瀏覽器開發者工具（F12）
2. 右鍵點擊刷新按鈕
3. 選擇「清除緩存並強制重新整理」（Empty Cache and Hard Reload）

或者：

1. 打開無痕模式（Ctrl+Shift+N 或 Cmd+Shift+N）
2. 重新登入測試

### 步驟 3: 驗證 API 調用

打開瀏覽器開發者工具的 Network 標籤，檢查實際的 API 請求：

**應該看到：**
- `GET /api/courses/?line_user_id=...`
- `GET /api/teacher/assignments/?line_user_id=...`

**不應該看到：**
- `GET /api/v2/web/courses/list/...`
- `GET /api/v2/web/assignments/list/...`

### 步驟 4: 檢查後端是否正確調用

確認後端日誌中有：
```
========== get_courses API 開始 ==========
========== get_teacher_assignments API 開始 ==========
```

如果沒有這些日誌，說明前端還在調用舊的 API。

## 測試清單

- [ ] 清除 `.next` 目錄
- [ ] 重新啟動前端服務器
- [ ] 清除瀏覽器緩存或使用無痕模式
- [ ] 檢查 Network 標籤中的 API 請求
- [ ] 檢查 Console 中的日誌
- [ ] 檢查後端終端的日誌
- [ ] 確認課程和作業正確顯示

## 預期結果

### 前端 Console 日誌：
```
========== getTeacherCourses 開始 ==========
📥 輸入參數 lineUserId: Uc8858c883da4bd4aecf9271aaa019a45
✅ 有效的 lineUserId: Uc8858c883da4bd4aecf9271aaa019a45
🔗 完整 API URL: /api/courses/?line_user_id=Uc8858c883da4bd4aecf9271aaa019a45&_ts=...
⏳ 開始發送請求...
📦 API 原始回應:
  - resp.data: {courses: Array(4), total_courses: 4, ...}
✅ 最終課程數量: 4
📋 第一個課程範例: {...}
========== getTeacherCourses 結束 ==========

========== getTeacherAssignments 開始 ==========
...
✅ 最終作業數量: 2
========== getTeacherAssignments 結束 ==========

✅ 教師資料載入成功:
  - 課程數量: 4
  - 作業數量: 2
```

### 後端終端日誌：
```
========== get_courses API 開始 ==========
📥 收到請求參數 line_user_id: Uc8858c883da4bd4aecf9271aaa019a45
✅ 成功取得用戶: teacher@example.com, 角色: teacher
✅ Google Classroom API 返回 4 個課程
✅ 成功格式化 4 個課程
========== get_courses API 結束 ==========

========== get_teacher_assignments API 開始 ==========
...
✅ 成功處理作業:
- 總課程數: 4
- 總作業數: 2
========== get_teacher_assignments API 結束 ==========
```

## 如果問題持續

如果清除緩存後問題仍然存在，請提供：

1. **Network 標籤截圖**：顯示實際的 API 請求 URL
2. **Console 完整日誌**：從頁面載入開始的所有日誌
3. **後端完整日誌**：從 API 請求開始的所有日誌
4. **瀏覽器資訊**：Chrome/Firefox/Safari 版本

## 常見問題

### Q: 為什麼前端還在調用舊的 API？
A: Next.js 會緩存編譯後的文件。刪除 `.next` 目錄並重新啟動可以解決。

### Q: 為什麼課程數量是 0？
A: 可能是數據轉換函數的問題，或者過濾邏輯過濾掉了所有課程。

### Q: 後端返回數據但前端收不到？
A: 檢查數據路徑是否正確。後端返回 `{courses: [...]}` 但前端可能在讀取 `{data: {courses: [...]}}`。

### Q: 如何確認是緩存問題？
A: 使用無痕模式測試。如果無痕模式正常，就是緩存問題。
