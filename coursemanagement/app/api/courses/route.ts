import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const lineUserId = url.searchParams.get('line_user_id') || ''

    const now = new Date().toISOString()
    const courses = [
      {
        id: 'gc-12345',
        name: '數學 A 班',
        section: 'A',
        description: '代數與幾何',
        enrollmentCode: 'ABCDEF',
        courseState: 'ACTIVE',
        google_classroom_url: 'https://classroom.google.com/c/gc-12345',
        creationTime: now,
        updateTime: now,
        schedules: [
          { day_of_week: 1, day_name: '週一', start_time: '09:00', end_time: '10:00', location: 'A201' },
          { day_of_week: 3, day_name: '週三', start_time: '09:00', end_time: '10:00', location: 'A201' }
        ],
        has_schedule: true
      },
      {
        id: 'gc-67890',
        name: '英文 B 班',
        section: 'B',
        description: '文法與閱讀',
        enrollmentCode: 'UVWXYZ',
        courseState: 'ACTIVE',
        google_classroom_url: 'https://classroom.google.com/c/gc-67890',
        creationTime: now,
        updateTime: now,
        schedules: [
          { day_of_week: 2, day_name: '週二', start_time: '11:00', end_time: '12:00', location: 'B305' }
        ],
        has_schedule: true
      }
    ]

    return NextResponse.json({
      line_user_id: lineUserId,
      total_courses: courses.length,
      courses
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unexpected_error' }, { status: 500 })
  }
}