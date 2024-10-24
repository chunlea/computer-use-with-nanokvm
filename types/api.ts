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
