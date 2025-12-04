"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, Clock, MapPin, User, BookOpen, X, Check, Calendar, GraduationCap, ChevronDown, ChevronRight, CheckSquare, Square } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface OCRSchedule {
  day_of_week: number
  start: string
  end: string
}

interface OCRConflict {
  day_of_week: number
  start_time: string
  end_time: string
  conflicting_course: {
    id: number
    title: string
    instructor: string
    classroom: string
    start_time: string
    end_time: string
  }
}

interface OCRCourse {
  title: string
  instructor: string
  classroom: string
  schedule: OCRSchedule[]
  conflicts?: OCRConflict[]
  has_conflicts?: boolean
}

interface OCRPreviewData {
  items: OCRCourse[]
  total_courses: number
  courses_with_conflicts: number
}

interface OCRPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  data: OCRPreviewData | null
  onConfirm: (selectedCourses: OCRCourse[]) => void
  loading?: boolean
}

const dayNames = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

export function OCRPreviewModal({ isOpen, onClose, data, onConfirm, loading = false }: OCRPreviewModalProps) {
  const [editedCourses, setEditedCourses] = useState<OCRCourse[]>([])
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set())
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set())

  React.useEffect(() => {
    if (data?.items) {
      setEditedCourses([...data.items])
      // 預設選擇沒有衝突的課程
      const noConflictIndices = data.items
        .map((course, index) => ({ course, index }))
        .filter(({ course }) => !course.has_conflicts)
        .map(({ index }) => index)
      setSelectedCourses(new Set(noConflictIndices))
      // 預設展開有衝突的課程
      const conflictIndices = data.items
        .map((course, index) => ({ course, index }))
        .filter(({ course }) => course.has_conflicts)
        .map(({ index }) => index)
      setExpandedCourses(new Set(conflictIndices))
    }
  }, [data])

  const handleCourseEdit = (index: number, field: keyof OCRCourse, value: string) => {
    const updated = [...editedCourses]
    if (field === 'title' || field === 'instructor' || field === 'classroom') {
      updated[index] = { ...updated[index], [field]: value }
      setEditedCourses(updated)
    }
  }

  const handleScheduleEdit = (courseIndex: number, scheduleIndex: number, field: keyof OCRSchedule, value: string) => {
    const updated = [...editedCourses]
    const updatedSchedule = [...updated[courseIndex].schedule]
    if (field === 'start' || field === 'end') {
      updatedSchedule[scheduleIndex] = { ...updatedSchedule[scheduleIndex], [field]: value }
    } else if (field === 'day_of_week') {
      updatedSchedule[scheduleIndex] = { ...updatedSchedule[scheduleIndex], [field]: parseInt(value) }
    }
    updated[courseIndex] = { ...updated[courseIndex], schedule: updatedSchedule }
    
    // 重新檢查衝突狀態
    const hasConflicts = checkCourseConflicts(updated[courseIndex], courseIndex, updated)
    updated[courseIndex] = { 
      ...updated[courseIndex], 
      has_conflicts: hasConflicts,
      conflicts: hasConflicts ? updated[courseIndex].conflicts : []
    }
    
    setEditedCourses(updated)
    
    // 如果修改後沒有衝突了，自動選中該課程
    if (!hasConflicts && !selectedCourses.has(courseIndex)) {
      const newSelected = new Set(selectedCourses)
      newSelected.add(courseIndex)
      setSelectedCourses(newSelected)
    }
  }

  // 檢查課程是否有衝突
  const checkCourseConflicts = (course: OCRCourse, courseIndex: number, allCourses: OCRCourse[]): boolean => {
    // 檢查與其他課程的衝突
    for (let i = 0; i < allCourses.length; i++) {
      if (i === courseIndex) continue // 跳過自己
      
      const otherCourse = allCourses[i]
      for (const schedule of course.schedule) {
        for (const otherSchedule of otherCourse.schedule) {
          // 檢查是否在同一天
          if (schedule.day_of_week === otherSchedule.day_of_week) {
            // 檢查時間是否重疊
            const start1 = schedule.start
            const end1 = schedule.end
            const start2 = otherSchedule.start
            const end2 = otherSchedule.end
            
            // 時間重疊判斷：!(end1 <= start2 || start1 >= end2)
            if (!(end1 <= start2 || start1 >= end2)) {
              return true // 有衝突
            }
          }
        }
      }
    }
    
    // 檢查課程內部時段是否有衝突
    for (let i = 0; i < course.schedule.length; i++) {
      for (let j = i + 1; j < course.schedule.length; j++) {
        const schedule1 = course.schedule[i]
        const schedule2 = course.schedule[j]
        
        if (schedule1.day_of_week === schedule2.day_of_week) {
          const start1 = schedule1.start
          const end1 = schedule1.end
          const start2 = schedule2.start
          const end2 = schedule2.end
          
          if (!(end1 <= start2 || start1 >= end2)) {
            return true // 內部時段衝突
          }
        }
      }
    }
    
    return false // 沒有衝突
  }

  const toggleCourseSelection = (index: number) => {
    const newSelected = new Set(selectedCourses)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedCourses(newSelected)
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

  // 全選/取消全選功能
  const handleSelectAll = () => {
    const availableCourses = editedCourses
      .map((course, index) => ({ course, index }))
      .filter(({ course }) => !course.has_conflicts)
      .map(({ index }) => index)
    
    if (selectedCourses.size === availableCourses.length) {
      // 如果已全選，則取消全選
      setSelectedCourses(new Set())
    } else {
      // 否則全選所有可用課程
      setSelectedCourses(new Set(availableCourses))
    }
  }

  // 展開/收起所有課程
  const handleExpandAll = () => {
    if (expandedCourses.size === editedCourses.length) {
      setExpandedCourses(new Set())
    } else {
      setExpandedCourses(new Set(editedCourses.map((_, index) => index)))
    }
  }

  const handleConfirm = () => {
    const selected = editedCourses.filter((_, index) => selectedCourses.has(index))
    onConfirm(selected)
  }

  // 實時計算衝突數量（基於當前編輯狀態）
  const conflictCount = editedCourses.filter(course => course.has_conflicts).length
  const availableCount = editedCourses.length - conflictCount
  const selectedCount = selectedCourses.size
  const isAllSelected = selectedCount === availableCount && availableCount > 0
  const isAllExpanded = expandedCourses.size === editedCourses.length

  if (!data) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-2xl lg:max-w-5xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-3 sm:p-6">
        <DialogHeader className="pb-3 sm:pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-xl">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="truncate">OCR 課程識別結果預覽</span>
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            請檢查並編輯識別結果，選擇要新增的課程
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-6 pr-1">
          {/* 統計信息和控制按鈕 */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      識別到 <span className="font-semibold text-foreground">{data.total_courses}</span> 個課程
                    </span>
                  </div>
                  {conflictCount > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-orange-600">
                        <span className="font-semibold">{conflictCount}</span> 個課程有時段衝突
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={availableCount === 0}
                    className="flex items-center gap-1 text-xs sm:text-sm h-8 px-2 sm:px-3"
                  >
                    {isAllSelected ? (
                      <>
                        <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">取消全選</span>
                        <span className="sm:hidden">取消</span>
                      </>
                    ) : (
                      <>
                        <Square className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">全選可用</span>
                        <span className="sm:hidden">全選</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExpandAll}
                    className="flex items-center gap-1 text-xs sm:text-sm h-8 px-2 sm:px-3"
                  >
                    {isAllExpanded ? (
                      <>
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">收起全部</span>
                        <span className="sm:hidden">收起</span>
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">展開全部</span>
                        <span className="sm:hidden">展開</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 課程列表 */}
          {editedCourses.map((course, courseIndex) => (
            <Card key={courseIndex} className={`transition-all duration-200 ${
              course.has_conflicts 
                ? 'border-orange-200 bg-orange-50/50 shadow-sm' 
                : selectedCourses.has(courseIndex)
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card shadow-sm hover:shadow-md'
            }`}>
              <Collapsible 
                open={expandedCourses.has(courseIndex)}
                onOpenChange={() => toggleCourseExpansion(courseIndex)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="p-3 sm:pb-4 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-start sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={selectedCourses.has(courseIndex)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedCourses)
                            if (checked) {
                              newSelected.add(courseIndex)
                            } else {
                              newSelected.delete(courseIndex)
                            }
                            setSelectedCourses(newSelected)
                          }}
                          disabled={course.has_conflicts}
                          className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <CardTitle className="text-sm sm:text-lg font-semibold break-words">
                              {course.title || `課程 ${courseIndex + 1}`}
                            </CardTitle>
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                              {course.instructor && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{course.instructor}</span>
                                </span>
                              )}
                              {course.classroom && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{course.classroom}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                {course.schedule.length} 個時段
                              </span>
                            </div>
                            {course.has_conflicts && (
                              <Badge variant="destructive" className="flex items-center gap-1 font-medium text-xs w-fit mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                時段衝突
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {expandedCourses.has(courseIndex) ? (
                          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-4 sm:space-y-6 pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                    {/* 課程基本信息 */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <User className="h-4 w-4 text-primary flex-shrink-0" />
                        <h4 className="font-medium text-xs sm:text-sm text-muted-foreground">課程基本信息</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label htmlFor={`course-name-${courseIndex}`} className="text-xs sm:text-sm font-medium">
                            課程名稱 <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`course-name-${courseIndex}`}
                            value={course.title}
                            onChange={(e) => handleCourseEdit(courseIndex, 'title', e.target.value)}
                            placeholder="請輸入課程名稱"
                            className="h-9 sm:h-10 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label htmlFor={`course-instructor-${courseIndex}`} className="text-xs sm:text-sm font-medium">
                            授課教師
                          </Label>
                          <Input
                            id={`course-instructor-${courseIndex}`}
                            value={course.instructor}
                            onChange={(e) => handleCourseEdit(courseIndex, 'instructor', e.target.value)}
                            placeholder="請輸入授課教師"
                            className="h-9 sm:h-10 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3 sm:my-4" />

                    {/* 時段信息 */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                        <h4 className="font-medium text-xs sm:text-sm text-muted-foreground">課程時段</h4>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        {course.schedule.map((schedule, scheduleIndex) => (
                          <div key={scheduleIndex} className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 ${
                            course.has_conflicts 
                              ? 'border-destructive/30 bg-destructive/5' 
                              : 'border-border bg-muted/30'
                          }`}>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">星期</Label>
                                <select
                                  value={schedule.day_of_week}
                                  onChange={(e) => handleScheduleEdit(courseIndex, scheduleIndex, 'day_of_week', e.target.value)}
                                  className="px-2 py-1.5 border rounded text-xs sm:text-sm w-full h-9"
                                >
                                  {dayNames.map((day, index) => (
                                    <option key={index} value={index}>{day}</option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="space-y-1">
                                <Label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">開始</Label>
                                <Input
                                  type="time"
                                  value={schedule.start}
                                  onChange={(e) => handleScheduleEdit(courseIndex, scheduleIndex, 'start', e.target.value)}
                                  className="text-xs sm:text-sm h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">結束</Label>
                                <Input
                                  type="time"
                                  value={schedule.end}
                                  onChange={(e) => handleScheduleEdit(courseIndex, scheduleIndex, 'end', e.target.value)}
                                  className="text-xs sm:text-sm h-9"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 衝突資訊 */}
                    {course.conflicts && course.conflicts.length > 0 && (
                      <div className="bg-orange-100 border border-orange-200 rounded p-2 sm:p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium text-orange-800">時段衝突詳情</span>
                        </div>
                        <div className="space-y-2">
                          {course.conflicts.map((conflict, index) => (
                            <div key={index} className="text-xs sm:text-sm text-orange-700 bg-white p-2 rounded break-words">
                              <div className="font-medium">
                                {dayNames[conflict.day_of_week]} {conflict.start_time}-{conflict.end_time}
                              </div>
                              <div className="text-[10px] sm:text-xs mt-1 break-words">
                                與現有課程衝突：{conflict.conflicting_course.title} 
                                ({conflict.conflicting_course.instructor}) 
                                {conflict.conflicting_course.start_time}-{conflict.conflicting_course.end_time}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        <DialogFooter className="pt-3 sm:pt-6 border-t bg-muted/30 flex-shrink-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">
                  已選擇 <span className="font-semibold text-foreground">{selectedCourses.size}</span> / {availableCount} 個可用課程
                </span>
              </div>
              {conflictCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
                  <span className="text-orange-600 text-xs sm:text-sm">
                    <span className="font-semibold">{conflictCount}</span> 個有衝突，將被跳過
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button variant="outline" onClick={onClose} className="font-medium text-xs sm:text-sm h-9 px-3 flex-1 sm:flex-none">
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                取消
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={selectedCourses.size === 0 || loading}
                className="font-medium text-xs sm:text-sm h-9 px-3 flex-1 sm:flex-none"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                    <span className="hidden sm:inline">處理中...</span>
                    <span className="sm:hidden">處理中</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">確認新增 {selectedCourses.size} 個課程</span>
                    <span className="sm:hidden">確認 ({selectedCourses.size})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
