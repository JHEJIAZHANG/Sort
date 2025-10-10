// 測試 API 響應結構
// 根據你提供的實際響應數據

const mockApiResponse = {
  data: {
    preview_data: {
      success: true,
      classroom: {
        courses: [
          {
            google_course_id: "795521701284",
            name: "國文課",
            description: "12345",
            instructor: "張芸甄",
            google_classroom_url: "https://classroom.google.com/c/Nzk1NTIxNzAxMjg0"
          },
          {
            google_course_id: "794605301916",
            name: "国文课",
            description: "",
            instructor: "張芸甄",
            google_classroom_url: "https://classroom.google.com/c/Nzk0NjA1MzAxOTE2"
          },
          {
            google_course_id: "803972295451",
            name: "國文課",
            description: "",
            instructor: "陳可安",
            google_classroom_url: "https://classroom.google.com/c/ODAzOTcyMjk1NDUx"
          },
          {
            google_course_id: "802753363466",
            name: "1141行動應用程式設計",
            description: "",
            instructor: "張隆君",
            google_classroom_url: "https://classroom.google.com/c/ODAyNzUzMzYzNDY2"
          },
          {
            google_course_id: "738249749047",
            name: "1132行動應用開發",
            description: "",
            instructor: "張隆君",
            google_classroom_url: "https://classroom.google.com/c/NzM4MjQ5NzQ5MDQ3"
          },
          {
            google_course_id: "711324156828",
            name: "1131Python程式設計",
            description: "",
            instructor: "張隆君",
            google_classroom_url: "https://classroom.google.com/c/NzExMzI0MTU2ODI4"
          }
        ]
      },
      existing_data: {
        courses: ["803972295451", "711324156828", "802753363466"]
      },
      errors: []
    },
    user_id: "U015b486e04b09ae70bde24db70ec9611",
    preview_time: "2025-10-05T09:24:13.243835+00:00"
  }
}

// 測試數據提取邏輯
console.log('=== 測試 API 響應結構 ===\n')

const previewData = mockApiResponse.data
console.log('1. previewData 存在:', !!previewData)
console.log('2. previewData.preview_data 存在:', !!previewData?.preview_data)
console.log('3. previewData.preview_data.classroom 存在:', !!previewData?.preview_data?.classroom)
console.log('4. previewData.preview_data.classroom.courses 存在:', !!previewData?.preview_data?.classroom?.courses)

if (previewData?.preview_data?.classroom?.courses) {
  const courses = previewData.preview_data.classroom.courses
  console.log('\n✅ 成功找到課程數據!')
  console.log(`   課程數量: ${courses.length}`)
  console.log('\n課程列表:')
  courses.forEach((course, index) => {
    console.log(`   ${index + 1}. ${course.name} (${course.instructor})`)
    console.log(`      ID: ${course.google_course_id}`)
  })
  
  console.log('\n已存在的課程:')
  const existingCourses = previewData.preview_data.existing_data.courses
  console.log(`   ${existingCourses.length} 個課程已存在於系統中`)
  existingCourses.forEach(id => {
    const course = courses.find(c => c.google_course_id === id)
    if (course) {
      console.log(`   - ${course.name}`)
    }
  })
} else {
  console.log('\n❌ 無法找到課程數據')
}
