# 老師身分存取限制實作文檔

## 需求說明

1. 未註冊用戶必須先完成註冊才能進入首頁
2. 選擇老師身分的用戶註冊完成後不能進入首頁
3. 只有學生身分可以進入首頁

## 實作內容

### 1. 修改 `hooks/use-user-auth.ts`

在 `checkUserRegistration` 函數中新增角色檢查邏輯：

```typescript
// 檢查用戶角色：只有學生可以進入首頁
if (user && user.role === 'teacher') {
  console.log('🚫 [useUserAuth] 老師身分無法進入首頁')
  setAuthState({
    isAuthenticated: false,
    user,
    isLoading: false,
    error: '老師身分目前無法使用此應用程式',
    needsRegistration: false
  })
} else {
  setAuthState({
    isAuthenticated: true,
    user,
    isLoading: false,
    error: null,
    needsRegistration: false
  })
}
```

**功能說明：**
- 當用戶已註冊時，檢查其角色
- 如果是老師身分，設置錯誤訊息並阻止進入
- 如果是學生身分，允許正常進入

### 2. 修改 `components/auth-gate.tsx`

#### 2.1 更新註冊頁守衛邏輯

```typescript
// 註冊頁的快速守衛：若已註冊則檢查角色
const registered = await UserService.getOnboardStatus(uid)
if (registered) {
  // 檢查用戶角色
  const userProfile = await UserService.getUserByLineId(uid)
  if (userProfile?.role === 'student') {
    router.replace('/')
  }
  // 老師身分不導向首頁，留在註冊頁顯示訊息
}
```

**功能說明：**
- 已註冊的學生會被導向首頁
- 已註冊的老師會留在註冊頁面

#### 2.2 新增錯誤訊息顯示

當老師嘗試進入首頁時，顯示友善的錯誤訊息，說明目前僅開放學生使用。

### 3. 修改 `app/registration/page.tsx`

#### 3.1 更新註冊狀態檢查邏輯

```typescript
if (registered) {
  console.log('✅ 用戶已註冊，檢查角色...')
  // 檢查用戶角色
  const userProfile = await UserService.getUserByLineId(uidMemo)
  
  if (userProfile?.role === 'student') {
    console.log('✅ 學生身分，自動跳轉到應用首頁')
    // 跳轉邏輯...
  } else if (userProfile?.role === 'teacher') {
    console.log('🚫 老師身分，顯示提示訊息')
    setRegistrationStatus('not_registered') // 保持在註冊頁但顯示已註冊狀態
  }
  return
}
```

**功能說明：**
- 已註冊的學生會被導向首頁
- 已註冊的老師會留在註冊頁面顯示提示

#### 3.2 新增註冊完成後的角色檢查

老師註冊完成後顯示成功訊息，但不跳轉到首頁；學生註冊完成後正常跳轉到首頁。

### 4. 更新 `services/userService.ts`

#### 4.1 新增 API 欄位轉換

```typescript
// 後端 API 回傳的格式（snake_case）
interface ApiUserProfile {
  id?: string
  line_user_id: string
  name: string
  email?: string
  role: UserRole
  picture_url?: string
  registered_at?: string
  last_login_at?: string
  is_active?: boolean
}

// 轉換函數
private static transformApiProfile(apiProfile: ApiUserProfile): UserProfile {
  return {
    id: apiProfile.id || apiProfile.line_user_id,
    lineUserId: apiProfile.line_user_id,
    name: apiProfile.name,
    email: apiProfile.email,
    googleEmail: apiProfile.email,
    role: apiProfile.role,
    pictureUrl: apiProfile.picture_url,
    registeredAt: apiProfile.registered_at,
    lastLoginAt: apiProfile.last_login_at,
    isActive: apiProfile.is_active ?? true
  }
}
```

**功能說明：**
- 將後端的 snake_case 格式轉換為前端的 camelCase
- 確保 `email` 同時映射到 `email` 和 `googleEmail`

### 5. 更新 `services/apiService.ts`

#### 5.1 更新 updateProfile 方法

```typescript
static async updateProfile(lineUserId: string, data: any) {
  // 將前端的 camelCase 轉換為後端的 snake_case
  const apiData: any = {}
  
  if (data.name !== undefined) apiData.name = data.name
  if (data.role !== undefined) apiData.role = data.role
  if (data.email !== undefined) apiData.email = data.email
  if (data.googleEmail !== undefined) apiData.email = data.googleEmail
  if (data.pictureUrl !== undefined) apiData.picture_url = data.pictureUrl
  
  return this.request(`/profile/${lineUserId}/`, {
    method: 'PUT',
    body: JSON.stringify(apiData)
  })
}
```

**功能說明：**
- 將前端的 camelCase 格式轉換為後端的 snake_case
- 支援 `googleEmail` 自動轉換為 `email`

## API 欄位對應

### 後端 API (snake_case) ↔ 前端 (camelCase)

**GET /api/v2/profile/{lineUserId}/ 回傳欄位：**
- `line_user_id` → `lineUserId`
- `name` → `name`
- `email` → `email` / `googleEmail`
- `role` → `role`
- `picture_url` → `pictureUrl`
- `registered_at` → `registeredAt`
- `last_login_at` → `lastLoginAt`
- `is_active` → `isActive`

**PUT /api/v2/profile/{lineUserId}/ 可更新欄位：**
- `name` ← `name`
- `role` ← `role`
- `email` ← `email` / `googleEmail`

## 使用者體驗流程

### 學生註冊流程
1. 訪問網站 → 未註冊 → 導向註冊頁
2. 選擇「學生」身分
3. 輸入姓名
4. 完成 Google 授權
5. 註冊成功 → 自動進入首頁 ✅

### 老師註冊流程
1. 訪問網站 → 未註冊 → 導向註冊頁
2. 選擇「老師」身分
3. 輸入姓名
4. 完成 Google 授權
5. 註冊成功 → 顯示提示訊息（無法進入首頁）🚫

### 已註冊學生訪問
1. 訪問網站 → 已註冊 → 檢查角色 → 學生 → 進入首頁 ✅

### 已註冊老師訪問
1. 訪問網站 → 已註冊 → 檢查角色 → 老師 → 顯示錯誤訊息 🚫

## 測試建議

1. **測試未註冊用戶**
   - 直接訪問首頁應該被導向註冊頁

2. **測試學生註冊**
   - 完成註冊後應該能進入首頁
   - 再次訪問應該直接進入首頁

3. **測試老師註冊**
   - 完成註冊後應該看到提示訊息
   - 再次訪問應該看到無法存取的錯誤訊息

4. **測試已註冊用戶**
   - 學生應該能正常使用所有功能
   - 老師應該無法進入首頁

## 注意事項

1. 所有的角色檢查都基於後端 API 返回的用戶資料
2. 錯誤訊息對用戶友善，說明老師功能正在開發中
3. 保持了原有的 LINE 登入和 Google 授權流程
4. 不影響現有的學生功能
5. 前後端欄位名稱已正確對應（snake_case ↔ camelCase）
6. API 請求包含必要的 headers（Accept, ngrok-skip-browser-warning）
7. 使用 `cache: 'no-store'` 確保獲取最新的用戶資料

## 未來擴展

當老師功能開發完成後，可以：
1. 移除角色檢查限制
2. 根據角色顯示不同的首頁內容
3. 為老師提供專屬的管理功能
