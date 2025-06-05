import { callCustomAPI, type APIRequestConfig } from "./api-handler"

export interface Agent {
  id: string
  type: string
  systemPrompt?: string
  apiEndpoint?: string
  model?: string
  label?: string
  // API-specific fields
  apiConfig?: APIRequestConfig
}

export interface AgentNode extends Agent {
  inputs?: string[]
  outputs?: string[]
}

export interface AgentGraph {
  nodes: AgentNode[]
  edges: { source: string; target: string }[]
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

export async function executeAgent(agent: Agent, input: string, onStep?: (step: string) => void) {
  onStep?.(`🔄 Executing ${agent.type} agent: ${agent.label || agent.id}`)

  if (agent.type === "input") {
    onStep?.(`📥 Input agent processing: "${input.substring(0, 50)}${input.length > 50 ? "..." : ""}"`)
    return input
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
      onStep?.(`✅ Processor result: ${result.substring(0, 100)}${result.length > 100 ? "..." : ""}`)
      return result
    } catch (error) {
      console.error("Processor agent error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      onStep?.(`❌ Processor agent failed: ${errorMessage}`)
      throw new Error(`Processor agent failed: ${errorMessage}`)
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
      return result
    } catch (error) {
      console.error("API agent error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      onStep?.(`❌ API agent failed: ${errorMessage}`)
      throw new Error(`API agent failed: ${errorMessage}`)
    }
  }

  if (agent.type === "output") {
    onStep?.(`📤 Output agent formatting result`)
    return input
  }

  throw new Error(`Unknown agent type: ${agent.type}`)
}

export async function executeWorkflow(
  graph: AgentGraph,
  input: string,
  onStep?: (step: string) => void,
  onNodeStatusChange?: (nodeId: string, status: "executing" | "completed" | "error") => void,
) {
  onStep?.("🚀 Starting workflow execution...")

  // Validate workflow
  if (graph.nodes.length === 0) {
    throw new Error("Workflow is empty. Please add at least one agent.")
  }

  // Find input nodes
  const inputNodes = graph.nodes.filter((node) => node.type === "input")
  if (inputNodes.length === 0) {
    onStep?.("⚠️ No input node found, using first node as input")
    // If no input node, treat the first node as input
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

  // Set input for input nodes
  for (const node of inputNodes) {
    onStep?.(`📝 Setting input for node: ${node.label || node.id}`)
    onNodeStatusChange?.(node.id, "executing")

    // Small delay to show the executing state
    await new Promise((resolve) => setTimeout(resolve, 100))

    results.set(node.id, input)
    processed.add(node.id)
    onNodeStatusChange?.(node.id, "completed")
  }

  // Process nodes in topological order
  let hasProgress = true
  let iterations = 0
  const maxIterations = graph.nodes.length * 2 // Prevent infinite loops

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
        // No incoming edges, use original input
        nodeInput = input
      } else {
        // Combine inputs from connected nodes
        const inputs = incomingEdges.map((edge) => results.get(edge.source)).filter(Boolean)
        nodeInput = inputs.join("\n\n")
      }

      onStep?.(`⚙️ Processing node: ${node.label || node.id}`)
      onNodeStatusChange?.(node.id, "executing")

      try {
        const result = await executeAgent(node, nodeInput, onStep)
        results.set(node.id, result)
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
