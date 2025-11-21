# Google Classroom 同步功能 - 含課程時間設定

## 功能概述

在課程頁面點擊「同步 Google Classroom 課程」按鈕，實現兩階段同步流程：
1. **預覽階段**：顯示即將同步的課程（不包含作業），讓使用者設定每個課程的上課時間
2. **確認階段**：將選擇的課程和時間一起提交到後端創建

## API 端點

### 1. 預覽同步內容
```
POST /api/v2/sync/preview-sync-all/
```

**描述：** 預覽 Google Classroom 同步數據，只返回課程信息，不包含作業

**請求參數：**
```json
{
  "line_user_id": "string"
}
```

**回應格式：**
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
        "description": "課程描述",
        "room": "教室",
        "ownerId": "教師ID",
        "creationTime": "2024-01-01T00:00:00Z",
        "updateTime": "2024-01-01T00:00:00Z",
        "enrollmentCode": "課程代碼",
        "courseState": "ACTIVE",
        "alternateLink": "https://classroom.google.com/c/...",
        "teacherFolder": {},
        "guardiansEnabled": false,
        "calendarId": "日曆ID"
      }
    ],
    "existing_course_ids": ["已存在的課程ID列表"]
  }
}
```

### 2. 確認匯入
```
POST /api/v2/sync/confirm-import/
```

**描述：** 選擇性匯入 Google Classroom 數據，支援只匯入課程或同時匯入課程和作業

**請求參數：**
```json
{
  "line_user_id": "string",
  "selected_items": {
    "courses": ["course_id1", "course_id2"],
    "assignments": []
  },
  "course_schedules": {
    "google_course_id_1": [
      {
        "day_of_week": 1,
        "start_time": "09:00",
        "end_time": "10:50",
        "location": "A101"
      },
      {
        "day_of_week": 3,
        "start_time": "14:00",
        "end_time": "15:50",
        "location": "B202"
      }
    ],
    "google_course_id_2": [
      {
        "day_of_week": 2,
        "start_time": "10:00",
        "end_time": "12:00",
        "location": "C303"
      }
    ]
  }
}
```

**說明：**
- `selected_items.courses`: 必填，要匯入的課程 ID 列表
- `selected_items.assignments`: 可選，要匯入的作業 ID 列表（預覽階段不返回作業，所以通常為空）
- `course_schedules`: 課程時間設定
- `day_of_week`: 0=週日, 1=週一, 2=週二, ..., 6=週六
- `start_time` / `end_time`: 24小時制時間格式 "HH:MM"
- `location`: 上課地點（選填）

**回應格式：**
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
    "selected_items": {
      "courses": ["795521701284", "794605301916"]
    },
    "user_id": "U015b486e04b09ae70bde24db70ec9611",
    "import_time": "2025-10-05T07:40:50.983946+00:00",
    "import_type": "selective"
  }
}
```

### 3. 同步作業（後續功能）
```
POST /api/v2/sync/sync-assignments/
```

**描述：** 只同步指定課程的作業，不影響課程本身

**請求參數：**
```json
{
  "line_user_id": "string",
  "course_ids": ["course_id1", "course_id2"]
}
```

