"use client"

import {
  APIResponse,
  Message,
  ToolResultResponse,
  ToolUseResponse,
} from "@/types/api"
import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
} from "react"
import { useHID } from "./hid-context"
import { MouseButton } from "@/lib/mapping"

interface ChatContextProps {
  takeAction: (action: ToolUseResponse) => void
  screenRef: React.RefObject<HTMLImageElement | null>
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  submitMessage: (props: {
    messageContent: string | object
    showThinking: boolean
    beforeSubmitting?: () => void
    afterSubmitting?: () => void
  }) => void
  tool: ToolUseResponse | null | undefined
  setTool: React.Dispatch<
    React.SetStateAction<ToolUseResponse | null | undefined>
  >
  takeScreenshot: () => string | undefined
  appendToolResult: (toolResult: ToolResultResponse) => void
  getToolResult: (toolUseId: string) => ToolResultResponse | undefined
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined)

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const screenRef = useRef<HTMLImageElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [toolResults, setToolResults] = useState<
    Record<string, ToolResultResponse>
  >({})

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [tool, setTool] = useState<ToolUseResponse | null | undefined>(null)

  const {
    moveMouse,
    clickMouse,
    mouseDown,
    mouseUp,
    typeString,
    handleKeyPress,
    holdKey,
    scroll,
    wait,
  } = useHID()

  const takeScreenshot = useCallback(() => {
    if (!screenRef.current) {
      console.error("KVM screen not found")
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = screenRef.current.width
    canvas.height = screenRef.current.height
    const context = canvas.getContext("2d")

    if (context) {
      context.drawImage(screenRef.current, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL("image/png").split(",")[1]
    }
  }, [])

  const submitMessage = useCallback(
    async ({
      messageContent,
      showThinking,
      isToolResult,
      beforeSubmitting,
      afterSubmitting,
    }: {
      messageContent: string | object
      showThinking: boolean
      isToolResult?: boolean
      beforeSubmitting?: () => void
      afterSubmitting?: () => void
    }) => {
      if (beforeSubmitting) {
        beforeSubmitting()
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        hiden: isToolResult,
        content:
          typeof messageContent === "string"
            ? messageContent
            : [messageContent],
      }

      const thinkingMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        isThinking: true,
      }

      if (showThinking) {
        setMessages((prev) => [...prev, userMessage, thinkingMessage])
      } else {
        setMessages((prev) => [...prev, userMessage])
      }

      setIsLoading(true)

      const apiMessages = [...messages, userMessage].map((msg) => {
        if (msg.toolUse) {
          if (typeof msg.content === "string" && msg.content.length > 0) {
            return {
              role: msg.role,
              content: [
                {
                  type: "text",
                  text: msg.content,
                },
                msg.toolUse,
              ],
            }
          } else {
            return {
              role: msg.role,
              content: [msg.toolUse],
            }
          }
        }

        return {
          role: msg.role,
          content: msg.content,
        }
      })

      const requestBody = {
        messages: apiMessages,
      }

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: APIResponse = await response.json()

        setMessages((prev) => {
          const newMessages = [...prev]
          newMessages[
            showThinking ? newMessages.length - 1 : newMessages.length
          ] = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.content,
            hasToolUse: data.hasToolUse || !!data.toolUse,
            toolUse: data.toolUse,
          }
          return newMessages
        })

        if (data.hasToolUse && data.toolUse) {
          setTool(data.toolUse)
        }
      } catch (error) {
        console.error("Submit Error:", error)
        setMessages((prev) => {
          const newMessages = [...prev]
          newMessages[
            showThinking ? newMessages.length - 1 : newMessages.length
          ] = {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "I apologize, but I encountered an error. Please try again.",
          }
          return newMessages
        })
      } finally {
        setIsLoading(false)

        if (afterSubmitting) {
          afterSubmitting()
        }
      }
    },
    [messages]
  )

  const appendToolResult = useCallback(
    async (toolResult: ToolResultResponse) => {
      if (!toolResult.tool_use_id) {
        console.error("Tool result must have a tool_use_id")
        return
      }

      setToolResults((prev) => ({
        ...prev,
        [toolResult.tool_use_id]: toolResult,
      }))

      await submitMessage({
        messageContent: toolResult,
        isToolResult: true,
        showThinking: true,
      })
    },
    [submitMessage]
  )

  const getToolResult = useCallback(
    (toolUseId: string) => {
      return toolResults[toolUseId]
    },
    [toolResults]
  )

  const takeAction = useCallback(
    async (action: ToolUseResponse) => {
      console.log("Taking action:", action)

      switch (action.input.action) {
        case "screenshot":
          const screenshot = takeScreenshot()
          if (screenshot) {
            await appendToolResult({
              type: "tool_result",
              tool_use_id: action.id,
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/png",
                    data: screenshot,
                  },
                },
              ],
            })
          }
          break

        case "mouse_move":
          console.log("Mouse move", action.input?.coordinate)
          if (action.input?.coordinate) {
            await moveMouse(
              action.input?.coordinate[0],
              action.input?.coordinate[1]
            )
          }
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "left_click":
          console.log("Mouse left click")
          await clickMouse(MouseButton.Left)
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "right_click":
          console.log("Mouse right click")
          await clickMouse(MouseButton.Right)
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "middle_click":
          console.log("Mouse middle click")
          await clickMouse(MouseButton.Middle)
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "double_click":
          console.log("Double click")
          await clickMouse(MouseButton.Left)
          await clickMouse(MouseButton.Left)
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "triple_click":
          console.log("Triple click")
          await clickMouse(MouseButton.Left)
          await clickMouse(MouseButton.Left)
          await clickMouse(MouseButton.Left)
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "left_mouse_down":
          console.log("Mouse down")
          await mouseDown(MouseButton.Left)
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "left_mouse_up":
          console.log("Mouse up")
          await mouseUp(MouseButton.Left)
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "left_click_drag":
          console.log("Left click drag", action.input?.coordinate)
          if (action.input?.coordinate) {
            await mouseDown(MouseButton.Left)
            await moveMouse(
              action.input?.coordinate[0],
              action.input?.coordinate[1]
            )
            await mouseUp(MouseButton.Left)
          }
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "key":
          console.log("Key press", action.input?.text)
          await handleKeyPress(action.input?.text || "")
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "hold_key":
          console.log("Hold key", action.input?.text, action.input?.duration)
          await holdKey(action.input?.text || "", action.input?.duration || 500)
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "type":
          console.log("Type", action.input?.text)
          await typeString(action.input?.text || "")
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "scroll":
          console.log("Scroll", action.input?.scroll_direction, action.input?.scroll_amount)
          await scroll(
            action.input?.scroll_direction || "down",
            action.input?.scroll_amount || 3
          )
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "wait":
          console.log("Wait", action.input?.duration)
          await wait(action.input?.duration || 1000)
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
          })
          break

        case "cursor_position":
          console.log("Cursor position requested")
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
            content: [
              {
                type: "text",
                text: "Cursor position tracking is not available via nanoKVM",
              },
            ],
          })
          break

        default:
          console.log("Unknown action:", action.input.action)
          await appendToolResult({
            type: "tool_result",
            tool_use_id: action.id,
            content: [
              {
                type: "text",
                text: `Unknown action: ${action.input.action}`,
              },
            ],
          })
      }
    },
    [
      appendToolResult,
      clickMouse,
      handleKeyPress,
      holdKey,
      mouseDown,
      mouseUp,
      moveMouse,
      scroll,
      takeScreenshot,
      typeString,
      wait,
    ]
  )

  useEffect(() => {
    if (tool && messages[messages.length - 1]?.hasToolUse) {
      takeAction(tool)
      setTool(undefined)
    }
  }, [takeAction, messages, tool])

  return (
    <ChatContext.Provider
      value={{
        takeAction,
        screenRef,
        messages,
        setMessages,
        input,
        setInput,
        isLoading,
        setIsLoading,
        submitMessage,
        tool,
        setTool,
        takeScreenshot,
        appendToolResult,
        getToolResult,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
