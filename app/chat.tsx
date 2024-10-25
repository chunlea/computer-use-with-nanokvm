"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import "highlight.js/styles/atom-one-dark.css"
import {
  ComputerIcon,
  HdmiPortIcon,
  MousePointerClickIcon,
  Send,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useChat } from "./chat-provider"
import { MessageComponent } from "@/components/message"

export default function AIChat() {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, setInput, isLoading, submitMessage } = useChat()

  const contentRef = useRef<HTMLDivElement>(null)
  const [isScrollLocked, setIsScrollLocked] = useState(false)

  useEffect(() => {
    const scrollToBottom = () => {
      if (!messagesEndRef.current) return

      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        })
      })
    }

    // Scroll when messages change or when loading state changes
    const timeoutId = setTimeout(scrollToBottom, 100)

    return () => clearTimeout(timeoutId)
  }, [messages, isLoading]) // Add isLoading to dependencies

  useEffect(() => {
    if (!messagesEndRef.current) return

    const observer = new ResizeObserver(() => {
      if (!isScrollLocked) {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        })
      }
    })

    observer.observe(messagesEndRef.current)

    return () => observer.disconnect()
  }, [isScrollLocked])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim()) return
    if (isLoading) return

    setIsScrollLocked(true)

    setInput("")

    await submitMessage({
      messageContent: input,
      showThinking: true,
      afterSubmitting() {
        setIsScrollLocked(false)

        // Force a final scroll after state updates
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          })
        })
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) {
        const form = e.currentTarget.form
        if (form) {
          const submitEvent = new Event("submit", {
            bubbles: true,
            cancelable: true,
          })
          form.dispatchEvent(submitEvent)
        }
      }
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target
    setInput(textarea.value)
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`
  }

  return (
    <Card className="w-full flex flex-col h-full">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {messages.length > 0 && (
              <>
                <Avatar className="w-8 h-8 border">
                  <AvatarImage src="/ant-logo.svg" alt="AI Assistant Avatar" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    Computer Assistant with nanoKVM
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Powered by Claude
                  </CardDescription>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent
        ref={contentRef}
        className="flex-1 overflow-y-auto p-4 scroll-smooth snap-y snap-mandatory"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in-up max-w-[95%] mx-auto">
            <Avatar className="w-10 h-10 mb-4 border">
              <AvatarImage
                src="/ant-logo.svg"
                alt="AI Assistant Avatar"
                width={40}
                height={40}
              />
            </Avatar>
            <h2 className="text-xl font-semibold mb-12">
              Computer Assistant with nanoKVM
            </h2>
            <div className="space-y-6 text-base">
              <div className="flex items-center gap-3">
                <ComputerIcon className="text-muted-foreground w-6 h-6" />
                <p className="text-muted-foreground">
                  I can access your computer or iPad with nanoKVM.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <HdmiPortIcon className="text-muted-foreground w-6 h-6" />
                <p className="text-muted-foreground">
                  I can see what in your computer screen via HDMI.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <MousePointerClickIcon className="text-muted-foreground w-6 h-6" />
                <p className="text-muted-foreground">
                  I can control your computer with keyboard and mouse.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 min-h-full">
            {messages.map((message) =>
              message.hiden ? null : (
                <MessageComponent message={message} key={message.id} />
              )
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-col space-y-2">
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="min-h-[44px] h-[44px] resize-none py-3 flex items-center"
                  rows={1}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-[44px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </CardFooter>
    </Card>
  )
}
