# 教師角色驗證問題

## 問題診斷

根據 Console 日誌：
```
[TeacherAssignmentDetail] 角色: undefined
[TeacherAssignmentDetail] 統計資料: {}
[TeacherAssignmentDetail] 未繳交學生數: 0
[TeacherAssignmentDetail] 已繳交學生數: 0
```

**問題原因：** 後端沒有正確判斷用戶為教師，返回的資料缺少教師角色的必要欄位。

## 後端角色判斷邏輯

後端使用以下邏輯判斷用戶是否為教師：

### 方法 1: Google API 驗證（主要方法）
```python
# 查詢課程的教師名單
teachers_response = service.courses().teachers().list(courseId=course_id).execute()
teacher_emails = [t.get("profile", {}).get("emailAddress") for t in teachers_response.get("teachers", [])]

# 檢查用戶的 email 是否在教師名單中
is_teacher = prof.email in teacher_emails
```

### 方法 2: 課程擁有者檢查（備用方法）
```python
# 如果方法 1 失敗，檢查是否為課程擁有者
is_teacher = course.get("ownerId") == prof.email
```

## 可能的原因

### 1. 用戶不是課程的教師
**症狀：** 用戶的 email 不在課程的教師名單中

**解決方案：**
- 確認用戶的 Google 帳號是否為此課程的教師
- 在 Google Classroom 中檢查課程的教師名單
- 確認用戶的 email 與 Google Classroom 中的 email 一致

### 2. LineProfile 中的 email 不正確
**症狀：** 資料庫中的 email 與 Google 帳號的 email 不一致

**解決方案：**
```python
# 檢查資料庫中的 email
prof = LineProfile.objects.get(line_user_id=line_user_id)
print(f"資料庫中的 email: {prof.email}")

# 檢查 Google 帳號的 email
userinfo = service.userProfiles().get(userId='me').execute()
print(f"Google 帳號的 email: {userinfo.get('emailAddress')}")
```

### 3. Google Classroom API 權限不足
**症狀：** 無法查詢課程的教師名單

**解決方案：**
- 確認 Google OAuth 授權範圍包含 `classroom.courses.readonly`
- 重新授權 Google 帳號

### 4. 課程 ID 不正確
**症狀：** 查詢的課程不存在或用戶沒有權限

**解決方案：**
- 確認課程 ID 是否正確
- 檢查用戶是否有權限訪問此課程

## 調試步驟

### 步驟 1: 檢查後端日誌

查看後端日誌中的角色判斷過程：

```bash
# 查看後端日誌
tail -f /path/to/django/logs/debug.log | grep -A 10 "get_submissions_status"
```

查找以下關鍵字：
- `驗證教師身份`
- `is_teacher`
- `teacher_emails`

### 步驟 2: 檢查用戶的 email

在 Django shell 中執行：

```python
from classroomai.models import LineProfile

# 替換成實際的 LINE User ID
line_user_id = "U1234567890abcdef"
prof = LineProfile.objects.get(line_user_id=line_user_id)

print(f"LINE User ID: {prof.line_user_id}")
print(f"Email: {prof.email}")
print(f"Role: {prof.role}")
print(f"Name: {prof.name}")
```

### 步驟 3: 檢查 Google Classroom 教師名單

使用 Google Classroom API 查詢：

```python
from googleapiclient.discovery import build
from classroomai.utils import get_valid_google_credentials

# 獲取憑證
creds = get_valid_google_credentials(prof)
service = build('classroom', 'v1', credentials=creds)

# 查詢教師名單
course_id = "123456789"  # 替換成實際的課程 ID
teachers_response = service.courses().teachers().list(courseId=course_id).execute()

print("課程教師名單：")
for teacher in teachers_response.get("teachers", []):
    profile = teacher.get("profile", {})
    print(f"  - {profile.get('name', {}).get('fullName')}: {profile.get('emailAddress')}")
```

### 步驟 4: 手動測試角色判斷

在 Django shell 中執行：

```python
from classroomai.models import LineProfile
from classroomai.utils import get_valid_google_credentials
from googleapiclient.discovery import build

# 設定參數
line_user_id = "U1234567890abcdef"  # 替換成實際的 LINE User ID
course_id = "123456789"  # 替換成實際的課程 ID

# 獲取用戶和憑證
prof = LineProfile.objects.get(line_user_id=line_user_id)
creds = get_valid_google_credentials(prof)
service = build('classroom', 'v1', credentials=creds)

# 查詢教師名單
teachers_response = service.courses().teachers().list(courseId=course_id).execute()
teacher_emails = [t.get("profile", {}).get("emailAddress") for t in teachers_response.get("teachers", [])]

# 判斷是否為教師
is_teacher = prof.email in teacher_emails

print(f"用戶 email: {prof.email}")
print(f"教師 emails: {teacher_emails}")
print(f"是否為教師: {is_teacher}")
```

## 臨時解決方案

### 方案 1: 手動設定用戶為教師

在 Django admin 或 shell 中：

```python
from classroomai.models import LineProfile

line_user_id = "U1234567890abcdef"
prof = LineProfile.objects.get(line_user_id=line_user_id)
prof.role = 'teacher'
prof.save()

print(f"已將用戶 {prof.name} 設定為教師")
```

### 方案 2: 更新用戶的 email

如果資料庫中的 email 不正確：

```python
from classroomai.models import LineProfile

line_user_id = "U1234567890abcdef"
correct_email = "teacher@example.com"  # 替換成正確的 email

prof = LineProfile.objects.get(line_user_id=line_user_id)
prof.email = correct_email
prof.save()

print(f"已更新用戶 {prof.name} 的 email 為 {correct_email}")
```

### 方案 3: 修改後端邏輯（不推薦）

如果確定用戶是教師但後端無法驗證，可以臨時修改後端邏輯：

```python
# 在 views.py 的 get_submissions_status 函數中
# 找到 is_teacher 的判斷邏輯，添加額外的檢查

# 原始邏輯
is_teacher = prof.email in teacher_emails

# 修改為（臨時）
is_teacher = prof.email in teacher_emails or prof.role == 'teacher'
```

**注意：** 這個方案不推薦，因為它繞過了 Google Classroom 的權限驗證。

## 前端錯誤處理

前端現在會檢測這個問題並顯示友好的錯誤訊息：

```
無法載入作業繳交狀態：您可能不是此課程的教師，或後端無法驗證您的教師身份。
請確認您的 Google 帳號是否為此課程的教師。
```

## 相關文件

- `QUICK_FIX_GUIDE.md` - 快速診斷指南
- `HOW_TO_DEBUG_SUBMISSION_STATUS.md` - 詳細調試步驟
- `SUBMISSION_STATUS_DEBUG_COMPLETE.md` - 完整修復文件
