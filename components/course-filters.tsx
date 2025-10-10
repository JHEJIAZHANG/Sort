"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchIcon } from "@/components/icons"

interface CourseFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterDay: string
  onFilterDayChange: (day: string) => void
  totalCount: number
  filteredCount: number
}

export function CourseFilters({
  searchQuery,
  onSearchChange,
  filterDay,
  onFilterDayChange,
  totalCount,
  filteredCount,
}: CourseFiltersProps) {
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isComposing, setIsComposing] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  const debouncedSearch = useCallback(
    (value: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        onSearchChange(value)
      }, 300)
    },
    [onSearchChange],
  )

  useEffect(() => {
    if (!isComposing && inputValue !== searchQuery) {
      debouncedSearch(inputValue)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [inputValue, isComposing, debouncedSearch, searchQuery])

  useEffect(() => {
    if (searchQuery !== inputValue) {
      setInputValue(searchQuery)
    }
  }, [searchQuery])

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true)
  }, [])

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  return (
    <div className="mb-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜尋課程名稱、教師或地點..."
            value={inputValue}
            onChange={handleInputChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className="pl-9 bg-white border-gray-300"
          />
        </div>
        <Select value={filterDay} onValueChange={onFilterDayChange}>
          <SelectTrigger className="w-32 bg-white border-gray-300">
            <SelectValue placeholder="篩選星期" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="0">週一</SelectItem>
            <SelectItem value="1">週二</SelectItem>
            <SelectItem value="2">週三</SelectItem>
            <SelectItem value="3">週四</SelectItem>
            <SelectItem value="4">週五</SelectItem>
            <SelectItem value="5">週六</SelectItem>
            <SelectItem value="6">週日</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || filterDay !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInputValue("")
              onSearchChange("")
              onFilterDayChange("all")
            }}
            className="whitespace-nowrap"
          >
            清除
          </Button>
        )}
      </div>

      {(searchQuery || filterDay !== "all") && (
        <div className="mt-2 text-sm text-muted-foreground">
          找到 {filteredCount} / {totalCount} 個課程
        </div>
      )}
    </div>
  )
}
