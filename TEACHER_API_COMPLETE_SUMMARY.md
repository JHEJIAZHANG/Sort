# 教師 API 完整總結

## ✅ 最終確認

### 前端（已正確配置）

**教師專用 Hook：** `coursemanagement/hooks/use-teacher-courses.ts`
```typescript
// ✅ 正確：使用教師專用 API
const coursesRes = await ApiService.getTeacherCourses(lineUserId)
const assignmentsRes = await ApiService.getTeacherAssignments(lineUserId)
```

**API 服務：** `coursemanagement/services/apiService.ts`
```typescript
// ✅ 教師課程 API（正確）
static async getTeacherCourses(lineUserId: string) {
  const resp = await this.request<any>(`/courses/${qs}`, {}, 'other')
  // 調用 /api/courses/ → 從 Course model 讀取
}

// ✅ 教師作業 API（正確）
static async getTeacherAssignments(lineUserId: string, params?) {
  const resp = await this.request<any>(`/teacher/assignments/${qs}`, {}, 'other')
  // 調用 /api/teacher/assignments/ → 從 Homework model 讀取
}

// ⚠️ 學生課程 API（不要在教師頁面使用）
static async getCourses(lineUserId: string) {
  const resp = await this.request<any>(`/web/courses/list/${qs}`)
  // 調用 /api/v2/web/courses/list/ → 學生專用
}
```

### 後端（已正確配置）

**教師課程 API：** `ntub v2 2/ntub v2/classroomai/course/views.py`
```python
@api_view(["GET"])
def get_courses(request):
    """GET /api/courses/?line_user_id=xxx"""
    # ✅ 從本地資料庫讀取
    prof = get_object_or_404(LineProfile, line_user_id=line_user_id)
    courses = Course.objects.filter(owner=prof).order_by('-created_at')
    # 返回教師創建的課程
```

**教師作業 API：** `ntub v2 2/ntub v2/classroomai/course/views.py`
```python
@api_view(["GET"])
def get_teacher_assignments(request):
    """GET /api/teacher/assignments/?line_user_id=xxx"""
    # ✅ 從本地資料庫讀取
    prof = get_object_or_404(LineProfile, line_user_id=line_user_id)
    courses = Course.objects.filter(owner=prof)
    for course in courses:
        homeworks = Homework.objects.filter(course=course)
    # 返回教師創建的作業
```

## 數據流程

### 教師端（正確）
```
教師頁面 (teacher/page.tsx)
  ↓
use-teacher-courses hook
  ↓
ApiService.getTeacherCourses() → /api/courses/
  ↓
Course.objects.filter(owner=prof) ← 本地資料庫
  ↓
返回教師創建的課程

ApiService.getTeacherAssignments() → /api/teacher/assignments/
  ↓
Homework.objects.filter(course=course) ← 本地資料庫
  ↓
返回教師創建的作業
```

### 學生端（不同的流程）
```
學生頁面
  ↓
use-courses hook
  ↓
ApiService.getCourses() → /api/v2/web/courses/list/
  ↓
整合 API（本地 + Google Classroom）
  ↓
返回學生的課程
```

## 關鍵區別

| 項目 | 教師端 | 學生端 |
|------|--------|--------|
| **API 端點** | `/api/courses/`<br>`/api/teacher/assignments/` | `/api/v2/web/courses/list/`<br>`/api/v2/web/assignments/list/` |
| **數據來源** | Course model<br>Homework model | 整合 API（本地 + Classroom） |
| **Hook** | `use-teacher-courses` | `use-courses` |
| **API 方法** | `getTeacherCourses()`<br>`getTeacherAssignments()` | `getCourses()`<br>`getAssignments()` |
| **數據類型** | 教師創建的課程和作業 | 學生參與的課程和作業 |

## 重要規則

