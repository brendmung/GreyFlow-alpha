"use client"

import type React from "react"

import { MessageSquare, Cpu, Globe, FileText } from "lucide-react"

const agents = [
  {
    type: "input",
    label: "Input Agent",
    description: "Collects user input",
    icon: MessageSquare,
    color: "bg-blue-100 text-blue-500",
  },
  {
    type: "processor",
    label: "Processing Agent",
    description: "Processes data with AI",
    icon: Cpu,
    color: "bg-teal-100 text-teal-500",
  },
  {
    type: "api",
    label: "API Agent",
    description: "Makes API calls",
    icon: Globe,
    color: "bg-orange-100 text-orange-500",
  },
  {
    type: "output",
    label: "Output Agent",
    description: "Displays results",
    icon: MessageSquare,
    color: "bg-indigo-100 text-indigo-500",
  },
  {
    type: "pdf",
    label: "PDF Generator",
    description: "Creates PDF documents",
    icon: FileText,
    color: "bg-slate-100 text-slate-500",
  },
  {
    type: "word",
    label: "Word Generator",
    description: "Creates Word documents",
    icon: FileText,
    color: "bg-cyan-100 text-cyan-500",
  },
]

interface AgentSidebarProps {
  onAddNode: (type: string) => void
}

export function AgentSidebar({ onAddNode }: AgentSidebarProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Drag to add agents</h3>
      {agents.map((agent) => {
        const Icon = agent.icon
        return (
          <div
            key={agent.type}
            className={`${agent.color} p-3 rounded-lg cursor-grab active:cursor-grabbing border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200`}
            draggable
            onDragStart={(event) => onDragStart(event, agent.type)}
            onClick={() => onAddNode(agent.type)}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full w-8 h-8 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">{agent.label}</div>
                <div className="text-xs opacity-75">{agent.description}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
