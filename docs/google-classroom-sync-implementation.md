# Google Classroom 同步功能實現總結

## 概述

已完成 Google Classroom 課程同步功能，支援預覽課程、設定上課時間、選擇性匯入。

## 實現的功能

### 1. 預覽同步內容
- 呼叫 `/api/v2/sync/preview-sync-all/` 獲取 Google Classroom 課程列表
- 顯示課程名稱、班級、教室等資訊
- 標示已存在的課程（黃色背景）
- **注意：** API 只返回課程，不返回作業

### 2. 課程時間設定
- 每個課程可以新增多個上課時段
- 時段設定包含：
  - 星期選擇（週一到週日）
  - 開始時間（24小時制）
  - 結束時間（24小時制）
  - 上課地點（選填）
- 支援新增、編輯、刪除時段

### 3. 確認匯入
- 呼叫 `/api/v2/sync/confirm-import/` 匯入選擇的課程
- 提交課程 ID 列表和時間設定
- 顯示匯入結果（成功匯入的課程數量）
- 自動刷新課程列表

## 檔案修改

### 1. `components/google-sync-all.tsx`

**主要變更：**
- 新增 `courseSchedules` 狀態管理課程時間
- 實現時間設定 UI（星期、時間、地點輸入）
- 支援多時段管理（新增、編輯、刪除）
- 適配實際 API 回應格式

**關鍵介面：**
```typescript
interface ClassroomCourse {
  id: string
  name: string
  section?: string
  description?: string
  room?: string
  ownerId?: string
  // ... 其他 Google Classroom 欄位
}

interface CourseSchedule {
  day_of_week: number  // 0=週日, 1=週一, ..., 6=週六
  start_time: string   // "HH:MM"
  end_time: string     // "HH:MM"
  location?: string
}

interface PreviewData {
  classroom_courses?: ClassroomCourse[]
  existing_course_ids?: string[]
}
```

### 2. `services/apiService.ts`

**新增方法：**

```typescript
// 預覽同步內容
static async previewSyncAll()

// 確認匯入（更新參數格式）
static async confirmImport(params: {
  courses: string[]
  assignments?: string[]
  schedules?: Record<string, CourseSchedule[]>
})

// 同步作業（後續功能）
static async syncAssignments(courseIds: string[])
```

## API 規格

### 1. 預覽同步 API

**端點：** `POST /api/v2/sync/preview-sync-all/`

**請求：**
```json
{
  "line_user_id": "string"
}
```

**回應：**
```json
{
  "success": true,
  "message": "預覽同步完成",
  "data": {
    "classroom_courses": [
      {
        "id": "795521701284",
        "name": "課程名稱",
        "section": "課程區段",
        "room": "教室",
        // ... 其他欄位
      }
    ],
    "existing_course_ids": ["已存在的課程ID"]
  }
}
```

### 2. 確認匯入 API

**端點：** `POST /api/v2/sync/confirm-import/`

**請求：**
```json
{
  "line_user_id": "string",
  "selected_items": {
    "courses": ["course_id1", "course_id2"],
    "assignments": []
  },
  "course_schedules": {
    "course_id1": [
      {
        "day_of_week": 1,
        "start_time": "09:00",
        "end_time": "10:50",
        "location": "A101"
      }
    ]
  }
}
```

**回應：**
```json
{
  "success": true,
  "message": "選擇性匯入完成",
  "data": {
    "import_results": {
      "classroom": {
        "success": true,
        "courses_imported": 2,
        "assignments_imported": 0,
        "errors": []
      }
    },
    "import_time": "2025-10-05T07:40:50.983946+00:00",
    "import_type": "selective"
  }
}
```

### 3. 同步作業 API（後續功能）

**端點：** `POST /api/v2/sync/sync-assignments/`

**請求：**
```json
{
  "line_user_id": "string",
  "course_ids": ["course_id1", "course_id2"]
}
```

**回應：**
```json
{
  "success": true,
  "message": "作業同步完成",
  "data": {
    "sync_result": {
      "success": true,
      "courses_processed": 2,
      "assignments_synced": 2,
      "errors": []
    }
  }
}
```

## 使用流程

1. **點擊同步按鈕**
   - 使用者在課程頁面點擊「同步 Google Classroom 課程」

2. **預覽課程**
   - 系統呼叫 `preview-sync-all` API
   - 顯示對話框，列出所有 Google Classroom 課程
   - 已存在的課程會標示黃色背景

3. **設定上課時間**
   - 使用者為每個課程點擊「+ 新增時段」
   - 選擇星期、開始時間、結束時間、地點
   - 可新增多個時段（例如：週一和週三都有課）

4. **確認匯入**
   - 使用者點擊「確認匯入課程」
   - 系統呼叫 `confirm-import` API
   - 提交所有課程 ID 和時間設定

5. **顯示結果**
   - 顯示成功匯入的課程數量
   - 自動刷新課程列表
   - 新課程出現在課程頁面

## UI 設計

### 預覽對話框

```
┌─────────────────────────────────────────┐
│ 確認同步內容                              │
├─────────────────────────────────────────┤
│ 課程 (3)                                 │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ 資料結構 [已存在]                     │ │
│ │ 課程區段                              │ │
│ │ 教室: A101                            │ │
│ │                                       │ │
│ │ 上課時間              [+ 新增時段]    │ │
│ │ ┌───────────────────────────────────┐ │ │
│ │ │ [週一▼] [09:00] [10:50] [A101] [✕]│ │ │
│ │ │ [週三▼] [14:00] [15:50] [A101] [✕]│ │ │
│ │ └───────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ℹ️ 已存在的課程將會被更新，不會重複創建   │
│                                          │
│ [取消]                    [確認匯入課程] │
└─────────────────────────────────────────┘
```

### 時段設定表單

- **星期選擇**：下拉選單（週一到週日）
- **開始時間**：時間輸入框（type="time"）
- **結束時間**：時間輸入框（type="time"）
- **地點**：文字輸入框（placeholder="地點"）
- **刪除按鈕**：紅色 ✕ 按鈕

## 注意事項

1. **API 限制**
   - 預覽 API 只返回課程，不返回作業
   - 作業需要使用另外的 `sync-assignments` API

2. **已存在課程**
   - 已存在的課程會被更新，不會重複創建
   - 使用黃色背景標示

3. **時間格式**
   - 使用 24 小時制
   - 格式：`HH:MM`（例如：`09:00`、`14:30`）

4. **星期編碼**
   - 0 = 週日
   - 1 = 週一
   - 2 = 週二
   - ...
   - 6 = 週六

5. **多時段支援**
   - 一個課程可以有多個上課時段
   - 適合一週上課多次的課程

## 後續功能

### 作業同步
可以在課程詳情頁面新增「同步作業」按鈕，呼叫 `sync-assignments` API 為特定課程同步作業。

**實現建議：**
```typescript
const handleSyncAssignments = async (courseId: string) => {
  const response = await ApiService.syncAssignments([courseId])
  // 處理回應並刷新作業列表
}
```

## 測試建議

1. **預覽功能**
   - 測試有課程的情況
   - 測試沒有課程的情況
   - 測試已存在課程的標示

2. **時間設定**
   - 測試新增時段
   - 測試編輯時段
   - 測試刪除時段
   - 測試多個時段

3. **匯入功能**
   - 測試成功匯入
   - 測試錯誤處理
   - 測試課程列表刷新

4. **邊界情況**
   - 測試沒有設定時間的課程
   - 測試 API 錯誤
   - 測試網路錯誤
