import TopNavBar from "@/components/top-nav-bar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import AIChat from "./chat"
import KVMScreen from "./screen"
import { ChatProvider } from "./chat-provider"
import { HIDProvider } from "./hid-context"

export default function Home() {
  return (
    <HIDProvider>
      <ChatProvider>
        <div className="flex flex-col h-screen">
          <TopNavBar />
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <AIChat />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel>
              <KVMScreen />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </ChatProvider>
    </HIDProvider>
  )
}
