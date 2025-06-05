// Universal API handler for any HTTP endpoint

export interface APIRequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  bodyTemplate?: string
  responseFormat?: "json" | "text" | "xml"
  authType?: "none" | "bearer" | "apikey" | "basic"
  authValue?: string
  authHeader?: string
  useCorsProxy?: boolean
}

export interface APIAgent {
  id: string
  label: string
  endpoint: string
  config: APIRequestConfig
}

export function parseInputForAPI(input: string, bodyTemplate?: string, queryParams?: Record<string, string>) {
  // If there's a body template, replace placeholders with input
  if (bodyTemplate) {
    // Replace {{input}} or {input} placeholders
    return bodyTemplate.replace(/\{\{?input\}?\}/g, input)
  }

  // For query parameters, try to extract values from input
  if (queryParams) {
    const params = { ...queryParams }

    // Simple extraction - replace {{input}} in query param values
    Object.keys(params).forEach((key) => {
      if (params[key].includes("{{input}}") || params[key].includes("{input}")) {
        params[key] = params[key].replace(/\{\{?input\}?\}/g, input)
      }
    })

    return params
  }

  // Default: return input as-is for simple cases
  return input
}

export function buildURL(baseURL: string, queryParams?: Record<string, string>): string {
  if (!queryParams || Object.keys(queryParams).length === 0) {
    return baseURL
  }

  const url = new URL(baseURL)
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value && value.trim()) {
      url.searchParams.append(key, value)
    }
  })

  return url.toString()
}

export function buildHeaders(config: APIRequestConfig): Record<string, string> {
  const headers: Record<string, string> = {
    ...config.headers,
  }

  // Only add Content-Type for requests with body
  if (["POST", "PUT", "PATCH"].includes(config.method)) {
    headers["Content-Type"] = "application/json"
  }

  // Add authentication headers
  if (config.authType === "bearer" && config.authValue) {
    headers["Authorization"] = `Bearer ${config.authValue}`
  } else if (config.authType === "apikey" && config.authValue && config.authHeader) {
    headers[config.authHeader] = config.authValue
  } else if (config.authType === "basic" && config.authValue) {
    headers["Authorization"] = `Basic ${btoa(config.authValue)}`
  }

  return headers
}

// Add this function before callCustomAPI
export function getCorsProxyUrl(originalUrl: string, useCorsProxy = false): string {
  if (!useCorsProxy) return originalUrl

  // Use a public CORS proxy for testing (not recommended for production)
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`
}

export async function callCustomAPI(endpoint: string, input: string, config: APIRequestConfig): Promise<string> {
  try {
    console.log(`Making ${config.method} request to: ${endpoint}`)
    console.log("Input:", input)
    console.log("Config:", config)

    let url = endpoint
    let body: string | undefined

    // Handle query parameters for GET requests
    if (config.method === "GET" && config.queryParams) {
      const parsedParams = parseInputForAPI(input, undefined, config.queryParams)
      url = buildURL(endpoint, parsedParams as Record<string, string>)
    }

    // Apply CORS proxy if enabled
    if (config.useCorsProxy) {
      url = getCorsProxyUrl(url, true)
    }

    // Handle request body for POST/PUT/PATCH requests
    if (["POST", "PUT", "PATCH"].includes(config.method)) {
      if (config.bodyTemplate) {
        body = parseInputForAPI(input, config.bodyTemplate) as string
      } else {
        // Default: send input as JSON
        body = JSON.stringify({ input, query: input, message: input })
      }
    }

    const headers = buildHeaders(config)

    console.log("Final URL:", url)
    console.log("Headers:", headers)
    console.log("Body:", body)

    // Add CORS mode and error handling
    const response = await fetch(url, {
      method: config.method,
      headers,
      body,
      mode: "cors",
      credentials: "omit",
    })

    console.log("Response status:", response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed (${response.status}): ${errorText}`)
    }

    const responseText = await response.text()
    console.log("Raw response:", responseText)

    // Try to parse as JSON first
    try {
      const jsonData = JSON.parse(responseText)

      // Format JSON response nicely
      if (typeof jsonData === "object") {
        return formatAPIResponse(jsonData)
      }

      return String(jsonData)
    } catch {
      // If not JSON, return as text
      return responseText
    }
  } catch (error) {
    console.error("Custom API call failed:", error)

    // Handle specific error types with helpful messages
    if (error instanceof TypeError && error.message.includes("fetch")) {
      const corsMessage = config.useCorsProxy
        ? "The CORS proxy failed to connect to the API."
        : "This might be due to CORS restrictions. Try enabling the CORS proxy option."

      throw new Error(`Network error: Unable to connect to ${endpoint}. ${corsMessage}`)
    }

    if (error instanceof Error && error.message.includes("CORS")) {
      throw new Error(
        `CORS error: The API at ${endpoint} doesn't allow requests from this domain. Try enabling the CORS proxy option for testing.`,
      )
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    throw new Error(`API call failed: ${errorMessage}`)
  }
}

