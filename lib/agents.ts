import { callCustomAPI, type APIRequestConfig } from "./api-handler"
import jsPDF from "jspdf"

// Helper function to trigger file download
function downloadPDF(pdf: jsPDF, filename: string) {
  pdf.save(filename)
}

interface PDFStyle {
  fontSize: number
  lineHeight: number
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  headerStyle?: {
    fontSize: number
    bold: boolean
    spacing: number
  }
  subheaderStyle?: {
    fontSize: number
    bold: boolean
    spacing: number
  }
  paragraphStyle?: {
    indent: number
    spacing: number
  }
  listStyle?: {
    indent: number
    bulletPoint: string
    spacing: number
  }
  highlightStyle?: {
    color: string
    backgroundColor?: string
  }
}

interface DocumentSection {
  type: 'title' | 'heading' | 'subheading' | 'paragraph' | 'list' | 'quote' | 'code'
  content: string
  level?: number
  items?: string[]
}

interface FormattedDocument {
  sections: DocumentSection[]
  metadata: {
    title?: string
    author?: string
    date?: string
    documentType: string
  }
}

export interface Agent {
  id: string
  type: string
  systemPrompt?: string
  apiEndpoint?: string
  model?: string
  label?: string
  // API-specific fields
  apiConfig?: APIRequestConfig
  // PDF-specific fields
  pdfConfig?: {
    format?: string
    orientation?: string
    fontSize?: number
    lineHeight?: number
    margins?: {
      top: number
      right: number
      bottom: number
      left: number
    }
    filename?: string
    documentType?: "general" | "cv" | "research" | "report" | "letter" | "custom"
    styleOverrides?: Partial<PDFStyle>
  }
}

export interface AgentNode extends Agent {
  inputs?: string[]
  outputs?: string[]
}

export interface AgentGraph {
  nodes: AgentNode[]
  edges: { source: string; target: string }[]
}

export interface AgentResponse {
  content: string
  needsMoreInfo?: boolean
  infoRequest?: string
  needsInput?: boolean
  inputPrompt?: string
}

export async function callAI(endpoint: string, messages: any[], systemPrompt?: string, model?: string) {
  try {
    // Prepare messages with system prompt if provided
    const apiMessages = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages

    console.log("Making AI API call to:", endpoint)

    const requestPayload = {
      model: model || "gpt-4o",
      messages: apiMessages,
    }

    console.log("Request payload:", JSON.stringify(requestPayload, null, 2))

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    })

    console.log("Response status:", response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API response error:", response.status, response.statusText, errorText)

      // Try to parse error as JSON for better error messages
      let errorMessage = errorText
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.reason) {
          errorMessage = errorJson.reason
        } else if (errorJson.error) {
          errorMessage = typeof errorJson.error === "string" ? errorJson.error : errorText
        }
      } catch {
        // If not JSON, use the raw text
      }

      throw new Error(`API request failed (${response.status}): ${errorMessage}`)
    }

    const data = await response.json()
    console.log("API response:", JSON.stringify(data, null, 2))

    // Handle different possible response formats
    if (data.choices && data.choices.length > 0) {
      const choice = data.choices[0]
      if (choice.message && choice.message.content) {
        return choice.message.content
      }
      if (choice.text) {
        return choice.text
      }
    }

    // Handle direct message format
    if (data.message) {
      if (typeof data.message === "string") {
        return data.message
      }
      if (data.message.content) {
        return data.message.content
      }
    }

    // Handle other common formats
    if (data.content) {
      return data.content
    }

    if (data.response) {
      return data.response
    }

    if (data.text) {
      return data.text
    }

    if (typeof data === "string") {
      return data
    }

    // If we get here, the response format is unexpected
    console.error("Unexpected API response format:", data)
    throw new Error(`Unexpected API response format. The API returned: ${JSON.stringify(data)}`)
  } catch (error) {
    console.error("Error calling AI API:", error)

    if (error instanceof Error) {
      // Re-throw with more context if it's a network error
      if (error.message.includes("fetch")) {
        throw new Error(`Network error: Unable to connect to ${endpoint}. Please check your internet connection.`)
      }
      throw error
    } else {
      throw new Error(`API call failed: ${String(error)}`)
    }
  }
}

