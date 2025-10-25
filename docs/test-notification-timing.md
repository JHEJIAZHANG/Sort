# 待辦事項提醒時機測試指南

## 功能說明
當用戶在"我的"頁面修改"待辦事項提醒時機"設定後，首頁的待辦事項卡片會即時更新，顯示對應天數內的待辦事項。

## 測試步驟

### 測試 1：1週前提醒
1. 進入"我的"頁面
2. 點擊"通知設定"
3. 在"待辦事項提醒時機"下拉選單中選擇"1週前"
4. 點擊"儲存設定"
5. 返回"首頁"
6. 查看待辦事項卡片

**預期結果：**
- 卡片底部顯示："顯示 7 天內的待辦事項"
- 卡片中只顯示 7 天內到期的待辦事項
- 超過 7 天後到期的待辦事項不會顯示

### 測試 2：1天前提醒
1. 進入"我的"頁面 → 通知設定
2. 將"待辦事項提醒時機"改為"1天前"
3. 儲存設定並返回首頁

**預期結果：**
- 卡片底部顯示："顯示 1 天內的待辦事項"
- 卡片中只顯示明天到期的待辦事項
- 2天後或更久到期的待辦事項不會顯示

### 測試 3：2天前提醒
1. 進入"我的"頁面 → 通知設定
2. 將"待辦事項提醒時機"改為"2天前"
3. 儲存設定並返回首頁

**預期結果：**
- 卡片底部顯示："顯示 2 天內的待辦事項"
- 卡片中顯示今天、明天、後天到期的待辦事項

### 測試 4：當天提醒（1小時前）
1. 進入"我的"頁面 → 通知設定
2. 將"待辦事項提醒時機"改為"1小時前"
3. 儲存設定並返回首頁

**預期結果：**
- 卡片底部顯示："顯示今天的待辦事項"
- 卡片中只顯示今天到期的待辦事項

## 技術細節

### 提醒時機對應的天數
- **15分鐘前** → 0天（今天）
- **30分鐘前** → 0天（今天）
- **1小時前** → 0天（今天）
- **2小時前** → 0天（今天）
- **1天前** → 1天
- **2天前** → 2天
- **1週前** → 7天

### 篩選邏輯
組件會根據 `reminderDays` 篩選待辦事項：
```typescript
const daysUntilDue = getDaysDifferenceTaiwan(viewingDate, assignment.dueDate)
if (daysUntilDue <= reminderDays && daysUntilDue >= 0) {
  return true // 顯示此待辦事項
}
```

### 事件流程
1. 用戶修改設定 → `setNotificationSettings()` 更新狀態
2. `useEffect` 監聽 `notificationSettings` 變化
3. 觸發 `notificationSettingsChanged` 自定義事件
4. 首頁監聽該事件並更新本地的 `notificationSettings` 狀態
5. `UnifiedTodoSection` 組件接收新的 `notificationSettings`
6. 組件重新計算 `reminderDays` 並重新篩選待辦事項
7. 卡片底部顯示更新後的提示文字

## 常見問題

### Q: 修改設定後沒有立即更新？
A: 確保：
1. 點擊了"儲存設定"按鈕
2. 已經返回首頁（不是停留在設定頁面）
3. 瀏覽器控制台沒有錯誤訊息

### Q: 卡片顯示的天數不正確？
A: 檢查：
1. `getReminderDays()` 函數的對應關係是否正確
2. 瀏覽器控制台是否有 `notificationSettingsChanged` 事件被觸發
3. `app/page.tsx` 中的事件監聽器是否正常工作

### Q: 待辦事項沒有被正確篩選？
A: 確認：
1. 待辦事項的 `dueDate` 是否正確
2. `getDaysDifferenceTaiwan()` 函數計算是否正確
3. 篩選條件 `daysUntilDue <= reminderDays && daysUntilDue >= 0` 是否符合需求

## 調試技巧

在瀏覽器控制台執行以下命令來檢查當前設定：

```javascript
// 檢查當前的通知設定
window.addEventListener('notificationSettingsChanged', (e) => {
  console.log('通知設定已更新:', e.detail)
})

// 手動觸發設定變更（測試用）
window.dispatchEvent(new CustomEvent('notificationSettingsChanged', {
  detail: { assignmentReminderTiming: '1week' }
}))
```
