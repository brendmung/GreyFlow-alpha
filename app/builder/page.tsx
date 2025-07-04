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
import {
  Save,
  ArrowLeft,
  Download,
  Play,
  Square,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { InputNode } from "@/components/agent-nodes/input-node"
import { ProcessorNode } from "@/components/agent-nodes/processor-node"
import { OutputNode } from "@/components/agent-nodes/output-node"
import { APINode } from "@/components/agent-nodes/api-node"
import { PDFNode } from "@/components/agent-nodes/pdf-node"
import { LeftPanel } from "@/components/agent-builder/left-panel"
import { RightPanel } from "@/components/agent-builder/right-panel"
import { executeWorkflow } from "@/lib/agents"
import type { AgentGraph } from "@/lib/agents"
import type { APIRequestConfig } from "@/lib/api-handler"
import { ExportDialog } from "@/components/agent-builder/export-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { NewWorkflowDialog } from "@/components/agent-builder/new-workflow-dialog"
import { Textarea } from "@/components/ui/textarea"
import { WordNode } from "@/components/agent-nodes/word-node"

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
type AuthType = "none" | "bearer" | "apikey" | "basic"

interface AgentNodeData {
  label: string
  systemPrompt?: string
  apiEndpoint?: string
  model?: string
  prompt?: string
  apiConfig?: APIRequestConfig
  pdfConfig?: {
    filename?: string
    documentType?: "general" | "cv" | "research" | "report" | "letter" | "custom"
  }
  wordConfig?: {
    filename?: string
    documentType?: "general" | "cv" | "research" | "report" | "letter" | "custom"
  }
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
  pdf: PDFNode,
  word: WordNode,
}

const templates: Record<string, Template> = {
  cv: {
    name: "CV/Resume Builder",
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 100, y: 150 },
        data: {
          label: "Basic Information",
          prompt: "Let's start building your CV! Please provide your name and current job title or field.",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "processor-1",
        type: "processor",
        position: { x: 300, y: 150 },
        data: {
          label: "Smart CV Assistant",
          systemPrompt: `You are a friendly and intelligent CV assistant. Your goal is to help users create a professional CV through a conversational process.

CURRENT STATE TRACKING:
You must maintain the current state of information gathering by analyzing the entire conversation history.
Store all provided information and track the current section being discussed.
DO NOT move to the next section until the current section is complete and satisfactory.

INTERACTION RULES:
1. Focus on ONE section at a time until it's complete
2. If the information for the current section is incomplete or unclear, ask follow-up questions
3. Only move to the next section when current section is fully satisfied
4. Use the user's name when provided
5. Acknowledge received information and explain why you need more details if necessary

INFORMATION GATHERING SEQUENCE:
1. Basic Info (name, title) - Already provided in first input
2. Contact Info (email, phone, location)
3. Professional Summary (brief overview of career)
4. Most Recent Role (detailed information)
5. Additional Experience (previous roles)
6. Education (degrees, certifications)
7. Key Skills (technical and soft skills)
8. Optional Sections (projects, languages, etc.)

SECTION COMPLETION CRITERIA:
Contact Info:
- Must have email AND phone
- Location is required
- Format: Verify email format is valid

Professional Summary:
- Must be 2-3 sentences
- Should mention years of experience
- Should highlight key expertise
- Should indicate career focus

Most Recent Role:
- Must have company name
- Must have job title
- Must have start date
- Must have responsibilities (at least 3)
- Must have achievements (at least 1)

Additional Experience:
- At least one previous role
- Same criteria as recent role
- Brief but complete descriptions

Education:
- Highest degree must be specified
- Institution name required
- Year of completion required
- Relevant coursework (if recent graduate)

Key Skills:
- Must have at least 5 skills
- Mix of technical and soft skills
- Group similar skills together

RESPONSE FORMAT:
For incomplete sections:
"MISSING_INFO: [Conversational request for specific missing details about CURRENT section]"

Examples of follow-up questions:
- "MISSING_INFO: I see you're in New York, John. Could you provide your email and phone number to complete your contact information?"
- "MISSING_INFO: Thanks for sharing your role at Google. Could you add 2-3 specific achievements? For example: 'Increased server response time by 40%' or 'Led a team of 5 developers'"

When section is complete:
"SECTION_COMPLETE: [Current section] is complete. [Next request]"
Example: "SECTION_COMPLETE: Contact information is complete. Now, I'd love to hear about your professional journey. Could you provide a brief summary of your career, highlighting your years of experience and key expertise?"

When all information is complete:
"COMPLETE: [Full structured CV data]"

IMPORTANT:
- Stay focused on current section until complete
- Explain why you need more information
- Provide specific examples in follow-up questions
- Keep track of all previously provided information
- Don't move to next section until current is perfect`,
          model: "gpt-4o",
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
          label: "CV Formatter",
          systemPrompt: `You are a professional CV/Resume formatter. Your task is to:
1. Take the structured CV data
2. Format it into a professional, well-organized CV
3. Use clear section headings and proper spacing
4. Highlight key achievements and skills
5. Ensure all dates and details are properly formatted
6. Create a clean, professional layout suitable for PDF conversion

FORMATTING RULES:
- Start with name and contact info prominently displayed
- Create clear section headings
- Use bullet points for experience and achievements
- Highlight key skills and qualifications
- Maintain consistent formatting throughout
- Use active voice and impactful action verbs
- Optimize spacing and layout

Return the formatted CV content ready for PDF conversion.`,
          model: "gpt-4o",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "pdf-1",
        type: "pdf",
        position: { x: 700, y: 150 },
        data: {
          label: "PDF Generator",
          pdfConfig: {
            documentType: "cv",
            filename: "professional_cv.pdf",
          },
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "input-1", target: "processor-1", animated: true },
      { id: "e2-3", source: "processor-1", target: "processor-2", animated: true },
      { id: "e3-4", source: "processor-2", target: "pdf-1", animated: true },
    ],
  },
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
        position: { x: 100, y: 200 },
        data: {
          label: "Content Brief",
          prompt: "Describe what content you need (topic, target audience, purpose, length, tone, etc.)",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "processor-1",
        type: "processor",
        position: { x: 300, y: 200 },
        data: {
          label: "Content Strategist",
          systemPrompt: `You are an expert content strategist who helps plan effective content. Your job is to:

1. Analyze the content brief provided by the user
2. Create a detailed content outline with clear sections
3. Suggest key points to cover in each section
4. Recommend tone, style, and approach based on target audience
5. Provide research suggestions and potential sources
6. Suggest headline options and SEO keywords

FORMAT YOUR RESPONSE:
- Start with a brief analysis of the content brief
- Provide 3-5 headline options
- Create a structured outline with main sections and subsections
- For each section, include 3-5 key points to cover
- Suggest tone, style, and content approach
- Recommend SEO keywords and phrases to include
- End with any additional strategic recommendations

Be specific, actionable, and focused on creating high-quality content that meets the user's goals.`,
          model: "gpt-4o",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "processor-2",
        type: "processor",
        position: { x: 500, y: 200 },
        data: {
          label: "Content Writer",
          systemPrompt: `You are a skilled content writer who creates engaging, well-structured content. Your task is to:

1. Use the content strategy and outline provided
2. Write complete, polished content following the outline
3. Maintain a consistent tone and style throughout
4. Include engaging headlines, subheadings, and transitions
5. Incorporate suggested keywords naturally
6. Create content that is both informative and engaging

WRITING GUIDELINES:
- Start with a compelling introduction that hooks the reader
- Follow the outline structure but feel free to improve it
- Use clear, concise language appropriate for the target audience
- Include relevant examples, data points, or stories to illustrate key points
- Create smooth transitions between sections
- End with a strong conclusion and call-to-action if appropriate
- Naturally incorporate SEO keywords without keyword stuffing

Write complete, publication-ready content that fulfills the brief and follows the strategy.`,
          model: "gpt-4o",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "processor-3",
        type: "processor",
        position: { x: 700, y: 200 },
        data: {
          label: "Content Editor",
          systemPrompt: `You are a meticulous content editor who polishes and perfects written content. Your job is to:

1. Review the content for clarity, coherence, and impact
2. Improve sentence structure and word choice
3. Ensure consistent tone and style
4. Check for logical flow and organization
5. Enhance readability and engagement
6. Optimize for SEO without sacrificing quality
7. Fix any grammar, spelling, or punctuation errors

EDITING APPROACH:
- Preserve the writer's voice while enhancing clarity
- Vary sentence structure for better rhythm and flow
- Replace weak or generic words with more precise, impactful alternatives
- Ensure transitions between paragraphs and sections are smooth
- Check that the content fulfills the original brief
- Format the content appropriately with proper headings, lists, etc.
- Add or enhance calls-to-action if appropriate

Return the fully edited, publication-ready content.`,
          model: "gpt-4o",
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      },
      {
        id: "output-1",
        type: "output",
        position: { x: 900, y: 200 },
        data: {
          label: "Final Content",
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
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)
  const [infoRequest, setInfoRequest] = useState("")
  const [infoResolver, setInfoResolver] = useState<((value: string) => void) | null>(null)
  const [isInputDialogOpen, setIsInputDialogOpen] = useState(false)
  const [inputPrompt, setInputPrompt] = useState("")
  const [inputResolver, setInputResolver] = useState<((value: string) => void) | null>(null)
  const [currentInput, setCurrentInput] = useState("")
  const [workflowAbortController, setWorkflowAbortController] = useState<AbortController | null>(null)

  // Track changes
  useEffect(() => {
    if (templateLoaded) {
      const currentState = { nodes, edges, workflowName }
      const savedState = currentWorkflowId
        ? JSON.parse(localStorage.getItem("greyflow_workflows") || "{}")?.[currentWorkflowId]
        : null

      const hasChanges = savedState
        ? JSON.stringify({ nodes: savedState.nodes, edges: savedState.edges, workflowName: savedState.name }) !==
          JSON.stringify(currentState)
        : nodes.length > 0 || edges.length > 0

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

  // Stop workflow execution
  const stopWorkflow = useCallback(() => {
    if (workflowAbortController) {
      workflowAbortController.abort()
      setWorkflowAbortController(null)
    }

    // Close any open dialogs
    setIsInfoDialogOpen(false)
    setIsInputDialogOpen(false)

    // Clear resolvers to prevent hanging promises
    if (infoResolver) {
      infoResolver("")
      setInfoResolver(null)
    }
    if (inputResolver) {
      inputResolver("")
      setInputResolver(null)
    }

    // Reset execution state
    setIsRunning(false)
    resetNodeStatuses()

    toast({
      title: "Workflow stopped",
      description: "The workflow execution has been cancelled.",
      variant: "destructive",
    })
  }, [workflowAbortController, infoResolver, inputResolver, toast])

  const createNewWorkflow = useCallback(
    (name: string) => {
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
      setIsNewWorkflowDialogOpen(false)
      toast({
        title: "Workflow created",
        description: `Created new workflow: ${name}`,
      })
    },
    [setNodes, setEdges, toast],
  )

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
            apiConfig:
              type === "api"
                ? {
                    method: "GET" as HTTPMethod,
                    authType: "none" as AuthType,
                  }
                : undefined,
          },
        }

        setNodes((nds) => [...nds, newNode])
      }
    },
    [setNodes, instance],
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
    [isMobile],
  )

  const handleEdgeClick: EdgeMouseHandler = useCallback((event, edge) => {
    event.stopPropagation()
    setSelectedEdge(edge)
    setSelectedNode(null)
  }, [])

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
          apiConfig:
            type === "api"
              ? {
                  method: "GET" as HTTPMethod,
                  authType: "none" as AuthType,
                }
              : undefined,
          isExecuting: false,
          isCompleted: false,
          hasError: false,
        },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [setNodes],
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

  const exportWorkflow = useCallback(
    (name: string) => {
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
    },
    [nodes, edges, toast],
  )

  const handleRunWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      toast({
        title: "No agents defined",
        description: "Please add at least one agent to your workflow.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsRunning(true)
      setOutput("")

      // Create abort controller for this workflow execution
      const abortController = new AbortController()
      setWorkflowAbortController(abortController)

      const workflowData: AgentGraph = {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type || "processor",
          systemPrompt: node.data.systemPrompt,
          apiEndpoint: node.data.apiEndpoint,
          model: node.data.model,
          label: node.data.label,
          prompt: node.data.prompt,
          pdfConfig: node.data.pdfConfig,
          apiConfig: node.data.apiConfig
            ? {
                ...node.data.apiConfig,
                method: (node.data.apiConfig.method || "GET") as HTTPMethod,
                authType: (node.data.apiConfig.authType || "none") as AuthType,
              }
            : undefined,
          wordConfig: node.data.wordConfig,
        })),
        edges: edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
        })),
      }

      const handleNeedInput = async (prompt: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          // Check if workflow was cancelled
          if (abortController.signal.aborted) {
            reject(new Error("Workflow cancelled"))
            return
          }

          setInputPrompt(prompt)
          setCurrentInput("") // Clear previous input
          setInputResolver(() => (value: string) => {
            if (abortController.signal.aborted) {
              reject(new Error("Workflow cancelled"))
            } else {
              resolve(value)
            }
          })
          setIsInputDialogOpen(true)
        })
      }

      const handleNeedMoreInfo = async (request: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          // Check if workflow was cancelled
          if (abortController.signal.aborted) {
            reject(new Error("Workflow cancelled"))
            return
          }

          setInfoRequest(request)
          setUserInput("") // Clear previous input
          setInfoResolver(() => (value: string) => {
            if (abortController.signal.aborted) {
              reject(new Error("Workflow cancelled"))
            } else {
              resolve(value)
            }
          })
          setIsInfoDialogOpen(true)
        })
      }

      const result = await executeWorkflow(
        workflowData,
        "", // Start with empty input, let input agents request it
        (step: string) => {
          setOutput((prev) => prev + step + "\n")
        },
        (nodeId: string, status: "executing" | "completed" | "error") => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      isExecuting: status === "executing",
                      isCompleted: status === "completed",
                      hasError: status === "error",
                    },
                  }
                : n,
            ),
          )
        },
        handleNeedMoreInfo,
        handleNeedInput,
      )

      if (!abortController.signal.aborted) {
        setOutput((prev) => prev + "\nFinal Result: " + result)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      if (errorMessage !== "Workflow cancelled") {
        toast({
          title: "Workflow execution failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsRunning(false)
      setWorkflowAbortController(null)
    }
  }, [nodes, edges, setNodes, toast])

  const handleInfoSubmit = useCallback(
    (additionalInfo: string) => {
      if (infoResolver) {
        infoResolver(additionalInfo)
        setInfoResolver(null)
        setIsInfoDialogOpen(false)
        setInfoRequest("")
        setUserInput("") // Clear after submission
      }
    },
    [infoResolver],
  )

  const handleInputSubmit = useCallback(
    (input: string) => {
      if (inputResolver) {
        inputResolver(input)
        setInputResolver(null)
        setIsInputDialogOpen(false)
        setCurrentInput("") // Clear after submission
        setInputPrompt("")
      }
    },
    [inputResolver],
  )

  // Handle dialog cancellation
  const handleInfoCancel = useCallback(() => {
    if (infoResolver) {
      infoResolver("")
      setInfoResolver(null)
    }
    setIsInfoDialogOpen(false)
    setInfoRequest("")
    setUserInput("") // Clear on cancel
    stopWorkflow()
  }, [infoResolver, stopWorkflow])

  const handleInputCancel = useCallback(() => {
    if (inputResolver) {
      inputResolver("")
      setInputResolver(null)
    }
    setIsInputDialogOpen(false)
    setCurrentInput("") // Clear on cancel
    setInputPrompt("")
    stopWorkflow()
  }, [inputResolver, stopWorkflow])

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
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [leftPanelOpen, rightPanelOpen])

  // Handle mobile touch events
  useEffect(() => {
    if (isMobile) {
      const handleTouchMove = (e: TouchEvent) => {
        if (rightPanelOpen) {
          e.preventDefault()
        }
      }
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      return () => document.removeEventListener("touchmove", handleTouchMove)
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
      // Stop workflow with Escape key
      if (event.key === "Escape" && isRunning) {
        event.preventDefault()
        stopWorkflow()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedNode, selectedEdge, deleteNode, deleteEdge, isRunning, stopWorkflow])

  // Panel toggle functions
  const toggleLeftPanel = useCallback(() => {
    if (isMobile && !leftPanelOpen && rightPanelOpen) {
      setRightPanelOpen(false)
    }
    setLeftPanelOpen((prev) => !prev)
  }, [isMobile, leftPanelOpen, rightPanelOpen])

  const toggleRightPanel = useCallback(() => {
    if (isMobile && !rightPanelOpen && leftPanelOpen) {
      setLeftPanelOpen(false)
    }
    setRightPanelOpen((prev) => !prev)
  }, [isMobile, rightPanelOpen, leftPanelOpen])

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <button onClick={() => handleNavigation("/")} className="flex items-center gap-2 hover:text-foreground">
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
                {leftPanelOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
              </Button>
              <Button
                variant={rightPanelOpen ? "secondary" : "ghost"}
                size="icon"
                onClick={toggleRightPanel}
                className="relative"
              >
                {rightPanelOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={saveWorkflow}
                disabled={!hasUnsavedChanges}
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">{hasUnsavedChanges ? "Save*" : "Save"}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={() => setIsExportDialogOpen(true)}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              {isRunning ? (
                <Button size="sm" variant="destructive" className="gap-2" onClick={stopWorkflow}>
                  <Square className="h-4 w-4" />
                  <span className="hidden sm:inline">Stop</span>
                </Button>
              ) : (
                <Button size="sm" className="gap-2" onClick={handleRunWorkflow}>
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Run</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${leftPanelOpen ? "w-64" : "w-0"} flex-shrink-0 transition-all duration-300 relative md:static ${
            isMobile && leftPanelOpen ? "absolute z-50 h-[calc(100vh-3.5rem)]" : ""
          }`}
        >
          {leftPanelOpen && <LeftPanel onAddNode={addNewNode} nodes={nodes} edges={edges} />}
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
          className={`${rightPanelOpen ? "w-80" : "w-0"} flex-shrink-0 transition-all duration-300 relative md:static ${
            isMobile && rightPanelOpen ? "absolute right-0 z-50 h-[calc(100vh-3.5rem)]" : ""
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
        onClose={(e) => {
          setIsNewWorkflowDialogOpen(false)
          // Only redirect to home if explicitly cancelled and no workflow exists
          if (!templateLoaded && !nodes.length && e?.type === "click") {
            window.location.href = "/"
          }
        }}
        onConfirm={createNewWorkflow}
      />
      <Dialog open={isUnsavedDialogOpen} onOpenChange={setIsUnsavedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>You have unsaved changes. Do you want to save them before leaving?</DialogDescription>
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
      {/* Info Dialog with proper cancellation handling */}
      <Dialog
        open={isInfoDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleInfoCancel()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Additional Information Needed</DialogTitle>
            <DialogDescription>{infoRequest}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              id="additional-info"
              placeholder="Enter the requested information..."
              className="min-h-[100px]"
              onChange={(e) => setUserInput(e.target.value)}
              value={userInput}
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleInfoCancel}>
              Cancel Workflow
            </Button>
            <Button onClick={() => handleInfoSubmit(userInput)} disabled={!userInput.trim()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Input Dialog with proper cancellation handling */}
      <Dialog
        open={isInputDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleInputCancel()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Needed</DialogTitle>
            <DialogDescription>{inputPrompt}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              id="workflow-input"
              placeholder="Enter your input..."
              className="min-h-[100px]"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleInputCancel}>
              Cancel Workflow
            </Button>
            <Button onClick={() => handleInputSubmit(currentInput)} disabled={!currentInput.trim()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
