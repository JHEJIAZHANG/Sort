# 提醒功能使用暫存資料修復

## 問題描述
「提醒未繳交」按鈕顯示「目前沒有未繳交學生」，但實際上有未繳交的學生。

## 根本原因
`teacher_send_assignment_reminder` 函數沒有使用 `HomeworkStatisticsCache` 中的暫存資料，而是重新查詢 Google Classroom API，導致：
1. 效能較差（重複 API 調用）
2. 可能因為 API 限制或權限問題而失敗
3. 與前端顯示的資料不一致

## 修復內容

### 1. 優先使用暫存資料

修改 `teacher_send_assignment_reminder` 函數，使其：

#### 步驟 1：獲取未繳交學生列表
```python
# 優先從 HomeworkStatisticsCache 獲取
cached_data = HomeworkStatisticsCache.get_valid_cache(
    line_user_id=line_user_id,
    course_id=course_id,
    coursework_id=coursework_id
)

if cached_data and cached_data.is_valid():
    # 使用暫存資料
    unsubmitted_students = cached_data.unsubmitted_students
    student_ids = [student.get("userId") for student in unsubmitted_students]
else:
    # 備用方案：使用 Google API
    # ...
```

#### 步驟 2：獲取學生詳細資訊
```python
# 從暫存中建立學生資訊映射表
student_info_map = {}
for student in unsubmitted_students:
    user_id = str(student.get("userId", ""))
    if user_id:
        student_info_map[user_id] = {
            "name": student.get("name", "同學"),
            "email": student.get("emailAddress", "")
        }
```

#### 步驟 3：發送提醒
```python
for student_id in student_ids:
    # 優先使用暫存中的學生資訊
    if student_id in student_info_map:
        student_name = student_info_map[student_id]["name"]
        student_email = student_info_map[student_id]["email"]
    else:
        # 備用方案：使用 Google API
        # ...
    
    # 查找 LINE 帳號並發送提醒
    # ...
```

### 2. 改善日誌輸出

添加了更詳細的日誌，方便追蹤：

```
[Reminder] 收到提醒請求: course_id=XXX, coursework_id=YYY
[Reminder] 嘗試從暫存中獲取未繳交學生列表...
[Reminder] ✓ 找到有效的暫存資料
[Reminder] 從暫存中找到 5 位未繳交學生
[Reminder] 從暫存中獲取了 5 位學生的資訊
[Reminder] 使用暫存資料: 張三 (student1@example.com)
[Reminder] ✓ 已發送 LINE 提醒給: 張三
```

### 3. 備用方案

如果暫存資料不可用（過期或不存在），會自動使用 Google Classroom API：

```
[Reminder] ✗ 暫存資料不存在或已過期，改用 Google API
[Reminder] 從 Google API 找到 5 位未繳交學生
```

## 資料流程

### 正常流程（使用暫存）

```
用戶點擊「提醒未繳交」
    ↓
前端調用 getAssignmentSubmissionStatus
    ↓
後端查詢 Google API 並暫存到 HomeworkStatisticsCache
    ↓
前端顯示未繳交學生列表
    ↓
用戶點擊「確認提醒」
    ↓
前端調用 sendAssignmentReminder
    ↓
後端從 HomeworkStatisticsCache 讀取未繳交學生資料
    ↓
後端查找學生的 LINE 帳號
    ↓
後端發送 LINE 提醒
    ↓
返回提醒結果
```

### 備用流程（暫存不可用）

```
用戶點擊「提醒未繳交」
    ↓
前端調用 sendAssignmentReminder
    ↓
後端嘗試從 HomeworkStatisticsCache 讀取
    ↓
暫存不可用（過期或不存在）
    ↓
後端查詢 Google Classroom API
    ↓
後端獲取未繳交學生列表
    ↓
後端查找學生的 LINE 帳號
    ↓
後端發送 LINE 提醒
    ↓
返回提醒結果
```

## 優勢

### 1. 效能提升
- 減少 Google Classroom API 調用次數
- 避免 API 速率限制
- 提高回應速度

### 2. 資料一致性
- 前端顯示的資料與提醒使用的資料一致
- 避免因 API 延遲導致的資料不同步

### 3. 可靠性提升
- 即使 Google API 暫時不可用，仍可使用暫存資料
- 多層備用方案確保功能可用

### 4. 隱私保護
- 學生個資存在資料庫暫存中
- 不會在日誌中洩露敏感資訊

## 暫存資料結構

`HomeworkStatisticsCache` 模型包含：

```python
{
    "line_user_id": "教師的 LINE User ID",
    "course_id": "課程 ID",
    "coursework_id": "作業 ID",
    "course_name": "課程名稱",
    "homework_title": "作業標題",
    "total_students": 10,
    "submitted_count": 7,
    "unsubmitted_count": 3,
    "completion_rate": 70.0,
    "unsubmitted_students": [
        {
            "name": "張三",
            "userId": "123456",
            "emailAddress": "student1@example.com"
        },
        // ...
    ],
    "submitted_students": [...],
    "status_counts": {...},
    "expires_at": "2024-01-01T12:00:00Z"
}
```

## 暫存有效期

- **預設有效期**：1 小時
- **自動更新**：當 `get_submissions_status` 被調用時
- **手動清除**：可以透過 Django admin 或管理命令清除

## 測試建議

### 測試場景 1：正常使用暫存
1. 進入作業詳情頁面（觸發 `get_submissions_status`）
2. 確認顯示未繳交學生
3. 點擊「提醒未繳交」
4. 檢查後端日誌，應該看到「使用暫存資料」

### 測試場景 2：暫存過期
1. 等待 1 小時以上（或手動刪除暫存）
2. 直接調用提醒 API（不先查看作業詳情）
3. 檢查後端日誌，應該看到「改用 Google API」

### 測試場景 3：部分學生未綁定 LINE
1. 確保有學生未綁定 LINE 帳號
2. 點擊「提醒未繳交」
3. 檢查回應，應該顯示成功和失敗的數量

## 監控建議

### 關鍵指標
- 暫存命中率（使用暫存 vs 使用 API）
- 提醒成功率
- LINE 發送失敗率
- API 調用次數

### 日誌關鍵字
- `[Reminder] ✓ 找到有效的暫存資料` - 暫存命中
- `[Reminder] ✗ 暫存資料不存在或已過期` - 暫存未命中
- `[Reminder] ✓ 已發送 LINE 提醒給` - 提醒成功
- `[Reminder] ✗ LINE 提醒失敗` - 提醒失敗
- `[Reminder] ⚠ 學生未綁定 LINE` - 學生未綁定

## 後續改進

1. **Email 提醒功能**：為未綁定 LINE 的學生發送 Email
2. **批量提醒優化**：使用 LINE Messaging API 的 multicast 功能
3. **提醒歷史記錄**：記錄每次提醒的時間和結果
4. **提醒頻率限制**：避免短時間內重複提醒同一學生
5. **自定義提醒訊息**：允許教師自定義提醒內容
