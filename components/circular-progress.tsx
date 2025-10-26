"use client"

import { useEffect, useState } from "react"

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  submittedCount?: number
  totalCount?: number
}

export function CircularProgress({
  percentage,
  size = 200,
  strokeWidth = 20,
  submittedCount,
  totalCount
}: CircularProgressProps) {
  const [progress, setProgress] = useState(0)
  
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  useEffect(() => {
    // 動畫效果：從 0 到目標百分比
    const timer = setTimeout(() => {
      setProgress(percentage)
    }, 100)

    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 背景圓環 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* 進度圓環 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      {/* 中間文字 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl sm:text-4xl font-bold text-primary">
          {Math.round(progress)}%
        </span>
        {submittedCount !== undefined && totalCount !== undefined && (
          <span className="text-xs sm:text-sm text-muted-foreground mt-2">
            {submittedCount} / {totalCount}
          </span>
        )}
      </div>
    </div>
  )
}
