"use client"

import { APIResponse, Message, ToolUseResponse } from "@/types/api"
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
  screenRef: React.RefObject<HTMLImageElement>
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
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined)

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const screenRef = useRef<HTMLImageElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [tool, setTool] = useState<ToolUseResponse | null | undefined>(null)

  const { moveMouse, clickMouse, typeString, handleKeyPress } = useHID()

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
      beforeSubmitting,
      afterSubmitting,
    }: {
      messageContent: string | object
      showThinking: boolean
      beforeSubmitting?: () => void
      afterSubmitting?: () => void
    }) => {
      if (beforeSubmitting) {
        beforeSubmitting()
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content:
          typeof messageContent === "string"
            ? messageContent
            : [messageContent],
      }

      const thinkingMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "thinking",
      }

      if (showThinking) {
        setMessages((prev) => [...prev, userMessage, thinkingMessage])
      } else {
        setMessages((prev) => [...prev, userMessage])
      }

      setIsLoading(true)

      // Prepare all messages for the API request
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

        // Handle text-only messages
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

  const takeAction = useCallback(
    async (action: ToolUseResponse) => {
      console.log("Taking action:", action)

      switch (action.input.action) {
        case "screenshot":
          const screenshot = takeScreenshot()
          if (screenshot) {
            await submitMessage({
              messageContent: {
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
              },
              showThinking: true,
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

          await submitMessage({
            messageContent: {
              type: "tool_result",
              tool_use_id: action.id,
            },
            showThinking: true,
          })
          break
        case "left_click":
          console.log("Mouse left click")
          await clickMouse(MouseButton.Left)
          await submitMessage({
            messageContent: {
              type: "tool_result",
              tool_use_id: action.id,
            },
            showThinking: true,
          })
          break
        case "double_click":
          console.log("double click")
          await clickMouse(MouseButton.Left)
          await clickMouse(MouseButton.Left)
          await submitMessage({
            messageContent: {
              type: "tool_result",
              tool_use_id: action.id,
            },
            showThinking: true,
          })
          break
        case "key":
          console.log("Key press", action.input?.text)
          await handleKeyPress(action.input?.text || "")
          await submitMessage({
            messageContent: {
              type: "tool_result",
              tool_use_id: action.id,
            },
            showThinking: true,
          })
          break
        case "type":
          console.log("Type")
          await typeString(action.input?.text || "")

          await submitMessage({
            messageContent: {
              type: "tool_result",
              tool_use_id: action.id,
            },
            showThinking: true,
          })
          break
      }
    },
    [
      clickMouse,
      handleKeyPress,
      moveMouse,
      submitMessage,
      takeScreenshot,
      typeString,
    ]
  )

  useEffect(() => {
    if (tool && messages[messages.length - 1].hasToolUse) {
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
