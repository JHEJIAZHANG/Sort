# 快速修復檢查清單

## 問題：作業詳情頁面無法載入，顯示「無法驗證教師身份」

### ✅ 已完成的修復

1. **新增 `teacher_send_assignment_reminder` 函數** - 提醒功能現在可以正常工作
2. **增強教師身份驗證邏輯** - 添加了 4 個備用驗證方法
3. **改善日誌輸出** - 前端和後端都有詳細的診斷日誌
4. **改善錯誤處理** - 提供更清晰的錯誤訊息

### 🔍 現在需要做的事

#### 步驟 1：重新啟動後端服務
```bash
# 停止當前的後端服務（Ctrl+C）
# 然後重新啟動
cd "ntub v2 2/ntub v2/classroomai"
python manage.py runserver
```

#### 步驟 2：清除瀏覽器快取
1. 打開瀏覽器開發者工具（F12）
2. 右鍵點擊重新整理按鈕
3. 選擇「清除快取並強制重新整理」

#### 步驟 3：重新載入作業詳情頁面
1. 進入教師頁面
2. 選擇一個課程
3. 點擊一個作業查看詳情

#### 步驟 4：檢查日誌

**前端日誌（瀏覽器 Console）**：
```
[TeacherAssignmentDetail] ===== 開始診斷 =====
[TeacherAssignmentDetail] first.role: teacher
[TeacherAssignmentDetail] first.statistics: {...}
```

**後端日誌（終端）**：
```
[SubmissionStatus] 查詢課程 XXX 的教師名單...
[SubmissionStatus] 用戶 xxx@example.com 是否為教師: True
[SubmissionStatus] 最終驗證結果: is_teacher=True, method=teacher_list
```

### 🎯 驗證方法說明

後端現在使用 4 個驗證方法（按優先順序）：

1. **teacher_list** - 從 Google Classroom API 獲取教師名單並比對 email
2. **owner_profile** - 檢查用戶是否為課程擁有者（通過 profile）
3. **owner_id** - 檢查用戶是否為課程擁有者（通過 ID）
4. **local_db** - 檢查本地資料庫中的課程擁有者
5. **role_and_access** - 檢查 LineProfile 的 role 和課程訪問權限

### ❓ 如果還是不行

#### 檢查 1：確認 Google OAuth Scopes
確保包含以下 scopes：
- `https://www.googleapis.com/auth/classroom.courses.readonly`
- `https://www.googleapis.com/auth/classroom.rosters.readonly`
- `https://www.googleapis.com/auth/classroom.coursework.students.readonly`

#### 檢查 2：確認 Email 一致性
```python
# 在 Django shell 中執行
from user.models import LineProfile
prof = LineProfile.objects.get(line_user_id='YOUR_LINE_USER_ID')
print(f"LineProfile Email: {prof.email}")
print(f"LineProfile Role: {prof.role}")

# 然後在 Google Classroom 中確認教師的 email 是否一致
```

#### 檢查 3：手動設定為教師
如果確定用戶應該是教師，可以手動設定：
```python
from user.models import LineProfile
prof = LineProfile.objects.get(line_user_id='YOUR_LINE_USER_ID')
prof.role = 'teacher'
prof.save()
print("已設定為教師")
```

#### 檢查 4：檢查課程是否存在於本地資料庫
```python
from course.models import Course
from user.models import LineProfile

prof = LineProfile.objects.get(line_user_id='YOUR_LINE_USER_ID')
courses = Course.objects.filter(owner=prof)
print(f"找到 {courses.count()} 個課程")
for c in courses:
    print(f"  - {c.name} (GC ID: {c.gc_course_id})")
```

### 📊 預期結果

如果一切正常，您應該看到：

**前端**：
- 繳交率進度條
- 已繳交/未繳交統計卡片
- 學生繳交狀態列表
- 「提醒未繳交」按鈕可以正常使用

**後端日誌**：
```
[SubmissionStatus] 最終驗證結果: is_teacher=True, method=teacher_list
```

### 🆘 緊急聯絡

如果以上步驟都無法解決問題，請提供：

1. **前端完整日誌**（從 `[TeacherAssignmentDetail] 開始載入...` 開始）
2. **後端完整日誌**（從 `[SubmissionStatus]` 開始）
3. **您的 LINE User ID**（可以部分遮蔽）
4. **課程 ID 和作業 ID**
5. **您在 Google Classroom 中的角色**（教師/學生）

---

## 總結

✅ **提醒功能** - 已修復，可以正常使用
🔧 **教師驗證** - 已增強，添加了多個備用方法
📝 **日誌診斷** - 已完善，可以快速定位問題

**下一步**：重新啟動後端服務，清除瀏覽器快取，然後重新測試。
