# 待辦事項提醒時間動態更新功能

## 問題描述
在"我的"頁面修改通知設定中的待辦事項提醒時間後，"首頁"的待辦事項無法即時更新顯示新的提醒時間。

## 解決方案

### 1. 動態計算提醒時間
不再使用固定的 `notificationTime` 欄位，而是根據當前的 `notificationSettings.assignmentReminderTiming` 動態計算提醒時間。

### 2. 修改的檔案

#### `components/custom-category-detail.tsx`
- 新增 `notificationSettings` 參數到 `CustomCategoryDetailProps` 介面
- 新增 `calculateNotificationTime` 函數來根據截止時間和提醒設定計算提醒時間
- 在組件中動態計算 `notificationTime`，而不是使用固定值
- 將顯示文字從"通知時間"改為"提醒時間"以更清楚表達意義

#### `app/page.tsx`
- 在調用 `CustomCategoryDetail` 時傳入 `notificationSettings` 參數

### 3. 工作原理

1. 用戶在"我的"頁面修改提醒時間設定
2. `ProfileContent` 組件觸發 `notificationSettingsChanged` 事件
3. `app/page.tsx` 監聽該事件並更新 `notificationSettings` 狀態
4. 當用戶查看待辦事項詳情時，`CustomCategoryDetail` 組件接收最新的 `notificationSettings`
5. 組件根據當前設定動態計算並顯示提醒時間

### 4. 提醒時間計算邏輯

```typescript
function calculateNotificationTime(dueDate: Date, reminderTiming: string): Date {
  const notificationTime = new Date(dueDate)
  
  switch (reminderTiming) {
    case "15min": notificationTime.setMinutes(notificationTime.getMinutes() - 15); break
    case "30min": notificationTime.setMinutes(notificationTime.getMinutes() - 30); break
    case "1hour": notificationTime.setHours(notificationTime.getHours() - 1); break
    case "2hours": notificationTime.setHours(notificationTime.getHours() - 2); break
    case "1day": notificationTime.setDate(notificationTime.getDate() - 1); break
    case "2days": notificationTime.setDate(notificationTime.getDate() - 2); break
    case "1week": notificationTime.setDate(notificationTime.getDate() - 7); break
    default: notificationTime.setDate(notificationTime.getDate() - 1)
  }
  
  return notificationTime
}
```

## 測試步驟

1. 進入"我的"頁面 → 通知設定
2. 修改"待辦事項提醒時機"（例如從"1天前"改為"1週前"）
3. 儲存設定
4. 返回"首頁"
5. 查看待辦事項卡片：
   - 卡片底部應顯示"顯示 7 天內的待辦事項"
   - 卡片中的待辦事項應該是 7 天內到期的項目
6. 點擊任一待辦事項查看詳情
7. 確認"提醒時間"顯示的是根據新設定計算的時間（截止時間前 7 天）

## 優點

- **即時更新**：修改設定後立即生效，無需重新載入頁面
- **動態計算**：不需要在資料庫中儲存固定的提醒時間
- **靈活性高**：用戶可以隨時調整提醒時間，所有待辦事項都會自動適應新設定
- **視覺反饋**：卡片底部清楚顯示當前的篩選範圍，讓用戶了解顯示的是哪些待辦事項

## 額外修改

### `components/unified-todo-section.tsx`
- 修改卡片底部的顯示邏輯，始終顯示當前的篩選範圍
- 當提醒時間設定為當天（15分鐘、30分鐘、1小時、2小時）時，顯示"顯示今天的待辦事項"
- 當提醒時間設定為多天時，顯示"顯示 X 天內的待辦事項"
