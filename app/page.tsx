"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Bot,
  Network,
  GitBranch,
  Code,
  Upload,
  Trash2,
  Zap,
  Workflow,
  Lightbulb,
  Moon,
  Sun,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"

export default function Home() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)
  const [savedWorkflows, setSavedWorkflows] = useState<
    Array<{
      name: string
      lastSaved: string
      id: string
    }>
  >([])

  // Once mounted, we can safely show the UI that depends on the theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load saved workflows on component mount
  useEffect(() => {
    try {
      const workflowsStr = localStorage.getItem("greyflow_workflows")
      if (workflowsStr) {
        const workflows = JSON.parse(workflowsStr)
        setSavedWorkflows(
          Object.entries(workflows).map(([id, workflow]: [string, any]) => ({
            id,
            name: workflow.name,
            lastSaved: workflow.lastSaved || workflow.createdAt || new Date().toISOString(),
          })),
        )
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
      setSavedWorkflows((prev) => prev.filter((w) => w.id !== id))
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
      icon: <Lightbulb className="h-6 w-6" />,
      template: "cv",
    },
    {
      name: "Weather Assistant",
      description:
        "Get personalized weather insights and recommendations based on location. Includes practical advice for activities and clothing.",
      icon: <Zap className="h-6 w-6" />,
      template: "weather",
    },
    {
      name: "Research & Humanize",
      description:
        "Transform complex topics into well-researched, human-friendly content while maintaining academic quality and depth.",
      icon: <Bot className="h-6 w-6" />,
      template: "research",
    },
    {
      name: "Content Creator",
      description:
        "Generate engaging content with AI assistance. Perfect for blog posts, articles, and creative writing.",
      icon: <Workflow className="h-6 w-6" />,
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
      description: "Leverage advanced language models to process, analyze, and transform content based on your needs.",
    },
    {
      icon: Code,
      title: "No-Code Solution",
      description:
        "Build complex workflows without writing any code. Configure everything through a simple visual interface.",
    },
    {
      icon: Network,
      title: "Workflow Automation",
      description:
        "Automate repetitive tasks and processes with customizable workflows that integrate with your existing tools.",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="w-full max-w-[2000px] mx-auto flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GitBranch className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">GreyFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {savedWorkflows.length > 0 && (
              <Link
                href="#workflows"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                My Workflows
              </Link>
            )}
            <Link
              href="#templates"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Templates
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleImportWorkflow}>
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Link href="/builder?new=true">
              <Button size="sm">New Workflow</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 border-b relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
          <div className="w-full max-w-[2000px] mx-auto px-4 md:px-6 relative">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="mb-4">
                  Build AI workflows visually
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                  Visual AI <span className="text-primary">Workflow Builder</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Create, test, and refine AI workflows through a visual interface. No coding required.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <Link href="/builder?new=true">
                  <Button size="lg" className="gap-2">
                    Start Building <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="gap-2 bg-transparent" onClick={handleImportWorkflow}>
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
          <section id="workflows" className="w-full py-16 md:py-20 border-b">
            <div className="w-full max-w-[2000px] mx-auto px-4 md:px-6">
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-4">My Workflows</h2>
                <p className="text-xl text-muted-foreground max-w-2xl">Continue working on your saved workflows</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedWorkflows.map((workflow) => (
                  <Card key={workflow.id} className="group transition-all duration-300 hover:shadow-md">
                    <CardHeader className="pb-3">
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
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteWorkflow(workflow.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardFooter>
                      <Link href={`/builder?load=${workflow.id}`} className="w-full">
                        <Button size="sm" className="w-full">
                          Open Workflow
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Templates Section */}
        <section id="templates" className="w-full py-16 md:py-20 border-b">
          <div className="w-full max-w-[2000px] mx-auto px-4 md:px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Ready-to-Use Templates</h2>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Start with a template and customize it for your specific needs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {workflowTemplates.map((template, index) => (
                <Card key={index} className="group transition-all duration-300 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">{template.icon}</div>
                      <div className="flex-1">
                        <CardTitle>{template.name}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className="mt-4">{template.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Link href={`/builder?template=${template.template}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Use Template
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-20 border-b">
          <div className="w-full max-w-[2000px] mx-auto px-4 md:px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Core Features</h2>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Everything you need to build powerful AI workflows
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center text-center p-6 bg-card rounded-lg border hover:shadow-md transition-all"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-16 md:py-20 bg-muted/30">
          <div className="w-full max-w-[2000px] mx-auto px-4 md:px-6">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl">Build powerful AI workflows in just a few steps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg border">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Design Your Workflow</h3>
                <p className="text-muted-foreground">
                  Drag and drop nodes onto the canvas and connect them to create your workflow logic.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg border">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Configure Components</h3>
                <p className="text-muted-foreground">
                  Set up each node with the specific parameters and connections needed for your workflow.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg border">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Run & Refine</h3>
                <p className="text-muted-foreground">
                  Test your workflow, view the results, and make adjustments to optimize performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-20">
          <div className="w-full max-w-[2000px] mx-auto px-4 md:px-6">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Building?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Create your first AI workflow using our visual interface
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/builder?new=true">
                  <Button size="lg" className="gap-2">
                    Open Builder <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="gap-2 bg-transparent" onClick={handleImportWorkflow}>
                  <Upload className="h-4 w-4" />
                  Import Workflow
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t">
        <div className="w-full max-w-[2000px] mx-auto px-4 md:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <GitBranch className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">GreyFlow</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Open-source AI workflow builder for creating powerful, visual AI processes without code.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/builder?new=true"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    New Workflow
                  </Link>
                </li>
                <li>
                  <Link
                    href="#templates"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Templates
                  </Link>
                </li>
                <li>
                  <Link
                    href="#features"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/brendmung/GreyFlow-alpha"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} GreyFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
