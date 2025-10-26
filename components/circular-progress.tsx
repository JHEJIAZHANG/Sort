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
}: CircularProgressProps) {
  const [progress, setProgress] = useState(0)

  // 淺色背景環比較細
  const thinStrokeWidth = 15
  // 深色進度環比較粗
  const thickStrokeWidth = strokeWidth

  // 計算半徑 - 兩個環使用相同的半徑，這樣細的環會卡在粗的環中間
  const outerRadius = (size - thickStrokeWidth) / 2
  const innerRadius = outerRadius - thickStrokeWidth - 4

  const circumference = outerRadius * 2 * Math.PI
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
        {/* 內圈填滿的圓形 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          fill="#ff9100"
        />

        {/* 外圈背景圓環（淺色、較細） - 使用相同半徑 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke="#fed7aa"
          strokeWidth={thinStrokeWidth}
          fill="none"
        />

        {/* 外圈進度圓環（深橘色、較粗） */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke="#ff9100"
          strokeWidth={thickStrokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>

      {/* 中間文字 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-white">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}
