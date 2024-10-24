"use client"

import { MouseButton, MouseEvent } from "@/lib/mapping"
import { client } from "@/lib/websocket"
import React, { createContext, useCallback, useContext, useEffect } from "react"

interface HIDContextProps {
  moveMouse: (x: number, y: number) => void
  typeString: (str: string) => void
  clickMouse: (button: MouseButton) => void
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

  const moveMouse = useCallback((clientX: number, clientY: number) => {
    const x = clientX / 773
    const y = clientY / 538
    const hexX = x < 0 ? 0x0001 : Math.floor(0x7fff * x) + 0x0001
    const hexY = y < 0 ? 0x0001 : Math.floor(0x7fff * y) + 0x0001

    const data = [2, MouseEvent.MoveAbsolute, MouseButton.None, hexX, hexY]
    client.send(data)
  }, [])

  const clickMouse = useCallback((button: MouseButton) => {
    switch (button) {
      case 0:
        button = MouseButton.Left
        break
      case 1:
        button = MouseButton.Wheel
        break
      case 2:
        button = MouseButton.Right
        break
      default:
        console.log(`unknown button ${button}`)
        return
    }

    // mouse down
    client.send([2, MouseEvent.Down, button, 0, 0])

    // TODO: seems differnet duration at iOS has different behavior
    // // mouse up
    // client.send([2, MouseEvent.Up, button, 0, 0])
  }, [])

  const typeString = useCallback((str: string) => {
    for (const char of str) {
      const code = char.toUpperCase().charCodeAt(0) - 61

      // key down
      const ctrl = 0
      const shift = 0
      const alt = 0
      const meta = 0
      const data = [1, code, ctrl, shift, alt, meta]
      client.send(data)
      // key up
      client.send([1, 0, 0, 0, 0, 0])
    }
  }, [])

  return (
    <HIDContext.Provider
      value={{
        moveMouse,
        clickMouse,
        typeString,
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
