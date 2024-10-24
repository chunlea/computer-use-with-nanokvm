"use client"

import { APIResponse, Message, ToolUseResponse } from "@/types/api"
import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
} from "react"

interface ChatContextProps {
  takeAction: (action: ToolUseResponse) => void
  screenRef: React.RefObject<HTMLImageElement>
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined)

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const screenRef = useRef<HTMLImageElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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

  const takeAction = useCallback(
    async (action: ToolUseResponse) => {
      console.log("Taking action:", action)

      switch (action.input.action) {
        case "screenshot":
          const screenshot = takeScreenshot()
          if (screenshot) {
            const userMessage: Message = {
              id: crypto.randomUUID(),
              role: "user",
              content: [
                {
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
              ],
            }

            setMessages((prev) => [...prev, userMessage])

            // Prepare all messages for the API request
            const apiMessages = [...messages, userMessage].map((msg) => {
              if (msg.toolUse) {
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
                newMessages[newMessages.length] = {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: data.content,
                  hasToolUse: data.hasToolUse || !!data.toolUse,
                  toolUse: data.toolUse,
                }
                return newMessages
              })

              if (data.hasToolUse && data.toolUse) {
                takeAction(data.toolUse)
              }
            } catch (error) {
              console.error("Submit Error:", error)
              setMessages((prev) => {
                const newMessages = [...prev]
                newMessages[newMessages.length] = {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content:
                    "I apologize, but I encountered an error. Please try again.",
                }
                return newMessages
              })
            } finally {
              setIsLoading(false)
            }
          }
          break
      }
    },
    [messages, takeScreenshot]
  )

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
