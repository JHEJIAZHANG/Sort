"use client"

import { useState, useEffect, useCallback } from "react"
import { ApiService } from "@/services/apiService"

export interface CustomTodoItem {
  id: string
  category?: string | null
  course?: string | null
  title: string
  description?: string
  dueDate: Date
  status: "pending" | "completed" | "overdue"
  createdAt: Date
  updatedAt: Date
}

function fromBackend(item: any): CustomTodoItem {
  return {
    id: item.id,
    category: item.category ?? null,
    course: item.course ?? null,
    title: item.title,
    description: item.description || "",
    dueDate: new Date(item.due_date || item.dueDate),
    status: item.status,
    createdAt: new Date(item.created_at || item.createdAt),
    updatedAt: new Date(item.updated_at || item.updatedAt),
  }
}

function toBackend(item: Omit<CustomTodoItem, "id" | "createdAt" | "updatedAt">) {
  return {
    category: item.category ?? null,
    course: item.course ?? null,
    title: item.title,
    description: item.description || "",
    due_date: item.dueDate.toISOString(),
    status: item.status,
  }
}

export function useCustomTodos(lineUserId: string) {
  const [items, setItems] = useState<CustomTodoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!lineUserId) return
    try {
      setIsLoading(true)
      setError(null)
      const resp = await ApiService.getCustomTodos(lineUserId)
      const data = (resp as any)?.data?.data || (resp as any)?.data?.results || resp.data || []
      if (Array.isArray(data)) {
        setItems(data.map(fromBackend))
      } else {
        setItems([])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入自訂待辦失敗")
    } finally {
      setIsLoading(false)
    }
  }, [lineUserId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const addItem = useCallback(async (data: Omit<CustomTodoItem, "id" | "createdAt" | "updatedAt">) => {
    const payload = toBackend(data)
    const resp = await ApiService.createCustomTodo(payload)
    if (resp.error) throw new Error(resp.error)
    const created = fromBackend(((resp as any)?.data?.data) ?? resp.data)
    setItems(prev => [...prev, created])
    return created
  }, [])

  const updateItem = useCallback(async (id: string, updates: Partial<Omit<CustomTodoItem, "id" | "createdAt" | "updatedAt">>) => {
    try {
      // 獲取當前項目用於回滾
      const currentItem = items.find(i => i.id === id)
      if (!currentItem) {
        throw new Error('找不到要更新的待辦事項')
      }

      // 樂觀更新：立即更新本地狀態
      const optimisticUpdate = { 
        ...currentItem, 
        ...updates, 
        updatedAt: new Date() 
      }
      setItems(prev => prev.map(i => (i.id === id ? optimisticUpdate : i)))

      try {
        // 準備API payload
        const payload: any = {}
        if (updates.title !== undefined) payload.title = updates.title
        if (updates.description !== undefined) payload.description = updates.description
        if (updates.dueDate !== undefined) payload.due_date = updates.dueDate.toISOString()
        if (updates.status !== undefined) payload.status = updates.status
        if (updates.category !== undefined) payload.category = updates.category
        if (updates.course !== undefined) payload.course = updates.course

        console.log('更新待辦事項:', { id, payload })
        const resp = await ApiService.updateCustomTodo(id, payload)
        
        if (resp.error) {
          throw new Error(resp.error)
        }
        
        // 處理API回應
        let finalUpdate: CustomTodoItem
        if (resp.data) {
          try {
            finalUpdate = fromBackend(((resp as any)?.data?.data) ?? resp.data)
          } catch (transformError) {
            console.warn('API回應轉換失敗，使用樂觀更新結果:', transformError)
            finalUpdate = optimisticUpdate
          }
        } else {
          finalUpdate = optimisticUpdate
        }
        
        console.log('更新成功:', finalUpdate)
        
        // 更新本地狀態
        setItems(prev => prev.map(i => (i.id === id ? finalUpdate : i)))
        
        return finalUpdate

      } catch (apiError) {
        // API調用失敗，回滾到原始狀態
        console.error('待辦事項更新失敗，回滾狀態:', apiError)
        setItems(prev => prev.map(i => (i.id === id ? currentItem : i)))
        throw apiError
      }

    } catch (error) {
      console.error('更新待辦事項錯誤:', error)
      throw error
    }
  }, [items])

  const deleteItem = useCallback(async (id: string) => {
    try {
      // 保存當前項目用於回滾
      const currentItem = items.find(i => i.id === id)
      if (!currentItem) {
        throw new Error('找不到要刪除的待辦事項')
      }

      // 樂觀更新：立即從本地狀態移除
      setItems(prev => prev.filter(i => i.id !== id))

      try {
        console.log('刪除待辦事項:', id)
        const resp = await ApiService.deleteCustomTodo(id)
        
        if (resp.error) {
          throw new Error(resp.error)
        }
        
        console.log('刪除成功')

      } catch (apiError) {
        // API調用失敗，回滾狀態
        console.error('待辦事項刪除失敗，回滾狀態:', apiError)
        setItems(prev => [...prev, currentItem].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ))
        throw apiError
      }

    } catch (error) {
      console.error('刪除待辦事項錯誤:', error)
      throw error
    }
  }, [items])

  const getById = (id: string) => items.find(i => i.id === id)

  return { items, isLoading, error, addItem, updateItem, deleteItem, getById, refetch: fetchItems }
}