// Helper function to clean and parse JSON from AI response
function cleanAndParseJSON(response: string): any {
  // Remove markdown code blocks if present
  let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '')
  
  // Remove any leading/trailing whitespace
  cleanResponse = cleanResponse.trim()
  
  try {
    return JSON.parse(cleanResponse)
  } catch (error) {
    console.error("Error parsing JSON:", error)
    throw new Error("Failed to parse AI response as JSON")
  }
}

async function analyzeContentAndGenerateStyle(content: string, documentType: string): Promise<PDFStyle> {
  // AI prompt to analyze content and determine optimal styling
  const analysisPrompt = `Analyze this content and provide PDF styling parameters. Return ONLY a JSON object with no additional text or formatting.

Content type: ${documentType}
Content preview: ${content.substring(0, 500)}...

Required JSON structure:
{
  "fontSize": number,
  "lineHeight": number,
  "margins": {
    "top": number,
    "right": number,
    "bottom": number,
    "left": number
  },
  "headerStyle": {
    "fontSize": number,
    "bold": boolean,
    "spacing": number
  },
  "subheaderStyle": {
    "fontSize": number,
    "bold": boolean,
    "spacing": number
  },
  "paragraphStyle": {
    "indent": number,
    "spacing": number
  },
  "listStyle": {
    "indent": number,
    "bulletPoint": string,
    "spacing": number
  }
}`

  try {
    const result = await callAI(
      "https://grey-api.vercel.app/api/chat",
      [{ role: "user", content: analysisPrompt }],
      "You are a document formatter. Respond ONLY with a JSON object. No markdown, no explanations.",
      "gpt-4o"
    )

    // Parse the AI response into a PDFStyle object
    const styleParams = cleanAndParseJSON(result)
    return {
      fontSize: styleParams.fontSize || 12,
      lineHeight: styleParams.lineHeight || 1.2,
      margins: styleParams.margins || { top: 20, right: 20, bottom: 20, left: 20 },
      headerStyle: styleParams.headerStyle,
      subheaderStyle: styleParams.subheaderStyle,
      paragraphStyle: styleParams.paragraphStyle,
      listStyle: styleParams.listStyle,
      highlightStyle: styleParams.highlightStyle
    }
  } catch (error) {
    console.error("Error generating style:", error)
    // Return default style if AI analysis fails
    return {
      fontSize: 12,
      lineHeight: 1.2,
      margins: { top: 20, right: 20, bottom: 20, left: 20 }
    }
  }
}

async function formatContentWithAI(content: string, documentType: string): Promise<FormattedDocument> {
  const formattingPrompt = `Format this content for a professional ${documentType} PDF. 
Return a JSON object with properly structured content.

Raw content: ${content}

Format rules:
1. Use # for main title
2. Use ## for section headings
3. Use ### for subsection headings
4. Use - for list items
5. Use > for quotes
6. Use \`\`\` for code blocks
7. Use blank lines between sections
8. Preserve important whitespace

Return format:
{
  "sections": [
    {
      "type": "title|heading|subheading|paragraph|list|quote|code",
      "content": "text content",
      "level": number (for headings),
      "items": ["list items"] (for lists)
    }
  ],
  "metadata": {
    "title": "document title",
    "author": "extracted or generated",
    "date": "current date",
    "documentType": "${documentType}"
  }
}`

  try {
    const result = await callAI(
      "https://grey-api.vercel.app/api/chat",
      [{ role: "user", content: formattingPrompt }],
      "You are a professional document formatter. Return only valid JSON with the formatted content structure.",
      "gpt-4o"
    )

    const formatted = cleanAndParseJSON(result)
    return formatted
  } catch (error) {
    console.error("Error formatting content:", error)
    return {
      sections: [{ type: 'paragraph', content }],
      metadata: { documentType }
    }
  }
}

