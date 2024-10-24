export async function GET() {
  const response = await fetch(
    `http://${process.env.NEXT_PUBLIC_NANOKVM_HOST}/api/stream/mjpeg`
  )

  const imageBuffer = await response.body

  return new Response(imageBuffer, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/mjpeg",
    },
  })
}
