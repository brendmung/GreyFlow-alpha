"use client"
import { Separator } from "@/components/ui/separator"
import { Bot, Cpu, MessageSquare, Globe } from "lucide-react"

interface AgentSidebarProps {
  onAddNode: (type: string) => void
}

export function AgentSidebar({ onAddNode }: AgentSidebarProps) {
  return (
    <div className="h-full border-r p-4 flex flex-col overflow-auto">
      <h2 className="font-semibold text-lg mb-4">Agent Types</h2>
      <p className="text-sm text-gray-500 mb-4">Click to add agents to your workflow</p>
      <Separator className="my-4" />
      <div className="space-y-3 flex-1">
        <div
          className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => onAddNode("input")}
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
      <div className="mt-4">
        <Separator className="my-4" />
        <div className="text-xs text-gray-500">Connect agents by dragging from one node's handle to another.</div>
      </div>
    </div>
  )
}
