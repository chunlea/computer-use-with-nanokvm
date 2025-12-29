export interface ComputerAction {
  action:
    | "key"
    | "hold_key"
    | "type"
    | "mouse_move"
    | "left_click"
    | "left_click_drag"
    | "left_mouse_down"
    | "left_mouse_up"
    | "right_click"
    | "middle_click"
    | "double_click"
    | "triple_click"
    | "screenshot"
    | "cursor_position"
    | "scroll"
    | "wait"
  coordinate?: [number, number]
  text?: string
  duration?: number
  scroll_direction?: "up" | "down" | "left" | "right"
  scroll_amount?: number
}
