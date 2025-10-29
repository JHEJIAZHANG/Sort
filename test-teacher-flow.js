// 完整測試教師 API 流程
// 在瀏覽器 Console 中執行

async function testTeacherFlow() {
  console.log('========== 開始測試教師 API 流程 ==========')
  
  const lineUserId = 'Uc8858c883da4bd4aecf9271aaa019a45'
  
  // 測試 1: 教師課程 API
  console.log('\n📚 測試 1: 教師課程 API')
  console.log('URL: /api/courses/?line_user_id=' + lineUserId)
  
  try {
    const coursesResp = await fetch(`/api/courses/?line_user_id=${lineUserId}&_ts=${Date.now()}`, {
      credentials: 'include',
      headers: { 'ngrok-skip-browser-warning': 'true' }
    })
    
    console.log('狀態碼:', coursesResp.status)
    const coursesData = await coursesResp.json()
    console.log('完整回應:', coursesData)
    
    if (coursesData.courses) {
      console.log('✅ 課程數量:', coursesData.courses.length)
      if (coursesData.courses.length > 0) {
        console.log('第一個課程:', coursesData.courses[0])
      }
    } else {
      console.error('❌ 沒有 courses 欄位')
    }
  } catch (error) {
    console.error('❌ 課程 API 錯誤:', error)
  }
  
  // 測試 2: 教師作業 API
  console.log('\n📝 測試 2: 教師作業 API')
  console.log('URL: /api/teacher/assignments/?line_user_id=' + lineUserId)
  
  try {
    const assignmentsResp = await fetch(`/api/teacher/assignments/?line_user_id=${lineUserId}&_ts=${Date.now()}`, {
      credentials: 'include',
      headers: { 'ngrok-skip-browser-warning': 'true' }
    })
    
    console.log('狀態碼:', assignmentsResp.status)
    const assignmentsData = await assignmentsResp.json()
    console.log('完整回應:', assignmentsData)
    
    if (assignmentsData.data && assignmentsData.data.all_assignments) {
      console.log('✅ 作業數量:', assignmentsData.data.all_assignments.length)
      if (assignmentsData.data.all_assignments.length > 0) {
        console.log('第一個作業:', assignmentsData.data.all_assignments[0])
      }
    } else {
      console.error('❌ 沒有 data.all_assignments 欄位')
      console.log('data 內容:', assignmentsData.data)
    }
  } catch (error) {
    console.error('❌ 作業 API 錯誤:', error)
  }
  
  // 測試 3: 數據轉換
  console.log('\n🔄 測試 3: 數據轉換')
  
  // 模擬後端課程數據
  const mockCourse = {
    id: "803980731255",
    name: "演算法",
    section: "A班",
    description: "演算法課程",
    ownerId: "teacher@example.com",
    enrollmentCode: "abc123",
    courseState: "ACTIVE",
    creationTime: "2024-01-01T00:00:00",
    updateTime: "2024-01-02T00:00:00",
    schedules: [
      {
        day_of_week: 1,
        day_name: "Tue",
        start_time: "09:00",
        end_time: "10:30",
        location: "A101"
      }
    ],
    has_schedule: true,
    is_local: true
  }
  
  console.log('模擬課程數據:', mockCourse)
  console.log('轉換後應該有:')
  console.log('  - id:', mockCourse.id)
  console.log('  - name:', mockCourse.name)
  console.log('  - schedule:', mockCourse.schedules)
  
  // 模擬後端作業數據
  const mockAssignment = {
    id: "hw_123",
    title: "作業一",
    description: "完成習題",
    state: "PUBLISHED",
    work_type: "ASSIGNMENT",
    due_date: "2024-01-15 23:59",
    due_datetime: "2024-01-15T23:59:00",
    is_upcoming: true,
    creation_time: "2024-01-01T00:00:00",
    update_time: "2024-01-02T00:00:00",
    max_points: 100,
    course_info: {
      id: "803980731255",
      name: "演算法",
      section: "A班"
    }
  }
  
  console.log('模擬作業數據:', mockAssignment)
  console.log('轉換後應該有:')
  console.log('  - id:', mockAssignment.id)
  console.log('  - title:', mockAssignment.title)
  console.log('  - courseId:', mockAssignment.course_info.id)
  console.log('  - courseName:', mockAssignment.course_info.name)
  
  console.log('\n========== 測試完成 ==========')
}

// 執行測試
testTeacherFlow()
