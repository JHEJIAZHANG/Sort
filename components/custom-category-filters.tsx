"use client"

import { Button } from "@/components/ui/button"

interface CustomCategoryFiltersProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  counts: {
    all: number
    pending: number
    completed: number
    overdue: number
  }
}

export function CustomCategoryFilters({ activeFilter, onFilterChange, counts }: CustomCategoryFiltersProps) {
  const filters = [
    { id: "all", label: "全部", count: counts.all },
    { id: "pending", label: "進行中", count: counts.pending },
    { id: "overdue", label: "已逾期", count: counts.overdue },
    { id: "completed", label: "已完成", count: counts.completed },
  ]

  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className="whitespace-nowrap"
        >
          {filter.label} ({filter.count})
        </Button>
      ))}
    </div>
  )
}
