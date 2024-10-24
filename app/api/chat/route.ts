// app/api/finance/route.ts
import { NextRequest } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

// Initialize Anthropic client with correct headers
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const runtime = "edge"

interface ComputerToolSchema {
  type: "computer_20241022"
  name: "computer"
  display_width_px: number
  display_height_px: number
  display_number: number
}

interface TextEditorToolSchema {
  type: "text_editor_20241022"
  name: "str_replace_editor"
}

interface BashToolSchema {
  type: "bash_20241022"
  name: "bash"
}

interface GeneralToolSchema {
  name: string
  description: string
  input_schema: {
    type: "object"
    properties: Record<string, unknown>
    required: string[]
  }
}

type ToolSchema =
  | ComputerToolSchema
  | TextEditorToolSchema
  | BashToolSchema
  | GeneralToolSchema

const tools: ToolSchema[] = [
  {
    type: "computer_20241022",
    name: "computer",
    display_width_px: 1024,
    display_height_px: 768,
    display_number: 1,
  },
]

export async function POST(req: NextRequest) {
  try {
    const { messages, model = "claude-3-5-sonnet-20241022" } = await req.json()

    console.log("🔍 Initial Request Data:", {
      hasMessages: !!messages,
      messageCount: messages?.length,
      model,
    })

    // Input validation
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400 }
      )
    }

    if (!model) {
      return new Response(
        JSON.stringify({ error: "Model selection is required" }),
        { status: 400 }
      )
    }

    const anthropicMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    console.log("🚀 Final Anthropic API Request:", {
      endpoint: "messages.create",
      model,
      max_tokens: 4096,
      temperature: 0.7,
      messageCount: anthropicMessages.length,
      tools: tools.map((t) => t.name),
      messageStructure: JSON.stringify(
        anthropicMessages.map((msg) => ({
          role: msg.role,
          content:
            typeof msg.content === "string"
              ? msg.content.slice(0, 50) + "..."
              : "[Complex Content]",
        })),
        null,
        2
      ),
    })

    const response = await anthropic.beta.messages.create({
      model,
      max_tokens: 1024,
      tools: tools,
      messages: anthropicMessages,
      betas: ["computer-use-2024-10-22"],
    })

    console.log("✅ Anthropic API Response received:", {
      status: "success",
      stopReason: response.stop_reason,
      hasToolUse: response.content.some((c) => c.type === "tool_use"),
      contentTypes: response.content.map((c) => c.type),
      contentLength:
        response.content[0].type === "text"
          ? response.content[0].text.length
          : 0,
      toolOutput: response.content.find((c) => c.type === "tool_use")
        ? JSON.stringify(
            response.content.find((c) => c.type === "tool_use"),
            null,
            2
          )
        : "No tool used",
    })

    const toolUseContent = response.content.find((c) => c.type === "tool_use")
    const textContent = response.content.find((c) => c.type === "text")

    return new Response(
      JSON.stringify({
        content: textContent?.text || "",
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
    console.error("❌ Finance API Error: ", error)
    console.error("Full error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      headers:
        error instanceof Error && "headers" in error
          ? (error as { headers: Record<string, string> }).headers
          : undefined,
      response:
        error instanceof Error && "response" in error
          ? (error as { response: unknown }).response
          : undefined,
    })

    // Add specific error handling for different scenarios
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
