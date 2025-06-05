// External API integrations for real-world functionality

export interface ExternalAPIConfig {
  name: string
  endpoint: string
  method: "GET" | "POST"
  headers?: Record<string, string>
  transformInput?: (input: string) => any
  transformOutput?: (response: any) => string
  requiresAuth?: boolean
  description: string
}

// Weather API using OpenWeatherMap (free tier)
export const weatherAPI: ExternalAPIConfig = {
  name: "OpenWeatherMap",
  endpoint: "https://api.openweathermap.org/data/2.5/weather",
  method: "GET",
  description: "Get current weather data for any location",
  transformInput: (input: string) => {
    // Extract location from input
    const location = input.trim()
    return {
      q: location,
      appid: "demo_key", // Users would need to add their own API key
      units: "metric",
    }
  },
  transformOutput: (response: any) => {
    if (response.error) {
      return `Weather data unavailable: ${response.error}`
    }
    return `Current weather in ${response.name}: ${response.weather[0].description}, ${response.main.temp}°C, humidity ${response.main.humidity}%, wind ${response.wind.speed} m/s`
  },
}

// News API for research workflows
export const newsAPI: ExternalAPIConfig = {
  name: "NewsAPI",
  endpoint: "https://newsapi.org/v2/everything",
  method: "GET",
  description: "Search for news articles and current information",
  transformInput: (input: string) => {
    return {
      q: input.trim(),
      apiKey: "demo_key", // Users would need to add their own API key
      sortBy: "relevancy",
      pageSize: 5,
    }
  },
  transformOutput: (response: any) => {
    if (response.error) {
      return `News search failed: ${response.error}`
    }
    const articles = response.articles?.slice(0, 3) || []
    return articles
      .map(
        (article: any) =>
          `• ${article.title}\n  Source: ${article.source.name}\n  Summary: ${article.description || "No description"}`,
      )
      .join("\n\n")
  },
}

// JSONPlaceholder for demo data
export const jsonPlaceholderAPI: ExternalAPIConfig = {
  name: "JSONPlaceholder",
  endpoint: "https://jsonplaceholder.typicode.com/posts",
  method: "GET",
  description: "Demo API for testing data workflows",
  transformInput: (input: string) => {
    // Extract post ID if mentioned, otherwise get random posts
    const match = input.match(/\d+/)
    return match ? { id: match[0] } : {}
  },
  transformOutput: (response: any) => {
    if (Array.isArray(response)) {
      return response
        .slice(0, 3)
        .map((post: any) => `Post ${post.id}: ${post.title}\n${post.body.substring(0, 100)}...`)
        .join("\n\n")
    } else {
      return `Post ${response.id}: ${response.title}\n${response.body}`
    }
  },
}

// Quotable API for inspirational content
export const quotableAPI: ExternalAPIConfig = {
  name: "Quotable",
  endpoint: "https://api.quotable.io/random",
  method: "GET",
  description: "Get random inspirational quotes",
  transformInput: (input: string) => {
    // Can filter by tags if specified
    const tags = input.toLowerCase().includes("motivational")
      ? "motivational"
      : input.toLowerCase().includes("wisdom")
        ? "wisdom"
        : ""
    return tags ? { tags } : {}
  },
  transformOutput: (response: any) => {
    return `"${response.content}" - ${response.author}`
  },
}

// REST Countries API for geographic data
export const countriesAPI: ExternalAPIConfig = {
  name: "REST Countries",
  endpoint: "https://restcountries.com/v3.1/name",
  method: "GET",
  description: "Get detailed information about countries",
  transformInput: (input: string) => {
    // Extract country name from input
    const country = input.trim()
    return { name: country }
  },
  transformOutput: (response: any) => {
    if (Array.isArray(response) && response.length > 0) {
      const country = response[0]
      return `${country.name.common} (${country.name.official})\nCapital: ${country.capital?.[0] || "N/A"}\nPopulation: ${country.population?.toLocaleString() || "N/A"}\nRegion: ${country.region}\nCurrencies: ${Object.values(
        country.currencies || {},
      )
        .map((c: any) => c.name)
        .join(", ")}`
    }
    return "Country information not found"
  },
}

// Cat Facts API for fun content
export const catFactsAPI: ExternalAPIConfig = {
  name: "Cat Facts",
  endpoint: "https://catfact.ninja/fact",
  method: "GET",
  description: "Get random cat facts for content inspiration",
  transformInput: () => ({}),
  transformOutput: (response: any) => {
    return `Cat Fact: ${response.fact}`
  },
}

export const EXTERNAL_APIS = {
  weather: weatherAPI,
  news: newsAPI,
  jsonplaceholder: jsonPlaceholderAPI,
  quotes: quotableAPI,
  countries: countriesAPI,
  catfacts: catFactsAPI,
}

export async function callExternalAPI(apiConfig: ExternalAPIConfig, input: string): Promise<string> {
  try {
    let url = apiConfig.endpoint
    const requestOptions: RequestInit = {
      method: apiConfig.method,
      headers: {
        "Content-Type": "application/json",
        ...apiConfig.headers,
      },
    }

    if (apiConfig.method === "GET" && apiConfig.transformInput) {
      const params = apiConfig.transformInput(input)
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })

      if (searchParams.toString()) {
        url += (url.includes("?") ? "&" : "?") + searchParams.toString()
      }
    } else if (apiConfig.method === "POST" && apiConfig.transformInput) {
      requestOptions.body = JSON.stringify(apiConfig.transformInput(input))
    }

    console.log(`Calling external API: ${url}`)

    const response = await fetch(url, requestOptions)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (apiConfig.transformOutput) {
      return apiConfig.transformOutput(data)
    }

    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error("External API call failed:", error)
    return `External API call failed: ${error instanceof Error ? error.message : "Unknown error"}`
  }
}
