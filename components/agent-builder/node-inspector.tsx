"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

interface NodeInspectorProps {
  selectedNode: any
  updateNodeData: (nodeId: string, data: any) => void
  setSelectedNode: (node: any) => void
}

export function NodeInspector({ selectedNode, updateNodeData, setSelectedNode }: NodeInspectorProps) {
  const [label, setLabel] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [apiEndpoint, setApiEndpoint] = useState("")

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || "")
      setSystemPrompt(selectedNode.data.systemPrompt || "")
      setApiEndpoint(selectedNode.data.apiEndpoint || "")
    }
  }, [selectedNode])

  if (!selectedNode) {
    return (
      <div className="h-full border-l p-4 flex flex-col overflow-auto">
        <h2 className="font-semibold text-lg mb-4">Node Inspector</h2>
        <p className="text-sm text-gray-500">Select a node to view and edit its properties</p>
      </div>
    )
  }

  const handleSave = () => {
    updateNodeData(selectedNode.id, {
      label,
      systemPrompt,
      apiEndpoint,
    })
  }

  return (
    <div className="h-full border-l p-4 flex flex-col overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Node Inspector</h2>
        <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-4 flex-1">
        <div>
          <Label htmlFor="node-label">Label</Label>
          <Input id="node-label" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>

        {selectedNode.type === "processor" && (
          <div>
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant..."
              className="h-32 resize-none"
            />
          </div>
        )}

        {selectedNode.type === "api" && (
          <div>
            <Label htmlFor="api-endpoint">API Endpoint</Label>
            <Input
              id="api-endpoint"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://api.example.com/endpoint"
            />
          </div>
        )}

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setSelectedNode(null)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
