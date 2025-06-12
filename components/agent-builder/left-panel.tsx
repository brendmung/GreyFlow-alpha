"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Bot, Globe, MessageSquare, Play, FileImage, File } from "lucide-react"
import type { Node, Edge } from "reactflow"

interface LeftPanelProps {
  onAddNode: (type: string) => void
  nodes: Node[]
  edges: Edge[]
}

const nodeTypes = [
  {
    type: "input",
    label: "Input",
    icon: MessageSquare,
    description: "Collect user input",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    type: "processor",
    label: "Processor",
    icon: Bot,
    description: "AI processing agent",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    type: "api",
    label: "API",
    icon: Globe,
    description: "External API call",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    type: "output",
    label: "Output",
    icon: Play,
    description: "Display results",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  {
    type: "pdf",
    label: "PDF",
    icon: FileImage,
    description: "Generate PDF document",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  {
    type: "word",
    label: "Word",
    icon: File,
    description: "Generate Word document",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
]

export function LeftPanel({ onAddNode, nodes, edges }: LeftPanelProps) {
  const onDragStart = (event: React.DragEvent<HTMLButtonElement>, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  return (
    <div className="w-full h-full bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Agent Nodes</h2>
        <p className="text-sm text-muted-foreground">Drag nodes to the canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {nodeTypes.map((nodeType) => {
          const Icon = nodeType.icon
          return (
            <Button
              key={nodeType.type}
              variant="outline"
              className={`w-full h-auto p-3 flex flex-col items-start gap-2 cursor-grab active:cursor-grabbing ${nodeType.color}`}
              onDragStart={(e) => onDragStart(e, nodeType.type)}
              draggable
              onClick={() => onAddNode(nodeType.type)}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{nodeType.label}</span>
              </div>
              <span className="text-xs text-left">{nodeType.description}</span>
            </Button>
          )
        })}
      </div>

      <Separator />

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Workflow Stats</span>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            {nodes.length} nodes
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {edges.length} connections
          </Badge>
        </div>
      </div>
    </div>
  )
}
