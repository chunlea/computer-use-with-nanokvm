"use client"

import { KeyboardCodes, MouseButton, MouseEvent } from "@/lib/mapping"
import { client } from "@/lib/websocket"
import React, { createContext, useCallback, useContext, useEffect } from "react"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface HIDContextProps {
  moveMouse: (x: number, y: number) => Promise<void>
  typeString: (str: string) => Promise<void>
  clickMouse: (button: MouseButton) => Promise<void>
  handleKeyPress: (key: string) => Promise<void>
}

const HIDContext = createContext<HIDContextProps | undefined>(undefined)

export const HIDProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    const timer = setInterval(() => {
      client.send([0])
    }, 1000 * 60)

    return () => {
      clearInterval(timer)
      client.unregister("stream")
      client.close()
    }
  }, [])

  const moveMouse = useCallback(async (clientX: number, clientY: number) => {
    const x = (clientX - 0) / 832
    const y = (clientY - 0) / 600
    const hexX = x < 0 ? 0x0001 : Math.floor(0x7fff * x) + 0x0001
    const hexY = y < 0 ? 0x0001 : Math.floor(0x7fff * y) + 0x0001

    const data = [2, MouseEvent.MoveAbsolute, MouseButton.None, hexX, hexY]
    client.send(data)
    await delay(50)
  }, [])

  const clickMouse = useCallback(async (button: MouseButton) => {
    // mouse down
    client.send([2, MouseEvent.Down, button, 0, 0])

    await delay(200)

    client.send([2, MouseEvent.Up, button, 0, 0])

    await delay(50)
  }, [])

  const handleKeyPress = useCallback(async (key: string) => {
    const code =
      KeyboardCodes.get(key.toUpperCase()) ||
      KeyboardCodes.get(`Key${key.toUpperCase()}`)

    if (!code) {
      console.log(`Unknown key: ${key}`)
      return
    }

    // key down
    const ctrl = 0
    const shift = 0
    const alt = 0
    const meta = 0
    const data = [1, code, ctrl, shift, alt, meta]

    client.send(data)

    await delay(50)
    // key up
    client.send([1, 0, 0, 0, 0, 0])

    await delay(50)
  }, [])

  const typeString = useCallback(
    async (str: string) => {
      for (const char of str) {
        await handleKeyPress(char)
      }
    },
    [handleKeyPress]
  )

  return (
    <HIDContext.Provider
      value={{
        moveMouse,
        clickMouse,
        typeString,
        handleKeyPress,
      }}
    >
      {children}
    </HIDContext.Provider>
  )
}

export const useHID = () => {
  const context = useContext(HIDContext)
  if (!context) {
    throw new Error("useHID must be used within a HIDProvider")
  }
  return context
}
