"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Connection,
  type Edge,
  type NodeTypes,
  type ReactFlowInstance,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ArrowLeft, Download, Upload, Bot, Code, Play, Loader2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { InputNode } from "@/components/agent-nodes/input-node"
import { ProcessorNode } from "@/components/agent-nodes/processor-node"
import { OutputNode } from "@/components/agent-nodes/output-node"
import { APINode } from "@/components/agent-nodes/api-node"
import { LeftPanel } from "@/components/agent-builder/left-panel"
import { RightPanel } from "@/components/agent-builder/right-panel"
import Link from "next/link"
import { executeWorkflow } from "@/lib/agents"
import type { AgentGraph, AgentNode as WorkflowAgentNode } from "@/lib/agents"
import type { APIRequestConfig } from "@/lib/api-handler"
import { ExportDialog } from "@/components/agent-builder/export-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { NewWorkflowDialog } from "@/components/agent-builder/new-workflow-dialog"

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
type AuthType = "none" | "bearer" | "apikey" | "basic"

interface AgentNodeData {
  label: string
  systemPrompt?: string
  apiEndpoint?: string
  model?: string
  apiConfig?: APIRequestConfig
  isExecuting?: boolean
  isCompleted?: boolean
  hasError?: boolean
}

type FlowAgentNode = Node<AgentNodeData>
type FlowAgentEdge = Edge

interface Template {
  name: string
  nodes: FlowAgentNode[]
  edges: FlowAgentEdge[]
}

const nodeTypes: NodeTypes = {
  input: InputNode,
  processor: ProcessorNode,
  output: OutputNode,
  api: APINode,
}

