# 教師 API 驗證和修正指南

## 🔍 當前狀態檢查

### 1. 前端 API 調用（✅ 已正確）

**文件：** `coursemanagement/services/apiService.ts`

```typescript
// ✅ 教師課程 API
static async getTeacherCourses(lineUserId: string) {
  const resp = await this.request<any>(`/courses/${qs}`, {}, 'other')
  // 調用 /api/courses/
  const courses = resp?.data?.courses ?? []
  return { data: courses }
}

// ✅ 教師作業 API
static async getTeacherAssignments(lineUserId: string, params?) {
  const resp = await this.request<any>(`/teacher/assignments/${qs}`, {}, 'other')
  // 調用 /api/teacher/assignments/
  const assignments = resp?.data?.data?.all_assignments ?? []
  return { data: assignments }
}
```

### 2. 後端 API 實現（✅ 已正確）

**文件：** `ntub v2 2/ntub v2/classroomai/course/views.py`

```python
# ✅ 教師課程 API
@api_view(["GET"])
def get_courses(request):
    """GET /api/courses/?line_user_id=xxx"""
    prof = get_object_or_404(LineProfile, line_user_id=line_user_id)
    courses = Course.objects.filter(owner=prof).order_by('-created_at')
    # 返回: { courses: [...], total_courses: N }

# ✅ 教師作業 API
@api_view(["GET"])
def get_teacher_assignments(request):
    """GET /api/teacher/assignments/?line_user_id=xxx"""
    prof = get_object_or_404(LineProfile, line_user_id=line_user_id)
    courses = Course.objects.filter(owner=prof)
    # 返回: { data: { all_assignments: [...] } }
```

### 3. URL 路由（✅ 已正確）

**文件：** `ntub v2 2/ntub v2/classroomai/course/urls.py`

```python
urlpatterns = [
    path("api/courses/", get_courses, name="get_courses"),
    path("api/teacher/assignments/", get_teacher_assignments, name="get_teacher_assignments"),
]
```

## 🧪 測試步驟

### 步驟 1: 測試後端 API

在終端執行：

```bash
# 測試課程 API
curl "http://localhost:8000/api/courses/?line_user_id=Uc8858c883da4bd4aecf9271aaa019a45"

# 測試作業 API
curl "http://localhost:8000/api/teacher/assignments/?line_user_id=Uc8858c883da4bd4aecf9271aaa019a45"
```

**預期結果：**
```json
// 課程 API
{
  "courses": [
    {
      "id": "803980731255",
      "name": "演算法",
      "section": "A班",
      ...
    }
  ],
  "total_courses": 4
}

// 作業 API
{
  "data": {
    "all_assignments": [
      {
        "id": "hw_123",
        "title": "作業一",
        "course_info": {
          "id": "803980731255",
          "name": "演算法"
        },
        ...
      }
    ]
  }
}
```

### 步驟 2: 測試前端 API 調用

在瀏覽器 Console 執行 `test-teacher-flow.js`：

```javascript
// 複製 test-teacher-flow.js 的內容到 Console
// 或者在頁面中執行：
const script = document.createElement('script');
script.src = '/test-teacher-flow.js';
document.head.appendChild(script);
```

### 步驟 3: 檢查數據轉換

在瀏覽器 Console 查看：

```javascript
// 應該看到：
========== useTeacherCourses: 開始載入教師資料 ==========
📞 調用 ApiService.getTeacherCourses...
========== getTeacherCourses 開始 ==========
✅ 最終課程數量: 4
📋 第一個課程範例: {...}

📞 調用 ApiService.getTeacherAssignments...
========== getTeacherAssignments 開始 ==========
✅ 最終作業數量: 2
📋 第一個作業範例: {...}

📊 原始數據:
  - coursesData 類型: object 是陣列? true
  - coursesData 長度: 4
  - assignmentsData 類型: object 是陣列? true
  - assignmentsData 長度: 2

🔄 開始轉換數據...
  轉換課程 1: {...}
  轉換課程 2: {...}
  轉換作業 1: {...}
  轉換作業 2: {...}

✅ 教師資料載入成功:
  - 課程數量: 4
  - 作業數量: 2
```

## 🐛 常見問題和修正

### 問題 1: 課程數量是 0

**檢查：**
```bash
# 檢查後端日誌
# 應該看到：
✅ 資料庫返回 4 個課程

# 如果看到：
✅ 資料庫返回 0 個課程
```

**原因：** 資料庫中沒有課程記錄

**修正：**
```sql
-- 檢查資料庫
SELECT * FROM course_course WHERE owner_id = (
  SELECT id FROM user_lineprofile WHERE line_user_id = 'Uc8858c883da4bd4aecf9271aaa019a45'
);

-- 如果沒有記錄，創建測試課程
INSERT INTO course_course (owner_id, name, section, gc_course_id, enrollment_code, course_state, created_at, updated_at)
VALUES (
  (SELECT id FROM user_lineprofile WHERE line_user_id = 'Uc8858c883da4bd4aecf9271aaa019a45'),
  '測試課程',
  'A班',
  'test_course_123',
  'abc123',
  'ACTIVE',
  NOW(),
  NOW()
);
```

