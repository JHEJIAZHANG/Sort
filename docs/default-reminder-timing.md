# 預設提醒時間設定為 1 週前

## 修改說明
將待辦事項提醒時間的預設值從"1天前"改為"1週前"，讓用戶在首頁看到一週內的所有待辦事項。

## 修改的檔案

### 1. `components/profile-content.tsx`
修改了兩處預設值：

#### 組件狀態初始值
```typescript
const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
  assignmentReminders: true,
  examReminders: true,
  assignmentReminderTiming: "1week", // 從 "1day" 改為 "1week"
  lineNotifications: true,
  browserNotifications: true,
  doNotDisturbEnabled: false,
  doNotDisturbStart: "22:00",
  doNotDisturbEnd: "08:00",
})
```

#### getNotificationSettings 函數
```typescript
export function getNotificationSettings(): NotificationSettings {
  return {
    assignmentReminders: true,
    examReminders: true,
    assignmentReminderTiming: "1week", // 從 "1day" 改為 "1week"
    lineNotifications: true,
    browserNotifications: true,
    doNotDisturbEnabled: false,
    doNotDisturbStart: "22:00",
    doNotDisturbEnd: "08:00",
  }
}
```

### 2. `hooks/use-notification-settings.ts`
修改了預設設定：

```typescript
const defaultSettings: NotificationSettings = {
  assignmentReminderTiming: "1week", // 從 "1day" 改為 "1week"
  examReminderTiming: "1week",       // 保持 "1week"
  customCategoryReminderTiming: "1week", // 從 "1day" 改為 "1week"
  enablePushNotifications: true,
  enableEmailNotifications: false,
  enableSoundNotifications: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  enableQuietHours: false,
}
```

## 影響範圍

### 首頁待辦事項卡片
- **之前**：預設顯示 1 天內的待辦事項
- **現在**：預設顯示 7 天內的待辦事項
- 卡片底部顯示："顯示 7 天內的待辦事項"

### 通知設定頁面
- 下拉選單預設選中"1週前"
- 用戶仍可以自由修改為其他選項

### 待辦事項詳情頁面
- 提醒時間預設為截止時間前 7 天
- 根據用戶修改的設定動態調整

## 使用者體驗改善

### 優點
1. **更全面的視野**：用戶可以看到未來一週的所有待辦事項，更好地規劃時間
2. **減少遺漏**：不會因為只看到明天的待辦事項而忽略後天或更遠的任務
3. **符合習慣**：大多數人習慣以週為單位規劃工作和學習

### 彈性
- 用戶仍可以在"我的"頁面 → 通知設定中修改為其他時間
- 支援的選項：15分鐘前、30分鐘前、1小時前、2小時前、1天前、2天前、1週前

## 測試驗證

### 測試步驟
1. 清除瀏覽器快取或使用無痕模式
2. 開啟應用程式首頁
3. 查看待辦事項卡片

### 預期結果
- ✅ 卡片底部顯示："顯示 7 天內的待辦事項"
- ✅ 卡片中顯示未來 7 天內到期的所有待辦事項
- ✅ 超過 7 天後到期的待辦事項不會顯示

### 驗證設定頁面
1. 進入"我的"頁面 → 通知設定
2. 查看"待辦事項提醒時機"下拉選單

### 預期結果
- ✅ 預設選中"1週前"
- ✅ 可以修改為其他選項
- ✅ 修改後立即生效

## 技術細節

### 提醒天數計算
```typescript
const getReminderDays = (timing: string) => {
  switch (timing) {
    case "15min":
    case "30min":
    case "1hour":
    case "2hours":
      return 0 // 今天
    case "1day":
      return 1
    case "2days":
      return 2
    case "1week":
      return 7 // 一週
    default:
      return 1
  }
}
```

### 篩選邏輯
```typescript
const daysUntilDue = getDaysDifferenceTaiwan(viewingDate, assignment.dueDate)
if (daysUntilDue <= reminderDays && daysUntilDue >= 0) {
  return true // 顯示此待辦事項
}
```

當 `reminderDays = 7` 時：
- 今天到期的項目：`daysUntilDue = 0` → 顯示 ✅
- 明天到期的項目：`daysUntilDue = 1` → 顯示 ✅
- 7天後到期的項目：`daysUntilDue = 7` → 顯示 ✅
- 8天後到期的項目：`daysUntilDue = 8` → 不顯示 ❌

## 相關文件
- [notification-time-update.md](./notification-time-update.md) - 提醒時間動態更新功能
- [test-notification-timing.md](./test-notification-timing.md) - 測試指南
- [notification-timing-checklist.md](./notification-timing-checklist.md) - 驗證清單
