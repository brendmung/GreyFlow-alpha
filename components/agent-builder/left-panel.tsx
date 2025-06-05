"use client"
import { Separator } from "@/components/ui/separator"
import { Bot, Cpu, MessageSquare, Globe, Code } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LeftPanelProps {
  onAddNode: (type: string) => void
  nodes: any[]
  edges: any[]
}

export function LeftPanel({ onAddNode, nodes, edges }: LeftPanelProps) {
  return (
    <div className="h-full border-r flex flex-col bg-background">
      <Tabs defaultValue="agents" className="h-full flex flex-col">
        <div className="border-b px-4 flex-shrink-0">
          <TabsList className="my-2">
            <TabsTrigger value="agents">Agent Types</TabsTrigger>
            <TabsTrigger value="code">Workflow Code</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agents" className="flex-1 p-4 overflow-auto m-0">
          <div className="space-y-4 h-full flex flex-col">
            <p className="text-sm text-gray-500">Click to add agents to your workflow</p>
            <Separator className="my-2" />

            <div className="space-y-3 flex-1">
              <div
                className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => onAddNode("input")}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow", "input")
                  event.dataTransfer.effectAllowed = "move"
                }}
              >
                <div className="flex items-center">
                  <div className="rounded-full w-8 h-8 flex items-center justify-center bg-blue-100">
                    <Bot className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="ml-2">
                    <div className="text-sm font-medium">Input Agent</div>
                    <div className="text-xs text-gray-500">Processes user input</div>
                  </div>
                </div>
              </div>
              <div
                className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => onAddNode("processor")}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow", "processor")
                  event.dataTransfer.effectAllowed = "move"
                }}
              >
                <div className="flex items-center">
                  <div className="rounded-full w-8 h-8 flex items-center justify-center bg-green-100">
                    <Cpu className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="ml-2">
                    <div className="text-sm font-medium">Processor Agent</div>
                    <div className="text-xs text-gray-500">Processes information</div>
                  </div>
                </div>
              </div>
              <div
                className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => onAddNode("api")}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow", "api")
                  event.dataTransfer.effectAllowed = "move"
                }}
              >
                <div className="flex items-center">
                  <div className="rounded-full w-8 h-8 flex items-center justify-center bg-orange-100">
                    <Globe className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="ml-2">
                    <div className="text-sm font-medium">API Agent</div>
                    <div className="text-xs text-gray-500">Makes API calls</div>
                  </div>
                </div>
              </div>
              <div
                className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => onAddNode("output")}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow", "output")
                  event.dataTransfer.effectAllowed = "move"
                }}
              >
                <div className="flex items-center">
                  <div className="rounded-full w-8 h-8 flex items-center justify-center bg-purple-100">
                    <MessageSquare className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="ml-2">
                    <div className="text-sm font-medium">Output Agent</div>
                    <div className="text-xs text-gray-500">Formats final response</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex-shrink-0">
              <Separator className="my-2" />
              <div className="text-xs text-gray-500">Connect agents by dragging from one node's handle to another.</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="flex-1 overflow-hidden m-0">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between border-b px-4 flex-shrink-0">
              <div className="flex items-center py-2">
                <Code className="h-4 w-4 mr-2" />
                <h3 className="text-sm font-medium">Workflow Code</h3>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto text-sm min-h-full">
                {JSON.stringify({ nodes, edges }, null, 2)}
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
