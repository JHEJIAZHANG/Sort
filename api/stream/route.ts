import { NextRequest } from "next/server"

export const runtime = "nodejs" // 確保長連線可用

export async function GET(_req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder()
      let counter = 0
      const timer = setInterval(() => {
        counter++
        controller.enqueue(
          enc.encode(
            `data: ${JSON.stringify({
              ts: Date.now(),
              counter,
              message: "伺服器時間更新",
            })}\n\n`
          )
        )
      }, 3000) // 每3秒推送一次更新
      return () => clearInterval(timer)
    },
  })
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}