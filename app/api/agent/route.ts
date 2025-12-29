import { NextRequest } from "next/server"
import { runAgentQuery } from "@/lib/agent-server"
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk"

// Use Node.js runtime for Claude Agent SDK (not Edge)
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { prompt, screenshot } = await req.json()

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const messages: SDKMessage[] = []

    const result = await runAgentQuery({
      prompt,
      screenshot,
      onMessage: (message) => {
        messages.push(message)
      },
    })

    // Extract the final response
    const assistantMessages = result.filter(
      (msg) => msg.type === "assistant"
    )
    const lastAssistant = assistantMessages[assistantMessages.length - 1]

    // Extract result messages
    const resultMessages = result.filter((msg) => msg.type === "result")

    return new Response(
      JSON.stringify({
        success: true,
        content: lastAssistant
          ? JSON.stringify(lastAssistant)
          : "Task completed",
        messages: result,
        resultMessages,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    )
  } catch (error) {
    console.error("Agent API error:", error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