function formatAPIResponse(data: any): string {
  // Handle common API response patterns

  // Array of objects (like search results)
  if (Array.isArray(data)) {
    if (data.length === 0) return "No results found"

    return data
      .slice(0, 5)
      .map((item, index) => {
        if (typeof item === "object") {
          // Try to find title/name/description fields
          const title = item.title || item.name || item.summary || `Item ${index + 1}`
          const description = item.description || item.content || item.body || ""

          return `${title}${description ? `\n${description.substring(0, 200)}${description.length > 200 ? "..." : ""}` : ""}`
        }
        return String(item)
      })
      .join("\n\n")
  }

  // Single object
  if (typeof data === "object" && data !== null) {
    // Handle common response wrappers
    if (data.data) return formatAPIResponse(data.data)
    if (data.results) return formatAPIResponse(data.results)
    if (data.items) return formatAPIResponse(data.items)

    // Handle error responses
    if (data.error) return `Error: ${data.error}`
    if (data.message && data.status === "error") return `Error: ${data.message}`

    // Format object fields
    const formatted = Object.entries(data)
      .filter(([key, value]) => value !== null && value !== undefined)
      .map(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())

        if (typeof value === "object") {
          return `${formattedKey}: ${JSON.stringify(value)}`
        }

        return `${formattedKey}: ${value}`
      })
      .join("\n")

    return formatted || JSON.stringify(data, null, 2)
  }

  // Primitive value
  return String(data)
}

// Common API templates for popular services
export const API_TEMPLATES = {
  openweather: {
    name: "OpenWeatherMap",
    endpoint: "https://api.openweathermap.org/data/2.5/weather",
    config: {
      method: "GET" as const,
      queryParams: {
        q: "{{input}}",
        appid: "YOUR_API_KEY",
        units: "metric",
      },
      authType: "none" as const,
    },
  },
  newsapi: {
    name: "NewsAPI",
    endpoint: "https://newsapi.org/v2/everything",
    config: {
      method: "GET" as const,
      queryParams: {
        q: "{{input}}",
        sortBy: "relevancy",
        pageSize: "5",
      },
      authType: "apikey" as const,
      authHeader: "X-API-Key",
      authValue: "YOUR_API_KEY",
    },
  },
  restcountries: {
    name: "REST Countries",
    endpoint: "https://restcountries.com/v3.1/name/{{input}}",
    config: {
      method: "GET" as const,
      authType: "none" as const,
    },
  },
  jsonplaceholder: {
    name: "JSONPlaceholder (Demo)",
    endpoint: "https://jsonplaceholder.typicode.com/posts",
    config: {
      method: "GET" as const,
      authType: "none" as const,
    },
  },
  custom: {
    name: "Custom API",
    endpoint: "",
    config: {
      method: "GET" as const,
      authType: "none" as const,
    },
  },
}
