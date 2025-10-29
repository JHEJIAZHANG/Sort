# 教師 API 最終修正

## 問題根源

之前的實現有一個根本性的錯誤：

### ❌ 錯誤的實現
- **教師課程 API** (`/api/courses/`) 從 **Google Classroom API** 讀取課程
- **教師作業 API** (`/api/teacher/assignments/`) 從 **Google Classroom API** 讀取作業

這導致：
1. 教師看到的是 Google Classroom 的課程（學生視角）
2. 教師看不到他們在系統中創建的課程和作業
3. 數據來源錯誤

### ✅ 正確的實現
- **教師課程 API** (`/api/courses/`) 從 **本地資料庫 Course model** 讀取
- **教師作業 API** (`/api/teacher/assignments/`) 從 **本地資料庫 Homework model** 讀取

這樣：
1. 教師看到他們在系統中創建的課程
2. 教師看到他們為這些課程創建的作業
3. 數據來源正確

## 修改內容

### 1. 修改 `get_courses` API

**文件：** `ntub v2 2/ntub v2/classroomai/course/views.py`

**修改前：**
```python
# 從 Google Classroom API 讀取
service = build_google_service("classroom", "v1", creds)
courses_response = service.courses().list(
    courseStates=["ACTIVE"],
    teacherId="me",
    pageSize=50
).execute()
courses = courses_response.get("courses", [])
```

**修改後：**
```python
# 從本地資料庫讀取
prof = get_object_or_404(LineProfile, line_user_id=line_user_id)
courses = Course.objects.filter(owner=prof).order_by('-created_at')
```

### 2. 修改 `get_teacher_assignments` API

**文件：** `ntub v2 2/ntub v2/classroomai/course/views.py`

**修改前：**
```python
# 從 Google Classroom API 讀取
service = build_google_service("classroom", "v1", creds)
course_works = service.courses().courseWork().list(courseId=course_id).execute()
```

**修改後：**
```python
# 從本地資料庫讀取
prof = get_object_or_404(LineProfile, line_user_id=line_user_id)
courses = Course.objects.filter(owner=prof)
for course in courses:
    homeworks = Homework.objects.filter(course=course)
```

## 數據模型

### Course Model
```python
class Course(models.Model):
    owner           = models.ForeignKey(LineProfile, on_delete=models.CASCADE)
    name            = models.CharField(max_length=100)
    section         = models.CharField(max_length=50, blank=True)
    description     = models.TextField(blank=True)
    gc_course_id    = models.CharField(max_length=100, unique=True)
    enrollment_code = models.CharField(max_length=50, blank=True)
    course_state    = models.CharField(max_length=20, default='ACTIVE')
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
```

### Homework Model
```python
class Homework(models.Model):
    course          = models.ForeignKey(Course, on_delete=models.CASCADE)
    owner           = models.ForeignKey(LineProfile, on_delete=models.CASCADE)
    title           = models.CharField(max_length=200)
    description     = models.TextField(blank=True)
    gc_homework_id  = models.CharField(max_length=100, unique=True)
    gc_course_id    = models.CharField(max_length=100)
    state           = models.CharField(max_length=20, default="PUBLISHED")
    work_type       = models.CharField(max_length=20, default="ASSIGNMENT")
    due_date        = models.DateField(null=True, blank=True)
    due_time        = models.TimeField(null=True, blank=True)
    max_points      = models.IntegerField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
```

## API 回應格式

### 課程 API 回應
```json
{
  "line_user_id": "Uc8858c883da4bd4aecf9271aaa019a45",
  "user_email": "teacher@example.com",
  "user_role": "teacher",
  "total_courses": 4,
  "courses": [
    {
      "id": "course_123",
      "name": "數學課",
      "section": "A班",
      "description": "高等數學",
      "ownerId": "teacher@example.com",
      "enrollmentCode": "abc123",
      "courseState": "ACTIVE",
      "creationTime": "2024-01-01T00:00:00",
      "updateTime": "2024-01-02T00:00:00",
      "schedules": [
        {
          "day_of_week": 1,
          "day_name": "Tue",
          "start_time": "09:00",
          "end_time": "10:30",
          "location": "A101"
        }
      ],
      "has_schedule": true,
      "is_local": true,
      "google_classroom_url": "https://classroom.google.com/c/course_123"
    }
  ]
}
```

