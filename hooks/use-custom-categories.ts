"use client"

import { useState, useEffect, useCallback } from "react"
import { ApiService } from "@/services/apiService"

export interface CustomCategory {
  id: string
  name: string
  icon: string
  color: string
  createdAt: Date
}

export function useCustomCategories(lineUserId: string) {
  const [categories, setCategories] = useState<CustomCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 載入分類資料（僅依賴後端資料）
  const fetchCategories = useCallback(async () => {
    if (!lineUserId) return

    try {
      setIsLoading(true)
      setError(null)

      // 後端 API 優先
      const resp = await ApiService.getCustomCategories(lineUserId)
      const raw = (resp.data as any)?.results || (resp.data as any) || []
      if (Array.isArray(raw)) {
        const categories = raw.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || 'clipboard',
          color: cat.color || '#3b82f6',
          createdAt: new Date(cat.created_at),
        }))
        setCategories(categories)
        return
      }
      setCategories([])
    } catch (error) {
      setError(error instanceof Error ? error.message : '載入自定義分類失敗')
    } finally {
      setIsLoading(false)
    }
  }, [lineUserId])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const addCategory = useCallback(async (category: Omit<CustomCategory, "id" | "createdAt">) => {
    try {
      // 後端優先
      const resp = await ApiService.createCustomCategory({ name: category.name, icon: category.icon, color: category.color })
      if (!resp.data) {
        throw new Error('無法建立自訂分類')
      }

      const createdRaw: any = resp.data
      const created: CustomCategory = {
        id: createdRaw.id,
        name: createdRaw.name,
        icon: createdRaw.icon || 'clipboard',
        color: createdRaw.color || '#3b82f6',
        createdAt: new Date(createdRaw.created_at),
      }
      setCategories(prev => [...prev, created])
      return created
    } catch (err) {
      throw err
    }
  }, [])

  const updateCategory = useCallback(async (id: string, updates: Partial<Omit<CustomCategory, "id" | "createdAt">>) => {
    try {
      const resp = await ApiService.updateCustomCategory(id, updates)
      if (resp.error) throw new Error(resp.error)

      setCategories(prev => prev.map(cat =>
        cat.id === id ? { ...cat, ...updates } : cat
      ))
    } catch (err) {
      throw err
    }
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const resp = await ApiService.deleteCustomCategory(id)
      if (resp.error) throw new Error(resp.error)
      setCategories(prev => prev.filter(cat => cat.id !== id))
    } catch (err) {
      throw err
    }
  }, [])

  const getCategoryById = (id: string) => {
    return categories.find((cat) => cat.id === id)
  }

  return {
    categories,
    isLoading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    refetch: fetchCategories
  }
}
