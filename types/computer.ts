export interface ComputerAction {
  action:
    | "key"
    | "type"
    | "mouse_move"
    | "left_click"
    | "left_click_drag"
    | "right_click"
    | "middle_click"
    | "double_click"
    | "screenshot"
    | "cursor_position"
  coordinate?: [number, number]
  text?: string
}
