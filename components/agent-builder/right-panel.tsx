"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Play, Trash2, Check, Loader2, Plus, Minus, Copy, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { API_TEMPLATES, type APIRequestConfig } from "@/lib/api-handler"

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "OpenAI" },
  { value: "gpt-4.1", label: "GPT-4.1", provider: "OpenAI" },
  { value: "nova-ai", label: "Nova AI", provider: "Amazon" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "Google" },
]

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
  isMobile: boolean
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
  isMobile,
}: RightPanelProps) {
  const { toast } = useToast()
  const [label, setLabel] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [apiEndpoint, setApiEndpoint] = useState("")
  const [model, setModel] = useState("gpt-4o")
  const [selectedTemplate, setSelectedTemplate] = useState("custom")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [inputPrompt, setInputPrompt] = useState("")
  const [showCopySuccess, setShowCopySuccess] = useState(false)

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || "")
      setSystemPrompt(selectedNode.data.systemPrompt || "")
      setApiEndpoint(selectedNode.data.apiEndpoint || "")
      setModel(selectedNode.data.model || "gpt-4o")
      setInputPrompt(selectedNode.data.prompt || "")
      setHasUnsavedChanges(false)
    }
  }, [selectedNode])

  const handleSave = useCallback(() => {
    if (!selectedNode) return

    const updates: any = {
      label,
    }

    if (selectedNode.type === "processor") {
      updates.systemPrompt = systemPrompt
      updates.model = model
    } else if (selectedNode.type === "api") {
      updates.apiEndpoint = apiEndpoint
      updates.apiConfig = selectedNode.data.apiConfig
    } else if (selectedNode.type === "input") {
      updates.prompt = inputPrompt
    }

    updateNodeData(selectedNode.id, updates)
    setHasUnsavedChanges(false)
    toast({
      title: "Changes saved",
      description: "Node configuration has been updated.",
    })
  }, [selectedNode, label, systemPrompt, apiEndpoint, model, inputPrompt, updateNodeData, toast])

  const handleTemplateSelect = (templateKey: string) => {
    if (templateKey === "custom") {
      setSelectedTemplate("")
      return
    }

    const template = API_TEMPLATES[templateKey as keyof typeof API_TEMPLATES]
    if (template) {
      setSelectedTemplate(templateKey)
      setApiEndpoint(template.endpoint)
      setModel(template.config.model || "gpt-4o")
      setSystemPrompt(template.config.systemPrompt || "")
    }
  }

  const addHeader = () => {
    // Implementation of addHeader function
  }

  const updateHeader = (oldKey: string, newKey: string, value: string) => {
    // Implementation of updateHeader function
  }

  const removeHeader = (key: string) => {
    // Implementation of removeHeader function
  }

  const addQueryParam = () => {
    // Implementation of addQueryParam function
  }

  const updateQueryParam = (oldKey: string, newKey: string, value: string) => {
    // Implementation of updateQueryParam function
  }

  const removeQueryParam = (key: string) => {
    // Implementation of removeQueryParam function
  }

  const handleDelete = () => {
    if (selectedNode) {
      onDeleteNode(selectedNode.id)
    }
  }

  const handleCancel = () => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || "")
      setSystemPrompt(selectedNode.data.systemPrompt || "")
      setApiEndpoint(selectedNode.data.apiEndpoint || "")
      setModel(selectedNode.data.model || "gpt-4o")
      setInputPrompt(selectedNode.data.prompt || "")
      setHasUnsavedChanges(false)
    }
    setSelectedNode(null)
  }

  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)

    if (diffSeconds < 10) return "just now"
    if (diffSeconds < 60) return `${diffSeconds}s ago`
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleInputFocus = () => {
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo(0, 0)
      }, 100)
    }
  }

  const handleCopyOutput = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      setShowCopySuccess(true)
      setTimeout(() => setShowCopySuccess(false), 2000)
    }
  }, [output])

  return (
    <div className="h-full w-full border-l bg-background">
      <div className="p-4 h-full flex flex-col">
        <Tabs defaultValue="inspector" className="h-full flex flex-col">
          <div className="border-b px-4 flex-shrink-0">
            <TabsList className="my-2">
              <TabsTrigger value="inspector">Node Inspector</TabsTrigger>
              <TabsTrigger value="output">Workflow Output</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inspector" className="flex-1 p-4 overflow-auto m-0">
            {selectedNode ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Node Configuration</h3>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => onDeleteNode(selectedNode.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={!hasUnsavedChanges}>
                      Save Changes
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="node-label">Label</Label>
                    <Input
                      id="node-label"
                      value={label}
                      onChange={(e) => {
                        setLabel(e.target.value)
                        setHasUnsavedChanges(true)
                      }}
                      placeholder="Node Label"
                    />
                  </div>

                  {selectedNode.type === "input" && (
                    <div>
                      <Label htmlFor="input-prompt">Input Prompt</Label>
                      <Textarea
                        id="input-prompt"
                        value={inputPrompt}
                        onChange={(e) => {
                          setInputPrompt(e.target.value)
                          setHasUnsavedChanges(true)
                        }}
                        placeholder="Enter the prompt to show when requesting input..."
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This prompt will be shown to users when the workflow needs their input.
                      </p>
                    </div>
                  )}

                  {selectedNode.type === "processor" && (
                    <>
                      <div>
                        <Label htmlFor="model">AI Model</Label>
                        <Select
                          value={model}
                          onValueChange={(value) => {
                            setModel(value)
                            setHasUnsavedChanges(true)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AI_MODELS.map((model) => (
                              <SelectItem key={model.value} value={model.value}>
                                {model.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="system-prompt">System Prompt</Label>
                        <Textarea
                          id="system-prompt"
                          value={systemPrompt}
                          onChange={(e) => {
                            setSystemPrompt(e.target.value)
                            setHasUnsavedChanges(true)
                          }}
                          placeholder="Enter system prompt..."
                          className="min-h-[200px]"
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.type === "api" && (
                    <>
                      <div>
                        <Label htmlFor="api-template">API Template (Optional)</Label>
                        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a template or configure manually" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom Configuration</SelectItem>
                            {Object.entries(API_TEMPLATES).map(([key, template]) => (
                              <SelectItem key={key} value={key}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Templates provide pre-configured settings for popular APIs
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="api-endpoint">API Endpoint *</Label>
                        <Input
                          id="api-endpoint"
                          value={apiEndpoint}
                          onChange={(e) => setApiEndpoint(e.target.value)}
                          placeholder="https://api.example.com/endpoint"
                          className={hasUnsavedChanges ? "border-orange-300" : ""}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use {"{input}"} or {"{{input}}"} as placeholder for user input
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="cors-proxy"
                          checked={selectedNode.data.apiConfig?.useCorsProxy || false}
                          onChange={(e) => {
                            const newConfig = { ...selectedNode.data.apiConfig, useCorsProxy: e.target.checked }
                            updateNodeData(selectedNode.id, { apiConfig: newConfig })
                            setHasUnsavedChanges(true)
                          }}
                          className="rounded"
                        />
                        <Label htmlFor="cors-proxy" className="text-sm">
                          Use CORS proxy (for testing APIs that don't support CORS)
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 -mt-2">
                        ⚠️ Only use for testing. CORS proxies may not be reliable for production.
                      </p>

                      <div>
                        <Label htmlFor="api-method">HTTP Method</Label>
                        <Select value={selectedNode.data.apiConfig?.method || "GET"} onValueChange={(value: any) => {
                          const newConfig = { ...selectedNode.data.apiConfig, method: value }
                          updateNodeData(selectedNode.id, { apiConfig: newConfig })
                          setHasUnsavedChanges(true)
                        }}>
                          <SelectTrigger>
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
                        <Label>Authentication</Label>
                        <Select value={selectedNode.data.apiConfig?.authType || "none"} onValueChange={(value: any) => {
                          const newConfig = { ...selectedNode.data.apiConfig, authType: value }
                          updateNodeData(selectedNode.id, { apiConfig: newConfig })
                          setHasUnsavedChanges(true)
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Authentication</SelectItem>
                            <SelectItem value="bearer">Bearer Token</SelectItem>
                            <SelectItem value="apikey">API Key</SelectItem>
                            <SelectItem value="basic">Basic Auth</SelectItem>
                          </SelectContent>
                        </Select>

                        {selectedNode.data.apiConfig?.authType !== "none" && (
                          <div className="mt-2 space-y-2">
                            {selectedNode.data.apiConfig?.authType === "apikey" && (
                              <Input
                                placeholder="Header name (e.g., X-API-Key)"
                                value={selectedNode.data.apiConfig?.authHeader || ""}
                                onChange={(e) => {
                                  const newConfig = { ...selectedNode.data.apiConfig, authHeader: e.target.value }
                                  updateNodeData(selectedNode.id, { apiConfig: newConfig })
                                  setHasUnsavedChanges(true)
                                }}
                              />
                            )}
                            <Input
                              type="password"
                              placeholder={selectedNode.data.apiConfig?.authType === "basic" ? "username:password" : "Token/API Key"}
                              value={selectedNode.data.apiConfig?.authValue || ""}
                              onChange={(e) => {
                                const newConfig = { ...selectedNode.data.apiConfig, authValue: e.target.value }
                                updateNodeData(selectedNode.id, { apiConfig: newConfig })
                                setHasUnsavedChanges(true)
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {selectedNode.data.apiConfig?.method === "GET" && (
                        <div>
                          <div className="flex items-center justify-between">
                            <Label>Query Parameters</Label>
                            <Button size="sm" variant="outline" onClick={addQueryParam}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="space-y-2 mt-2">
                            {Object.entries(selectedNode.data.apiConfig?.queryParams || {}).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <Input
                                  placeholder="Parameter name"
                                  value={key}
                                  onChange={(e) => {
                                    const newParams = { ...selectedNode.data.apiConfig?.queryParams, [e.target.value]: value }
                                    const newConfig = { ...selectedNode.data.apiConfig, queryParams: newParams }
                                    updateNodeData(selectedNode.id, { apiConfig: newConfig })
                                    setHasUnsavedChanges(true)
                                  }}
                                  className="flex-1"
                                />
                                <Input
                                  placeholder="Value (use {{input}} for user input)"
                                  value={value}
                                  onChange={(e) => {
                                    const newParams = { ...selectedNode.data.apiConfig?.queryParams, [key]: e.target.value }
                                    const newConfig = { ...selectedNode.data.apiConfig, queryParams: newParams }
                                    updateNodeData(selectedNode.id, { apiConfig: newConfig })
                                    setHasUnsavedChanges(true)
                                  }}
                                  className="flex-1"
                                />
                                <Button size="sm" variant="outline" onClick={() => {
                                  const newParams = { ...selectedNode.data.apiConfig?.queryParams }
                                  delete newParams[key]
                                  const newConfig = { ...selectedNode.data.apiConfig, queryParams: newParams }
                                  updateNodeData(selectedNode.id, { apiConfig: newConfig })
                                  setHasUnsavedChanges(true)
                                }}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {["POST", "PUT", "PATCH"].includes(selectedNode.data.apiConfig?.method || "GET") && (
                        <div>
                          <Label htmlFor="body-template">Request Body Template</Label>
                          <Textarea
                            id="body-template"
                            value={selectedNode.data.apiConfig?.bodyTemplate || ""}
                            onChange={(e) => {
                              const newConfig = { ...selectedNode.data.apiConfig, bodyTemplate: e.target.value }
                              updateNodeData(selectedNode.id, { apiConfig: newConfig })
                              setHasUnsavedChanges(true)
                            }}
                            placeholder='{"query": "{{input}}", "limit": 10}'
                            className="h-24 resize-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            JSON template for request body. Use {"{{input}}"} for user input.
                          </p>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between">
                          <Label>Custom Headers</Label>
                          <Button size="sm" variant="outline" onClick={addHeader}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-2 mt-2">
                          {Object.entries(selectedNode.data.apiConfig?.headers || {}).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <Input
                                placeholder="Header name"
                                value={key}
                                onChange={(e) => {
                                  const newHeaders = { ...selectedNode.data.apiConfig?.headers, [e.target.value]: value }
                                  const newConfig = { ...selectedNode.data.apiConfig, headers: newHeaders }
                                  updateNodeData(selectedNode.id, { apiConfig: newConfig })
                                  setHasUnsavedChanges(true)
                                }}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Header value"
                                value={value}
                                onChange={(e) => {
                                  const newHeaders = { ...selectedNode.data.apiConfig?.headers, [key]: e.target.value }
                                  const newConfig = { ...selectedNode.data.apiConfig, headers: newHeaders }
                                  updateNodeData(selectedNode.id, { apiConfig: newConfig })
                                  setHasUnsavedChanges(true)
                                }}
                                className="flex-1"
                              />
                              <Button size="sm" variant="outline" onClick={() => {
                                const newHeaders = { ...selectedNode.data.apiConfig?.headers }
                                delete newHeaders[key]
                                const newConfig = { ...selectedNode.data.apiConfig, headers: newHeaders }
                                updateNodeData(selectedNode.id, { apiConfig: newConfig })
                                setHasUnsavedChanges(true)
                              }}>
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div className="max-w-md space-y-2">
                  <h3 className="text-lg font-semibold">No Node Selected</h3>
                  <p className="text-sm text-gray-500">
                    Select a node in the workflow to view and edit its configuration.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="output" className="flex-1 p-4 overflow-auto m-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Workflow Output</h3>
                <Button size="sm" onClick={onRunWorkflow} disabled={isRunning}>
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Workflow
                    </>
                  )}
                </Button>
              </div>

              <div className="relative min-h-[200px] bg-gray-50 dark:bg-gray-900 rounded-md p-4 font-mono text-sm overflow-auto">
                {output ? (
                  <>
                  <div className="whitespace-pre-wrap">
                    {output.split("\n").map((line, i) => (
                      <div key={i} className="mb-1">
                        {line}
                      </div>
                    ))}
                  </div>
                    {output.includes("Final Result:") && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">Final Result:</div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const finalResult = output.split("Final Result:")[1].trim()
                              navigator.clipboard.writeText(finalResult)
                              setShowCopySuccess(true)
                              setTimeout(() => setShowCopySuccess(false), 2000)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {showCopySuccess ? (
                              <CheckCheck className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="mt-2 whitespace-pre-wrap">
                          {output.split("Final Result:")[1].trim()}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Run the workflow to see output here
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
