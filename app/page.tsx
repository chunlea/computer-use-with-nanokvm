import TopNavBar from "@/components/top-nav-bar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <TopNavBar />
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <div className="h-full w-full items-center justify-center flex">
            Chat
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <div className="h-full w-full items-center justify-center flex">
            Screen
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
