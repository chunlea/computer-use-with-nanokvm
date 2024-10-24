"use client"

import { client } from "@/lib/websocket"
import React, { createContext, useCallback, useContext, useEffect } from "react"

interface HIDContextProps {
  moveMouse: (x: number, y: number) => void
  typeString: (str: string) => void
  clickMouse: (button: MouseButton) => void
}

const HIDContext = createContext<HIDContextProps | undefined>(undefined)

export const KeyboardCodes: Map<string, number> = new Map([
  ["KeyA", 4],
  ["KeyB", 5],
  ["KeyC", 6],
  ["KeyD", 7],
  ["KeyE", 8],
  ["KeyF", 9],
  ["KeyG", 10],
  ["KeyH", 11],
  ["KeyI", 12],
  ["KeyJ", 13],
  ["KeyK", 14],
  ["KeyL", 15],
  ["KeyM", 16],
  ["KeyN", 17],
  ["KeyO", 18],
  ["KeyP", 19],
  ["KeyQ", 20],
  ["KeyR", 21],
  ["KeyS", 22],
  ["KeyT", 23],
  ["KeyU", 24],
  ["KeyV", 25],
  ["KeyW", 26],
  ["KeyX", 27],
  ["KeyY", 28],
  ["KeyZ", 29],

  ["Digit1", 30],
  ["Digit2", 31],
  ["Digit3", 32],
  ["Digit4", 33],
  ["Digit5", 34],
  ["Digit6", 35],
  ["Digit7", 36],
  ["Digit8", 37],
  ["Digit9", 38],
  ["Digit0", 39],

  ["Enter", 40],
  ["Escape", 41],
  ["Backspace", 42],
  ["Tab", 43],
  ["Space", 44],
  ["Minus", 45],
  ["Equal", 46],
  ["BracketLeft", 47],
  ["BracketRight", 48],
  ["Backslash", 49],
  ["IntlBackslash", 49],

  ["Semicolon", 51],
  ["Quote", 52],
  ["Backquote", 53],
  ["KeyTilde", 53],
  ["Comma", 54],
  ["Period", 55],
  ["KeyDot", 55],
  ["Slash", 56],
  ["CapsLock", 57],

  ["F1", 58],
  ["F2", 59],
  ["F3", 60],
  ["F4", 61],
  ["F5", 62],
  ["F6", 63],
  ["F7", 64],
  ["F8", 65],
  ["F9", 66],
  ["F10", 67],
  ["F11", 68],
  ["F12", 69],
  ["F13", 70],

  ["PrintScreen", 70],
  ["ScrollLock", 71],
  ["Pause", 72],
  ["Insert", 73],
  ["Home", 74],
  ["PageUp", 75],
  ["Delete", 76],
  ["End", 77],
  ["PageDown", 78],
  ["ArrowRight", 79],
  ["ArrowLeft", 80],
  ["ArrowDown", 81],
  ["ArrowUp", 82],

  ["NumLock", 83],
  ["NumpadDivide", 84],
  ["NumpadMultiply", 85],
  ["NumpadSubtract", 86],
  ["NumpadAdd", 87],
  ["NumpadEnter", 88],
  ["Numpad1", 89],
  ["Numpad2", 90],
  ["Numpad3", 91],
  ["Numpad4", 92],
  ["Numpad5", 93],
  ["Numpad6", 94],
  ["Numpad7", 95],
  ["Numpad8", 96],
  ["Numpad9", 97],
  ["Numpad0", 98],
  ["NumpadDecimal", 99],
  ["KeyKpDot", 99],

  ["Menu", 118],

  ["ControlLeft", 224],
  ["ShiftLeft", 225],
  ["AltLeft", 226],
  ["MetaLeft", 227],
  ["WinLeft", 227],
  ["ControlRight", 228],
  ["ShiftRight", 229],
  ["AltRight", 230],
  ["MetaRight", 231],
  ["WinRight", 231],
])

export enum MouseEvent {
  Up = 0,
  Down = 1,
  MoveAbsolute = 2,
  MoveRelative = 3,
  Scroll = 4,
}

export enum MouseButton {
  None = 0,
  Left = 1,
  Right = 2,
  Wheel = 3,
}

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

  const moveMouse = useCallback((x: number, y: number) => {
    const hexX = x < 0 ? 0x0001 : Math.floor(0x7fff * x) + 0x0001
    const hexY = y < 0 ? 0x0001 : Math.floor(0x7fff * y) + 0x0001

    const data = [2, x, y, hexX, hexY]
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

    // mouse up
    client.send([2, MouseEvent.Up, MouseButton.None, 0, 0])
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
