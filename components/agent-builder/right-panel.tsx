"use client"

import { useState, useEffect } from "react"
import { X, Play, Trash2, Check, Loader2, Plus, Minus, Copy } from "lucide-react"
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
  const [selectedModel, setSelectedModel] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // API Configuration
  const [apiMethod, setApiMethod] = useState<"GET" | "POST" | "PUT" | "DELETE" | "PATCH">("GET")
  const [apiHeaders, setApiHeaders] = useState<Record<string, string>>({})
  const [apiQueryParams, setApiQueryParams] = useState<Record<string, string>>({})
  const [apiBodyTemplate, setApiBodyTemplate] = useState("")
  const [authType, setAuthType] = useState<"none" | "bearer" | "apikey" | "basic">("none")
  const [authValue, setAuthValue] = useState("")
  const [authHeader, setAuthHeader] = useState("X-API-Key")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [useCorsProxy, setUseCorsProxy] = useState(false)

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || "")
      setSystemPrompt(selectedNode.data.systemPrompt || "")
      setApiEndpoint(selectedNode.data.apiEndpoint || "")
      setSelectedModel(selectedNode.data.model || "gpt-4o")

      // Load API configuration
      const config = selectedNode.data.apiConfig || {}
      setApiMethod(config.method || "GET")
      setApiHeaders(config.headers || {})
      setApiQueryParams(config.queryParams || {})
      setApiBodyTemplate(config.bodyTemplate || "")
      setAuthType(config.authType || "none")
      setAuthValue(config.authValue || "")
      setAuthHeader(config.authHeader || "X-API-Key")
      setUseCorsProxy(config.useCorsProxy || false)

      setHasUnsavedChanges(false)
      setLastSaved(null)
    }
  }, [selectedNode])

  // Track changes to show unsaved indicator
  useEffect(() => {
    if (selectedNode) {
      const hasChanges =
        label !== (selectedNode.data.label || "") ||
        systemPrompt !== (selectedNode.data.systemPrompt || "") ||
        apiEndpoint !== (selectedNode.data.apiEndpoint || "") ||
        selectedModel !== (selectedNode.data.model || "gpt-4o") ||
        JSON.stringify({
          apiMethod,
          apiHeaders,
          apiQueryParams,
          apiBodyTemplate,
          authType,
          authValue,
          authHeader,
          useCorsProxy,
        }) !==
          JSON.stringify({
            apiMethod: selectedNode.data.apiConfig?.method || "GET",
            apiHeaders: selectedNode.data.apiConfig?.headers || {},
            apiQueryParams: selectedNode.data.apiConfig?.queryParams || {},
            apiBodyTemplate: selectedNode.data.apiConfig?.bodyTemplate || "",
            authType: selectedNode.data.apiConfig?.authType || "none",
            authValue: selectedNode.data.apiConfig?.authValue || "",
            authHeader: selectedNode.data.apiConfig?.authHeader || "X-API-Key",
            useCorsProxy: selectedNode.data.apiConfig?.useCorsProxy || false,
          })
      setHasUnsavedChanges(hasChanges)
    }
  }, [
    label,
    systemPrompt,
    apiEndpoint,
    selectedModel,
    apiMethod,
    apiHeaders,
    apiQueryParams,
    apiBodyTemplate,
    authType,
    authValue,
    authHeader,
    useCorsProxy,
    selectedNode,
  ])

  const handleSave = async () => {
    if (!selectedNode || !hasUnsavedChanges) return

    setIsSaving(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 300))

      const apiConfig: APIRequestConfig = {
        method: apiMethod,
        headers: apiHeaders,
        queryParams: apiQueryParams,
        bodyTemplate: apiBodyTemplate,
        authType,
        authValue,
        authHeader,
        useCorsProxy,
      }

      updateNodeData(selectedNode.id, {
        label,
        systemPrompt,
        apiEndpoint,
        model: selectedModel,
        apiConfig,
      })

      setHasUnsavedChanges(false)
      setLastSaved(new Date())

      toast({
        title: "Changes saved",
        description: `Node "${label || selectedNode.type}" has been updated successfully.`,
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTemplateSelect = (templateKey: string) => {
    if (templateKey === "custom") {
      setSelectedTemplate("")
      return
    }

    const template = API_TEMPLATES[templateKey as keyof typeof API_TEMPLATES]
    if (template) {
      setSelectedTemplate(templateKey)
      setApiEndpoint(template.endpoint)
      setApiMethod(template.config.method)
      setApiHeaders(template.config.headers || {})
      setApiQueryParams(template.config.queryParams || {})
      setApiBodyTemplate(template.config.bodyTemplate || "")
      setAuthType(template.config.authType || "none")
      setAuthValue(template.config.authValue || "")
      setAuthHeader(template.config.authHeader || "X-API-Key")
    }
  }

  const addHeader = () => {
    setApiHeaders({ ...apiHeaders, "": "" })
  }

  const updateHeader = (oldKey: string, newKey: string, value: string) => {
    const newHeaders = { ...apiHeaders }
    if (oldKey !== newKey) {
      delete newHeaders[oldKey]
    }
    newHeaders[newKey] = value
    setApiHeaders(newHeaders)
  }

  const removeHeader = (key: string) => {
    const newHeaders = { ...apiHeaders }
    delete newHeaders[key]
    setApiHeaders(newHeaders)
  }

  const addQueryParam = () => {
    setApiQueryParams({ ...apiQueryParams, "": "" })
  }

  const updateQueryParam = (oldKey: string, newKey: string, value: string) => {
    const newParams = { ...apiQueryParams }
    if (oldKey !== newKey) {
      delete newParams[oldKey]
    }
    newParams[newKey] = value
    setApiQueryParams(newParams)
  }

  const removeQueryParam = (key: string) => {
    const newParams = { ...apiQueryParams }
    delete newParams[key]
    setApiQueryParams(newParams)
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
      setSelectedModel(selectedNode.data.model || "gpt-4o")

      const config = selectedNode.data.apiConfig || {}
      setApiMethod(config.method || "GET")
      setApiHeaders(config.headers || {})
      setApiQueryParams(config.queryParams || {})
      setApiBodyTemplate(config.bodyTemplate || "")
      setAuthType(config.authType || "none")
      setAuthValue(config.authValue || "")
      setAuthHeader(config.authHeader || "X-API-Key")
      setUseCorsProxy(config.useCorsProxy || false)

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

  return (
    <div className="h-full w-full border-l bg-background">
      <div className="p-4 h-full flex flex-col">
      <Tabs defaultValue="test" className="h-full flex flex-col">
        <div className="border-b px-4 flex-shrink-0">
          <TabsList className="my-2">
            <TabsTrigger value="test">Test Workflow</TabsTrigger>
            <TabsTrigger value="inspector" className="relative">
              Node Inspector
              {hasUnsavedChanges && <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="test" className="flex-1 p-4 overflow-auto m-0">
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold">Test Workflow</h3>
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

            <div className="space-y-4 flex-1 min-h-0">
              <div className="flex-shrink-0">
                  <Label htmlFor="input">User Input</Label>
                <Textarea
                    id="input"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Enter your input..."
                    className="min-h-[80px]"
                    onFocus={handleInputFocus}
                />
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <Label htmlFor="output" className="flex-shrink-0">
                  Output
                </Label>
                <div
                  id="output"
                  className="flex-1 p-4 border rounded-md overflow-auto whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 min-h-[200px] font-mono text-sm relative group hover:border-gray-400 transition-colors"
                >
                  {output ? (
                    <div className="space-y-2">
                      {(() => {
                        const lines = output.split('\n');
                        const finalResultIndex = lines.findIndex(line => line.startsWith('Final Result:'));
                        
                        if (finalResultIndex === -1) {
                          // No final result found, show all lines
                          return lines.map((line, i) => <div key={i}>{line}</div>);
                        }

                        // Get all content after "Final Result:" as the complete result
                        const finalResult = lines.slice(finalResultIndex)
                          .join('\n')
                          .replace('Final Result:', '')
                          .trim();

                        return (
                          <>
                            {/* Show execution steps */}
                            {lines.slice(0, finalResultIndex).map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
                            
                            {/* Show final result section */}
                            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold text-base text-blue-600 dark:text-blue-400">Final Result</div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-transform"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(finalResult);
                                    toast({
                                      title: "Copied!",
                                      description: "The final result has been copied to your clipboard.",
                                      duration: 1500,
                                    });
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="whitespace-pre-wrap">{finalResult}</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="text-gray-500">
                      Run the workflow to see output here...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inspector" className="flex-1 p-4 overflow-auto m-0">
          {!selectedNode ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Node Inspector</h3>
              <p className="text-sm text-gray-500">Select a node to view and edit its properties</p>
            </div>
          ) : (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Node Inspector</h3>
                  {hasUnsavedChanges && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      Unsaved changes
                    </span>
                  )}
                  {lastSaved && !hasUnsavedChanges && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Saved {formatLastSaved(lastSaved)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handleDelete} title="Delete Node">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4 flex-1 overflow-auto">
                <div>
                  <Label htmlFor="node-label">Label</Label>
                  <Input
                    id="node-label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className={hasUnsavedChanges ? "border-orange-300" : ""}
                  />
                </div>

                {selectedNode.type === "processor" && (
                  <>
                    <div>
                      <Label htmlFor="model-select">AI Model</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className={hasUnsavedChanges ? "border-orange-300" : ""}>
                          <SelectValue placeholder="Select an AI model" />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              <div className="flex flex-col">
                                <span>{model.label}</span>
                                <span className="text-xs text-gray-500">{model.provider}</span>
                              </div>
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
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="You are a helpful assistant..."
                        className={`h-32 resize-none ${hasUnsavedChanges ? "border-orange-300" : ""}`}
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
                        checked={useCorsProxy}
                        onChange={(e) => setUseCorsProxy(e.target.checked)}
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
                      <Select value={apiMethod} onValueChange={(value: any) => setApiMethod(value)}>
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
                      <Select value={authType} onValueChange={(value: any) => setAuthType(value)}>
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

                      {authType !== "none" && (
                        <div className="mt-2 space-y-2">
                          {authType === "apikey" && (
                            <Input
                              placeholder="Header name (e.g., X-API-Key)"
                              value={authHeader}
                              onChange={(e) => setAuthHeader(e.target.value)}
                            />
                          )}
                          <Input
                            type="password"
                            placeholder={authType === "basic" ? "username:password" : "Token/API Key"}
                            value={authValue}
                            onChange={(e) => setAuthValue(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {apiMethod === "GET" && (
                      <div>
                        <div className="flex items-center justify-between">
                          <Label>Query Parameters</Label>
                          <Button size="sm" variant="outline" onClick={addQueryParam}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-2 mt-2">
                          {Object.entries(apiQueryParams).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <Input
                                placeholder="Parameter name"
                                value={key}
                                onChange={(e) => updateQueryParam(key, e.target.value, value)}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Value (use {{input}} for user input)"
                                value={value}
                                onChange={(e) => updateQueryParam(key, key, e.target.value)}
                                className="flex-1"
                              />
                              <Button size="sm" variant="outline" onClick={() => removeQueryParam(key)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {["POST", "PUT", "PATCH"].includes(apiMethod) && (
                      <div>
                        <Label htmlFor="body-template">Request Body Template</Label>
                        <Textarea
                          id="body-template"
                          value={apiBodyTemplate}
                          onChange={(e) => setApiBodyTemplate(e.target.value)}
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
                        {Object.entries(apiHeaders).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <Input
                              placeholder="Header name"
                              value={key}
                              onChange={(e) => updateHeader(key, e.target.value, value)}
                              className="flex-1"
                            />
                            <Input
                              placeholder="Header value"
                              value={value}
                              onChange={(e) => updateHeader(key, key, e.target.value)}
                              className="flex-1"
                            />
                            <Button size="sm" variant="outline" onClick={() => removeHeader(key)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={!hasUnsavedChanges || isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : hasUnsavedChanges ? (
                      "Save Changes"
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Saved
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
