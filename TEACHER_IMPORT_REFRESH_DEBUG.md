# 教師課程匯入後刷新問題調試指南

## 問題描述

教師按「確定匯入」後，課程沒有顯示在網站上。

## 已實施的調試功能

### 1. 完整的調試日誌鏈

整個匯入流程現在包含詳細的調試日誌：

#### A. 匯入確認階段 (`TeacherGoogleClassroomOnboarding.handleConfirm`)
```
========== 教師課程匯入開始 ==========
選中的課程數量: N
選中的課程 IDs: [...]
課程時間表: {...}
步驟 1: 呼叫 teacherConfirmImport API...
匯入 API 回應: {...}
✅ 課程匯入成功
步驟 2: 呼叫 teacherSyncAssignments API...
作業同步 API 回應: {...}
✅ 作業同步成功
========== 教師課程匯入完成 ==========
即將呼叫 onComplete() 刷新課程列表
```

#### B. 按鈕組件階段 (`ImportTeacherGoogleClassroomButton.handleOnboardingComplete`)
```
========== 教師匯入按鈕：匯入完成 ==========
關閉匯入對話框
呼叫 onImportComplete 回調函數
✅ onImportComplete 已執行
========================================
```

#### C. 教師頁面階段 (`app/teacher/page.tsx`)
```
========== 教師頁面：開始刷新課程列表 ==========
當前課程數量: N
✅ refetch() 已呼叫
================================================
```

#### D. 資料載入階段 (`useCourses.fetchAllData`)
```
========== useCourses: 開始載入資料 ==========
lineUserId: U...
✅ 資料載入成功:
  - 課程數量: N
  - 作業數量: N
  - 筆記數量: N
  - 考試數量: N
================================================
```

## 調試步驟

### 步驟 1: 開啟開發者工具

1. 按 F12 開啟瀏覽器開發者工具
2. 切換到 Console 標籤
3. 清空控制台（可選）

### 步驟 2: 執行匯入流程

1. 點擊「匯入 Google Classroom 課程」
2. 選擇要匯入的課程
3. 設定上課時間
4. 點擊「確認匯入」

### 步驟 3: 觀察控制台輸出

按照上述的日誌順序，檢查每個階段是否正常執行。

## 常見問題排查

### 問題 1: API 匯入失敗

**症狀**: 
```
❌ 匯入失敗: [錯誤訊息]
```

**可能原因**:
- 後端 API 錯誤
- 網路連線問題
- 授權失效

**解決方法**:
1. 查看完整的錯誤訊息
2. 檢查 Network 標籤中的 API 請求
3. 確認後端日誌

### 問題 2: onComplete 未執行

**症狀**: 
- 看到「課程匯入成功」
- 但沒有看到「教師匯入按鈕：匯入完成」

**可能原因**:
- `onComplete()` 調用失敗
- JavaScript 錯誤中斷執行

**解決方法**:
1. 檢查控制台是否有 JavaScript 錯誤
2. 確認 `onComplete` prop 是否正確傳遞

### 問題 3: onImportComplete 未定義

**症狀**:
```
⚠️ onImportComplete 未定義
```

**可能原因**:
- 父組件未傳遞 `onImportComplete` prop

**解決方法**:
1. 檢查 `ImportTeacherGoogleClassroomButton` 的使用
2. 確認 `onImportComplete` prop 已傳遞

### 問題 4: refetch 未執行

**症狀**:
- 看到「教師匯入按鈕：匯入完成」
- 但沒有看到「教師頁面：開始刷新課程列表」

**可能原因**:
- `refetch` 函數未正確綁定
- 回調函數執行失敗

**解決方法**:
1. 檢查 `useCourses` hook 是否正常
2. 確認 `lineUserId` 是否存在

### 問題 5: 資料載入失敗

**症狀**:
- 看到「開始刷新課程列表」
- 但沒有看到「useCourses: 開始載入資料」

**可能原因**:
- `lineUserId` 為空
- `fetchAllData` 函數錯誤