### 作業 API 回應
```json
{
  "message": "成功取得老師作業列表",
  "data": {
    "user_info": {
      "line_user_id": "Uc8858c883da4bd4aecf9271aaa019a45",
      "email": "teacher@example.com",
      "role": "teacher"
    },
    "summary": {
      "total_courses": 4,
      "total_assignments": 10,
      "upcoming_assignments_count": 2
    },
    "courses": [
      {
        "course_id": "course_123",
        "course_name": "數學課",
        "course_section": "A班",
        "total_assignments": 3,
        "upcoming_assignments": 1,
        "google_classroom_url": "https://classroom.google.com/c/course_123",
        "assignments": [
          {
            "id": "hw_456",
            "title": "作業一",
            "description": "完成習題 1-10",
            "state": "PUBLISHED",
            "work_type": "ASSIGNMENT",
            "due_date": "2024-01-15 23:59",
            "due_datetime": "2024-01-15T23:59:00",
            "is_upcoming": true,
            "creation_time": "2024-01-01T00:00:00",
            "update_time": "2024-01-02T00:00:00",
            "max_points": 100,
            "assignee_mode": "ALL_STUDENTS",
            "course_info": {
              "id": "course_123",
              "name": "數學課",
              "section": "A班"
            },
            "google_classroom_url": "https://classroom.google.com/c/course_123/a/hw_456/details"
          }
        ]
      }
    ],
    "upcoming_assignments": [...],
    "all_assignments": [...]
  }
}
```

## 測試步驟

### 1. 重新啟動後端服務器

```bash
cd "ntub v2 2/ntub v2/classroomai"
python manage.py runserver
```

### 2. 測試課程 API

```bash
curl "http://localhost:8000/api/courses/?line_user_id=Uc8858c883da4bd4aecf9271aaa019a45"
```

**預期結果：**
- 返回教師在資料庫中創建的課程
- 不是 Google Classroom 的課程

### 3. 測試作業 API

```bash
curl "http://localhost:8000/api/teacher/assignments/?line_user_id=Uc8858c883da4bd4aecf9271aaa019a45"
```

**預期結果：**
- 返回教師為這些課程創建的作業
- 不是 Google Classroom 的作業

### 4. 檢查後端日誌

應該看到：

```
========== get_courses API 開始 ==========
📥 收到請求參數 line_user_id: Uc8858c883da4bd4aecf9271aaa019a45
⏳ 查詢用戶...
✅ 找到用戶: teacher@example.com, 角色: teacher
⏳ 從資料庫查詢教師的課程...
✅ 資料庫返回 4 個課程
⏳ 開始格式化課程資料...
  處理課程 1/4: 數學課 (ID: course_123)
  處理課程 2/4: 英文課 (ID: course_456)
...
✅ 成功格式化 4 個課程
========== get_courses API 結束 ==========
```

### 5. 檢查前端顯示

1. 訪問教師頁面
2. 應該看到教師創建的課程列表
3. 應該看到這些課程的作業列表

## 注意事項

### 1. 數據來源
- **教師課程和作業**：來自本地資料庫（Course 和 Homework models）
- **學生課程和作業**：來自 Google Classroom API（通過 `/api/v2/web/` 端點）

### 2. 課程創建
教師需要通過以下方式創建課程：
- 使用 `/api/classrooms/` API 創建 Google Classroom 課程
- 課程會自動保存到本地資料庫的 Course model

### 3. 作業創建
教師需要通過以下方式創建作業：
- 使用 `/api/homeworks/` API 創建 Google Classroom 作業
- 作業會自動保存到本地資料庫的 Homework model

### 4. 數據同步
- 當教師創建課程/作業時，會同時創建 Google Classroom 資源和本地資料庫記錄
- 本地資料庫記錄包含 `gc_course_id` 和 `gc_homework_id` 以關聯 Google Classroom 資源

## 常見問題

### Q: 為什麼教師看不到課程？
A: 檢查資料庫中是否有 Course 記錄，且 owner 是該教師。

### Q: 為什麼教師看不到作業？
A: 檢查資料庫中是否有 Homework 記錄，且關聯到教師的課程。

### Q: 如何創建測試數據？
A: 使用 Django admin 或直接在資料庫中創建 Course 和 Homework 記錄。

### Q: 前端還是顯示空的？
A: 檢查：
1. 後端 API 是否返回數據（使用 curl 測試）
2. 前端是否正確調用 API（檢查 Network 標籤）
3. 前端是否正確解析數據（檢查 Console 日誌）
4. 瀏覽器緩存是否已清除

## 下一步

1. **重新啟動後端服務器**
2. **清除前端緩存並重新啟動**
3. **使用 test-teacher-api.html 測試 API**
4. **檢查後端和前端日誌**
5. **確認數據正確顯示**