### 問題 2: 作業數量是 0

**檢查：**
```bash
# 檢查後端日誌
# 應該看到：
  處理課程: 演算法 (ID: 803980731255)
    找到 1 個作業

# 如果看到：
  處理課程: 演算法 (ID: 803980731255)
    找到 0 個作業
```

**原因：** 資料庫中沒有作業記錄

**修正：**
```sql
-- 檢查資料庫
SELECT h.* FROM course_homework h
JOIN course_course c ON h.course_id = c.id
WHERE c.owner_id = (
  SELECT id FROM user_lineprofile WHERE line_user_id = 'Uc8858c883da4bd4aecf9271aaa019a45'
);

-- 如果沒有記錄，創建測試作業
INSERT INTO course_homework (course_id, owner_id, title, description, gc_homework_id, gc_course_id, state, work_type, due_date, due_time, created_at, updated_at)
VALUES (
  (SELECT id FROM course_course WHERE gc_course_id = '803980731255' LIMIT 1),
  (SELECT id FROM user_lineprofile WHERE line_user_id = 'Uc8858c883da4bd4aecf9271aaa019a45'),
  '測試作業',
  '這是一個測試作業',
  'test_hw_123',
  '803980731255',
  'PUBLISHED',
  'ASSIGNMENT',
  '2024-12-31',
  '23:59:00',
  NOW(),
  NOW()
);
```

### 問題 3: 前端顯示空的

**檢查：**
```javascript
// 在 Console 查看
console.log('courses:', courses)
console.log('assignments:', assignments)

// 應該看到：
courses: Array(4) [{...}, {...}, {...}, {...}]
assignments: Array(2) [{...}, {...}]

// 如果看到：
courses: Array(0) []
assignments: Array(0) []
```

**原因：** 數據轉換失敗

**修正：** 檢查 `coursemanagement/lib/dataTransform.ts`

```typescript
// 確保 transformBackendCourse 正確處理教師 API 的格式
export function transformBackendCourse(backendCourse: any): Course {
  // 教師 API 返回的格式
  const id = backendCourse.id || backendCourse.gc_course_id
  const name = backendCourse.name || backendCourse.title
  const schedules = backendCourse.schedules || []
  
  return {
    id: String(id),
    name: name,
    schedule: schedules.map((s: any) => ({
      dayOfWeek: s.day_of_week,
      startTime: s.start_time,
      endTime: s.end_time
    })),
    ...
  }
}

// 確保 transformBackendAssignment 正確處理教師 API 的格式
export function transformBackendAssignment(backendAssignment: any): Assignment {
  // 教師 API 返回的格式
  const courseInfo = backendAssignment.course_info || {}
  
  return {
    id: String(backendAssignment.id),
    title: backendAssignment.title,
    courseId: String(courseInfo.id),
    courseName: courseInfo.name,
    dueDate: new Date(backendAssignment.due_date || backendAssignment.due_datetime),
    ...
  }
}
```

### 問題 4: 500 錯誤

**檢查後端日誌：**
```
2025-10-29 15:14:44,239 ERROR Internal Server Error: /api/teacher/assignments/
```

**原因：** 後端代碼有錯誤

**修正：** 查看完整的錯誤堆疊，修正代碼錯誤

## ✅ 驗證清單

完成以下所有項目：

- [ ] 後端課程 API 返回數據（curl 測試）
- [ ] 後端作業 API 返回數據（curl 測試）
- [ ] 前端課程 API 調用成功（Console 日誌）
- [ ] 前端作業 API 調用成功（Console 日誌）
- [ ] 數據轉換成功（Console 日誌）
- [ ] 前端顯示課程列表
- [ ] 前端顯示作業列表
- [ ] 沒有 Console 錯誤
- [ ] 沒有 Network 錯誤
- [ ] 沒有後端錯誤

## 🚀 最終確認

執行以下命令確認一切正常：

```bash
# 1. 重新啟動後端
cd "ntub v2 2/ntub v2/classroomai"
python manage.py runserver

# 2. 重新啟動前端
cd coursemanagement
rm -rf .next
npm run dev

# 3. 在瀏覽器中：
# - 清除緩存（Cmd+Shift+R）
# - 訪問教師頁面
# - 打開 Console
# - 執行 test-teacher-flow.js
# - 檢查結果

# 4. 確認顯示：
# - 課程列表有 4 個課程
# - 作業列表有 2 個作業
# - 沒有錯誤訊息
```

## 📝 總結

如果所有測試都通過，你應該看到：

1. ✅ 後端從資料庫讀取課程和作業
2. ✅ 前端正確調用教師 API
3. ✅ 數據正確轉換
4. ✅ 前端正確顯示課程和作業
5. ✅ 沒有任何錯誤

如果還有問題，請提供：
- 後端完整日誌
- 前端 Console 完整日誌
- Network 標籤截圖
- 資料庫查詢結果
