"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Bot, Network, GitBranch, Code, BookOpen, Upload, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [savedWorkflows, setSavedWorkflows] = useState<Array<{
    name: string;
    lastSaved: string;
    id: string;
  }>>([])

  // Load saved workflows on component mount
  useEffect(() => {
    try {
      const workflowsStr = localStorage.getItem("greyflow_workflows")
      if (workflowsStr) {
        const workflows = JSON.parse(workflowsStr)
        setSavedWorkflows(Object.entries(workflows).map(([id, workflow]: [string, any]) => ({
          id,
          name: workflow.name,
          lastSaved: workflow.lastSaved || workflow.createdAt || new Date().toISOString(),
        })))
      }
    } catch (error) {
      console.error("Failed to load saved workflows:", error)
    }
  }, [])

  const handleImportWorkflow = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".gre") && !file.name.endsWith(".json")) {
      toast({
        title: "Invalid file format",
        description: "Please select a .gre or .json file.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string)

        if (workflow.format !== "GreyFlow") {
          toast({
            title: "Unsupported format",
            description: "This file is not a valid GreyFlow workflow.",
            variant: "destructive",
          })
          return
        }

        // Generate a unique ID for the workflow
        const workflowId = `workflow-${Date.now()}`
        
        // Save to localStorage
        const existingWorkflows = JSON.parse(localStorage.getItem("greyflow_workflows") || "{}")
        existingWorkflows[workflowId] = {
          ...workflow,
          importedAt: new Date().toISOString(),
        }
        localStorage.setItem("greyflow_workflows", JSON.stringify(existingWorkflows))

        toast({
          title: "Workflow imported",
          description: "Opening workflow...",
        })

        // Auto-open the workflow
        window.location.href = `/builder?load=${workflowId}`
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to import workflow. Please check the file format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const deleteWorkflow = (id: string) => {
    try {
      const existingWorkflows = JSON.parse(localStorage.getItem("greyflow_workflows") || "{}")
      delete existingWorkflows[id]
      localStorage.setItem("greyflow_workflows", JSON.stringify(existingWorkflows))
      setSavedWorkflows(prev => prev.filter(w => w.id !== id))
      toast({
        title: "Workflow deleted",
        description: "The workflow has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete workflow. Please try again.",
        variant: "destructive",
      })
    }
  }

  const workflowTemplates = [
    {
      name: "CV/Resume Builder",
      description:
        "Create a professional CV/Resume with intelligent information gathering. The system will guide you through providing necessary details and generate a polished PDF document.",
      icon: "📄",
      template: "cv",
    },
    {
      name: "Weather Assistant",
      description:
        "Get personalized weather insights and recommendations based on location. Includes practical advice for activities and clothing.",
      icon: "🌤️",
      template: "weather",
    },
    {
      name: "Research & Humanize",
      description:
        "Transform complex topics into well-researched, human-friendly content while maintaining academic quality and depth.",
      icon: "📚",
      template: "research",
    },
    {
      name: "Content Creator",
      description:
        "Generate engaging content with AI assistance. Perfect for blog posts, articles, and creative writing.",
      icon: "✍️",
      template: "content",
    },
  ]

  const features = [
    {
      icon: GitBranch,
      title: "Visual Design",
      description:
        "Create workflows through an intuitive drag-and-drop interface. Connect components visually to build your process.",
    },
    {
      icon: Bot,
      title: "AI Processing",
      description: 
        "Leverage advanced language models to process, analyze, and transform content based on your needs.",
    },
    {
      icon: Code,
      title: "No-Code Solution",
      description:
        "Build complex workflows without writing any code. Configure everything through a simple visual interface.",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GitBranch className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              GreyFlow
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#templates" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Templates
            </Link>
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleImportWorkflow}>
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Link href="/builder?new=true">
              <Button size="sm">
                New Workflow
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 border-b">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="mb-4">
                  Build AI workflows visually
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                  Visual AI Workflow Builder
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Create, test, and refine AI workflows through a visual interface. No coding required.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/builder?new=true">
                  <Button size="lg" className="gap-2">
                    Start Building <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="gap-2" onClick={handleImportWorkflow}>
                  <Upload className="h-4 w-4" />
                  Import Workflow
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileImport}
                  accept=".gre,.json"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Saved Workflows Section */}
        {savedWorkflows.length > 0 && (
          <section className="py-20 border-b">
            <div className="container px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Your Workflows</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Continue working on your saved workflows
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedWorkflows.map((workflow) => (
                  <Card key={workflow.id} className="group transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{workflow.name}</CardTitle>
                          <CardDescription className="mt-2">
                            Last modified: {new Date(workflow.lastSaved).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => deleteWorkflow(workflow.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-end">
                        <Link href={`/builder?load=${workflow.id}`}>
                          <Button size="sm">
                            Open Workflow
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Templates Section */}
        <section id="templates" className="py-20 border-b">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Ready-to-Use Templates</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start with a template and customize it for your specific needs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workflowTemplates.map((template, index) => (
                <Card key={index} className="group transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{template.icon}</div>
                      <div className="flex-1">
                        <CardTitle>{template.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-end">
                      <Link href={`/builder?template=${template.template}`}>
                        <Button size="sm">
                          Use Template
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 border-b">
          <div className="container px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Core Features</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to build AI workflows
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="h-8 w-8 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-muted">
          <div className="container px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Build your first AI workflow using our visual interface
            </p>
              <Link href="/builder">
              <Button size="lg" className="gap-2">
                Open Builder <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 py-10 px-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">
              GreyFlow
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Open-source AI workflow builder</p>
        </div>
      </footer>
    </div>
  )
}
