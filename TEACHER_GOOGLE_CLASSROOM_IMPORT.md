# 教師 Google Classroom 課程匯入功能

## 概述

本功能為教師提供專用的 Google Classroom 課程匯入介面，與學生匯入功能相似但使用教師專用的 API 端點。

## 實現內容

### 1. API 服務層 (`services/apiService.ts`)

新增三個教師專用 API 方法：

- **`teacherPreviewImport()`**: 預覽教師課程
  - 端點: `POST /api/classroom/teacher/preview-import/`
  - 功能: 獲取使用者為教師的 Google Classroom 課程列表

- **`teacherConfirmImport(params)`**: 確認匯入教師課程
  - 端點: `POST /api/classroom/teacher/confirm-import/`
  - 參數:
    - `selected_courses`: 選中的課程 ID 陣列
    - `course_schedules`: 課程時間表（可選）
  - 功能: 匯入選中的課程及其時間表

- **`teacherSyncAssignments(params)`**: 同步教師作業
  - 端點: `POST /api/classroom/teacher/sync-assignments/`
  - 參數:
    - `mode`: 'all_active' 或 'selected'
    - `course_ids`: 課程 ID 陣列（可選）
  - 功能: 同步教師課程的作業

### 2. 教師課程匯入組件 (`components/teacher-google-classroom-onboarding.tsx`)

完整的教師課程匯入流程組件，包含：

- **歡迎頁面**: 說明匯入流程
- **載入頁面**: 顯示載入動畫
- **選擇頁面**: 
  - 顯示所有教師課程
  - 支援全選/取消全選
  - 支援展開/收起全部
  - 可編輯課程名稱、地點
  - 可設定多個上課時段（星期、開始時間、結束時間）
  - 顯示已選擇課程數量

### 3. 教師匯入按鈕組件 (`components/import-teacher-google-classroom-button.tsx`)

簡單的按鈕組件，用於觸發教師課程匯入流程。

### 4. 教師頁面整合 (`app/teacher/page.tsx`)

- 移除學生版的 `ImportGoogleClassroomButton`
- 使用教師專用的 `ImportTeacherGoogleClassroomButton`
- 移除未使用的 `GoogleClassroomImport` 組件引用
- 匯入完成後自動刷新課程列表

## 與學生版的差異

| 功能 | 學生版 | 教師版 |
|------|--------|--------|
| API 端點 | `/sync/preview-sync-all/` | `/classroom/teacher/preview-import/` |
| 確認匯入 | `/sync/confirm-import/` | `/classroom/teacher/confirm-import/` |
| 作業同步 | `/sync/sync-assignments/` | `/classroom/teacher/sync-assignments/` |
| 課程範圍 | 學生身份課程 | 教師身份課程 |
| 組件名稱 | `GoogleClassroomOnboarding` | `TeacherGoogleClassroomOnboarding` |
| 按鈕組件 | `ImportGoogleClassroomButton` | `ImportTeacherGoogleClassroomButton` |

## 使用流程

1. 教師點擊「匯入 Google Classroom 課程」按鈕
2. 系統顯示歡迎頁面，說明匯入流程
3. 教師點擊「開始匯入」
4. 系統從 Google Classroom 載入教師課程
5. 顯示課程列表，教師可以：
   - 選擇要匯入的課程
   - 編輯課程名稱和地點
   - 設定上課時間（可多個時段）
6. 教師點擊「確認匯入」
7. 系統執行：
   - 匯入選中的課程
   - 設定課程時間表
   - 同步課程作業
8. 匯入完成，自動刷新課程列表

## 技術特點

- **類型安全**: 使用 TypeScript 定義所有介面
- **錯誤處理**: 完整的錯誤捕獲和提示
- **用戶體驗**: 
  - 載入動畫
  - 即時反饋
  - 防止誤操作（禁用 ESC 和點擊外部關閉）
- **響應式設計**: 支援手機和桌面版
- **可擴展性**: 易於添加新功能

## 後端 API 要求

後端需要實現以下 API 端點（根據提供的文檔）：

1. `POST /api/classroom/teacher/preview-import/`
   - 請求: `{ line_user_id: string }`
   - 回應: 教師課程列表

2. `POST /api/classroom/teacher/confirm-import/`
   - 請求: `{ line_user_id, selected_courses, course_schedules }`
   - 回應: 匯入結果

3. `POST /api/classroom/teacher/sync-assignments/`
   - 請求: `{ line_user_id, mode, course_ids }`
   - 回應: 同步結果

## 注意事項

- 教師和學生使用不同的 API 端點，互不影響
- 教師只能匯入自己為教師的課程
- 學生只能匯入自己為學生的課程
- 兩者的 UI 和流程相似，但後端邏輯獨立
