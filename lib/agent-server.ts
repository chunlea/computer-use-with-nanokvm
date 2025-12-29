import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { client as nanokvmClient } from "./websocket"
import { KeyboardCodes, MouseButton, MouseEvent } from "./mapping"

// Display dimensions
const DISPLAY_WIDTH = parseInt(process.env.DISPLAY_WIDTH || "1024", 10)
const DISPLAY_HEIGHT = parseInt(process.env.DISPLAY_HEIGHT || "768", 10)

// Delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Create MCP server with nanoKVM tools
export function createNanoKVMServer(): McpServer {
  const server = new McpServer({
    name: "nanokvm-control",
    version: "1.0.0",
  })

  // Screenshot tool - returns placeholder, actual screenshot is handled by frontend
  server.tool(
    "screenshot",
    "Take a screenshot of the current screen",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: "Screenshot requested - this will be captured from the MJPEG stream",
          },
        ],
        isError: false,
      }
    }
  )

  // Mouse move tool
  server.tool(
    "mouse_move",
    "Move the mouse cursor to an absolute position",
    {
      x: z.number().describe("X coordinate (0 to display width)"),
      y: z.number().describe("Y coordinate (0 to display height)"),
    },
    async (args) => {
      const { x, y } = args
      const normalizedX = x / DISPLAY_WIDTH
      const normalizedY = y / DISPLAY_HEIGHT
      const hexX =
        normalizedX < 0
          ? 0x0001
          : Math.floor(0x7fff * normalizedX) + 0x0001
      const hexY =
        normalizedY < 0
          ? 0x0001
          : Math.floor(0x7fff * normalizedY) + 0x0001

      nanokvmClient.send([2, MouseEvent.MoveAbsolute, MouseButton.None, hexX, hexY])
      await delay(50)

      return {
        content: [{ type: "text", text: `Moved mouse to (${x}, ${y})` }],
        isError: false,
      }
    }
  )

  // Left click tool
  server.tool(
    "left_click",
    "Perform a left mouse click",
    {},
    async () => {
      nanokvmClient.send([2, MouseEvent.Down, MouseButton.Left, 0, 0])
      await delay(200)
      nanokvmClient.send([2, MouseEvent.Up, MouseButton.Left, 0, 0])
      await delay(50)

      return {
        content: [{ type: "text", text: "Left click performed" }],
        isError: false,
      }
    }
  )

  // Right click tool
  server.tool(
    "right_click",
    "Perform a right mouse click",
    {},
    async () => {
      nanokvmClient.send([2, MouseEvent.Down, MouseButton.Right, 0, 0])
      await delay(200)
      nanokvmClient.send([2, MouseEvent.Up, MouseButton.Right, 0, 0])
      await delay(50)

      return {
        content: [{ type: "text", text: "Right click performed" }],
        isError: false,
      }
    }
  )

  // Double click tool
  server.tool(
    "double_click",
    "Perform a double left mouse click",
    {},
    async () => {
      for (let i = 0; i < 2; i++) {
        nanokvmClient.send([2, MouseEvent.Down, MouseButton.Left, 0, 0])
        await delay(100)
        nanokvmClient.send([2, MouseEvent.Up, MouseButton.Left, 0, 0])
        await delay(100)
      }

      return {
        content: [{ type: "text", text: "Double click performed" }],
        isError: false,
      }
    }
  )

  // Triple click tool
  server.tool(
    "triple_click",
    "Perform a triple left mouse click (select line/paragraph)",
    {},
    async () => {
      for (let i = 0; i < 3; i++) {
        nanokvmClient.send([2, MouseEvent.Down, MouseButton.Left, 0, 0])
        await delay(80)
        nanokvmClient.send([2, MouseEvent.Up, MouseButton.Left, 0, 0])
        await delay(80)
      }

      return {
        content: [{ type: "text", text: "Triple click performed" }],
        isError: false,
      }
    }
  )

  // Type text tool
  server.tool(
    "type",
    "Type a string of text character by character",
    {
      text: z.string().describe("The text to type"),
    },
    async (args) => {
      const { text } = args

      for (const char of text) {
        const code =
          KeyboardCodes.get(char.toUpperCase()) ||
          KeyboardCodes.get(`Key${char.toUpperCase()}`)

        if (code) {
          nanokvmClient.send([1, code, 0, 0, 0, 0])
          await delay(50)
          nanokvmClient.send([1, 0, 0, 0, 0, 0])
          await delay(50)
        }
      }

      return {
        content: [{ type: "text", text: `Typed: "${text}"` }],
        isError: false,
      }
    }
  )

  // Key press tool
  server.tool(
    "key",
    "Press a keyboard key or key combination (e.g., 'Enter', 'Escape', 'ctrl+c')",
    {
      key: z.string().describe("Key name or combination"),
    },
    async (args) => {
      const { key } = args
      const code =
        KeyboardCodes.get(key.toUpperCase()) ||
        KeyboardCodes.get(`Key${key.toUpperCase()}`)

      if (code) {
        nanokvmClient.send([1, code, 0, 0, 0, 0])
        await delay(50)
        nanokvmClient.send([1, 0, 0, 0, 0, 0])
        await delay(50)
      }

      return {
        content: [{ type: "text", text: `Pressed key: ${key}` }],
        isError: false,
      }
    }
  )

  // Hold key tool
  server.tool(
    "hold_key",
    "Press and hold a key for a specified duration",
    {
      key: z.string().describe("Key to hold"),
      duration: z.number().default(500).describe("Duration in milliseconds"),
    },
    async (args) => {
      const { key, duration } = args
      const code =
        KeyboardCodes.get(key.toUpperCase()) ||
        KeyboardCodes.get(`Key${key.toUpperCase()}`)

      if (code) {
        nanokvmClient.send([1, code, 0, 0, 0, 0])
        await delay(duration)
        nanokvmClient.send([1, 0, 0, 0, 0, 0])
        await delay(50)
      }

      return {
        content: [{ type: "text", text: `Held key ${key} for ${duration}ms` }],
        isError: false,
      }
    }
  )

  // Scroll tool
  server.tool(
    "scroll",
    "Scroll the screen in a direction",
    {
      direction: z
        .enum(["up", "down", "left", "right"])
        .describe("Scroll direction"),
      amount: z.number().default(3).describe("Scroll amount (number of steps)"),
    },
    async (args) => {
      const { direction, amount } = args
      const scrollValue = direction === "up" || direction === "left" ? -1 : 1

      for (let i = 0; i < amount; i++) {
        if (direction === "up" || direction === "down") {
          nanokvmClient.send([2, 3, 0, 0, scrollValue])
        } else {
          nanokvmClient.send([2, 4, 0, scrollValue, 0])
        }
        await delay(50)
      }

      return {
        content: [
          { type: "text", text: `Scrolled ${direction} ${amount} steps` },
        ],
        isError: false,
      }
    }
  )

  // Wait tool
  server.tool(
    "wait",
    "Wait for a specified duration",
    {
      duration: z.number().default(1000).describe("Duration in milliseconds"),
    },
    async (args) => {
      const { duration } = args
      await delay(duration)

      return {
        content: [{ type: "text", text: `Waited ${duration}ms` }],
        isError: false,
      }
    }
  )

  // Click and drag tool
  server.tool(
    "left_click_drag",
    "Click and drag from current position to a new position",
    {
      endX: z.number().describe("End X coordinate"),
      endY: z.number().describe("End Y coordinate"),
    },
    async (args) => {
      const { endX, endY } = args

      // Mouse down
      nanokvmClient.send([2, MouseEvent.Down, MouseButton.Left, 0, 0])
      await delay(100)

      // Move to destination
      const normalizedX = endX / DISPLAY_WIDTH
      const normalizedY = endY / DISPLAY_HEIGHT
      const hexX =
        normalizedX < 0
          ? 0x0001
          : Math.floor(0x7fff * normalizedX) + 0x0001
      const hexY =
        normalizedY < 0
          ? 0x0001
          : Math.floor(0x7fff * normalizedY) + 0x0001

      nanokvmClient.send([2, MouseEvent.MoveAbsolute, MouseButton.None, hexX, hexY])
      await delay(100)

      // Mouse up
      nanokvmClient.send([2, MouseEvent.Up, MouseButton.Left, 0, 0])
      await delay(50)

      return {
        content: [{ type: "text", text: `Dragged to (${endX}, ${endY})` }],
        isError: false,
      }
    }
  )

  return server
}