**解決方法**:
1. 檢查 `lineUserId` 的值
2. 查看是否有錯誤訊息

### 問題 6: 課程數量未增加

**症狀**:
- 所有日誌都正常
- 但「課程數量」沒有增加

**可能原因**:
- 後端 API 未實際創建課程
- 課程已存在（重複匯入）
- 課程過濾條件排除了新課程

**解決方法**:
1. 檢查後端 API 的實際回應
2. 查看 Network 標籤中的 `/api/v2/web/courses/list/` 請求
3. 確認回應中是否包含新匯入的課程
4. 檢查課程的 `source` 欄位是否為 `google_classroom`

## 預期的完整日誌流程

成功匯入後，應該看到以下完整的日誌序列：

```
========== 教師課程匯入開始 ==========
選中的課程數量: 2
選中的課程 IDs: ["816989062073", "795521701284"]
課程時間表: {...}
步驟 1: 呼叫 teacherConfirmImport API...
匯入 API 回應: {"data": {"success": true, ...}}
✅ 課程匯入成功
步驟 2: 呼叫 teacherSyncAssignments API...
作業同步 API 回應: {"data": {"success": true, ...}}
✅ 作業同步成功
========== 教師課程匯入完成 ==========
即將呼叫 onComplete() 刷新課程列表

========== 教師匯入按鈕：匯入完成 ==========
關閉匯入對話框
呼叫 onImportComplete 回調函數
✅ onImportComplete 已執行
========================================

========== 教師頁面：開始刷新課程列表 ==========
當前課程數量: 0
✅ refetch() 已呼叫
================================================

========== useCourses: 開始載入資料 ==========
lineUserId: U015b486e04b09ae70bde24db70ec9611
✅ 資料載入成功:
  - 課程數量: 2  ← 應該增加
  - 作業數量: X
  - 筆記數量: X
  - 考試數量: X
================================================
```

## 後端 API 檢查

### 檢查匯入 API 回應

在 Network 標籤中找到 `/api/classroom/teacher/confirm-import/` 請求：

**預期回應**:
```json
{
  "success": true,
  "message": "教師課程匯入完成",
  "data": {
    "import_results": {
      "classroom": {
        "success": true,
        "courses_imported": 2,
        "errors": []
      },
      "schedules_set": 2
    },
    "selected_courses": ["816989062073", "795521701284"],
    "user_id": "U...",
    "import_time": "2025-...",
    "import_type": "teacher_courses"
  }
}
```

### 檢查課程列表 API

在 Network 標籤中找到 `/api/v2/web/courses/list/` 請求：

**檢查項目**:
1. 回應中是否包含新匯入的課程
2. 課程的 `gc_course_id` 是否匹配
3. 課程的 `source` 是否為 `google_classroom`
4. 課程的 `owner` 是否為當前用戶

## 前端過濾邏輯檢查

在 `app/teacher/page.tsx` 中，課程可能被過濾：

```typescript
const classroomCourses = useMemo(() => {
  return courses.filter((c) => c.source === "google_classroom")
}, [courses])
```

**檢查項目**:
1. 新匯入的課程是否有 `source: "google_classroom"`
2. 是否有其他過濾條件排除了課程

## 解決方案

如果所有日誌都正常，但課程仍未顯示：

1. **檢查後端是否實際創建了課程**
   - 查看資料庫
   - 檢查後端日誌

2. **檢查課程資料格式**
   - 確認 `transformBackendCourse` 函數正確轉換資料
   - 檢查必要欄位是否存在

3. **檢查前端過濾邏輯**
   - 確認 `source` 欄位正確
   - 檢查其他過濾條件

4. **強制刷新頁面**
   - 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
   - 清除瀏覽器快取

## 聯絡支援

如果問題仍未解決，請提供：

1. 完整的控制台日誌（從「教師課程匯入開始」到「資料載入成功」）
2. Network 標籤中的 API 請求和回應
3. 後端日誌（如果可訪問）
4. 截圖
