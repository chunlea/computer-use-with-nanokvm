export async function GET() {
  try {
    const response = await fetch(
      `http://${process.env.NEXT_PUBLIC_NANOKVM_HOST}/api/stream/mjpeg`
    )

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: "Failed to connect to nanoKVM device",
          status: response.status,
          message: response.status === 404 
            ? "nanoKVM device not found. Check if the device is connected and the host IP is correct."
            : "nanoKVM device connection error. Please check device status."
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }

    const imageBuffer = await response.body

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/mjpeg",
      },
    })
  } catch {
    return new Response(
      JSON.stringify({ 
        error: "Network error",
        message: "Unable to connect to nanoKVM device. Please check your network connection and device configuration."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
}
