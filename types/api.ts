// Updated APIResponse interface

import { ComputerAction } from "./computer"

export interface ToolUseResponse {
  type: "tool_use"
  id: string
  name: string
  input: ComputerAction
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
