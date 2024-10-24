"use client"

import Image from "next/image"
import { useChat } from "./chat-provider"

export default function KVMScreen() {
  const { screenRef } = useChat()

  return (
    <div className="h-full w-full items-center justify-center flex">
      <Image
        ref={screenRef}
        src="/api/stream/mjpeg"
        height={1080}
        width={1920}
        alt=""
        unoptimized={true}
      />
    </div>
  )
}
