"use client"

import Image from "next/image"
import { useRef } from "react"

export default function KVMScreen() {
  const imageRef = useRef<HTMLImageElement>(null)

  return (
    <div className="h-full w-full items-center justify-center flex">
      <Image
        ref={imageRef}
        src={`${process.env.NEXT_PUBLIC_NANOKVM_URL}/api/stream/mjpeg`}
        height={1080}
        width={1920}
        alt=""
        unoptimized={true}
      />
    </div>
  )
}
