# 作業提醒通知修復報告

## 問題描述
用戶修改作業的自訂提醒時機（custom_reminder_timing）後，系統沒有重新計算 notification_time，導致通知仍然按照舊的時間發送或不發送。

## 問題分析
1. **前端正常**：前端正確傳送 `customReminderTiming` 和 `notificationTime` 到後端
2. **API 接收正常**：`update_assignment` API 正確接收並傳遞參數
3. **問題所在**：`WebDataService.update_local_assignment` 方法只是簡單更新欄位，沒有重新計算 `notification_time`

## 修復方案
在 `classroomai/services/web_data_service.py` 的 `update_local_assignment` 方法中添加邏輯：

### 修復內容
1. **檢測變更**：檢查 `due_date` 或 `custom_reminder_timing` 是否改變
2. **重新計算**：當檢測到變更時，根據新的設定重新計算 `notification_time`
3. **時間驗證**：如果計算出的提醒時間已經過期，設為 None（不提醒）

### 計算邏輯
```python
# 決定使用哪個提醒時機設定
effective_timing = new_custom_timing if new_custom_timing != 'default' else '1week'

# 時間對應表
timing_map = {
    "15min": timedelta(minutes=15),
    "30min": timedelta(minutes=30),
    "1hour": timedelta(hours=1),
    "2hours": timedelta(hours=2),
    "1day": timedelta(days=1),
    "2days": timedelta(days=2),
    "1week": timedelta(weeks=1),
}

# 計算新的提醒時間
reminder_delta = timing_map.get(effective_timing, timedelta(days=1))
new_notification_time = new_due_date - reminder_delta
```

## 修復後的行為
1. **自動重新計算**：當用戶修改提醒時機或截止日期時，系統自動重新計算 notification_time
2. **過期處理**：如果計算出的提醒時間已經過期，設為 None（不會發送通知）
3. **日誌記錄**：添加詳細的日誌記錄，方便調試和監控

## 測試建議
1. 修改作業的自訂提醒時機，檢查 notification_time 是否正確更新
2. 修改作業的截止日期，檢查 notification_time 是否重新計算
3. 設定一個很短的提醒時間（如 15 分鐘），檢查是否能正常收到通知

## 相關文件
- `classroomai/services/web_data_service.py` - 主要修復文件
- `classroomai/api_v2/web_views.py` - API 端點
- `course-management/services/apiService.ts` - 前端 API 服務
- `course-management/hooks/use-courses.ts` - 前端狀態管理

## 修復時間
2025-10-11 03:41