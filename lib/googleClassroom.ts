// googleClassroom.ts
// 與後端 utils_encoding.py 保持一致的編碼與連結生成工具

function base64NoPadding(input: string): string {
  const encoded = Buffer.from(input, 'utf-8').toString('base64')
  return encoded.replace(/=+$/, '')
}

export function encodeCourseIdForGoogleClassroom(courseId: string): string {
  try {
    return base64NoPadding(String(courseId))
  } catch (e) {
    console.error('encodeCourseIdForGoogleClassroom 失敗:', e)
    return String(courseId)
  }
}

export function encodeCourseworkIdForGoogleClassroom(courseworkId: string): string {
  try {
    return base64NoPadding(String(courseworkId))
  } catch (e) {
    console.error('encodeCourseworkIdForGoogleClassroom 失敗:', e)
    return String(courseworkId)
  }
}

export function createGoogleClassroomCourseUrl(courseId: string): string {
  const encodedCourseId = encodeCourseIdForGoogleClassroom(courseId)
  return `https://classroom.google.com/c/${encodedCourseId}`
}

export function createGoogleClassroomAssignmentUrl(courseId: string, courseworkId: string): string {
  const encodedCourseId = encodeCourseIdForGoogleClassroom(courseId)
  const encodedCourseworkId = encodeCourseworkIdForGoogleClassroom(courseworkId)
  return `https://classroom.google.com/c/${encodedCourseId}/a/${encodedCourseworkId}/details`
}

// 嘗試修正可能不正確的 Google Classroom 連結（例如使用了未編碼的數字 ID）
export function normalizeGoogleClassroomUrl(url: string): string {
  if (!url) return url
  try {
    const u = new URL(url)
    if (u.hostname !== 'classroom.google.com') return url

    const parts = u.pathname.split('/').filter(Boolean)
    // 課程連結：/c/<id>
    if (parts.length === 2 && parts[0] === 'c') {
      const id = parts[1]
      const isNumeric = /^\d+$/.test(id)
      if (isNumeric) {
        return createGoogleClassroomCourseUrl(id)
      }
      return url
    }

    // 作業連結：/c/<course_id>/a/<coursework_id>/details
    if (parts.length >= 5 && parts[0] === 'c' && parts[2] === 'a') {
      const courseId = parts[1]
      const courseworkId = parts[3]
      const courseNumeric = /^\d+$/.test(courseId)
      const workNumeric = /^\d+$/.test(courseworkId)
      if (courseNumeric || workNumeric) {
        return createGoogleClassroomAssignmentUrl(courseId, courseworkId)
      }
      return url
    }

    return url
  } catch {
    return url
  }
}