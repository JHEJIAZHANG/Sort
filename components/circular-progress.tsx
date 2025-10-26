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
  
  const outerRadius = (size - strokeWidth) / 2
  const innerRadius = outerRadius - strokeWidth - 8
  const circumference = outerRadius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  
  // 計算小圓點的位置
  const angle = (progress / 100) * 360 - 90 // -90 因為從頂部開始
  const dotX = size / 2 + outerRadius * Math.cos((angle * Math.PI) / 180)
  const dotY = size / 2 + outerRadius * Math.sin((angle * Math.PI) / 180)

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
        {/* 內圈填滿的圓形 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          fill="#ff9100"
          className="transform rotate-90"
        />
        
        {/* 外圈背景圓環（淺色） */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke="#fed7aa"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* 外圈進度圓環（橘色） */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke="#ff9100"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
        
        {/* 進度末端的小圓點 */}
        {progress > 0 && (
          <circle
            cx={dotX}
            cy={dotY}
            r={strokeWidth / 3}
            fill="white"
            className="transition-all duration-1000 ease-out"
          />
        )}
      </svg>
      
      {/* 中間文字 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl sm:text-4xl font-bold text-white">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}
