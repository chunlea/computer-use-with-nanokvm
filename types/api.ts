// Updated APIResponse interface

import { ComputerAction } from "./computer"

export interface ToolUseResponse {
  type: "tool_use"
  id: string
  name: string
  input: ComputerAction
}

export interface ToolResultResponse {
  type: "tool_result"
  tool_use_id: string
  content: [
    {
      type: "text"
      source: {
        type: string
        media_type: string
        data: string
      }
    }
  ]
}

export interface APIResponse {
  content: string
  hasToolUse: boolean
  toolUse?: ToolUseResponse
}

export interface Message {
  id: string
  role: string
  content: string | object[]
  hasToolUse?: boolean
  toolUse?: ToolUseResponse
}
