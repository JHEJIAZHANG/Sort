# 測試作業繳交狀態 API

## 測試步驟

### 1. 在瀏覽器 Console 中執行以下代碼

```javascript
// 設定你的 LINE User ID 和課程/作業 ID
const LINE_USER_ID = "你的LINE_USER_ID";  // 替換成實際的 LINE User ID
const COURSE_ID = "課程ID";  // 替換成實際的課程 ID
const ASSIGNMENT_ID = "作業ID";  // 替換成實際的作業 ID

// 測試 API
async function testSubmissionStatus() {
  console.log("=== 開始測試作業繳交狀態 API ===");
  
  const url = "/api/classroom/submissions/status/";
  const payload = {
    line_user_id: LINE_USER_ID,
    course_coursework_pairs: [
      {
        course_id: COURSE_ID,
        coursework_id: ASSIGNMENT_ID
      }
    ]
  };
  
  console.log("請求 URL:", url);
  console.log("請求 Payload:", JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Line-User-Id": LINE_USER_ID
      },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    
    console.log("回應狀態:", response.status, response.statusText);
    
    const data = await response.json();
    console.log("回應資料:", JSON.stringify(data, null, 2));
    
    // 檢查資料結構
    if (data.results && Array.isArray(data.results)) {
      console.log("✅ results 是陣列");
      console.log("results 長度:", data.results.length);
      
      if (data.results.length > 0) {
        const first = data.results[0];
        console.log("第一筆結果:", JSON.stringify(first, null, 2));
        
        // 檢查必要欄位
        console.log("\n=== 欄位檢查 ===");
        console.log("role:", first.role);
        console.log("statistics:", first.statistics);
        console.log("unsubmitted_students:", first.unsubmitted_students);
        console.log("submitted_students:", first.submitted_students);
        
        if (first.role === "teacher") {
          console.log("✅ 角色是教師");
          
          if (first.statistics) {
            console.log("✅ 有統計資料");
            console.log("  - total_students:", first.statistics.total_students);
            console.log("  - submitted:", first.statistics.submitted);
            console.log("  - unsubmitted:", first.statistics.unsubmitted);
            console.log("  - completion_rate:", first.statistics.completion_rate);
          } else {
            console.log("❌ 缺少統計資料");
          }
          
          if (Array.isArray(first.unsubmitted_students)) {
            console.log("✅ unsubmitted_students 是陣列");
            console.log("  - 未繳交學生數:", first.unsubmitted_students.length);
            if (first.unsubmitted_students.length > 0) {
              console.log("  - 第一位未繳交學生:", JSON.stringify(first.unsubmitted_students[0], null, 2));
              
              // 檢查 userId 欄位
              const hasUserId = first.unsubmitted_students.every(s => s.userId);
              if (hasUserId) {
                console.log("  ✅ 所有未繳交學生都有 userId");
              } else {
                console.log("  ❌ 部分未繳交學生缺少 userId");
              }
            }
          } else {
            console.log("❌ unsubmitted_students 不是陣列或不存在");
          }
          
          if (Array.isArray(first.submitted_students)) {
            console.log("✅ submitted_students 是陣列");
            console.log("  - 已繳交學生數:", first.submitted_students.length);
            if (first.submitted_students.length > 0) {
              console.log("  - 第一位已繳交學生:", JSON.stringify(first.submitted_students[0], null, 2));
            }
          } else {
            console.log("❌ submitted_students 不是陣列或不存在");
          }
        } else {
          console.log("❌ 角色不是教師:", first.role);
        }
      } else {
        console.log("❌ results 陣列為空");
      }
    } else {
      console.log("❌ results 不是陣列或不存在");
    }
    
  } catch (error) {
    console.error("❌ 測試失敗:", error);
  }
  
  console.log("\n=== 測試完成 ===");
}

// 執行測試
testSubmissionStatus();
```

### 2. 檢查輸出

查看 Console 中的輸出，確認：

1. **API 回應狀態** - 應該是 200
2. **資料結構** - 應該有 `results` 陣列
3. **角色** - 應該是 `teacher`
4. **統計資料** - 應該有 `statistics` 物件
5. **學生列表** - 應該有 `unsubmitted_students` 和 `submitted_students` 陣列
6. **userId 欄位** - 每個學生都應該有 `userId`

### 3. 常見問題

#### 問題 1: results 陣列為空
**可能原因:**
- 課程 ID 或作業 ID 不正確
- 用戶沒有教師權限
- Google Classroom API 查詢失敗

**解決方法:**
- 檢查課程 ID 和作業 ID 是否正確
- 確認用戶角色是 teacher
- 查看後端日誌

#### 問題 2: unsubmitted_students 為空但實際有未繳交學生
**可能原因:**
- 後端沒有正確解析學生提交狀態
- Google Classroom API 回應格式變更

**解決方法:**
- 查看後端日誌中的 Google Classroom API 回應
- 確認後端的狀態判斷邏輯（NEW, CREATED, RECLAIMED_BY_STUDENT）

#### 問題 3: 學生沒有 userId
**可能原因:**
- 後端沒有正確提取 userId
- Google Classroom API 回應中缺少 userId

**解決方法:**
- 查看後端日誌中的原始 API 回應
- 確認後端的資料映射邏輯

## 測試提醒 API

```javascript
// 測試提醒 API
async function testReminder() {
  console.log("=== 開始測試提醒 API ===");
  
  const url = "/api/v2/teacher/assignments/reminder/";
  const payload = {
    line_user_id: LINE_USER_ID,
    course_id: COURSE_ID,
    coursework_id: ASSIGNMENT_ID,
    student_ids: []  // 空陣列表示提醒所有未繳交學生
  };
  
  console.log("請求 URL:", url);
  console.log("請求 Payload:", JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Line-User-Id": LINE_USER_ID
      },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    
    console.log("回應狀態:", response.status, response.statusText);
    
    const data = await response.json();
    console.log("回應資料:", JSON.stringify(data, null, 2));
    
    if (data.message) {
      console.log("✅ 提醒發送成功");
      console.log("  - 總學生數:", data.total_students);
      console.log("  - 已通知:", data.notified);
      console.log("  - LINE 通知:", data.line_notified);
      console.log("  - Email 通知:", data.email_notified);
      console.log("  - 失敗:", data.failed);
    } else if (data.error) {
      console.log("❌ 提醒發送失敗:", data.error);
      console.log("  - 訊息:", data.message);
    }
    
  } catch (error) {
    console.error("❌ 測試失敗:", error);
  }
  
  console.log("\n=== 測試完成 ===");
}

// 執行測試
// testReminder();  // 取消註解以執行
```

## 後端日誌檢查

如果前端測試顯示問題，請檢查後端日誌：

```bash
# 查看 Django 日誌
tail -f /path/to/django/logs/debug.log

# 或者查看 Docker 容器日誌
docker logs -f <container_name>
```

查找以下關鍵字：
- `get_submissions_status`
- `teacher_send_assignment_reminder`
- `Google Classroom API`
- `unsubmitted_students`
- `submitted_students`
