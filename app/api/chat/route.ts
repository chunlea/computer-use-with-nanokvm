import { NextRequest } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { BetaMessageParam, BetaContentBlockParam } from "@anthropic-ai/sdk/resources/beta/messages"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const runtime = "edge"

// Display dimensions - can be configured via environment variables
const DISPLAY_WIDTH = parseInt(process.env.DISPLAY_WIDTH || "1024", 10)
const DISPLAY_HEIGHT = parseInt(process.env.DISPLAY_HEIGHT || "768", 10)

// Using the latest Computer Use API (2025-01-24)
interface ComputerToolSchema {
  type: "computer_20250124"
  name: "computer"
  display_width_px: number
  display_height_px: number
  display_number: number
}

const tools: ComputerToolSchema[] = [
  {
    type: "computer_20250124",
    name: "computer",
    display_width_px: DISPLAY_WIDTH,
    display_height_px: DISPLAY_HEIGHT,
    display_number: 1,
  },
]

export async function POST(req: NextRequest) {
  try {
    const { messages, model = "claude-sonnet-4-20250514" } = await req.json()

    console.log("🔍 Request:", {
      messageCount: messages?.length,
      model,
    })

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400 }
      )
    }

    const anthropicMessages: BetaMessageParam[] = messages.map(
      (msg: { role: "user" | "assistant"; content: string | BetaContentBlockParam[] }) => ({
        role: msg.role,
        content: msg.content,
      })
    )

    const response = await anthropic.beta.messages.create({
      model,
      max_tokens: 4096,
      tools: tools,
      messages: anthropicMessages,
      betas: ["computer-use-2025-01-24"],
    })

    console.log("✅ Response:", {
      stopReason: response.stop_reason,
      hasToolUse: response.content.some((c) => c.type === "tool_use"),
      contentTypes: response.content.map((c) => c.type),
    })

    const toolUseContent = response.content.find((c) => c.type === "tool_use")
    const textContent = response.content.find((c) => c.type === "text")

    return new Response(
      JSON.stringify({
        content: textContent?.type === "text" ? textContent.text : "",
        hasToolUse: response.content.some((c) => c.type === "tool_use"),
        toolUse: toolUseContent,
        responseContent: response.content,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    )
  } catch (error) {
    console.error("❌ API Error:", error)

    if (error instanceof Anthropic.APIError) {
      return new Response(
        JSON.stringify({
          error: "API Error",
          details: error.message,
          code: error.status,
        }),
        { status: error.status }
      )
    }

    if (error instanceof Anthropic.AuthenticationError) {
      return new Response(
        JSON.stringify({
          error: "Authentication Error",
          details: "Invalid API key or authentication failed",
        }),
        { status: 401 }
      )
    }

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
