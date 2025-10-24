# 教師「我的課程」頁面使用的 Components 檔案

## 📦 主要組件清單

### 1. 課程相關組件

#### `components/teacher-course-card.tsx` ⭐
- **用途**: 顯示課程卡片
- **功能**: 
  - 顯示課程名稱、教師、時間、地點
  - Google Classroom 標籤和連結
  - 支援選擇模式
  - 橘色左側邊框
- **狀態**: 已修改為與學生課程卡片一致

#### `components/course-form.tsx`
- **用途**: 新增/編輯課程表單
- **功能**:
  - 手動輸入課程資訊
  - 設定課程時間表
  - OCR 批量匯入
  - 表單驗證

#### `components/course-detail.tsx`
- **用途**: 課程詳情對話框
- **功能**:
  - 顯示完整課程資訊
  - 編輯課程
  - 刪除課程
  - 查看該課程的作業、考試、筆記

#### `components/course-filters.tsx` ⭐
- **用途**: 搜尋和篩選功能
- **功能**:
  - 搜尋框（課程名稱、教師、地點）
  - 星期篩選下拉選單
  - 清除篩選按鈕
  - 顯示篩選結果統計

### 2. 視圖組件

#### `components/unified-calendar.tsx`
- **用途**: 月曆視圖
- **功能**:
  - 以月曆形式顯示課程
  - 點擊課程查看詳情
  - 顯示課程時間

### 3. 匯入相關組件

#### `components/google-classroom-import.tsx`
- **用途**: Google Classroom 匯入對話框
- **功能**:
  - 輸入課程代碼
  - 預覽課程資訊
  - 設定課程時間
  - 匯入課程

#### `components/import-google-classroom-button.tsx`
- **用途**: 匯入 Google Classroom 按鈕
- **功能**:
  - 顯示在頁面底部
  - 點擊開啟匯入流程

#### `components/add-course-dropdown.tsx`
- **用途**: 新增課程下拉選單
- **功能**:
  - 手動新增課程
  - 從 Google Classroom 匯入

### 4. UI 組件

#### `components/ui/card.tsx`
- **用途**: 卡片容器
- **使用位置**: 課程卡片、空狀態提示

#### `components/ui/button.tsx`
- **用途**: 按鈕組件
- **使用位置**: 視圖切換、新增、清除篩選等

#### `components/ui/dialog.tsx`
- **用途**: 對話框組件
- **使用位置**: 課程詳情對話框

### 5. 圖示組件

#### `components/icons.tsx`
- **用途**: 圖示集合
- **使用的圖示**:
  - `CalendarIcon` - 月曆視圖按鈕
  - `ListIcon` - 列表視圖按鈕

## 📊 組件使用流程圖

```
教師「我的課程」頁面
│
├─ 頁面標題區域
│  ├─ PageHeader
│  ├─ Button (視圖切換)
│  └─ AddCourseDropdown
│
├─ 搜尋和篩選區域
│  └─ CourseFilters ⭐
│
├─ 課程顯示區域
│  ├─ 列表視圖
│  │  └─ TeacherCourseCard ⭐ (多個)
│  │
│  └─ 月曆視圖
│     └─ UnifiedCalendar
│
├─ 底部匯入區域
│  └─ ImportGoogleClassroomButton
│
├─ 對話框
│  ├─ CourseDetail (課程詳情)
│  ├─ GoogleClassroomImport (匯入)
│  └─ CourseForm (新增/編輯)
│
└─ 空狀態
   ├─ Card
   └─ AddCourseDropdown
```

## 🔑 關鍵組件說明

### ⭐ TeacherCourseCard
**檔案位置**: `components/teacher-course-card.tsx`

**Props**:
```typescript
interface TeacherCourseCardProps {
  course: Course
  onClick: (course: Course) => void
  isSelected?: boolean
  isSelectionMode?: boolean
  onSelectionChange?: (courseId: string, selected: boolean) => void
}
```