### ✅ 正確做法
1. **教師頁面**只使用 `getTeacherCourses()` 和 `getTeacherAssignments()`
2. **教師 API** 只從 `Course` 和 `Homework` models 讀取
3. **數據完全分離**：教師看到的是他們創建的課程，學生看到的是他們參與的課程

### ❌ 錯誤做法
1. ~~教師頁面使用 `getCourses()`（學生 API）~~
2. ~~教師 API 從 Google Classroom API 讀取~~
3. ~~混用教師和學生的 API~~

## 測試確認

### 1. 檢查前端調用
打開瀏覽器開發者工具 → Network 標籤

**應該看到：**
```
GET /api/courses/?line_user_id=xxx
GET /api/teacher/assignments/?line_user_id=xxx
```

**不應該看到：**
```
GET /api/v2/web/courses/list/...  ← 這是學生 API
GET /api/v2/web/assignments/list/...  ← 這是學生 API
```

### 2. 檢查後端日誌
**應該看到：**
```
========== get_courses API 開始 ==========
⏳ 從資料庫查詢教師的課程...
✅ 資料庫返回 4 個課程

========== get_teacher_assignments API 開始 ==========
⏳ 從資料庫查詢教師的課程...
✅ 找到 4 個課程
⏳ 開始查詢每個課程的作業...
✅ 成功處理作業: 總作業數: 2
```

### 3. 檢查前端 Console
**應該看到：**
```
========== useTeacherCourses: 開始載入教師資料 ==========
📞 調用 ApiService.getTeacherCourses...
========== getTeacherCourses 開始 ==========
🔗 完整 API URL: /api/courses/?line_user_id=xxx
✅ 最終課程數量: 4

📞 調用 ApiService.getTeacherAssignments...
========== getTeacherAssignments 開始 ==========
🔗 完整 API URL: /api/teacher/assignments/?line_user_id=xxx
✅ 最終作業數量: 2
```

## 故障排除

### 問題：教師看不到課程
**檢查：**
1. 資料庫中是否有 `Course` 記錄？
2. `Course.owner` 是否指向該教師？
3. 後端日誌顯示找到幾個課程？

**解決：**
```sql
-- 檢查資料庫
SELECT * FROM course_course WHERE owner_id = (
  SELECT id FROM user_lineprofile WHERE line_user_id = 'Uc8858c883da4bd4aecf9271aaa019a45'
);
```

### 問題：教師看不到作業
**檢查：**
1. 資料庫中是否有 `Homework` 記錄？
2. `Homework.course` 是否關聯到教師的課程？
3. 後端日誌顯示找到幾個作業？

**解決：**
```sql
-- 檢查資料庫
SELECT h.* FROM course_homework h
JOIN course_course c ON h.course_id = c.id
WHERE c.owner_id = (
  SELECT id FROM user_lineprofile WHERE line_user_id = 'Uc8858c883da4bd4aecf9271aaa019a45'
);
```

### 問題：前端還在調用學生 API
**檢查：**
1. 瀏覽器緩存是否已清除？
2. 前端服務器是否已重新啟動？
3. Network 標籤顯示的 URL 是什麼？

**解決：**
```bash
# 清除緩存並重新啟動
cd coursemanagement
rm -rf .next
npm run dev
```

## 最終狀態

✅ **前端**：使用 `getTeacherCourses()` 和 `getTeacherAssignments()`  
✅ **後端**：從 `Course` 和 `Homework` models 讀取  
✅ **數據分離**：教師和學生的數據完全獨立  
✅ **API 正確**：教師 API 在 `/api/courses/` 和 `/api/teacher/assignments/`  
✅ **無混用**：不會調用學生的 `/api/v2/web/` 端點  

## 結論

教師 API 已經完全修正，確保：
1. 教師只看到他們創建的課程和作業
2. 不會讀取學生的資料
3. 數據來源正確（本地資料庫 Course/Homework models）
4. API 端點正確（/api/courses/ 和 /api/teacher/assignments/）
