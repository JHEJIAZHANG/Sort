"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ApiService } from '@/services/apiService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CheckoutReturnPage() {
  const params = useSearchParams()
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [details, setDetails] = useState<any>(null)

  useEffect(() => {
    const tx = params.get('transactionId') || ''
    const orderNo = params.get('orderId') || ''
    if (!tx && !orderNo) return
    const run = async () => {
      try {
        setStatus('processing')
        const resp = await ApiService.checkoutLinePayConfirm({ transactionId: tx || undefined, orderNo: orderNo || undefined })
        if ((resp as any)?.error) {
          setStatus('error')
          setMessage('交易確認失敗')
          return
        }
        setStatus('success')
      } catch (e) {
        setStatus('error')
        setMessage('網路或伺服器錯誤')
      }
    }
    run()
  }, [params])

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>付款結果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {status === 'processing' && <div>確認中...</div>}
        {status === 'success' && (
          <div className="space-y-2">
            <div className="text-green-700">付款成功</div>
            <Button onClick={() => (window.location.href = '/me/subscriptions')}>查看我的授權</Button>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-2">
            <div className="text-red-700">{message || '付款失敗'}</div>
            <Button onClick={() => (window.location.href = '/pricing')}>返回方案頁</Button>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  )
}
