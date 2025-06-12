"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Play, Settings, Loader2, FileText } from "lucide-react"
import type { Node } from "reactflow"
import { MessageSquare, Cpu, Globe } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AgentNodeData {
  label: string
  systemPrompt?: string
  apiEndpoint?: string
  model?: string
  prompt?: string
  apiConfig?: {
    method?: string
    queryParams?: Record<string, string>
    headers?: Record<string, string>
    body?: string
    authType?: string
    authToken?: string
    authKey?: string
    authValue?: string
  }
  pdfConfig?: {
    filename?: string
    documentType?: string
  }
  wordConfig?: {
    filename?: string
    documentType?: string
  }
  isExecuting?: boolean
  isCompleted?: boolean
  hasError?: boolean
}

type FlowAgentNode = Node<AgentNodeData>

interface RightPanelProps {
  selectedNode: FlowAgentNode | null
  updateNodeData: (nodeId: string, data: any) => void
  setSelectedNode: (node: FlowAgentNode | null) => void
  userInput: string
  setUserInput: (input: string) => void
  output: string
  isRunning: boolean
  onRunWorkflow: () => void
  onDeleteNode: (nodeId: string) => void
  isMobile?: boolean
}

export function RightPanel({
  selectedNode,
  updateNodeData,
  setSelectedNode,
  userInput,
  setUserInput,
  output,
  isRunning,
  onRunWorkflow,
  onDeleteNode,
  isMobile = false,
}: RightPanelProps) {
  const handleNodeUpdate = (field: string, value: any) => {
    if (selectedNode) {
      updateNodeData(selectedNode.id, { [field]: value })
    }
  }

  const handleNestedUpdate = (parent: string, field: string, value: any) => {
    if (selectedNode) {
      const currentData = selectedNode.data[parent as keyof AgentNodeData] || {}
      updateNodeData(selectedNode.id, {
        [parent]: {
          ...currentData,
          [field]: value,
        },
      })
    }
  }

  const renderNodeEditor = () => {
    if (!selectedNode) {
      return (
        <div className="p-6 text-center text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="font-medium mb-1">No Node Selected</h3>
          <p className="text-sm">Select a node to edit its properties</p>
        </div>
      )
  }

  return (
      <div className="space-y-6">
        {/* Header with node type and delete button */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize font-medium">
              {selectedNode.type} Node
            </Badge>
            {selectedNode.data.isExecuting && (
              <Badge variant="secondary" className="text-xs">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Running
              </Badge>
            )}
            {selectedNode.data.isCompleted && (
              <Badge variant="default" className="text-xs bg-green-500">
                Completed
              </Badge>
            )}
            {selectedNode.data.hasError && (
              <Badge variant="destructive" className="text-xs">
                Error
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              onDeleteNode(selectedNode.id)
              setSelectedNode(null)
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
                    </Button>
                </div>

        {/* Basic Configuration */}
                <div className="space-y-4">
                  <div>
            <Label htmlFor="label" className="text-sm font-medium">
              Node Label
            </Label>
                    <Input
              id="label"
              value={selectedNode.data.label}
              onChange={(e) => handleNodeUpdate("label", e.target.value)}
              placeholder="Enter node name"
              className="mt-1"
                    />
                  </div>

          {/* Input Node Configuration */}
                  {selectedNode.type === "input" && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Input Configuration
              </h4>
                    <div>
                <Label htmlFor="prompt" className="text-sm font-medium">
                  User Prompt
                </Label>
                      <Textarea
                  id="prompt"
                  value={selectedNode.data.prompt || ""}
                  onChange={(e) => handleNodeUpdate("prompt", e.target.value)}
                  placeholder="What should this input ask the user?"
                  className="mt-1 min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This message will be shown to users when input is needed
                </p>
              </div>
                    </div>
                  )}

          {/* Processor Node Configuration */}
                  {selectedNode.type === "processor" && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                AI Processing Configuration
              </h4>
              <div className="grid grid-cols-1 gap-4">
                      <div>
                  <Label htmlFor="model" className="text-sm font-medium">
                    AI Model
                  </Label>
                        <Select
                    value={selectedNode.data.model || "gpt-4o"}
                    onValueChange={(value) => handleNodeUpdate("model", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select AI model" />
                          </SelectTrigger>
                          <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                  <Label htmlFor="systemPrompt" className="text-sm font-medium">
                    System Instructions
                  </Label>
                        <Textarea
                    id="systemPrompt"
                    value={selectedNode.data.systemPrompt || ""}
                    onChange={(e) => handleNodeUpdate("systemPrompt", e.target.value)}
                    placeholder="Define the AI agent's role and behavior..."
                    className="mt-1 min-h-[120px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Instructions that define how the AI should behave and respond
                  </p>
                </div>
              </div>
                      </div>
                  )}

          {/* API Node Configuration */}
                  {selectedNode.type === "api" && (
            <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-900 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                API Configuration
              </h4>
              <div className="grid grid-cols-1 gap-4">
                      <div>
                  <Label htmlFor="apiEndpoint" className="text-sm font-medium">
                    API Endpoint URL
                  </Label>
                        <Input
                    id="apiEndpoint"
                    value={selectedNode.data.apiEndpoint || ""}
                    onChange={(e) => handleNodeUpdate("apiEndpoint", e.target.value)}
                          placeholder="https://api.example.com/endpoint"
                    className="mt-1 font-mono text-sm"
                        />
                      </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="method" className="text-sm font-medium">
                      Method
                        </Label>
                    <Select
                      value={selectedNode.data.apiConfig?.method || "GET"}
                      onValueChange={(value) => handleNestedUpdate("apiConfig", "method", value)}
                    >
                      <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                    <Label htmlFor="authType" className="text-sm font-medium">
                      Authentication
                    </Label>
                    <Select
                      value={selectedNode.data.apiConfig?.authType || "none"}
                      onValueChange={(value) => handleNestedUpdate("apiConfig", "authType", value)}
                    >
                      <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                            <SelectItem value="bearer">Bearer Token</SelectItem>
                            <SelectItem value="apikey">API Key</SelectItem>
                            <SelectItem value="basic">Basic Auth</SelectItem>
                          </SelectContent>
                        </Select>
                  </div>
                </div>
              </div>
                          </div>
                        )}

          {/* PDF Node Configuration */}
          {selectedNode.type === "pdf" && (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                PDF Generation Settings
              </h4>
              <div className="grid grid-cols-1 gap-4">
                        <div>
                  <Label htmlFor="pdfFilename" className="text-sm font-medium">
                    Output Filename
                  </Label>
                                <Input
                    id="pdfFilename"
                    value={selectedNode.data.pdfConfig?.filename || ""}
                    onChange={(e) => handleNestedUpdate("pdfConfig", "filename", e.target.value)}
                    placeholder="document.pdf"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pdfDocumentType" className="text-sm font-medium">
                    Document Template
                  </Label>
                  <Select
                    value={selectedNode.data.pdfConfig?.documentType || "general"}
                    onValueChange={(value) => handleNestedUpdate("pdfConfig", "documentType", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Document</SelectItem>
                      <SelectItem value="cv">CV/Resume</SelectItem>
                      <SelectItem value="research">Research Paper</SelectItem>
                      <SelectItem value="report">Business Report</SelectItem>
                      <SelectItem value="letter">Formal Letter</SelectItem>
                      <SelectItem value="custom">Custom Format</SelectItem>
                    </SelectContent>
                  </Select>
                              </div>
                          </div>
                        </div>
                      )}

          {/* Word Node Configuration */}
          {selectedNode.type === "word" && (
            <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-900 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Word Document Settings
              </h4>
              <div className="grid grid-cols-1 gap-4">
                        <div>
                  <Label htmlFor="wordFilename" className="text-sm font-medium">
                    Output Filename
                  </Label>
                  <Input
                    id="wordFilename"
                    value={selectedNode.data.wordConfig?.filename || ""}
                    onChange={(e) => handleNestedUpdate("wordConfig", "filename", e.target.value)}
                    placeholder="document.docx"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="wordDocumentType" className="text-sm font-medium">
                    Document Template
                  </Label>
                  <Select
                    value={selectedNode.data.wordConfig?.documentType || "general"}
                    onValueChange={(value) => handleNestedUpdate("wordConfig", "documentType", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Document</SelectItem>
                      <SelectItem value="cv">CV/Resume</SelectItem>
                      <SelectItem value="research">Research Paper</SelectItem>
                      <SelectItem value="report">Business Report</SelectItem>
                      <SelectItem value="letter">Formal Letter</SelectItem>
                      <SelectItem value="custom">Custom Format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
                        </div>
                      )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-background border-l flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Properties</h2>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Tabs defaultValue="configuration" className="flex-1 flex flex-col h-full">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="configuration">Node Configuration</TabsTrigger>
              <TabsTrigger value="output">Workflow Output</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="configuration" className="h-full p-4 m-0 overflow-auto">
              {renderNodeEditor()}
            </TabsContent>

            <TabsContent value="output" className="h-full flex flex-col p-4 m-0">
              <div className="bg-gray-50 border rounded-lg p-4 flex-1 overflow-auto mb-3">
                <div className="font-mono text-sm">
                  {output ? (
                    <div className="space-y-1">
                      {output.split("\n").map((line, index) => (
                        <div key={index} className="flex">
                          <span className="text-gray-400 mr-3 select-none text-xs">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={
                              line.includes("Error") || line.includes("Failed")
                                ? "text-red-600"
                                : line.includes("Completed") || line.includes("Success")
                                  ? "text-green-600"
                                  : line.includes("Starting") || line.includes("Processing")
                                    ? "text-blue-600"
                                    : "text-gray-700"
                            }
                          >
                            {line || " "}
                          </span>
                            </div>
                          ))}
                        </div>
                  ) : (
                    <div className="text-gray-500 italic h-full flex flex-col justify-center items-center">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span>Ready to execute workflow</span>
                      </div>
                      <div className="text-xs">Click "Run Workflow" to see execution logs here...</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={onRunWorkflow} disabled={isRunning} size="sm">
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Workflow
                    </>
                  )}
                </Button>
                {output && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(output)
                    }}
                  >
                    Copy Log
                  </Button>
                )}
              </div>
            </TabsContent>
            </div>
        </Tabs>
      </div>
    </div>
  )
}
