'use client'

import { useEffect, useState } from 'react'
import { useCourses } from '@/hooks/use-courses'
import { ApiService } from '@/services/apiService'

export default function ConsolePage() {
  const [lineUserId, setLineUserId] = useState<string>("")
  const [logs, setLogs] = useState<string[]>([])
  
  // 攔截 console.log 來顯示在頁面上
  useEffect(() => {
    const originalLog = console.log
    const originalError = console.error
    
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      setLogs(prev => [...prev, `[LOG] ${new Date().toLocaleTimeString()}: ${message}`])
      originalLog(...args)
    }
    
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      setLogs(prev => [...prev, `[ERROR] ${new Date().toLocaleTimeString()}: ${message}`])
      originalError(...args)
    }
    
    return () => {
      console.log = originalLog
      console.error = originalError
    }
  }, [])

  // 初始化 lineUserId
  useEffect(() => {
    const id = ApiService.bootstrapLineUserId()
    setLineUserId(id)
    setLogs(prev => [...prev, `[INIT] ${new Date().toLocaleTimeString()}: lineUserId 設置為 ${id}`])
  }, [])

  // 使用 useCourses hook
  const {
    courses,
    assignments,
    notes,
    exams,
    loading,
    error
  } = useCourses(lineUserId)

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">控制台日誌監控</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 狀態資訊 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-4">當前狀態</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Line User ID:</strong> {lineUserId || '未設置'}</div>
            <div><strong>載入中:</strong> {loading ? '是' : '否'}</div>
            <div><strong>錯誤:</strong> {error || '無'}</div>
            <div><strong>課程數量:</strong> {courses.length}</div>
            <div><strong>作業數量:</strong> {assignments.length}</div>
            <div><strong>筆記數量:</strong> {notes.length}</div>
            <div><strong>考試數量:</strong> {exams.length}</div>
          </div>
          
          {courses.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">課程列表:</h3>
              <ul className="text-sm space-y-1">
                {courses.map((course, index) => (
                  <li key={course.id} className="text-gray-600">
                    {index + 1}. {course.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 控制台日誌 */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-white">控制台日誌</h2>
            <button 
              onClick={clearLogs}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              清除日誌
            </button>
          </div>
          <div className="h-96 overflow-y-auto text-xs font-mono">
            {logs.length === 0 ? (
              <div className="text-gray-500">等待日誌輸出...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`mb-1 ${log.includes('[ERROR]') ? 'text-red-400' : ''}`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}