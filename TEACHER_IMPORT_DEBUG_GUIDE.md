# 教師 Google Classroom 匯入調試指南

## 問題描述

Teacher Preview Import API 有回傳值，但前端沒有正確顯示課程資訊。

## 已實施的修復

### 1. 增強的調試日誌

在 `components/teacher-google-classroom-onboarding.tsx` 的 `loadGoogleClassroomCourses` 方法中添加了詳細的調試日誌：

- 完整 API 回應記錄
- 數據結構分析
- 多路徑檢查
- 課程轉換過程追蹤

### 2. 多路徑數據解析

支援以下幾種可能的 API 回應結構：

```typescript
// 路徑 1: 標準結構（根據 API 文檔）
responseData?.data?.classroom?.courses

// 路徑 2: 簡化結構
responseData?.classroom?.courses

// 路徑 3: 直接課程陣列
responseData?.courses

// 路徑 4: 響應本身是陣列
Array.isArray(responseData)
```

## 調試步驟

### 步驟 1: 開啟瀏覽器開發者工具

1. 在教師頁面按 F12 開啟開發者工具
2. 切換到 Console 標籤

### 步驟 2: 觸發匯入流程

1. 點擊「匯入 Google Classroom 課程」按鈕
2. 點擊「開始匯入」

### 步驟 3: 查看控制台輸出

在控制台中查找以下關鍵日誌：

```
========== 教師課程預覽 API 調試 ==========
完整 API 回應: {...}
響應數據 (previewResponse.data): {...}
響應數據類型: object
響應數據鍵: [...]

========== 數據路徑檢查 ==========
1. responseData?.data?.classroom?.courses: true/false
2. responseData?.classroom?.courses: true/false
3. responseData?.courses: true/false
4. Array.isArray(responseData): true/false

✅ 路徑 X: 找到 ... : N 個課程
處理後的課程列表: [...]
處理課程 0: {...}
轉換後的課程: [...]
課程載入成功，共 N 個課程
=====================================
```

### 步驟 4: 分析 API 回應結構

根據控制台輸出，確認：

1. **API 是否成功回應**
   - 檢查是否有錯誤訊息
   - 確認 `previewResponse.error` 是否為 null

2. **數據結構是否正確**
   - 查看「完整 API 回應」的 JSON 結構
   - 確認哪個路徑檢查返回 true

3. **課程數據是否存在**
   - 查看「處理後的課程列表」是否有內容
   - 確認課程數量是否正確

## 常見問題排查

### 問題 1: API 回應錯誤

**症狀**: 控制台顯示 `❌ API 回應錯誤: ...`

**可能原因**:
- LINE User ID 未設置
- Google 授權失效
- 後端 API 錯誤

**解決方法**:
1. 確認已正確登入 LINE
2. 檢查 Google 帳戶授權狀態
3. 查看後端日誌

### 問題 2: 找不到課程數據

**症狀**: 控制台顯示 `❌ 所有路徑都未找到課程數據`

**可能原因**:
- API 回應結構與預期不符
- 後端回傳的數據格式錯誤

**解決方法**:
1. 查看「完整回應結構」日誌
2. 對比 API 文檔中的預期結構
3. 根據實際結構調整前端解析邏輯

### 問題 3: 課程列表為空

**症狀**: 顯示「沒有找到可匯入的教師課程」

**可能原因**:
- Google Classroom 中沒有教師身份的課程
- API 過濾條件過於嚴格
- 課程狀態不是 ACTIVE

**解決方法**:
1. 確認 Google Classroom 中有教師課程
2. 檢查後端過濾邏輯
3. 查看課程的 `course_state` 欄位

### 問題 4: 課程資訊不完整

**症狀**: 課程顯示但資訊缺失（如名稱、教室等）

**可能原因**:
- API 回傳的課程物件缺少某些欄位
- 欄位名稱與前端預期不符

**解決方法**:
1. 查看「處理課程 X」日誌中的原始課程物件
2. 確認欄位名稱是否正確：
   - `google_course_id` 或 `id`
   - `name`
   - `instructor`
   - `room` 或 `location`
3. 根據實際欄位名稱調整映射邏輯

## API 回應範例

### 實際的 API 回應結構

根據實際測試，後端回傳的結構是：

```json
{
  "data": {
    "success": true,
    "message": "預覽同步完成",
    "data": {
      "preview_data": {
        "classroom": {
          "courses": [
            {
              "google_course_id": "816989062073",
              "name": "游泳課",
              "section": "",
              "description": "",
              "ownerId": "115505997615740004401",
              "courseState": "ACTIVE",
              "google_classroom_url": "https://classroom.google.com/c/..."
            },
            {
              "google_course_id": "795521701284",
              "name": "國文課",
              "section": "",
              "description": "12345",
              "ownerId": "115505997615740004401",
              "courseState": "ACTIVE",
              "google_classroom_url": "https://classroom.google.com/c/..."
            }
          ]
        },
        "existing_data": {
          "courses": ["795521701284", "816989062073"]
        },
        "errors": []
      },
      "user_id": "U015b486e04b09ae70bde24db70ec9611",
      "preview_time": "2025-10-26T16:19:03.603342+00:00"
    }
  }
}
```

### 前端解析邏輯

```typescript
// ApiService.request 會將回應包裝成 { data: ... }
// 所以實際收到的是：
{
  data: {
    success: true,
    message: "預覽同步完成",
    data: {
      preview_data: {
        classroom: {
          courses: [...]
        },
        existing_data: {...},
        errors: []
      },
      user_id: "...",
      preview_time: "..."
    }
  }
}

// 因此需要訪問 responseData.data.preview_data.classroom.courses
```

### 課程欄位映射

後端回傳的課程物件欄位：
- `google_course_id` → 課程 ID
- `name` → 課程名稱
- `section` → 班別/節次
- `description` → 課程描述
- `ownerId` → 教師 ID
- `courseState` → 課程狀態（ACTIVE）
- `google_classroom_url` → Google Classroom 連結

前端需要的欄位：
- `google_course_id` ✅
- `name` ✅
- `instructor` ❌ (後端未提供，使用 ownerId 代替)
- `classroom` / `room` / `location` ❌ (後端未提供)

## 修復建議

如果調試後發現數據結構與預期不符，可以：

1. **調整前端解析邏輯**
   - 在 `loadGoogleClassroomCourses` 方法中添加新的路徑檢查
   - 根據實際結構修改數據提取邏輯

2. **修改後端 API**
   - 確保回應結構符合文檔規範
   - 添加必要的欄位

3. **統一數據格式**
   - 前後端協商統一的數據結構
   - 更新 API 文檔

## 聯絡支援

如果問題仍未解決，請提供：

1. 完整的控制台日誌輸出
2. 「完整 API 回應」的 JSON 內容
3. 後端 API 的實際回應（從 Network 標籤獲取）
4. 錯誤訊息截圖

這將幫助快速定位問題並提供解決方案。
