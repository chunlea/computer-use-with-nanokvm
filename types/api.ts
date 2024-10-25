// Updated APIResponse interface

import { ComputerAction } from "./computer"

export interface ToolUseResponse {
  type: "tool_use"
  id: string
  name: string
  input: ComputerAction
}

export interface ToolResultResponseImageContent {
  type: "image"
  source: {
    type: string
    media_type: string
    data: string
  }
}

export interface ToolResultResponseTextContent {
  type: "text"
  text: string
}

export interface ToolResultResponse {
  type: "tool_result"
  tool_use_id: string
  content?: [ToolResultResponseImageContent | ToolResultResponseTextContent]
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
  hiden?: boolean
  isThinking?: boolean
  hasToolUse?: boolean
  toolUse?: ToolUseResponse
}
