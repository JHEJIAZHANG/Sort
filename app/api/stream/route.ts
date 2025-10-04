import type { NextRequest } from "next/server"

export const runtime = "nodejs"
// 避免 Next.js 嘗試靜態化
export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest) {
  let intervalId: NodeJS.Timeout | null = null
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let counter = 0
      intervalId = setInterval(() => {
        counter += 1
        const payload = { ts: Date.now(), counter, message: "SSE heartbeat" }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }, 3000)
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
