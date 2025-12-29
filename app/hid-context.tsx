"use client"

import { KeyboardCodes, MouseButton, MouseEvent } from "@/lib/mapping"
import { client } from "@/lib/websocket"
import React, { createContext, useCallback, useContext, useEffect } from "react"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface HIDContextProps {
  moveMouse: (x: number, y: number) => Promise<void>
  typeString: (str: string) => Promise<void>
  clickMouse: (button: MouseButton) => Promise<void>
  mouseDown: (button: MouseButton) => Promise<void>
  mouseUp: (button: MouseButton) => Promise<void>
  handleKeyPress: (key: string) => Promise<void>
  holdKey: (key: string, duration?: number) => Promise<void>
  scroll: (direction: "up" | "down" | "left" | "right", amount?: number) => Promise<void>
  wait: (duration: number) => Promise<void>
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

  const mouseDown = useCallback(async (button: MouseButton) => {
    client.send([2, MouseEvent.Down, button, 0, 0])
    await delay(50)
  }, [])

  const mouseUp = useCallback(async (button: MouseButton) => {
    client.send([2, MouseEvent.Up, button, 0, 0])
    await delay(50)
  }, [])

  const clickMouse = useCallback(async (button: MouseButton) => {
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

    const ctrl = 0
    const shift = 0
    const alt = 0
    const meta = 0
    const data = [1, code, ctrl, shift, alt, meta]

    client.send(data)
    await delay(50)
    client.send([1, 0, 0, 0, 0, 0])
    await delay(50)
  }, [])

  const holdKey = useCallback(async (key: string, duration: number = 500) => {
    const code =
      KeyboardCodes.get(key.toUpperCase()) ||
      KeyboardCodes.get(`Key${key.toUpperCase()}`)

    if (!code) {
      console.log(`Unknown key: ${key}`)
      return
    }

    const ctrl = 0
    const shift = 0
    const alt = 0
    const meta = 0
    const data = [1, code, ctrl, shift, alt, meta]

    client.send(data)
    await delay(duration)
    client.send([1, 0, 0, 0, 0, 0])
    await delay(50)
  }, [])

  const scroll = useCallback(async (direction: "up" | "down" | "left" | "right", amount: number = 3) => {
    // nanoKVM uses wheel events - we simulate multiple small scrolls
    const scrollAmount = direction === "up" || direction === "left" ? -amount : amount

    for (let i = 0; i < Math.abs(amount); i++) {
      // Send scroll event (MouseEvent.Scroll = 3)
      if (direction === "up" || direction === "down") {
        client.send([2, 3, 0, 0, scrollAmount > 0 ? 1 : -1])
      } else {
        // Horizontal scroll
        client.send([2, 4, 0, scrollAmount > 0 ? 1 : -1, 0])
      }
      await delay(50)
    }
  }, [])

  const wait = useCallback(async (duration: number) => {
    await delay(duration)
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
        mouseDown,
        mouseUp,
        typeString,
        handleKeyPress,
        holdKey,
        scroll,
        wait,
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