// Agent query interface
export interface AgentQueryOptions {
  prompt: string
  screenshot?: string // Base64 encoded screenshot
  onMessage?: (message: SDKMessage) => void
}

export async function runAgentQuery(options: AgentQueryOptions) {
  const { prompt, screenshot, onMessage } = options

  const nanokvmServer = createNanoKVMServer()

  // Build the prompt with screenshot if available
  let fullPrompt = prompt
  if (screenshot) {
    fullPrompt = `Here is the current screen state:\n[Screenshot provided as base64 image]\n\nUser request: ${prompt}`
  }

  const messages: SDKMessage[] = []

  try {
    for await (const message of query({
      prompt: fullPrompt,
      options: {
        model: "claude-sonnet-4-20250514",
        mcpServers: {
          "nanokvm-control": {
            type: "sdk",
            name: "nanokvm-control",
            instance: nanokvmServer,
          },
        },
        allowedTools: [
          "mcp__nanokvm-control__screenshot",
          "mcp__nanokvm-control__mouse_move",
          "mcp__nanokvm-control__left_click",
          "mcp__nanokvm-control__right_click",
          "mcp__nanokvm-control__double_click",
          "mcp__nanokvm-control__triple_click",
          "mcp__nanokvm-control__type",
          "mcp__nanokvm-control__key",
          "mcp__nanokvm-control__hold_key",
          "mcp__nanokvm-control__scroll",
          "mcp__nanokvm-control__wait",
          "mcp__nanokvm-control__left_click_drag",
        ],
        permissionMode: "acceptEdits",
        systemPrompt: {
          type: "preset",
          preset: "claude_code",
          append: `You are controlling a remote computer via nanoKVM. You have access to tools to control the mouse and keyboard.

Available tools:
- screenshot: Take a screenshot to see the current screen state
- mouse_move: Move mouse to coordinates (x, y)
- left_click, right_click, double_click, triple_click: Mouse click actions
- type: Type text character by character
- key: Press a keyboard key (Enter, Escape, Tab, etc.)
- hold_key: Hold a key for a duration
- scroll: Scroll in a direction (up, down, left, right)
- wait: Wait for a specified duration
- left_click_drag: Click and drag to a new position

The display resolution is ${DISPLAY_WIDTH}x${DISPLAY_HEIGHT}. Coordinates should be within these bounds.

When performing actions, always take a screenshot first to understand the current state, then perform actions, and take another screenshot to verify the result.`,
        },
      },
    })) {
      messages.push(message)
      if (onMessage) {
        onMessage(message)
      }
    }
  } catch (error) {
    console.error("Agent query error:", error)
    throw error
  }

  return messages
}
