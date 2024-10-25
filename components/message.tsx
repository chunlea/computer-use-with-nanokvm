"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Message, ToolResultResponse } from "@/types/api"
import "highlight.js/styles/atom-one-dark.css"
import { ComputerIcon, HammerIcon } from "lucide-react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import { useChat } from "@/app/chat-provider"
import Image from "next/image"

export function MessageComponent({ message }: { message: Message }) {
  return (
    <div
      className={`animate-fade-in-up ${
        message.isThinking ? "animate-pulse" : ""
      }`}
    >
      <MessageBodyComponent role={message.role}>
        <MessageContentComponent message={message} />
      </MessageBodyComponent>
    </div>
  )
}

export function MessageBodyComponent({
  children,
  role,
}: {
  children?: React.ReactNode
  role: string
}) {
  return (
    <div className="flex items-start gap-2">
      {role === "assistant" && (
        <Avatar className="w-8 h-8 border">
          <AvatarImage src="/ant-logo.svg" alt="AI Assistant Avatar" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`flex flex-col max-w-[75%] ${
          role === "user" ? "ml-auto" : ""
        }`}
      >
        <div
          className={`p-3 rounded-md text-base ${
            role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted border"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function MessageToolResultComponent({
  toolResult,
}: {
  toolResult: ToolResultResponse
}) {
  if (toolResult.content) {
    return (
      <div className="flex justify-center">
        {toolResult.content.map((content, index) => {
          switch (content.type) {
            case "text":
              return (
                <ReactMarkdown
                  key={index}
                  rehypePlugins={[rehypeRaw, rehypeHighlight]}
                >
                  {JSON.stringify(content)}
                </ReactMarkdown>
              )
            case "image":
              return (
                <Image
                  key={index}
                  src={`data:${content.source.media_type};base64,${content.source.data}`}
                  alt="Tool result"
                  className="max-w-full"
                  width={100}
                  height={100}
                  unoptimized={true}
                />
              )
            default:
              return (
                <ReactMarkdown
                  key={index}
                  rehypePlugins={[rehypeRaw, rehypeHighlight]}
                >
                  {JSON.stringify(content)}
                </ReactMarkdown>
              )
          }
        })}
      </div>
    )
  }

  return null
}

export function MessageToolComponent({
  isThinking,
  name,
  action,
  toolUseId,
}: {
  isThinking: boolean
  name?: string
  action?: string
  toolUseId?: string
}) {
  const { getToolResult } = useChat()
  const toolResult = toolUseId && getToolResult(toolUseId)

  if (!name) return null

  if (name === "computer") {
    return (
      <>
        <Badge
          variant="secondary"
          className={cn("inline-flex", isThinking && "animate-pulse")}
        >
          <ComputerIcon className="w-4 h-4 mr-2" />
          {action}
        </Badge>
        {toolResult && <MessageToolResultComponent toolResult={toolResult} />}
      </>
    )
  }

  return (
    <Badge variant="secondary" className="inline-flex">
      <HammerIcon className="w-4 h-4 mr-1" /> Using tool...
    </Badge>
  )
}

export function MessageContentComponent({ message }: { message: Message }) {
  if (typeof message.content === "string") {
    if (message.isThinking) {
      return (
        <div className="flex items-center" key={message.id}>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
          {message.hasToolUse ? (
            <div className="flex flex-col gap-2">
              <MessageToolComponent
                isThinking={true}
                name={message.toolUse?.name}
                action={message.toolUse?.input.action}
                toolUseId={message.toolUse?.id}
              />
              <span>Thinking...</span>
            </div>
          ) : (
            <span>Thinking...</span>
          )}
        </div>
      )
    } else {
      return (
        <div className="flex flex-col gap-2">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
            key={message.id}
          >
            {message.content}
          </ReactMarkdown>
          {message.hasToolUse && (
            <MessageToolComponent
              isThinking={false}
              name={message.toolUse?.name}
              action={message.toolUse?.input.action}
              toolUseId={message.toolUse?.id}
            />
          )}
        </div>
      )
    }
  } else {
    return null
  }
}
