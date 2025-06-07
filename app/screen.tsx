"use client"

import Image from "next/image"
import { useChat } from "./chat-provider"
import { useState } from "react"

export default function KVMScreen() {
  const { screenRef } = useChat()
  const [imageError, setImageError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleImageError = async () => {
    try {
      const response = await fetch("/api/stream/mjpeg")
      if (!response.ok) {
        const errorData = await response.json()
        setErrorMessage(errorData.message || "Failed to load nanoKVM stream")
      } else {
        setErrorMessage("Image failed to load")
      }
    } catch {
      setErrorMessage("Unable to connect to nanoKVM device")
    }
    setImageError(true)
  }

  const handleImageLoad = () => {
    setImageError(false)
    setErrorMessage("")
  }

  if (imageError) {
    return (
      <div className="h-full w-full items-center justify-center flex flex-col gap-4 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            nanoKVM Connection Error
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {errorMessage}
          </p>
          <button
            onClick={() => {
              setImageError(false)
              setErrorMessage("")
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full items-center justify-center flex">
      <Image
        ref={screenRef}
        src="/api/stream/mjpeg"
        width={832}
        height={600}
        alt=""
        unoptimized={true}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  )
}
