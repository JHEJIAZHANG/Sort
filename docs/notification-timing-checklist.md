# 待辦事項提醒時機功能驗證清單

## ✅ 實作完成的功能

### 1. 通知設定頁面
- [x] 提供"待辦事項提醒時機"下拉選單
- [x] 包含 7 個選項：15分鐘前、30分鐘前、1小時前、2小時前、1天前、2天前、1週前
- [x] 修改設定時觸發 `notificationSettingsChanged` 事件
- [x] 提供"儲存設定"按鈕

### 2. 首頁待辦事項卡片
- [x] 監聽 `notificationSettingsChanged` 事件
- [x] 根據設定動態計算 `reminderDays`
- [x] 根據 `reminderDays` 篩選待辦事項
- [x] 卡片底部顯示當前篩選範圍
- [x] 支援即時更新（無需重新載入頁面）

### 3. 待辦事項詳情頁面
- [x] 接收 `notificationSettings` 參數
- [x] 動態計算提醒時間
- [x] 顯示"提醒時間"欄位

### 4. 篩選邏輯
- [x] 作業：根據 `reminderDays` 篩選
- [x] 考試：根據 `reminderDays` 篩選
- [x] 自訂待辦：根據 `reminderDays` 篩選
- [x] 已完成的項目：特殊處理（在範圍內顯示）

## 📋 測試檢查項目

### 基本功能測試
- [ ] 修改設定為"1週前"，確認顯示"顯示 7 天內的待辦事項"
- [ ] 修改設定為"1天前"，確認顯示"顯示 1 天內的待辦事項"
- [ ] 修改設定為"1小時前"，確認顯示"顯示今天的待辦事項"

### 篩選正確性測試
- [ ] 設定為"1週前"時，7天後到期的項目不顯示
- [ ] 設定為"1天前"時，2天後到期的項目不顯示
- [ ] 設定為"今天"時，明天到期的項目不顯示

### 即時更新測試
- [ ] 修改設定後立即返回首頁，確認卡片已更新
- [ ] 不需要重新載入頁面即可看到變化
- [ ] 多次修改設定，每次都能正確更新

### 詳情頁面測試
- [ ] 點擊待辦事項查看詳情
- [ ] 確認"提醒時間"欄位顯示正確
- [ ] 修改設定後，再次查看詳情，確認提醒時間已更新

### 邊界情況測試
- [ ] 沒有待辦事項時，顯示空狀態
- [ ] 所有待辦事項都超出範圍時，顯示空狀態
- [ ] 有已完成的待辦事項時，正確顯示

## 🔍 驗證方法

### 方法 1：手動測試
1. 按照測試檢查項目逐一驗證
2. 記錄任何異常行為
3. 截圖保存測試結果

### 方法 2：控制台調試
```javascript
// 在瀏覽器控制台執行
console.log('當前提醒設定:', 
  document.querySelector('[data-notification-settings]')?.textContent
)
```

### 方法 3：事件監聽
```javascript
// 監聽設定變更事件
window.addEventListener('notificationSettingsChanged', (e) => {
  console.log('設定已更新:', e.detail)
  console.log('提醒時機:', e.detail.assignmentReminderTiming)
})
```

## 📝 已知限制

1. **本地儲存**：設定目前儲存在組件狀態中，重新載入頁面後會恢復預設值
2. **同步問題**：如果在多個分頁中同時修改設定，可能需要手動重新載入
3. **時區處理**：使用台灣時區計算天數差異

## 🚀 未來改進建議

1. 將通知設定持久化到後端或 localStorage
2. 支援更多自訂提醒時間選項
3. 為不同類型的待辦事項設定不同的提醒時間
4. 添加提醒通知功能（瀏覽器推播或 LINE 通知）
5. 支援多個提醒時間點（例如：1週前和1天前都提醒）

## ✨ 相關文件

- [notification-time-update.md](./notification-time-update.md) - 功能實作說明
- [test-notification-timing.md](./test-notification-timing.md) - 詳細測試指南
- [custom-category-edit-time.md](./custom-category-edit-time.md) - 自訂分類時間編輯功能
