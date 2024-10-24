export async function GET() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_NANOKVM_URL}/api/stream/mjpeg`
  )

  const imageBuffer = await response.body

  return new Response(imageBuffer, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/mjpeg",
    },
  })
}