**回應格式：**
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
    },
    "user_id": "U015b486e04b09ae70bde24db70ec9611",
    "sync_time": "2025-10-05T07:41:01.977909+00:00",
    "sync_type": "assignments_only"
  }
}
```

## 前端實現

### 組件：`components/google-sync-all.tsx`

#### 主要狀態
```typescript
const [showPreviewDialog, setShowPreviewDialog] = useState(false)
const [previewData, setPreviewData] = useState<PreviewData | null>(null)
const [courseSchedules, setCourseSchedules] = useState<Record<string, CourseSchedule[]>>({})
```

#### 課程時間資料結構
```typescript
interface CourseSchedule {
  day_of_week: number
  start_time: string
  end_time: string
  location?: string
}
```

#### 主要功能

1. **預覽同步內容**
```typescript
const handleSync = async () => {
  const response = await ApiService.previewSyncAll()
  setPreviewData(response.data)
  setShowPreviewDialog(true)
}
```

2. **新增課程時段**
```typescript
const addScheduleForCourse = (courseId: string) => {
  setCourseSchedules(prev => ({
    ...prev,
    [courseId]: [
      ...(prev[courseId] || []),
      {
        day_of_week: 1,
        start_time: '09:00',
        end_time: '10:00',
        location: ''
      }
    ]
  }))
}
```

3. **更新課程時段**
```typescript
const updateScheduleForCourse = (
  courseId: string, 
  index: number, 
  field: keyof CourseSchedule, 
  value: any
) => {
  setCourseSchedules(prev => ({
    ...prev,
    [courseId]: (prev[courseId] || []).map((schedule, idx) => 
      idx === index ? { ...schedule, [field]: value } : schedule
    )
  }))
}
```

4. **確認匯入**
```typescript
const handleConfirmImport = async () => {
  const response = await ApiService.confirmImport(courseSchedules)
  // 處理回應並刷新課程列表
  if (onSync) {
    onSync()
  }
}
```

### API Service 方法

```typescript
// services/apiService.ts

static async previewSyncAll() {
  if (!this.lineUserId) {
    this.bootstrapLineUserId()
  }
  return this.request('/sync/preview-sync-all/', {
    method: 'POST',
    body: JSON.stringify({ line_user_id: this.lineUserId })
  })
}

static async confirmImport(courseSchedules?: Record<string, CourseSchedule[]>) {
  if (!this.lineUserId) {
    this.bootstrapLineUserId()
  }
  return this.request('/sync/confirm-import/', {
    method: 'POST',
    body: JSON.stringify({ 
      line_user_id: this.lineUserId,
      course_schedules: courseSchedules || {}
    })
  })
}
```

## UI 設計

### 預覽對話框

1. **課程列表區域**
   - 顯示課程名稱、班級、教師
   - 每個課程下方有「上課時間」設定區
   - 可新增多個時段（支援一週多次上課）

2. **時段設定表單**
   - 星期選擇（下拉選單）
   - 開始時間（時間輸入框）
   - 結束時間（時間輸入框）
   - 上課地點（文字輸入框）
   - 刪除按鈕

3. **作業列表區域**
   - 顯示作業標題、所屬課程、截止日期

4. **衝突警告**
   - 如果有重複課程或其他衝突，顯示警告訊息

5. **操作按鈕**
   - 取消：關閉對話框
   - 確認匯入：提交資料到後端

## 使用流程

1. 使用者點擊「同步 Google Classroom 課程」按鈕
2. 系統呼叫 `preview-sync-all` API 獲取課程和作業資料
3. 顯示預覽對話框，列出所有課程
4. 使用者為每個課程設定上課時間：
   - 點擊「+ 新增時段」按鈕
   - 選擇星期、開始時間、結束時間、地點
   - 可新增多個時段（例如：週一 09:00-10:50 和週三 14:00-15:50）
5. 使用者確認後點擊「確認匯入」
6. 系統呼叫 `confirm-import` API，將課程資料和時間一起提交
7. 後端創建課程、作業和課程時間
8. 前端刷新課程列表，顯示新匯入的課程

## 注意事項

1. **時間格式**：使用 24 小時制，格式為 "HH:MM"
2. **星期編碼**：0=週日, 1=週一, ..., 6=週六
3. **多時段支援**：一個課程可以有多個上課時段
4. **選填欄位**：地點（location）為選填
5. **衝突處理**：如果課程已存在，後端應該提供衝突資訊
6. **錯誤處理**：API 錯誤時顯示錯誤訊息給使用者

## 後端需求

後端需要實現以下功能：

1. **preview-sync-all**
   - 從 Google Classroom API 獲取課程和作業
   - 檢查是否有重複課程
   - 回傳課程、作業和衝突資訊

2. **confirm-import**
   - 接收課程資料和時間設定
   - 創建課程記錄
   - 創建作業記錄
   - 創建課程時間記錄（CourseSchedule）
   - 回傳創建結果統計

3. **資料庫模型**
   - Course: 課程基本資料
   - Assignment: 作業資料
   - CourseSchedule: 課程時間（一對多關係）
