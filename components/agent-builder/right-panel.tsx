"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Play, Settings, Loader2, FileText } from "lucide-react"
import type { Node } from "reactflow"
import { MessageSquare, Cpu, Globe, ChevronDown, Copy, Square } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"

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
  stopWorkflow: () => void
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
  stopWorkflow,
}: RightPanelProps) {
  // Local state to manage form values
  const [localData, setLocalData] = useState<AgentNodeData | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [copySuccess, setCopySuccess] = useState<string>("")

  interface WorkflowSection {
    id: string
    title: string
    content: string
    type: "success" | "error" | "info" | "output"
    metadata?: {
      timestamp?: string
      duration?: string
      nodeType?: string
    }
  }

  const parseWorkflowOutput = (output: string): WorkflowSection[] => {
    const lines = output.split("\n")
    const sections: WorkflowSection[] = []
    let currentSection: Partial<WorkflowSection> | null = null
    let sectionContent: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Only detect node result sections (lines with specific emojis that indicate node outputs)
      if (
        line.match(/^[✅❌📤]/u) &&
        (line.includes("Output") || line.includes("Result") || line.includes("Completed") || line.includes("Failed"))
      ) {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            id: currentSection.id || `section-${sections.length}`,
            title: currentSection.title || "Unknown",
            content: sectionContent.join("\n").trim(),
            type: currentSection.type || "info",
            metadata: currentSection.metadata,
          })
        }

        // Start new section
        const isError = line.includes("❌") || line.includes("Failed") || line.includes("Error")
        const isSuccess = line.includes("✅") || line.includes("Completed") || line.includes("Success")
        const isOutput = line.includes("📤") || line.includes("Output")

        currentSection = {
          id: `section-${sections.length}`,
          title: line.replace(/^[✅❌📤]\s*/u, "").trim(),
          type: isError ? "error" : isSuccess ? "success" : isOutput ? "output" : "info",
          metadata: {
            timestamp: new Date().toLocaleTimeString(),
            nodeType: extractNodeType(line),
          },
        }
        sectionContent = []
      } else if (line.trim()) {
        // Add content to current section or display as plain text
        if (currentSection) {
          sectionContent.push(line)
        } else {
          // For non-expandable content, create a simple text section
          sections.push({
            id: `text-${sections.length}`,
            title: "",
            content: line,
            type: "info",
          })
        }
      }
    }

    // Add final section
    if (currentSection) {
      sections.push({
        id: currentSection.id || `section-${sections.length}`,
        title: currentSection.title || "Unknown",
        content: sectionContent.join("\n").trim(),
        type: currentSection.type || "info",
        metadata: currentSection.metadata,
      })
    }

    // If no sections were parsed, create a single section with all content
    if (sections.length === 0 && output.trim()) {
      sections.push({
        id: "section-0",
        title: "Workflow Output",
        content: output.trim(),
        type: "info",
      })
    }

    return sections
  }

  const extractNodeType = (line: string): string => {
    if (line.includes("Processor")) return "processor"
    if (line.includes("API")) return "api"
    if (line.includes("PDF")) return "pdf"
    if (line.includes("Word")) return "word"
    if (line.includes("Input")) return "input"
    if (line.includes("Output")) return "output"
    return "unknown"
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const copyToClipboard = async (content: string, title: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopySuccess(title)
      setTimeout(() => setCopySuccess(""), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // const stopWorkflow = () => {
  //   // This function should be passed from the parent component
  //   // For now, we'll just call onRunWorkflow to stop
  //   console.log('Stopping workflow...')
  // }

  // Update local state when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setLocalData({ ...selectedNode.data })
    } else {
      setLocalData(null)
    }
  }, [selectedNode])

  const handleNodeUpdate = (field: string, value: any) => {
    if (selectedNode && localData) {
      const newData = { ...localData, [field]: value }
      setLocalData(newData)
      updateNodeData(selectedNode.id, { [field]: value })
    }
  }

  const handleNestedUpdate = (parent: string, field: string, value: any) => {
    if (selectedNode && localData) {
      const currentParentData = localData[parent as keyof AgentNodeData] || {}
      const newParentData = {
        ...currentParentData,
        [field]: value,
      }
      const newData = { ...localData, [parent]: newParentData }
      setLocalData(newData)
      updateNodeData(selectedNode.id, {
        [parent]: newParentData,
      })
    }
  }

  const renderNodeEditor = () => {
    if (!selectedNode || !localData) {
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
            {localData.isExecuting && (
              <Badge variant="secondary" className="text-xs">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Running
              </Badge>
            )}
            {localData.isCompleted && (
              <Badge variant="default" className="text-xs bg-green-500">
                Completed
              </Badge>
            )}
            {localData.hasError && (
              <Badge variant="destructive" className="text-xs">
                Error
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
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
              value={localData.label || ""}
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
                  value={localData.prompt || ""}
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
                    value={localData.model || "gpt-4o"}
                    onValueChange={(value) => handleNodeUpdate("model", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="nova-ai">Nova AI</SelectItem>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="systemPrompt" className="text-sm font-medium">
                    System Instructions
                  </Label>
                  <Textarea
                    id="systemPrompt"
                    value={localData.systemPrompt || ""}
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
                    value={localData.apiEndpoint || ""}
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
                      value={localData.apiConfig?.method || "GET"}
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
                      value={localData.apiConfig?.authType || "none"}
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

                {/* Authentication fields */}
                {localData.apiConfig?.authType === "bearer" && (
                  <div>
                    <Label htmlFor="authToken" className="text-sm font-medium">
                      Bearer Token
                    </Label>
                    <Input
                      id="authToken"
                      type="password"
                      value={localData.apiConfig?.authToken || ""}
                      onChange={(e) => handleNestedUpdate("apiConfig", "authToken", e.target.value)}
                      placeholder="Enter bearer token"
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                )}

                {localData.apiConfig?.authType === "apikey" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="authKey" className="text-sm font-medium">
                        API Key Name
                      </Label>
                      <Input
                        id="authKey"
                        value={localData.apiConfig?.authKey || ""}
                        onChange={(e) => handleNestedUpdate("apiConfig", "authKey", e.target.value)}
                        placeholder="X-API-Key"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="authValue" className="text-sm font-medium">
                        API Key Value
                      </Label>
                      <Input
                        id="authValue"
                        type="password"
                        value={localData.apiConfig?.authValue || ""}
                        onChange={(e) => handleNestedUpdate("apiConfig", "authValue", e.target.value)}
                        placeholder="Enter API key"
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Request Body for POST/PUT/PATCH */}
                {localData.apiConfig?.method && ["POST", "PUT", "PATCH"].includes(localData.apiConfig.method) && (
                  <div>
                    <Label htmlFor="requestBody" className="text-sm font-medium">
                      Request Body (JSON)
                    </Label>
                    <Textarea
                      id="requestBody"
                      value={localData.apiConfig?.body || ""}
                      onChange={(e) => handleNestedUpdate("apiConfig", "body", e.target.value)}
                      placeholder='{"key": "{{input}}", "data": "value"}'
                      className="mt-1 min-h-[80px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {"{{input}}"} to insert data from previous nodes
                    </p>
                  </div>
                )}
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
                    value={localData.pdfConfig?.filename || ""}
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
                    value={localData.pdfConfig?.documentType || "general"}
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
                    value={localData.wordConfig?.filename || ""}
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
                    value={localData.wordConfig?.documentType || "general"}
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
              <div className="flex-1 overflow-auto mb-3 space-y-3">
                {output ? (
                  <div className="space-y-3">
                    {parseWorkflowOutput(output).map((section, index) =>
                      section.title ? (
                        // Expandable section for node results
                        <div key={index} className="border rounded-lg overflow-hidden">
                          <div
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer border-b"
                            onClick={() => toggleSection(section.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  section.type === "error"
                                    ? "bg-red-500"
                                    : section.type === "success"
                                      ? "bg-green-500"
                                      : section.type === "info"
                                        ? "bg-blue-500"
                                        : "bg-gray-400"
                                }`}
                              />
                              <span className="font-medium text-sm">{section.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {section.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(section.content, section.title)
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  expandedSections.has(section.id) ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </div>
                          {expandedSections.has(section.id) && (
                            <div className="p-4 bg-white">
                              <div className="font-mono text-sm whitespace-pre-wrap break-words">{section.content}</div>
                              {section.metadata && (
                                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                                  <div className="flex flex-wrap gap-4">
                                    {section.metadata.timestamp && <span>Time: {section.metadata.timestamp}</span>}
                                    {section.metadata.duration && <span>Duration: {section.metadata.duration}</span>}
                                    {section.metadata.nodeType && <span>Type: {section.metadata.nodeType}</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        // Simple text display for non-expandable content
                        <div key={index} className="p-2 text-sm text-gray-700 font-mono whitespace-pre-wrap">
                          {section.content}
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-gray-500 italic border rounded-lg p-8">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Ready to execute workflow</span>
                    </div>
                    <div className="text-xs">Click "Run Workflow" to see execution results here...</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={isRunning ? stopWorkflow : onRunWorkflow}
                  variant={isRunning ? "destructive" : "default"}
                  size="sm"
                >
                  {isRunning ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Workflow
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Workflow
                    </>
                  )}
                </Button>
                {output && (
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(output, "Complete Workflow Log")}>
                    Copy All
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
