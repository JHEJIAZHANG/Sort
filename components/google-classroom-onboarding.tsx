"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  X, 
  Check, 
  Calendar, 
  GraduationCap, 
  ChevronDown, 
  ChevronRight, 
  CheckSquare, 
  Square,
  Loader2
} from "lucide-react"
import { ApiService } from "@/services/apiService"

interface GoogleClassroomCourse {
  id: string
  name: string
  section?: string
  descriptionHeading?: string
  room?: string
  ownerId?: string
  courseState?: string
  alternateLink?: string
}

interface CourseSchedule {
  day_of_week: number
  start_time: string
  end_time: string
}

interface EditableCourse extends GoogleClassroomCourse {
  selected: boolean
  schedules: CourseSchedule[]
  instructor?: string
  classroom?: string
}

interface GoogleClassroomOnboardingProps {
  isOpen: boolean
  onComplete: () => void
  onSkip: () => void
}

const dayNames = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

export function GoogleClassroomOnboarding({ isOpen, onComplete, onSkip }: GoogleClassroomOnboardingProps) {
  const [step, setStep] = useState<'welcome' | 'loading' | 'select'>('welcome')
  const [courses, setCourses] = useState<EditableCourse[]>([])
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 載入 Google Classroom 課程（不再重複同步）
  const loadGoogleClassroomCourses = async () => {
    setStep('loading')
    setError(null)
    
    try {
      // 直接獲取課程列表，不再重複同步
      const coursesResponse = await ApiService.getCourses(ApiService.getLineUserId())
      
      if (coursesResponse.error) {
        throw new Error(coursesResponse.error)
      }

      // 只顯示沒有設定時間表的課程（未匯入的課程）
      const googleCourses = (coursesResponse.data || [])
        .filter((course: any) => 
          course.source === 'google_classroom' && 
          (!course.schedule || course.schedule.length === 0)
        )
        .map((course: any) => ({
          id: course.id,
          name: course.name,
          section: course.courseCode,
          room: course.classroom,
          instructor: course.instructor,
          selected: true, // 預設全選
          schedules: [{
            day_of_week: 0,
            start_time: '09:00',
            end_time: '10:30'
          }],
          classroom: course.classroom || ''
        }))

      // 如果沒有未匯入的課程，顯示提示
      if (googleCourses.length === 0) {
        setError('沒有找到未匯入的課程。所有 Google Classroom 課程都已設定時間表。')
        setStep('welcome')
        return
      }

      setCourses(googleCourses)
      setStep('select')
      
      // 預設展開所有課程
      setExpandedCourses(new Set(googleCourses.map((_: any, index: number) => index)))
    } catch (err) {
      console.error('載入 Google Classroom 課程失敗:', err)
      setError(err instanceof Error ? err.message : '載入失敗')
      setStep('welcome')
    }
  }

  const toggleCourseSelection = (index: number) => {
    const updated = [...courses]
    updated[index].selected = !updated[index].selected
    setCourses(updated)
  }

  const toggleCourseExpansion = (index: number) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedCourses(newExpanded)
  }

  const handleCourseEdit = (index: number, field: keyof EditableCourse, value: string) => {
    const updated = [...courses]
    if (field === 'name' || field === 'instructor' || field === 'classroom') {
      updated[index] = { ...updated[index], [field]: value }
      setCourses(updated)
    }
  }

  const handleScheduleEdit = (courseIndex: number, scheduleIndex: number, field: keyof CourseSchedule, value: string | number) => {
    const updated = [...courses]
    const updatedSchedules = [...updated[courseIndex].schedules]
    updatedSchedules[scheduleIndex] = { ...updatedSchedules[scheduleIndex], [field]: value }
    updated[courseIndex].schedules = updatedSchedules
    setCourses(updated)
  }

  const addSchedule = (courseIndex: number) => {
    const updated = [...courses]
    updated[courseIndex].schedules.push({
      day_of_week: 0,
      start_time: '09:00',
      end_time: '10:30'
    })
    setCourses(updated)
  }

  const removeSchedule = (courseIndex: number, scheduleIndex: number) => {
    const updated = [...courses]
    updated[courseIndex].schedules = updated[courseIndex].schedules.filter((_, i) => i !== scheduleIndex)
    setCourses(updated)
  }

  const handleSelectAll = () => {
    const allSelected = courses.every(c => c.selected)
    const updated = courses.map(c => ({ ...c, selected: !allSelected }))
    setCourses(updated)
  }

  const handleExpandAll = () => {
    if (expandedCourses.size === courses.length) {
      setExpandedCourses(new Set())
    } else {
      setExpandedCourses(new Set(courses.map((_, index) => index)))
    }
  }

  const handleConfirm = async () => {
    setImporting(true)
    setError(null)

    try {
      const selectedCourses = courses.filter(c => c.selected)
      
      // 更新每個課程的時間表
      for (const course of selectedCourses) {
        await ApiService.setCourseSchedule(
          course.id,
          course.schedules.map(s => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            location: course.classroom || ''
          }))
        )
      }

      onComplete()
    } catch (err) {
      console.error('匯入課程失敗:', err)
      setError(err instanceof Error ? err.message : '匯入失敗')
    } finally {
      setImporting(false)
    }
  }

  const selectedCount = courses.filter(c => c.selected).length
  const isAllSelected = selectedCount === courses.length && courses.length > 0
  const isAllExpanded = expandedCourses.size === courses.length

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-[calc(100vw-1rem)] sm:max-w-2xl lg:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {step === 'welcome' && (
          <>
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <GraduationCap className="h-6 w-6 text-primary" />
                歡迎使用課程管理系統
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6 py-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">匯入 Google Classroom 課程</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  系統將載入您的 Google Classroom 課程，您可以選擇要匯入的課程並設定上課時間。
                </p>
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-6 border-t">
              <div className="flex gap-3 w-full sm:w-auto">
                <Button variant="outline" onClick={onSkip} className="flex-1 sm:flex-none">
                  取消
                </Button>
                <Button onClick={loadGoogleClassroomCourses} className="flex-1 sm:flex-none">
                  開始匯入
                </Button>
              </div>
            </DialogFooter>
          </>
        )}

        {step === 'loading' && (
          <>
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <GraduationCap className="h-6 w-6 text-primary" />
                載入課程中
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">正在從 Google Classroom 載入課程...</p>
              </div>
            </div>
          </>
        )}

        {step === 'select' && (
          <>
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <GraduationCap className="h-6 w-6 text-primary" />
                選擇要匯入的課程
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                請選擇要匯入的課程並設定上課時間
              </p>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* 統計信息和控制按鈕 */}
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          找到 <span className="font-semibold text-foreground">{courses.length}</span> 個課程
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={courses.length === 0}
                        className="flex items-center gap-2"
                      >
                        {isAllSelected ? (
                          <>
                            <CheckSquare className="h-4 w-4" />
                            取消全選
                          </>
                        ) : (
                          <>
                            <Square className="h-4 w-4" />
                            全選
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExpandAll}
                        className="flex items-center gap-2"
                      >
                        {isAllExpanded ? (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            收起全部
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-4 w-4" />
                            展開全部
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 課程列表 */}
              {courses.map((course, courseIndex) => (
                <Card key={courseIndex} className={`transition-all duration-200 ${
                  course.selected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-card shadow-sm hover:shadow-md'
                }`}>
                  <Collapsible 
                    open={expandedCourses.has(courseIndex)}
                    onOpenChange={() => toggleCourseExpansion(courseIndex)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={course.selected}
                              onCheckedChange={() => toggleCourseSelection(courseIndex)}
                              className="h-5 w-5"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-primary" />
                              <div className="flex flex-col">
                                <CardTitle className="text-lg font-semibold">
                                  {course.name}
                                </CardTitle>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {course.section && (
                                    <span>{course.section}</span>
                                  )}
                                  {course.classroom && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {course.classroom}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {course.schedules.length} 個時段
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {expandedCourses.has(courseIndex) ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="space-y-6 pt-0">
                        {/* 課程基本信息 */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-3">
                            <User className="h-4 w-4 text-primary" />
                            <h4 className="font-medium text-sm text-muted-foreground">課程基本信息</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`course-name-${courseIndex}`} className="text-sm font-medium">
                                課程名稱 <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id={`course-name-${courseIndex}`}
                                value={course.name}
                                onChange={(e) => handleCourseEdit(courseIndex, 'name', e.target.value)}
                                placeholder="請輸入課程名稱"
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`course-instructor-${courseIndex}`} className="text-sm font-medium">
                                授課教師
                              </Label>
                              <Input
                                id={`course-instructor-${courseIndex}`}
                                value={course.instructor || ''}
                                onChange={(e) => handleCourseEdit(courseIndex, 'instructor', e.target.value)}
                                placeholder="請輸入授課教師"
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`course-location-${courseIndex}`} className="text-sm font-medium">
                                上課地點
                              </Label>
                              <Input
                                id={`course-location-${courseIndex}`}
                                value={course.classroom || ''}
                                onChange={(e) => handleCourseEdit(courseIndex, 'classroom', e.target.value)}
                                placeholder="請輸入上課地點"
                                className="h-10"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        {/* 時段信息 */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <h4 className="font-medium text-sm text-muted-foreground">課程時段</h4>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addSchedule(courseIndex)}
                            >
                              新增時段
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {course.schedules.map((schedule, scheduleIndex) => (
                              <div key={scheduleIndex} className="p-4 rounded-lg border border-border bg-muted/30">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">星期</Label>
                                    <select
                                      value={schedule.day_of_week}
                                      onChange={(e) => handleScheduleEdit(courseIndex, scheduleIndex, 'day_of_week', parseInt(e.target.value))}
                                      className="px-2 py-1 border rounded text-sm w-full"
                                    >
                                      {dayNames.map((day, index) => (
                                        <option key={index} value={index}>{day}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">開始時間</Label>
                                    <Input
                                      type="time"
                                      value={schedule.start_time}
                                      onChange={(e) => handleScheduleEdit(courseIndex, scheduleIndex, 'start_time', e.target.value)}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">結束時間</Label>
                                    <Input
                                      type="time"
                                      value={schedule.end_time}
                                      onChange={(e) => handleScheduleEdit(courseIndex, scheduleIndex, 'end_time', e.target.value)}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1 flex items-end">
                                    {course.schedules.length > 1 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeSchedule(courseIndex, scheduleIndex)}
                                        className="w-full"
                                      >
                                        刪除
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>

            <DialogFooter className="pt-6 border-t bg-muted/30">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">
                      已選擇 <span className="font-semibold text-foreground">{selectedCount}</span> / {courses.length} 個課程
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onSkip} disabled={importing}>
                    <X className="h-4 w-4 mr-2" />
                    取消
                  </Button>
                  <Button 
                    onClick={handleConfirm}
                    disabled={selectedCount === 0 || importing}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        匯入中...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        確認匯入 {selectedCount} 個課程
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive mt-4">
                {error}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
