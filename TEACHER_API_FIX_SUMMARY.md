# 教師課程管理與作業管理 API 對接修正

## 問題描述
教師的資料已匯入資料庫，但前端讀不出來。教師的 API 都在 course 模組裡面。

## 問題分析

### 1. API 端點不匹配
**前端調用：**
- `getTeacherCourses()` → 原本調用 `/api/v2/web/courses/list/`
- `getTeacherAssignments()` → 原本調用 `/api/v2/web/assignments/list/`

**後端實際端點：**
- 教師課程：`/api/courses/` (在 `course/views.py` 中的 `get_courses`)
- 教師作業：`/api/teacher/assignments/` (在 `course/views.py` 中的 `get_teacher_assignments`)

### 2. 數據格式不匹配
**後端返回格式（教師課程）：**
```json
{
  "courses": [
    {
      "id": "google_classroom_id",
      "name": "課程名稱",
      "section": "班級",
      "ownerId": "teacher@email.com",
      "enrollmentCode": "abc123",
      "schedules": [
        {
          "day_of_week": 1,
          "start_time": "09:00",
          "end_time": "10:30",
          "location": "A101"
        }
      ]
    }
  ]
}
```

**後端返回格式（教師作業）：**
```json
{
  "data": {
    "all_assignments": [
      {
        "id": "assignment_id",
        "title": "作業標題",
        "due_date": "2024-01-01 23:59",
        "state": "PUBLISHED",
        "course_info": {
          "id": "course_id",
          "name": "課程名稱"
        }
      }
    ]
  }
}
```

## 修正內容

### 1. 修正 API 端點 (`services/apiService.ts`)

#### 修正前：
```typescript
static async getTeacherCourses(lineUserId: string) {
  const resp = await this.request<any>(`/web/courses/list/${qs}`)
  const courses = resp?.data?.data?.courses ?? []
  return { data: courses }
}

static async getTeacherAssignments(lineUserId: string, params?) {
  const resp = await this.request<any>(`/web/assignments/list/${qs}`, {}, 'other')
  const assignments = resp?.data?.data?.assignments ?? []
  return { data: assignments }
}
```

#### 修正後：
```typescript
static async getTeacherCourses(lineUserId: string) {
  // 使用 'other' apiPrefix 來調用 /api/courses/ 端點
  const resp = await this.request<any>(`/courses/${qs}`, {}, 'other')
  // 後端返回格式：{ courses: [...], total_courses: N }
  const courses = resp?.data?.courses ?? []
  return { data: courses }
}

static async getTeacherAssignments(lineUserId: string, params?) {
  // 使用 'other' apiPrefix 來調用 /api/teacher/assignments/ 端點
  const resp = await this.request<any>(`/teacher/assignments/${qs}`, {}, 'other')
  // 後端返回格式：{ data: { all_assignments: [...] } }
  const assignments = resp?.data?.data?.all_assignments ?? []
  return { data: assignments }
}
```

### 2. 更新數據轉換函數 (`coursemanagement/lib/dataTransform.ts`)

#### 課程轉換函數更新：
- 支援 Google Classroom API 返回的欄位（`enrollmentCode`, `ownerId`, `creationTime`）
- 正確處理 `schedules` 陣列
- 自動生成 Google Classroom URL

#### 作業轉換函數更新：
- 支援 `course_info` 物件格式
- 處理 `state` 欄位（PUBLISHED, DRAFT, DELETED）
- 支援 `due_datetime` 和 `due_date` 兩種格式
- 處理 `creation_time` 和 `update_time` 欄位

## 測試步驟

### 1. 測試教師課程列表
```bash
# 在瀏覽器控制台執行
const lineUserId = "YOUR_LINE_USER_ID"
const response = await fetch('/api/courses/?line_user_id=' + lineUserId)
const data = await response.json()
console.log('課程數量:', data.courses.length)
console.log('課程列表:', data.courses)
```

### 2. 測試教師作業列表
```bash
# 在瀏覽器控制台執行
const lineUserId = "YOUR_LINE_USER_ID"
const response = await fetch('/api/teacher/assignments/?line_user_id=' + lineUserId)
const data = await response.json()
console.log('作業數量:', data.data.all_assignments.length)
console.log('作業列表:', data.data.all_assignments)
```

### 3. 測試前端頁面
1. 登入教師帳號
2. 訪問 `/teacher?tab=courses`
3. 檢查課程列表是否正確顯示
4. 訪問 `/teacher?tab=assignments`
5. 檢查作業列表是否正確顯示

## 預期結果

### 成功指標：
1. ✅ 教師課程列表正確顯示所有 Google Classroom 課程
2. ✅ 課程卡片顯示課程名稱、班級、時間表等資訊
3. ✅ 教師作業列表正確顯示所有課程的作業
4. ✅ 作業卡片顯示作業標題、到期日期、課程名稱等資訊
5. ✅ 控制台沒有 API 錯誤訊息

### 常見問題排查：

#### 問題 1: 課程列表為空
- 檢查 LINE User ID 是否正確
- 檢查 Google OAuth 授權是否有效
- 檢查後端日誌是否有錯誤

#### 問題 2: 作業列表為空
- 檢查課程是否有作業
- 檢查 Google Classroom API 權限
- 檢查後端日誌是否有錯誤

#### 問題 3: 數據格式錯誤
- 檢查 `transformBackendCourse` 函數是否正確處理所有欄位
- 檢查 `transformBackendAssignment` 函數是否正確處理所有欄位
- 查看瀏覽器控制台的錯誤訊息

## 相關文件

- 後端課程 API: `ntub v2 2/ntub v2/classroomai/course/views.py`
- 前端 API 服務: `services/apiService.ts`
- 數據轉換函數: `coursemanagement/lib/dataTransform.ts`
- 教師課程 Hook: `coursemanagement/hooks/use-teacher-courses.ts`
- 教師頁面: `app/teacher/page.tsx`

## 注意事項

1. **API 端點前綴**：教師 API 使用 `'other'` 前綴，對應到 `/api/` 路徑
2. **數據來源**：教師課程和作業都來自 Google Classroom API
3. **權限檢查**：確保教師帳號有 Google Classroom 的讀取權限
4. **錯誤處理**：API 調用失敗時會返回錯誤訊息，前端需要正確處理

## 後續優化建議

1. 統一 API 端點命名規範
2. 統一數據格式（前後端一致）
3. 添加更詳細的錯誤訊息
4. 添加數據快取機制
5. 添加離線支援