function getDefaultStyleForType(documentType: string) {
  const baseStyle = {
    format: 'a4',
    orientation: 'portrait',
    defaultFontSize: 11,
    titleFontSize: 20,
    headingFontSize: 14,
    subheadingFontSize: 12,
    lineHeight: 1.2,
    margins: { top: 20, right: 15, bottom: 20, left: 15 }
  }

  switch (documentType) {
    case 'cv':
      return {
        ...baseStyle,
        defaultFontSize: 10,
        titleFontSize: 16,
        headingFontSize: 12,
        subheadingFontSize: 11,
        lineHeight: 1.15,
        margins: { top: 12, right: 12, bottom: 12, left: 12 }
      }
    case 'research':
      return {
        ...baseStyle,
        defaultFontSize: 11,
        titleFontSize: 18,
        lineHeight: 1.4,
        margins: { top: 25, right: 20, bottom: 25, left: 20 }
      }
    case 'letter':
      return {
        ...baseStyle,
        defaultFontSize: 11,
        titleFontSize: 14,
        lineHeight: 1.15,
        margins: { top: 30, right: 30, bottom: 30, left: 30 }
      }
    default:
      return baseStyle
  }
}

export async function executeAgent(agent: Agent, input: string, onStep?: (step: string) => void): Promise<AgentResponse> {
  onStep?.(`🔄 Executing ${agent.type} agent: ${agent.label || agent.id}`)

  if (agent.type === "input") {
    // If there's no input, request it through dialog
    if (!input.trim()) {
      onStep?.(`❓ Input agent requesting user input`)
      return {
        content: "",
        needsInput: true,
        inputPrompt: agent.systemPrompt || "Please provide your input..."
      }
    }

    onStep?.(`📥 Input agent processing: "${input.substring(0, 50)}${input.length > 50 ? "..." : ""}"`)
    return { content: input }
  }

  if (agent.type === "processor") {
    const modelInfo = agent.model ? ` (${agent.model})` : ""
    onStep?.(
      `🧠 Processor agent${modelInfo} with system prompt: "${(agent.systemPrompt || "Default assistant").substring(0, 50)}..."`,
    )

    const messages = [{ role: "user", content: input }]

    try {
      const result = await callAI(
        agent.apiEndpoint || "https://grey-api.vercel.app/api/chat",
        messages,
        agent.systemPrompt,
        agent.model,
      )

      // Check if the response indicates more information is needed
      if (result.startsWith("MISSING_INFO:")) {
        onStep?.(`❓ Agent requesting more information`)
        return {
          content: result,
          needsMoreInfo: true,
          infoRequest: result.substring("MISSING_INFO:".length).trim()
        }
      }

      onStep?.(`✅ Processor result: ${result.substring(0, 100)}${result.length > 100 ? "..." : ""}`)
      return { content: result }
    } catch (error) {
      console.error("Processor agent error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      onStep?.(`❌ Processor agent failed: ${errorMessage}`)
      throw new Error(`Processor agent failed: ${errorMessage}`)
    }
  }

  if (agent.type === "pdf") {
    onStep?.(`📄 PDF agent processing text to PDF`)
    try {
      // Get document type and style
      const documentType = agent.pdfConfig?.documentType || "general"
      const style = getDefaultStyleForType(documentType)
      
      // Format content with AI
      onStep?.(`📝 Analyzing and formatting content...`)
      const formattedDoc = await formatContentWithAI(input, documentType)
      
      // Create PDF
      const doc = new jsPDF({
        format: style.format,
        orientation: style.orientation
      })

      // Initialize position tracking
      let currentY = style.margins.top
      const pageWidth = doc.internal.pageSize.width
      const maxWidth = pageWidth - style.margins.left - style.margins.right

      // Helper function to add a new page
      const addNewPage = () => {
        doc.addPage()
        currentY = style.margins.top
      }

      // Helper function to check and add new page if needed
      const checkAndAddPage = (height: number) => {
        if (currentY + height > doc.internal.pageSize.height - style.margins.bottom) {
          addNewPage()
          return true
        }
        return false
      }

      // Process each section
      for (const section of formattedDoc.sections) {
        switch (section.type) {
          case 'title':
            doc.setFontSize(style.titleFontSize)
            doc.setFont(undefined, 'bold')
            const titleLines = doc.splitTextToSize(section.content, maxWidth)
            const titleHeight = titleLines.length * style.titleFontSize
            checkAndAddPage(titleHeight)
            doc.text(titleLines, style.margins.left, currentY)
            currentY += titleHeight + 2  // Minimal spacing after title
            break

          case 'heading':
            doc.setFontSize(style.headingFontSize)
            doc.setFont(undefined, 'bold')
            const headingLines = doc.splitTextToSize(section.content, maxWidth)
            const headingHeight = headingLines.length * style.headingFontSize
            checkAndAddPage(headingHeight)
            currentY += 1  // Minimal space before heading
            doc.text(headingLines, style.margins.left, currentY)
            currentY += headingHeight + 1  // Minimal spacing after heading
            break

          case 'subheading':
            doc.setFontSize(style.subheadingFontSize)
            doc.setFont(undefined, 'bold')
            const subheadingLines = doc.splitTextToSize(section.content, maxWidth)
            const subheadingHeight = subheadingLines.length * style.subheadingFontSize * 1.1
            checkAndAddPage(subheadingHeight)
            currentY += 1  // Minimal space before subheading
            doc.text(subheadingLines, style.margins.left, currentY)
            currentY += subheadingHeight + 1  // Minimal spacing after subheading
            break

          case 'paragraph':
            doc.setFontSize(style.defaultFontSize)
            doc.setFont(undefined, 'normal')
            const paragraphLines = doc.splitTextToSize(section.content, maxWidth)
            const lineHeight = style.defaultFontSize * 0.75
            const paragraphHeight = paragraphLines.length * lineHeight
            checkAndAddPage(paragraphHeight)
            
            paragraphLines.forEach((line: string, index: number) => {
              doc.text(line, style.margins.left, currentY + (index * lineHeight))
            })
            
            // Check if next section is a title/heading to add more space
            const nextSection = formattedDoc.sections[formattedDoc.sections.indexOf(section) + 1]
            if (nextSection && (nextSection.type === 'title' || nextSection.type === 'heading')) {
              currentY += paragraphHeight + 6  // More space before titles/headings
            } else {
              currentY += paragraphHeight + 1  // Normal spacing for other elements
            }
            break

          case 'list':
            doc.setFontSize(style.defaultFontSize)
            doc.setFont(undefined, 'normal')
            if (section.items) {
              let totalHeight = 0
              for (const item of section.items) {
                const bulletPoint = '•'
                const listItemText = `${bulletPoint} ${item}`
                const listLines = doc.splitTextToSize(listItemText, maxWidth - 8)
                const itemLineHeight = style.defaultFontSize * 0.75
                const listItemHeight = listLines.length * itemLineHeight
                checkAndAddPage(listItemHeight)
                
                listLines.forEach((line: string, index: number) => {
                  doc.text(line, style.margins.left + 4, currentY + (index * itemLineHeight))
                })
                
                currentY += listItemHeight
                totalHeight += listItemHeight
              }

              // Check if next section is a title/heading to add more space
              const nextSection = formattedDoc.sections[formattedDoc.sections.indexOf(section) + 1]
              if (nextSection && (nextSection.type === 'title' || nextSection.type === 'heading')) {
                currentY += 6  // More space before titles/headings
              }
            }
            break

          case 'quote':
            doc.setFontSize(style.defaultFontSize)
            doc.setFont(undefined, 'italic')
            const quoteLines = doc.splitTextToSize(section.content, maxWidth - 16)
            const quoteHeight = quoteLines.length * style.defaultFontSize * style.lineHeight
            checkAndAddPage(quoteHeight)
            doc.setDrawColor(200, 200, 200)
            doc.line(style.margins.left + 2, currentY - 1, style.margins.left + 2, currentY + quoteHeight + 1)
            doc.text(quoteLines, style.margins.left + 8, currentY)
            currentY += quoteHeight + 1  // Minimal spacing after quotes
            break

          case 'code':
            doc.setFontSize(style.defaultFontSize - 1)
            doc.setFont('courier', 'normal')
            const codeLines = doc.splitTextToSize(section.content, maxWidth - 8)
            const codeHeight = codeLines.length * (style.defaultFontSize - 1) * 1.1
            checkAndAddPage(codeHeight)
            doc.setFillColor(248, 248, 248)
            doc.rect(
              style.margins.left, 
              currentY - 1,
              maxWidth, 
              codeHeight + 2,
              'F'
            )
            doc.text(codeLines, style.margins.left + 4, currentY)
            currentY += codeHeight + 1  // Minimal spacing after code
            break
        }
      }

      // Generate filename
      const filename = agent.pdfConfig?.filename || 
        `${formattedDoc.metadata.title || documentType}-${Date.now()}.pdf`
      
      // Trigger download
      downloadPDF(doc, filename)
      
      onStep?.(`✅ Created professional PDF document: ${filename}`)
      return { content: `PDF file "${filename}" has been created and downloaded.` }

    } catch (error) {
      console.error("PDF agent error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      onStep?.(`❌ PDF agent failed: ${errorMessage}`)
      throw new Error(`PDF agent failed: ${errorMessage}`)
    }
  }

  if (agent.type === "api") {
    if (!agent.apiEndpoint) {
      throw new Error("API endpoint is required for API agents")
    }

    const config = agent.apiConfig || {
      method: "GET",
      authType: "none",
    }

    onStep?.(`🌐 API agent calling: ${agent.apiEndpoint}`)

    try {
      const result = await callCustomAPI(agent.apiEndpoint, input, config)
      onStep?.(`✅ API result: ${result.substring(0, 100)}${result.length > 100 ? "..." : ""}`)
      return { content: result }
    } catch (error) {
      console.error("API agent error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      onStep?.(`❌ API agent failed: ${errorMessage}`)
      throw new Error(`API agent failed: ${errorMessage}`)
    }
  }

  if (agent.type === "output") {
    onStep?.(`📤 Output agent formatting result`)
    return { content: input }
  }

  throw new Error(`Unknown agent type: ${agent.type}`)
}

export async function executeWorkflow(
  graph: AgentGraph,
  input: string,
  onStep?: (step: string) => void,
  onNodeStatusChange?: (nodeId: string, status: "executing" | "completed" | "error") => void,
  onNeedMoreInfo?: (request: string) => Promise<string>,
  onNeedInput?: (prompt: string) => Promise<string>
): Promise<string> {
  onStep?.("🚀 Starting workflow execution...")

  // Validate workflow
  if (graph.nodes.length === 0) {
    throw new Error("Workflow is empty. Please add at least one agent.")
  }

  // Find input nodes
  const inputNodes = graph.nodes.filter((node) => node.type === "input")
  if (inputNodes.length === 0) {
    onStep?.("⚠️ No input node found, using first node as input")
    const firstNode = graph.nodes[0]
    if (firstNode) {
      inputNodes.push({ ...firstNode, type: "input" })
    } else {
      throw new Error("No input node found in the workflow")
    }
  }

  // Initialize results map
  const results = new Map<string, string>()
  const processed = new Set<string>()
  const nodeRetries = new Map<string, number>()

  // Process nodes in topological order
  let hasProgress = true
  let iterations = 0
  const maxIterations = graph.nodes.length * 5

  while (hasProgress && processed.size < graph.nodes.length && iterations < maxIterations) {
    hasProgress = false
    iterations++

    for (const node of graph.nodes) {
      if (processed.has(node.id)) continue

      // Check if all inputs are processed
      const incomingEdges = graph.edges.filter((edge) => edge.target === node.id)
      const allInputsProcessed = incomingEdges.length === 0 || incomingEdges.every((edge) => processed.has(edge.source))

      if (!allInputsProcessed) continue

      // Collect inputs from connected nodes
      let nodeInput = ""
      if (incomingEdges.length === 0) {
        nodeInput = input
      } else {
        const inputs = incomingEdges.map((edge) => results.get(edge.source)).filter(Boolean)
        nodeInput = inputs.join("\n\n")
      }

      onStep?.(`⚙️ Processing node: ${node.label || node.id}`)
      onNodeStatusChange?.(node.id, "executing")

      try {
        const result = await executeAgent(node, nodeInput, onStep)

        // Handle case where agent needs input
        if (result.needsInput && onNeedInput) {
          onStep?.(`❓ Node ${node.label || node.id} needs user input`)
          const userInput = await onNeedInput(result.inputPrompt || "Please provide input...")
          nodeInput = userInput
          const retryResult = await executeAgent(node, nodeInput, onStep)
          results.set(node.id, retryResult.content)
        }
        // Handle case where agent needs more information
        else if (result.needsMoreInfo && onNeedMoreInfo) {
          onStep?.(`❓ Node ${node.label || node.id} needs more information`)
          const additionalInfo = await onNeedMoreInfo(result.infoRequest || "Please provide more information.")
          nodeInput = `${nodeInput}\n\nAdditional Information:\n${additionalInfo}`
          const retryResult = await executeAgent(node, nodeInput, onStep)
          results.set(node.id, retryResult.content)
        } else {
          results.set(node.id, result.content)
        }

        processed.add(node.id)
        hasProgress = true
        onNodeStatusChange?.(node.id, "completed")
        onStep?.(`✅ Completed node: ${node.label || node.id}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        onStep?.(`❌ Failed to execute node ${node.label || node.id}: ${errorMessage}`)
        onNodeStatusChange?.(node.id, "error")
        throw new Error(`Failed to execute node ${node.label || node.id}: ${errorMessage}`)
      }
    }
  }

  // Check if all nodes were processed
  if (processed.size < graph.nodes.length) {
    const unprocessed = graph.nodes.filter((node) => !processed.has(node.id))
    const unprocessedNames = unprocessed.map((n) => n.label || n.id).join(", ")
    onStep?.(`❌ Workflow incomplete. Unprocessed nodes: ${unprocessedNames}`)

    // Mark unprocessed nodes as error
    unprocessed.forEach((node) => onNodeStatusChange?.(node.id, "error"))

    throw new Error(`Workflow has circular dependencies or disconnected nodes: ${unprocessedNames}`)
  }

  // Find output nodes or return the last processed result
  const outputNodes = graph.nodes.filter((node) => node.type === "output")

  if (outputNodes.length === 0) {
    // Return results from nodes with no outgoing edges
    const terminalNodes = graph.nodes.filter((node) => !graph.edges.some((edge) => edge.source === node.id))

    if (terminalNodes.length > 0) {
      const finalResult = terminalNodes
        .map((node) => results.get(node.id))
        .filter(Boolean)
        .join("\n\n")
      onStep?.("🎉 Workflow completed successfully!")
      return finalResult
    }

    // Fallback to last processed node
    const allResults = Array.from(results.values())
    const finalResult = allResults[allResults.length - 1] || "No output generated"
    onStep?.("🎉 Workflow completed successfully!")
    return finalResult
  }

  // Combine outputs from all output nodes
  const finalResult = outputNodes
    .map((node) => results.get(node.id))
    .filter(Boolean)
    .join("\n\n")

  onStep?.("🎉 Workflow completed successfully!")
  return finalResult
}