# 教師角色驗證問題診斷指南

## 問題描述
作業詳情頁面顯示錯誤：「無法載入作業繳交狀態：您可能不是此課程的教師，或後端無法驗證您的教師身份。」

## 診斷步驟

### 1. 檢查瀏覽器控制台日誌

打開瀏覽器開發者工具（F12），查看 Console 標籤，尋找以下日誌：

#### 前端日誌
```
[TeacherAssignmentDetail] ===== 開始診斷 =====
[TeacherAssignmentDetail] data 的所有鍵: [...]
[TeacherAssignmentDetail] data.results 存在? true/false
[TeacherAssignmentDetail] results 陣列長度: X
[TeacherAssignmentDetail] ===== 第一筆結果分析 =====
[TeacherAssignmentDetail] first.role: teacher/student
[TeacherAssignmentDetail] first.statistics: {...}
[TeacherAssignmentDetail] first.unsubmitted_students: [...]
```

**關鍵檢查點**：
- `data.results` 是否存在？
- `results` 陣列長度是否大於 0？
- `first.role` 是 "teacher" 還是 "student"？
- `first.statistics` 是否存在？
- `first.unsubmitted_students` 是否存在？

### 2. 檢查後端日誌

查看後端控制台或日誌文件，尋找以下日誌：

```
[SubmissionStatus] 查詢課程 XXX 的教師名單...
[SubmissionStatus] 課程教師: ['teacher1@example.com', 'teacher2@example.com']
[SubmissionStatus] 用戶 your-email@example.com 是否為教師: True/False
[SubmissionStatus] 教師名單: [...]
```

**關鍵檢查點**：
- 課程的教師名單中是否包含您的 email？
- 用戶的 email 是否與 Google 帳號的 email 一致？
- 是否有「驗證教師身份失敗」的錯誤訊息？

### 3. 驗證用戶資料

#### 檢查 LineProfile 中的 email
```python
# 在 Django shell 中執行
from user.models import LineProfile
prof = LineProfile.objects.get(line_user_id='YOUR_LINE_USER_ID')
print(f"Email: {prof.email}")
print(f"Role: {prof.role}")
```

#### 檢查 Google Classroom 中的教師身份
使用 Google Classroom API Explorer 或直接查看課程設定：
1. 前往 https://classroom.google.com/
2. 進入課程
3. 點擊「人員」標籤
4. 確認您的帳號是否在「教師」列表中

### 4. 常見問題與解決方案

#### 問題 A：Email 不匹配
**症狀**：後端日誌顯示用戶 email 不在教師名單中

**原因**：
- LineProfile 中的 email 與 Google 帳號的 email 不一致
- 使用了不同的 Google 帳號登入

**解決方案**：
1. 確認 Google OAuth 登入時使用的帳號
2. 更新 LineProfile 中的 email：
```python
prof = LineProfile.objects.get(line_user_id='YOUR_LINE_USER_ID')
prof.email = 'correct-email@example.com'
prof.save()
```

#### 問題 B：Google API 權限不足
**症狀**：後端日誌顯示「驗證教師身份失敗」

**原因**：
- Google OAuth scope 缺少必要的權限
- Google API 憑證過期

**解決方案**：
1. 確認 OAuth scope 包含：
   - `https://www.googleapis.com/auth/classroom.courses.readonly`
   - `https://www.googleapis.com/auth/classroom.rosters.readonly`
2. 重新授權 Google 帳號

#### 問題 C：課程 ID 錯誤
**症狀**：無法找到課程或作業

**原因**：
- 傳遞的 course_id 或 coursework_id 不正確
- 課程已被刪除或封存

**解決方案**：
1. 確認 course_id 和 coursework_id 是否正確
2. 檢查課程是否仍然存在於 Google Classroom

#### 問題 D：後端返回的數據結構不正確
**症狀**：前端日誌顯示 `first.statistics` 或 `first.unsubmitted_students` 不存在

**原因**：
- 後端判斷用戶為學生角色
- 後端發生錯誤但沒有正確返回錯誤訊息

**解決方案**：
1. 檢查後端日誌中的角色判斷邏輯
2. 確認 `is_teacher` 變數的值
3. 檢查是否有異常被捕獲但沒有正確處理

### 5. 手動測試 API

使用 curl 或 Postman 測試 API：

```bash
curl -X POST http://localhost:8000/api/classroom/submissions/status/ \
  -H "Content-Type: application/json" \
  -d '{
    "line_user_id": "YOUR_LINE_USER_ID",
    "course_coursework_pairs": [
      {
        "course_id": "COURSE_ID",
        "coursework_id": "COURSEWORK_ID"
      }
    ]
  }'
```

**預期回應（教師角色）**：
```json
{
  "query_mode": "batch",
  "total_queries": 1,
  "successful_queries": 1,
  "failed_queries": 0,
  "teacher_queries": 1,
  "student_queries": 0,
  "results": [
    {
      "course_id": "...",
      "coursework_id": "...",
      "course_name": "...",
      "homework_title": "...",
      "role": "teacher",
      "statistics": {
        "total_students": 10,
        "submitted": 7,
        "unsubmitted": 3,
        "completion_rate": 70.0
      },
      "unsubmitted_students": [
        {
          "name": "學生A",
          "userId": "...",
          "emailAddress": "..."
        }
      ],
      "submitted_students": [...]
    }
  ]
}
```

### 6. 緊急修復方案

如果以上方法都無法解決，可以嘗試以下緊急修復：

#### 方案 1：強制設定為教師角色
```python
# 在 Django shell 中執行
from user.models import LineProfile
prof = LineProfile.objects.get(line_user_id='YOUR_LINE_USER_ID')
prof.role = 'teacher'
prof.save()
```

#### 方案 2：清除快取並重新授權
1. 清除瀏覽器快取和 cookies
2. 登出並重新登入
3. 重新授權 Google 帳號

#### 方案 3：檢查資料庫中的課程記錄
```python
from course.models import Course
courses = Course.objects.filter(owner__line_user_id='YOUR_LINE_USER_ID')
for course in courses:
    print(f"Course: {course.name}, GC ID: {course.gc_course_id}")
```

### 7. 聯絡支援

如果問題仍然存在，請提供以下資訊：

1. 前端控制台的完整日誌（特別是 `[TeacherAssignmentDetail]` 開頭的）
2. 後端日誌中的 `[SubmissionStatus]` 相關日誌
3. 您的 LINE User ID（可以部分遮蔽）
4. 課程 ID 和作業 ID
5. 您的 Google 帳號 email（可以部分遮蔽）

## 預防措施

1. **確保 email 一致性**：在註冊和授權時使用相同的 Google 帳號
2. **定期檢查權限**：確保 Google OAuth scope 包含所有必要的權限
3. **監控日誌**：定期檢查後端日誌，及早發現問題
4. **測試環境**：在測試環境中先驗證功能，再部署到生產環境
