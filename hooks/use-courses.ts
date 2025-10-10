"use client"

import { useState, useEffect, useCallback } from "react"
import type { Course, Assignment, Note, Exam } from "@/types/course"
import { ApiService } from "@/services/apiService"
import { 
  transformBackendCourse, 
  transformFrontendCourse,
  transformBackendAssignment,
  transformFrontendAssignment,
  transformBackendNote,
  transformFrontendNote,
  transformBackendExam,
  transformFrontendExam
} from "@/lib/dataTransform"

export function useCourses(lineUserId: string) {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 載入所有資料
  const fetchAllData = useCallback(async () => {
    if (!lineUserId) {
      console.log('❌ 沒有 lineUserId，跳過載入')
      return
    }

    console.log('🔄 開始載入資料，lineUserId:', lineUserId)
    try {
      setLoading(true)
      setError(null)

      // 並行載入所有資料
      const [coursesRes, assignmentsRes, notesRes, examsRes] = await Promise.all([
        ApiService.getCourses(lineUserId),
        ApiService.getAssignments(lineUserId),
        ApiService.getNotes(lineUserId),
        ApiService.getExams(lineUserId)
      ])

      console.log('🔍 API 回應狀態:', {
        courses: coursesRes,
        assignments: assignmentsRes,
        notes: notesRes,
        exams: examsRes
      })

      if (coursesRes.error) {
        console.error('❌ 課程載入錯誤:', coursesRes.error)
        setError(coursesRes.error)
        return
      }

      if (assignmentsRes.error) {
        console.error('❌ 作業載入錯誤:', assignmentsRes.error)
        setError(assignmentsRes.error)
        return
      }

      if (notesRes.error) {
        console.error('❌ 筆記載入錯誤:', notesRes.error)
        setError(notesRes.error)
        return
      }

      if (examsRes.error) {
        console.error('❌ 考試載入錯誤:', examsRes.error)
        setError(examsRes.error)
        return
      }

      // 轉換資料格式 - 處理分頁回應
      console.log('🔍 API 回應資料:', {
        courses: coursesRes.data,
        assignments: assignmentsRes.data,
        notes: notesRes.data,
        exams: examsRes.data
      })

      const coursesData = (coursesRes.data as any)?.results || (coursesRes.data as any) || []
      const assignmentsData = (assignmentsRes.data as any)?.results || (assignmentsRes.data as any) || []
      const notesData = (notesRes.data as any)?.results || (notesRes.data as any) || []
      const examsData = (examsRes.data as any)?.results || (examsRes.data as any) || []

      console.log('🔍 處理後的資料:', {
        coursesData,
        assignmentsData,
        notesData,
        examsData
      })

      const transformedCourses = Array.isArray(coursesData) ? coursesData.map(transformBackendCourse) : []
      const transformedAssignments = Array.isArray(assignmentsData) ? assignmentsData.map(transformBackendAssignment) : []
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
      const filteredAssignments = transformedAssignments.filter(a => uuidRegex.test(a.id))
      const transformedNotes = Array.isArray(notesData) ? notesData.map(transformBackendNote) : []
      const transformedExams = Array.isArray(examsData) ? examsData.map(transformBackendExam) : []

      console.log('✅ 轉換後的資料:', {
        transformedCourses,
        transformedAssignments,
        transformedNotes,
        transformedExams
      })

      setCourses(transformedCourses)
      // 僅接受 UUID 來源的作業，避免舊假資料殘留
      setAssignments(filteredAssignments)
      setNotes(transformedNotes)
      setExams(transformedExams)
    } catch (err) {
      console.error('❌ 載入資料時發生錯誤:', err)
      setError(err instanceof Error ? err.message : '載入資料失敗')
    } finally {
      console.log('✅ 載入完成，設置 loading = false')
      setLoading(false)
    }
  }, [lineUserId])

  useEffect(() => {
    console.log('🔄 useEffect 觸發，lineUserId:', lineUserId)
    
    // 如果沒有 lineUserId，直接設置載入完成
    if (!lineUserId) {
      console.log('❌ 沒有 lineUserId，設置載入完成')
      setLoading(false)
      return
    }
    
    fetchAllData()
  }, [fetchAllData])

  // 課程管理函數
  const addCourse = useCallback(async (course: Omit<Course, "id" | "createdAt">) => {
    try {
      const backendData = transformFrontendCourse(course as Course, lineUserId)
      const response = await ApiService.createCourse(backendData)
      
      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data) {
        const newCourse = transformBackendCourse(response.data)
        setCourses(prev => [...prev, newCourse])
        await fetchAllData()
        return newCourse
      } else {
        throw new Error('API 回應沒有資料')
      }
    } catch (err) {
      console.error('新增課程失敗:', err)
      throw err
    }
  }, [lineUserId, fetchAllData])

  const updateCourse = useCallback(async (id: string, updates: Partial<Course>) => {
    try {
      const courseId = id
      const backendData = transformFrontendCourse(updates as Course, lineUserId)
      const response = await ApiService.updateCourse(courseId, backendData)
      
      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data) {
        const updatedCourse = transformBackendCourse(response.data)
        setCourses(prev => prev.map(course => 
          course.id === id ? updatedCourse : course
        ))
        await fetchAllData()
        return updatedCourse
      } else {
        throw new Error('API 回應沒有資料')
      }
    } catch (err) {
      console.error('更新課程失敗:', err)
      throw err
    }
  }, [lineUserId, fetchAllData])

  const deleteCourse = useCallback(async (id: string) => {
    try {
      const courseId = id
      const response = await ApiService.deleteCourse(courseId)

      if (response.error) {
        throw new Error(response.error)
      }

      // API 請求成功後，直接更新本地狀態以觸發UI刷新
      setCourses(prev => prev.filter(course => course.id !== id))
      setAssignments(prev => prev.filter(assignment => assignment.courseId !== id))
      setNotes(prev => prev.filter(note => note.courseId !== id))
      setExams(prev => prev.filter(exam => exam.courseId !== id))

      // 與新增/更新行為一致：再做一次完整同步，避免其他視圖殘留
      await fetchAllData()

    } catch (err) {
      console.error('刪除課程失敗:', err)
      throw err
    }
  }, [setCourses, setAssignments, setNotes, setExams, fetchAllData])

  // 輔助函數
  const getCourseById = (id: string) => {
    return courses.find((course) => course.id === id)
  }

  const getAssignmentsByCourse = (courseId: string) => {
    return assignments.filter((assignment) => assignment.courseId === courseId)
  }

  const getNotesByCourse = (courseId: string) => {
    return notes.filter((note) => note.courseId === courseId)
  }

  const getExamsByCourse = (courseId: string) => {
    return exams.filter((exam) => exam.courseId === courseId)
  }

  const getAssignmentById = (id: string) => {
    return assignments.find((assignment) => assignment.id === id)
  }

  const getExamById = (id: string) => {
    return exams.find((exam) => exam.id === id)
  }

  // 作業管理函數
  const addAssignment = useCallback(async (assignment: Omit<Assignment, "id" | "createdAt" | "updatedAt">) => {
    try {
      // 組裝必填欄位
      const payload: any = {
        title: assignment.title,
        description: assignment.description || '',
        due_date: assignment.dueDate ? assignment.dueDate.toISOString() : null,
        course: assignment.courseId || null,
        type: 'assignment',
        status: assignment.status || 'pending',
      }
      if (!payload.title || !payload.due_date || !payload.course) {
        throw new Error('請選擇課程並填寫標題與截止時間')
      }

      const response = await ApiService.createAssignment(payload)
      if (response.error) throw new Error(response.error)

      if (response.data) {
        const newAssignment = transformBackendAssignment(response.data)
        setAssignments(prev => [...prev, newAssignment])
        await fetchAllData()
        return newAssignment
      }
    } catch (err) {
      throw err
    }
  }, [lineUserId, fetchAllData])

  const updateAssignment = useCallback(async (id: string, updates: Partial<Assignment>) => {
    try {
      const uuidRegex = /^[0-9a-fA-F-]{36}$/
      if (!uuidRegex.test(id)) {
        console.warn('忽略更新非UUID的作業，疑似假資料 id=', id)
        return
      }

      // 僅更新狀態：使用專用端點，避免送出其他空欄位
      if (Object.keys(updates).length === 1 && updates.status) {
        const response = await ApiService.updateAssignmentStatus(id, updates.status)
        if (response.error) throw new Error(response.error)
        if (response.data) {
          const updated = transformBackendAssignment(response.data)
          setAssignments(prev => prev.map(a => (a.id === id ? updated : a)))
          await fetchAllData()
          return updated
        } else {
          // 如果沒有返回資料，拋出錯誤
          throw new Error('API 調用成功但沒有返回作業資料')
        }
      }

      // 部分更新：只組裝提供的欄位
      const minimal: any = {}
      if (updates.title !== undefined) minimal.title = updates.title
      if (updates.description !== undefined) minimal.description = updates.description
      if ((updates as any).courseId !== undefined) minimal.course = (updates as any).courseId
      if (updates.dueDate !== undefined) minimal.due_date = updates.dueDate ? updates.dueDate.toISOString() : null
      if (updates.status !== undefined) minimal.status = updates.status

      const response = await ApiService.updateAssignment(id, minimal)
      if (response.error) throw new Error(response.error)

      if (response.data) {
        const updatedAssignment = transformBackendAssignment(response.data)
        setAssignments(prev => prev.map(assignment => 
          assignment.id === id ? updatedAssignment : assignment
        ))
        await fetchAllData()
        return updatedAssignment
      }
    } catch (err) {
      throw err
    }
  }, [lineUserId, fetchAllData])

  const deleteAssignment = useCallback(async (id: string) => {
    try {
      const uuidRegex = /^[0-9a-fA-F-]{36}$/
      if (!uuidRegex.test(id)) {
        console.warn('忽略刪除非UUID的作業，疑似假資料 id=', id)
        // 直接從前端列表移除它，避免再次觸發錯誤
        setAssignments(prev => prev.filter(assignment => assignment.id !== id))
        return
      }

      const response = await ApiService.deleteAssignment(id)
      if (response.error) throw new Error(response.error)
      setAssignments(prev => prev.filter(assignment => assignment.id !== id))
      await fetchAllData()
    } catch (err) {
      throw err
    }
  }, [fetchAllData])

  // 筆記管理函數
  const addNote = useCallback(async (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    try {
      const backendData = transformFrontendNote(note as Note, lineUserId)
      const response = await ApiService.createNote(backendData)
      
      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data) {
        let created = transformBackendNote(response.data)

        // 後端有時不立即回傳附件，做一次補綁定（fallback）
        const wantIds = Array.isArray((note as any).attachments)
          ? (note as any).attachments.map((a: any) => a.id)
          : []
        if (wantIds.length > 0 && (!(response.data as any).attachments || (response.data as any).attachments.length === 0)) {
          const patch = { attachment_ids: wantIds }
          const fixResp = await ApiService.updateNote(created.id, patch as any)
          if (!fixResp.error && fixResp.data) {
            created = transformBackendNote(fixResp.data)
          }
        }

        setNotes(prev => [...prev, created])
        await fetchAllData()
        return created
      }
    } catch (err) {
      throw err
    }
  }, [lineUserId, fetchAllData])

  const updateNote = useCallback(async (id: string, updates: Partial<Omit<Note, "id" | "createdAt">>) => {
    try {
      const noteId = id
      const backendData = transformFrontendNote(updates as Note, lineUserId)
      const response = await ApiService.updateNote(noteId, backendData)
      
      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data) {
        let updated = transformBackendNote(response.data)

        // 補綁定（fallback）：若附件未回傳且本次帶了 attachments
        const wantIds = Array.isArray((updates as any).attachments)
          ? (updates as any).attachments.map((a: any) => a.id)
          : []
        if (wantIds.length > 0 && (!(response.data as any).attachments || (response.data as any).attachments.length === 0)) {
          const patch = { attachment_ids: wantIds }
          const fixResp = await ApiService.updateNote(noteId, patch as any)
          if (!fixResp.error && fixResp.data) {
            updated = transformBackendNote(fixResp.data)
          }
        }

        setNotes(prev => prev.map(note => 
          note.id === id ? updated : note
        ))
        await fetchAllData()
        return updated
      }
    } catch (err) {
      throw err
    }
  }, [lineUserId, fetchAllData])

  const deleteNote = useCallback(async (id: string) => {
    try {
      const noteId = id
      const response = await ApiService.deleteNote(noteId)
      
      if (response.error) {
        throw new Error(response.error)
      }

      setNotes(prev => prev.filter(note => note.id !== id))
      await fetchAllData()
    } catch (err) {
      throw err
    }
  }, [fetchAllData])

  // 考試管理函數
  const addExam = useCallback(async (exam: Omit<Exam, "id" | "createdAt" | "updatedAt">) => {
    try {
      const backendData = transformFrontendExam(exam as Exam, lineUserId)
      const response = await ApiService.createExam(backendData)
      
      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data) {
        const newExam = transformBackendExam(response.data)
        setExams(prev => [...prev, newExam])
        await fetchAllData()
        return newExam
      }
    } catch (err) {
      throw err
    }
  }, [lineUserId, fetchAllData])

  const updateExam = useCallback(async (id: string, updates: Partial<Omit<Exam, "id" | "createdAt">>) => {
    try {
      const uuidRegex = /^[0-9a-fA-F-]{36}$/
      if (!uuidRegex.test(id)) {
        console.warn('忽略更新非UUID的考試，疑似假資料 id=', id)
        return
      }

      // 僅更新狀態：使用專用端點，避免送出其他空欄位
      if (Object.keys(updates).length === 1 && updates.status) {
        const response = await ApiService.updateExamStatus(id, updates.status)
        if (response.error) throw new Error(response.error)
        if (response.data) {
          const updated = transformBackendExam(response.data)
          setExams(prev => prev.map(e => (e.id === id ? updated : e)))
          await fetchAllData()
          return updated
        } else {
          // 如果沒有返回資料，拋出錯誤
          throw new Error('API 調用成功但沒有返回考試資料')
        }
      }

      // 完整更新：使用一般的更新端點
      const examId = id
      const backendData = transformFrontendExam(updates as Exam, lineUserId)
      const response = await ApiService.updateExam(examId, backendData)
      
      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data) {
        const updatedExam = transformBackendExam(response.data)
        setExams(prev => prev.map(exam => 
          exam.id === id ? updatedExam : exam
        ))
        await fetchAllData()
        return updatedExam
      }
    } catch (err) {
      throw err
    }
  }, [lineUserId, fetchAllData])

  const deleteExam = useCallback(async (id: string) => {
    try {
      const examId = id
      const response = await ApiService.deleteExam(examId)
      
      if (response.error) {
        throw new Error(response.error)
      }

      setExams(prev => prev.filter(exam => exam.id !== id))
      await fetchAllData()
    } catch (err) {
      throw err
    }
  }, [fetchAllData])

  return {
    courses,
    assignments,
    notes,
    exams,
    loading,
    error,
    addCourse,
    updateCourse,
    deleteCourse,
    getCourseById,
    getAssignmentsByCourse,
    getNotesByCourse,
    getExamsByCourse,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentById,
    addNote,
    updateNote,
    deleteNote,
    addExam,
    updateExam,
    deleteExam,
    getExamById,
    refetch: fetchAllData
  }
}