const templates: Record<string, Template> = {
  weather: {
    name: "Weather Assistant",
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 100, y: 150 },
        data: {
          label: "Location Query",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "processor-1",
        type: "processor",
        position: { x: 300, y: 100 },
        data: {
          label: "Location Parser",
          systemPrompt:
            "Extract the city name from the user's query. Return only the city name in a clean format (e.g., 'London' or 'New York'). If unclear, ask for clarification.",
          model: "gpt-4o",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "api-1",
        type: "api",
        position: { x: 300, y: 200 },
        data: {
          label: "Weather API",
          apiEndpoint: "https://api.openweathermap.org/data/2.5/weather",
          apiConfig: {
            method: "GET" as HTTPMethod,
            queryParams: {
              q: "{{input}}",
              appid: "YOUR_API_KEY",
              units: "metric",
            },
            authType: "none" as AuthType,
          },
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "processor-2",
        type: "processor",
        position: { x: 500, y: 150 },
        data: {
          label: "Weather Advisor",
          systemPrompt:
            "Based on the weather data provided, give practical recommendations for clothing, activities, and travel considerations. Be specific and actionable.",
          model: "gpt-4o",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "output-1",
        type: "output",
        position: { x: 700, y: 150 },
        data: {
          label: "Weather Report",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "input-1", target: "processor-1", animated: true },
      { id: "e2-3", source: "processor-1", target: "api-1", animated: true },
      { id: "e3-4", source: "api-1", target: "processor-2", animated: true },
      { id: "e4-5", source: "processor-2", target: "output-1", animated: true },
    ],
  },
  research: {
    name: "Research & Humanize",
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 50, y: 200 },
        data: {
          label: "Research Topic",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "processor-1",
        type: "processor",
        position: { x: 250, y: 200 },
        data: {
          label: "Academic Researcher",
          systemPrompt:
            "You are a meticulous academic researcher with expertise in analyzing complex topics. Approach this research with the thoroughness of a scholarly investigation, while writing in a clear, authoritative voice. Examine the topic's theoretical foundations, empirical evidence, and current scholarly discourse. Consider multiple academic perspectives and evaluate their methodological strengths. Integrate relevant theories and frameworks naturally into your analysis. Your writing should demonstrate deep academic understanding while remaining accessible. Rather than using obvious structural markers, develop your analysis through well-reasoned arguments and evidence-based discussion. Include relevant citations and scholarly sources where appropriate, formatted in an academic style. Maintain the intellectual rigor of academic writing while ensuring your prose flows naturally.",
          model: "gpt-4o",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "processor-2",
        type: "processor",
        position: { x: 450, y: 200 },
        data: {
          label: "Research Synthesizer",
          systemPrompt:
            "You are an experienced academic writer skilled at synthesizing complex research into cohesive scholarly work. Transform the research analysis into a well-reasoned academic discourse that would be suitable for a high-level university submission. Develop clear theoretical arguments while maintaining sophisticated academic language. Integrate supporting evidence and citations seamlessly into your discussion. Create logical progression of ideas without relying on obvious structural markers. Your synthesis should demonstrate scholarly depth while engaging the reader through natural academic discourse. Ensure proper integration of academic sources and maintain consistent scholarly tone throughout. Focus on creating a compelling academic narrative that builds its arguments methodically while avoiding formulaic writing patterns.",
          model: "gpt-4o",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "processor-3",
        type: "processor",
        position: { x: 650, y: 200 },
        data: {
          label: "Professional Editor",
          systemPrompt:
            "You are a skilled academic editor who specializes in refining scholarly work while maintaining its authenticity. Polish this research into a submission-ready academic paper that demonstrates both scholarly rigor and writing fluency. Maintain sophisticated academic language while ensuring natural flow and readability. Vary your sentence structures and paragraph lengths organically while preserving academic tone. Integrate technical terminology appropriately without becoming overly jargon-heavy. Ensure proper academic citation style and scholarly conventions are followed. Create smooth transitions between ideas that feel natural rather than formulaic. Your editing should enhance the work's academic credibility while making it engaging and professional. The final text should read like a well-crafted academic paper written by a knowledgeable scholar, avoiding any patterns that might suggest AI generation while maintaining the high standards expected in academic submissions.",
          model: "gpt-4o",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "output-1",
        type: "output",
        position: { x: 850, y: 200 },
        data: {
          label: "Final Academic Paper",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "input-1", target: "processor-1", animated: true },
      { id: "e2-3", source: "processor-1", target: "processor-2", animated: true },
      { id: "e3-4", source: "processor-2", target: "processor-3", animated: true },
      { id: "e4-5", source: "processor-3", target: "output-1", animated: true },
    ],
  },
  content: {
    name: "Content Creator",
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 50, y: 200 },
        data: {
          label: "Content Topic",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "api-1",
        type: "api",
        position: { x: 200, y: 150 },
        data: {
          label: "Inspiration API",
          apiEndpoint: "https://api.quotable.io/random",
          apiConfig: {
            method: "GET",
            authType: "none",
          },
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "processor-1",
        type: "processor",
        position: { x: 200, y: 250 },
        data: {
          label: "Content Writer",
          systemPrompt:
            "Create engaging, well-structured content based on the topic and any inspirational content provided. Include compelling headlines and clear structure.",
          model: "gpt-4o",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "output-1",
        type: "output",
        position: { x: 400, y: 200 },
        data: {
          label: "Final Content",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "input-1", target: "api-1", animated: true },
      { id: "e1-3", source: "input-1", target: "processor-1", animated: true },
      { id: "e2-3", source: "api-1", target: "processor-1", animated: true },
      { id: "e3-4", source: "processor-1", target: "output-1", animated: true },
    ],
  },
  data: {
    name: "Geographic Data Analyzer",
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 50, y: 200 },
        data: {
          label: "Country Query",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "api-1",
        type: "api",
        position: { x: 200, y: 150 },
        data: {
          label: "Countries API",
          apiEndpoint: "https://restcountries.com/v3.1/name/{{input}}",
          apiConfig: {
            method: "GET",
            authType: "none",
          },
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "processor-1",
        type: "processor",
        position: { x: 400, y: 200 },
        data: {
          label: "Data Analyst",
          systemPrompt:
            "Analyze country information and create insights about demographics, economy, and interesting facts. Provide actionable insights and comparisons.",
          model: "gpt-4o",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "output-1",
        type: "output",
        position: { x: 600, y: 200 },
        data: {
          label: "Analysis Report",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "input-1", target: "api-1", animated: true },
      { id: "e2-3", source: "api-1", target: "processor-1", animated: true },
      { id: "e3-4", source: "processor-1", target: "output-1", animated: true },
    ],
  },
}

const getTemplateWorkflow = (templateName: string): Template | null => {
  return templates[templateName as keyof typeof templates] || null
}

export default function BuilderPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<AgentNodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<FlowAgentNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<FlowAgentEdge | null>(null)
  const [workflowName, setWorkflowName] = useState("New Workflow")
  const [isRunning, setIsRunning] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [output, setOutput] = useState("")
  const [leftPanelWidth, setLeftPanelWidth] = useState(300)
  const [rightPanelWidth, setRightPanelWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)
  const [templateLoaded, setTemplateLoaded] = useState(false)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [instance, setInstance] = useState<ReactFlowInstance | null>(null)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isNewWorkflowDialogOpen, setIsNewWorkflowDialogOpen] = useState(false)
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // Track changes
  useEffect(() => {
    if (templateLoaded) {
      const currentState = { nodes, edges, workflowName }
      const savedState = currentWorkflowId ? JSON.parse(localStorage.getItem("greyflow_workflows") || "{}")?.[currentWorkflowId] : null
      
      const hasChanges = savedState ? (
        JSON.stringify({ nodes: savedState.nodes, edges: savedState.edges, workflowName: savedState.name }) !==
        JSON.stringify(currentState)
      ) : nodes.length > 0 || edges.length > 0

      setHasUnsavedChanges(hasChanges)
    }
  }, [nodes, edges, workflowName, currentWorkflowId, templateLoaded])

  // Handle navigation/closing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Handle internal navigation
  const handleNavigation = (href: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(href)
      setIsUnsavedDialogOpen(true)
    } else {
      window.location.href = href
    }
  }

  const createNewWorkflow = useCallback((name: string) => {
    const newNode = {
      id: `input-${Date.now()}`,
      type: "input",
      position: { x: 250, y: 200 },
      data: {
        label: "Input",
        isExecuting: false,
        isCompleted: false,
        hasError: false,
      },
    }
    setNodes([newNode])
    setEdges([])
    setWorkflowName(name)
    setTemplateLoaded(true)
    toast({
      title: "Workflow created",
      description: `Created new workflow: ${name}`,
    })
  }, [setNodes, setEdges, toast])

  // Load workflow data on component mount
  useEffect(() => {
    const template = searchParams.get("template")
    const isNew = searchParams.get("new") === "true"
    const loadId = searchParams.get("load")

    if (isNew && !templateLoaded) {
      setIsNewWorkflowDialogOpen(true)
      return
    }

    if (loadId && !templateLoaded) {
      try {
        const workflowsStr = localStorage.getItem("greyflow_workflows")
        if (workflowsStr) {
          const workflows = JSON.parse(workflowsStr)
          const workflow = workflows[loadId]
          if (workflow) {
            setWorkflowName(workflow.name)
            setNodes(workflow.nodes)
            setEdges(workflow.edges)
            setCurrentWorkflowId(loadId)
            setTemplateLoaded(true)
            toast({
              title: "Workflow loaded",
              description: `${workflow.name} has been loaded successfully.`,
            })
            return
          }
        }
        toast({
          title: "Workflow not found",
          description: "The requested workflow could not be found.",
          variant: "destructive",
        })
      } catch (error) {
        console.error("Failed to load workflow:", error)
        toast({
          title: "Load failed",
          description: "Failed to load workflow. Please try again.",
          variant: "destructive",
        })
      }
      return
    }

    if (template && !templateLoaded) {
      const workflow = getTemplateWorkflow(template)
      if (workflow) {
        setWorkflowName(workflow.name)
        setNodes(workflow.nodes)
        setEdges(workflow.edges)
        setTemplateLoaded(true)
        toast({
          title: "Template loaded",
          description: `${workflow.name} template has been loaded successfully.`,
        })
      } else {
        toast({
          title: "Template not found",
          description: "The requested template could not be found.",
          variant: "destructive",
        })
      }
    }
  }, [searchParams, templateLoaded, setNodes, setEdges, toast])

  const saveWorkflow = useCallback(() => {
    try {
      const workflow = {
        name: workflowName,
        nodes,
        edges,
        version: "1.0",
        format: "GreyFlow",
        lastSaved: new Date().toISOString(),
      }

      // Generate a new ID if this is a new workflow
      const workflowId = currentWorkflowId || `workflow-${Date.now()}`
      
      // Save to workflows storage
      const existingWorkflows = JSON.parse(localStorage.getItem("greyflow_workflows") || "{}")
      existingWorkflows[workflowId] = workflow
      localStorage.setItem("greyflow_workflows", JSON.stringify(existingWorkflows))
      
      // Update current workflow ID and reset changes flag
      setCurrentWorkflowId(workflowId)
      setHasUnsavedChanges(false)

      toast({
        title: "Workflow saved",
        description: "Your workflow has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save workflow. Please try again.",
        variant: "destructive",
      })
    }
  }, [workflowName, nodes, edges, currentWorkflowId, toast])

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  )

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setInstance(instance)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      const type = event.dataTransfer.getData("application/reactflow") as string

      if (reactFlowBounds && instance) {
        const position = instance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        })

        const newNode: FlowAgentNode = {
          id: `${type}-${Date.now()}`,
          type,
          position,
          data: {
            label: `New ${type} node`,
            isExecuting: false,
            isCompleted: false,
            hasError: false,
            apiConfig: type === "api" ? {
              method: "GET" as HTTPMethod,
              authType: "none" as AuthType,
            } : undefined,
          },
        }

        setNodes((nds) => [...nds, newNode])
      }
    },
    [setNodes, instance]
  )

  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      event.stopPropagation()
      setSelectedNode(node as FlowAgentNode)
      if (isMobile) {
        setRightPanelOpen(true)
        setLeftPanelOpen(false)
      }
    },
    [isMobile]
  )

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (event, edge) => {
      event.stopPropagation()
      setSelectedEdge(edge)
      setSelectedNode(null)
    },
    []
  )

  const addNewNode = useCallback(
    (type: string) => {
      const newNode: FlowAgentNode = {
        id: `${type}-${Date.now()}`,
        type,
        position: { x: 250, y: 100 },
        data: {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          systemPrompt: type === "processor" ? "You are a helpful assistant." : undefined,
          apiEndpoint: type === "api" ? "" : undefined,
          model: type === "processor" ? "gpt-4o" : undefined,
          apiConfig: type === "api" ? {
            method: "GET" as HTTPMethod,
            authType: "none" as AuthType,
          } : undefined,
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  const deleteNode = useCallback(
    (nodeId: string) => {
      // Remove the node
      setNodes((nds) => nds.filter((node) => node.id !== nodeId))

      // Remove all edges connected to this node
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))

      // Clear selection if the deleted node was selected
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null)
      }

      toast({
        title: "Node deleted",
        description: "The agent and its connections have been removed from the workflow.",
      })
    },
    [setNodes, setEdges, selectedNode, toast],
  )

  const deleteEdge = useCallback(
    (edgeId: string) => {
      // Remove the edge
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId))

      // Clear selection if the deleted edge was selected
      if (selectedEdge?.id === edgeId) {
        setSelectedEdge(null)
      }

      toast({
        title: "Connection removed",
        description: "The connection between agents has been removed.",
      })
    },
    [setEdges, selectedEdge, toast],
  )

  const updateNodeData = useCallback(
    (nodeId: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            }
          }
          return node
        }),
      )
    },
    [setNodes],
  )

  const updateNodeStatus = useCallback(
    (nodeId: string, status: "executing" | "completed" | "error") => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                isExecuting: status === "executing",
                isCompleted: status === "completed",
                hasError: status === "error",
              },
            }
          }
          return node
        }),
      )
    },
    [setNodes],
  )

  const resetNodeStatuses = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      })),
    )
  }, [setNodes])

  const exportWorkflow = useCallback((name: string) => {
    try {
      const workflow = {
        name: name,
        nodes,
        edges,
        version: "1.0",
        format: "GreyFlow",
        exportedAt: new Date().toISOString(),
      }
      const dataStr = JSON.stringify(workflow, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.gre`
      link.click()
      URL.revokeObjectURL(url)
      toast({
        title: "Workflow exported",
        description: "Your workflow has been downloaded as a .gre file.",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export workflow. Please try again.",
        variant: "destructive",
      })
    }
  }, [nodes, edges, toast])

  const handleRunWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      toast({
        title: "No agents defined",
        description: "Please add at least one agent to your workflow.",
        variant: "destructive",
      })
      return
    }

    if (!userInput.trim()) {
      toast({
        title: "No input provided",
        description: "Please enter some input to test your workflow.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsRunning(true)
      setOutput("")

      const workflowData: AgentGraph = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type || 'processor',
          systemPrompt: node.data.systemPrompt,
          apiEndpoint: node.data.apiEndpoint,
          model: node.data.model,
          label: node.data.label,
          apiConfig: node.data.apiConfig ? {
            ...node.data.apiConfig,
            method: (node.data.apiConfig.method || 'GET') as HTTPMethod,
            authType: (node.data.apiConfig.authType || 'none') as AuthType,
          } : undefined,
        })),
        edges: edges.map(edge => ({
          source: edge.source,
          target: edge.target,
        }))
      }

      const result = await executeWorkflow(
        workflowData,
        userInput,
        (step: string) => {
          setOutput(prev => prev + step + "\n")
        },
        (nodeId: string, status: "executing" | "completed" | "error") => {
          setNodes(nds => 
            nds.map(n => 
              n.id === nodeId 
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      isExecuting: status === "executing",
                      isCompleted: status === "completed",
                      hasError: status === "error"
                    }
                  }
                : n
            )
          )
        }
      )
      
      setOutput(prev => prev + "\nFinal Result: " + result)
    } catch (error) {
      console.error('Workflow execution failed:', error)
      toast({
        title: "Execution failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }, [nodes, edges, userInput, toast, setNodes])

  const handleLeftResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)

      const startX = e.clientX
      const startWidth = leftPanelWidth

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = Math.max(200, Math.min(500, startWidth + (e.clientX - startX)))
        setLeftPanelWidth(newWidth)
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [leftPanelWidth],
  )

  const handleRightResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)

      const startX = e.clientX
      const startWidth = rightPanelWidth

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = Math.max(300, Math.min(600, startWidth - (e.clientX - startX)))
        setRightPanelWidth(newWidth)
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [rightPanelWidth],
  )

  // Check if we're on a mobile device and set initial panel states
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768
      setIsMobile(isMobileView)
      if (isMobileView) {
        // On mobile, ensure only one panel is open at most
        if (leftPanelOpen && rightPanelOpen) {
          setRightPanelOpen(false)
        }
      } else {
        // On desktop, right panel is open by default
        setRightPanelOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [leftPanelOpen, rightPanelOpen])

  // Handle mobile touch events
  useEffect(() => {
    if (isMobile) {
      const handleTouchMove = (e: TouchEvent) => {
        if (rightPanelOpen) {
          e.preventDefault()
        }
      }
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      return () => document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [isMobile, rightPanelOpen])

  // Suppress ResizeObserver errors
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      if (
        e.message.includes("ResizeObserver loop completed with undelivered notifications") ||
        e.message.includes("ResizeObserver loop limit exceeded")
      ) {
        e.stopImmediatePropagation()
        e.preventDefault()
        return false
      }
    }

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      if (e.reason?.message?.includes("ResizeObserver")) {
        e.preventDefault()
        return false
      }
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    // Also suppress console errors
    const originalError = console.error
    console.error = (...args) => {
      if (args[0]?.toString().includes("ResizeObserver")) {
        return
      }
      originalError.apply(console, args)
    }

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      console.error = originalError
    }
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete selected node with Delete key only (not Backspace)
      if (event.key === "Delete" && selectedNode) {
        event.preventDefault()
        deleteNode(selectedNode.id)
      }
      // Delete selected edge with Delete key
      if (event.key === "Delete" && selectedEdge) {
        event.preventDefault()
        deleteEdge(selectedEdge.id)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedNode, selectedEdge, deleteNode, deleteEdge])

  // Panel toggle functions
  const toggleLeftPanel = useCallback(() => {
    if (isMobile && !leftPanelOpen && rightPanelOpen) {
      setRightPanelOpen(false)
    }
    setLeftPanelOpen(prev => !prev)
  }, [isMobile, leftPanelOpen, rightPanelOpen])

  const toggleRightPanel = useCallback(() => {
    if (isMobile && !rightPanelOpen && leftPanelOpen) {
      setLeftPanelOpen(false)
    }
    setRightPanelOpen(prev => !prev)
  }, [isMobile, rightPanelOpen, leftPanelOpen])

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleNavigation("/")}
              className="flex items-center gap-2 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            {!isMobile && (
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="h-8 w-[200px]"
                placeholder="Workflow Name"
              />
            )}
          </div>
          {isMobile && (
            <div className="flex items-center gap-2">
              <Button 
                variant={leftPanelOpen ? "secondary" : "ghost"} 
                size="icon" 
                onClick={toggleLeftPanel}
                className="relative"
              >
                {leftPanelOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" />
                )}
              </Button>
              <Button 
                variant={rightPanelOpen ? "secondary" : "ghost"} 
                size="icon" 
                onClick={toggleRightPanel}
                className="relative"
              >
                {rightPanelOpen ? (
                  <PanelRightClose className="h-5 w-5" />
                ) : (
                  <PanelRightOpen className="h-5 w-5" />
                )}
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={saveWorkflow}
                disabled={!hasUnsavedChanges}
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {hasUnsavedChanges ? "Save*" : "Save"}
                </span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setIsExportDialogOpen(true)}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={handleRunWorkflow}
                disabled={isRunning}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Run</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${
            leftPanelOpen ? 'w-64' : 'w-0'
          } flex-shrink-0 transition-all duration-300 relative md:static ${
            isMobile && leftPanelOpen ? 'absolute z-50 h-[calc(100vh-3.5rem)]' : ''
          }`}
        >
          {leftPanelOpen && (
            <LeftPanel
              onAddNode={addNewNode}
              nodes={nodes}
              edges={edges}
            />
          )}
        </div>

        <div className="flex-1 relative">
          <div className="h-full w-full" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onInit={onInit}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              fitView
              className="touch-none"
              snapToGrid={true}
              snapGrid={[15, 15]}
              minZoom={0.1}
              maxZoom={4}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            >
              <Background gap={15} size={1} />
              <Controls 
                className="bottom-4 right-4" 
                showInteractive={false}
                showZoom={true}
                showFitView={true}
                fitViewOptions={{ padding: 0.2 }}
              />
            </ReactFlow>
          </div>
        </div>

        <div
          className={`${
            rightPanelOpen ? 'w-80' : 'w-0'
          } flex-shrink-0 transition-all duration-300 relative md:static ${
            isMobile && rightPanelOpen ? 'absolute right-0 z-50 h-[calc(100vh-3.5rem)]' : ''
          }`}
        >
          {rightPanelOpen && (
            <RightPanel
              selectedNode={selectedNode}
              updateNodeData={updateNodeData}
              setSelectedNode={setSelectedNode}
              userInput={userInput}
              setUserInput={setUserInput}
              output={output}
              isRunning={isRunning}
              onRunWorkflow={handleRunWorkflow}
              onDeleteNode={deleteNode}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
      <NewWorkflowDialog
        isOpen={isNewWorkflowDialogOpen}
        onClose={() => {
          setIsNewWorkflowDialogOpen(false)
          // Only redirect to home if the user explicitly cancels and no workflow is loaded
          if (!templateLoaded && !nodes.length) {
            window.location.href = "/"
          }
        }}
        onConfirm={createNewWorkflow}
      />
      <Dialog open={isUnsavedDialogOpen} onOpenChange={setIsUnsavedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Do you want to save them before leaving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsUnsavedDialogOpen(false)
                if (pendingNavigation) {
                  window.location.href = pendingNavigation
                }
              }}
            >
              Don't Save
            </Button>
            <Button
              onClick={() => {
                saveWorkflow()
                setIsUnsavedDialogOpen(false)
                if (pendingNavigation) {
                  window.location.href = pendingNavigation
                }
              }}
            >
              Save & Leave
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsUnsavedDialogOpen(false)
                setPendingNavigation(null)
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={exportWorkflow}
        defaultName={workflowName}
      />
    </div>
  )
}