# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `bun dev` - Start development server with Turbopack at http://localhost:3000 (project uses Bun, not npm)
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run linting checks

### Environment Setup
- Copy `.env.local.example` to `.env.local` and configure:
  - `ANTHROPIC_API_KEY` - Required for AI chat functionality
  - `NEXT_PUBLIC_NANOKVM_HOST` - IP address of your nanoKVM device (required for KVM functionality)
- Set nanoKVM resolution to 800x600 via web interface
- Disable authentication on nanoKVM following Sipeed's instructions

## Architecture Overview

This is a Next.js application that provides an AI chat interface with computer control capabilities through a nanoKVM device.

### Core Components Structure
- **Main Layout**: Resizable panels with chat on left (30% width) and KVM screen on right
- **Two Context Providers**: 
  - `ChatProvider` - Manages AI conversation state and computer tool execution
  - `HIDProvider` - Handles keyboard/mouse input to nanoKVM via WebSocket

### Key Data Flow
1. User types message → ChatProvider submits to `/api/chat`
2. API calls Anthropic with computer tool capability
3. If tool use returned → ChatProvider.takeAction() executes computer actions
4. Actions (screenshot, mouse, keyboard) → HIDProvider → WebSocket to nanoKVM
5. Tool results sent back to Anthropic to continue conversation

### Critical Files
- `app/api/chat/route.ts` - Anthropic API integration with computer tool schema
- `app/chat-provider.tsx` - Central state management for chat and tool execution  
- `app/hid-context.tsx` - Hardware input device control via WebSocket
- `lib/websocket.ts` - WebSocket client for nanoKVM communication
- `lib/mapping.ts` - Keyboard/mouse code mappings for HID protocol

### Tool Execution Flow
The app supports these computer actions:
- `screenshot` - Captures canvas screenshot of KVM stream
- `mouse_move` - Moves cursor to absolute coordinates
- `left_click`/`double_click` - Mouse button actions
- `key` - Single key presses with HID key codes
- `type` - String typing by iterating key presses

All actions communicate with nanoKVM via WebSocket at `ws://{NANOKVM_HOST}/api/ws` using numeric protocol arrays.