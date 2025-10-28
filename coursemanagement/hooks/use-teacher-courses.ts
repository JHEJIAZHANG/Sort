"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Course, Assignment } from "@/types/course"
import { ApiService } from "@/services/apiService"
import { transformBackendCourse, transformBackendAssignment } from "@/lib/dataTransform"

/**
 * 教師專用的課程和作業管理 Hook
 * 使用教師專用的 API 端點：
 * - /api/courses/ (教師課程列表)
 * - /api/teacher/assignments/ (教師作業列表)
 */
export function useTeacherCourses(lineUserId: string) {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchPromiseRef = useRef<Promise<void> | null>(null)

  // 載入教師的課程和作業資料
  const fetchAllData = useCallback(async () => {
    if (!lineUserId) {
      console.log('❌ 沒有 lineUserId，跳過載入')
      return
    }

    // 若已有正在進行的刷新，直接等待同一承諾，避免重複執行
    if (fetchPromiseRef.current) {
      console.log('⏳ 已有正在進行的刷新，等待完成...')
      return fetchPromiseRef.current
    }

    console.log('========== useTeacherCourses: 開始載入教師資料 ==========')
    console.log('lineUserId:', lineUserId)
    const run = (async () => {
      try {
        setLoading(true)
        setError(null)

        // 使用教師專用 API
        const [coursesRes, assignmentsRes] = await Promise.all([
          ApiService.getTeacherCourses(lineUserId),
          ApiService.getTeacherAssignments(lineUserId)
        ])

        if (coursesRes.error) { 
          console.error('❌ 載入教師課程失敗:', coursesRes.error)
          setError(coursesRes.error)
          return 
        }
        if (assignmentsRes.error) { 
          console.error('❌ 載入教師作業失敗:', assignmentsRes.error)
          setError(assignmentsRes.error)
          return 
        }

        const coursesData = coursesRes.data || []
        const assignmentsData = assignmentsRes.data || []

        const transformedCourses = Array.isArray(coursesData) 
          ? coursesData.map(transformBackendCourse) 
          : []
        const transformedAssignments = Array.isArray(assignmentsData) 
          ? assignmentsData.map(transformBackendAssignment) 
          : []

        console.log('✅ 教師資料載入成功:')
        console.log('  - 課程數量:', transformedCourses.length)
        console.log('  - 作業數量:', transformedAssignments.length)

        setCourses(transformedCourses)
        setAssignments(transformedAssignments)
      } catch (err) {
        console.error('❌ 載入教師資料時發生錯誤:', err)
        setError(err instanceof Error ? err.message : '載入資料失敗')
      } finally {
        setLoading(false)
        fetchPromiseRef.current = null
      }
    })()

    fetchPromiseRef.current = run
    return run
  }, [lineUserId])

  useEffect(() => {
    console.log('🔄 useTeacherCourses useEffect 觸發，lineUserId:', lineUserId)
    
    // 如果沒有 lineUserId，直接設置載入完成
    if (!lineUserId) {
      console.log('❌ 沒有 lineUserId，設置載入完成')
      setLoading(false)
      return
    }
    
    fetchAllData()
  }, [fetchAllData])

  // 輔助函數
  const getCourseById = (id: string) => {
    return courses.find((course) => course.id === id)
  }

  const getAssignmentsByCourse = (courseId: string) => {
    return assignments.filter((assignment) => assignment.courseId === courseId)
  }

  const getAssignmentById = (id: string) => {
    return assignments.find((assignment) => assignment.id === id)
  }

  return {
    courses,
    assignments,
    loading,
    error,
    getCourseById,
    getAssignmentsByCourse,
    getAssignmentById,
    refetch: fetchAllData
  }
}