**特點**:
- 已修改為與學生課程卡片完全一致
- 橘色左側邊框 (#ff9100)
- 懸停動畫效果
- 響應式設計

### ⭐ CourseFilters
**檔案位置**: `components/course-filters.tsx`

**Props**:
```typescript
interface CourseFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterDay: string
  onFilterDayChange: (day: string) => void
  totalCount: number
  filteredCount: number
}
```

**特點**:
- 即時搜尋（300ms debounce）
- 支援中文輸入法
- 顯示篩選結果統計
- 清除篩選按鈕

## 📝 使用範例

### 在 CoursesContent 中的使用

```tsx
function CoursesContent() {
  // 1. 搜尋和篩選
  <CourseFilters
    searchQuery={courseSearchQuery}
    onSearchChange={setCourseSearchQuery}
    filterDay={courseFilterDay}
    onFilterDayChange={setCourseFilterDay}
    totalCount={courses.length}
    filteredCount={filteredCourses.length}
  />

  // 2. 課程卡片（列表視圖）
  {filteredCourses.map((course) => (
    <TeacherCourseCard 
      key={course.id} 
      course={course} 
      onClick={() => setSelectedCourseId(course.id)}
    />
  ))}

  // 3. 月曆視圖
  <UnifiedCalendar 
    courses={filteredCourses} 
    onCourseClick={(courseId) => setSelectedCourseId(courseId)}
    onEventClick={(event) => console.log('Calendar event clicked:', event)}
  />

  // 4. 匯入按鈕
  <ImportGoogleClassroomButton onImportComplete={() => refetch()} />

  // 5. 匯入對話框
  <GoogleClassroomImport
    isOpen={showGoogleClassroomImport}
    onClose={() => setShowGoogleClassroomImport(false)}
    onImport={handleImportCourse}
  />

  // 6. 課程詳情對話框
  <Dialog open={!!selectedCourseId}>
    <CourseDetail 
      courseId={selectedCourseId} 
      lineUserId={lineUserId} 
      showBackButton={false}
      onDeleted={() => { setSelectedCourseId(null); refetch() }}
      onUpdated={() => refetch()}
    />
  </Dialog>
}
```

## 🔄 與學生頁面的組件對比

| 組件 | 學生頁面 | 教師頁面 | 狀態 |
|------|---------|---------|------|
| 課程卡片 | `CourseCard` | `TeacherCourseCard` | ✅ 已統一 |
| 課程篩選 | `CourseFilters` | `CourseFilters` | ✅ 相同 |
| 課程表單 | `CourseForm` | `CourseForm` | ✅ 相同 |
| 課程詳情 | `CourseDetail` | `CourseDetail` | ✅ 相同 |
| 月曆視圖 | `UnifiedCalendar` | `UnifiedCalendar` | ✅ 相同 |
| 匯入對話框 | `GoogleClassroomImport` | `GoogleClassroomImport` | ✅ 相同 |
| 匯入按鈕 | `ImportGoogleClassroomButton` | `ImportGoogleClassroomButton` | ✅ 相同 |
| 新增下拉選單 | `AddCourseDropdown` | `AddCourseDropdown` | ✅ 相同 |

## 📌 總結

教師的「我的課程」頁面主要使用以下組件：

### 核心組件（8個）
1. ✅ `TeacherCourseCard` - 課程卡片（已修改）
2. ✅ `CourseFilters` - 搜尋和篩選
3. ✅ `CourseForm` - 新增/編輯表單
4. ✅ `CourseDetail` - 課程詳情
5. ✅ `UnifiedCalendar` - 月曆視圖
6. ✅ `GoogleClassroomImport` - 匯入對話框
7. ✅ `ImportGoogleClassroomButton` - 匯入按鈕
8. ✅ `AddCourseDropdown` - 新增下拉選單

### UI 組件（3個）
1. `Card` - 卡片容器
2. `Button` - 按鈕
3. `Dialog` - 對話框

所有組件都已正確整合，功能與學生頁面完全一致！
