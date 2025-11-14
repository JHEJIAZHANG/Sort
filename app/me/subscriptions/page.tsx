"use client"

import { useEffect, useState } from 'react'
import { ApiService } from '@/services/apiService'
import { useLineAuth } from '@/hooks/use-line-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MySubscriptionsPage() {
  const { isInitialized } = useLineAuth()
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const run = async () => {
      const resp = await ApiService.getMySubscriptions()
      const data = (resp as any)?.data?.items || []
      setItems(data)
    }
    run()
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">我的授權</h1>
      {items.map((it, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle>{it?.plan?.name || '方案'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              狀態：{it?.status}，席次：{it?.seat_count}
            </div>
            <div className="text-sm">{it?.start_at} ~ {it?.end_at}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

