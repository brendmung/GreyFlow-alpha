"use client"

import { Handle, Position } from "reactflow"
import { FileText } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PDFNodeProps {
  data: {
    label: string
    pdfConfig?: {
      filename?: string
      documentType?: "general" | "cv" | "research" | "report" | "letter" | "custom"
    }
    isExecuting?: boolean
    isCompleted?: boolean
    hasError?: boolean
  }
  selected: boolean
  id: string
}

const DOCUMENT_TYPES = [
  { value: "general", label: "General Document" },
  { value: "cv", label: "CV/Resume" },
  { value: "research", label: "Research Paper" },
  { value: "report", label: "Report" },
  { value: "letter", label: "Letter" },
  { value: "custom", label: "Custom" }
]

export function PDFNode({ data, selected, id }: PDFNodeProps) {
  const borderColor = data.hasError
    ? "border-red-500"
    : data.isCompleted
    ? "border-green-500"
    : data.isExecuting
    ? "border-blue-600 bg-blue-50 shadow-lg animate-pulse"
    : selected
    ? "border-gray-900 dark:border-gray-100"
    : "border-gray-200 dark:border-gray-800"

  return (
    <div className={`px-4 py-2 rounded-md border-2 bg-background ${borderColor} min-w-[200px]`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      
      <div className="flex items-center gap-2">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-orange-100">
          <FileText className="w-4 h-4 text-orange-500" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-medium">{data.label}</p>
          <p className="text-xs text-gray-500">Smart PDF Generator</p>
        </div>
      </div>

      <div className="mt-2 space-y-2">
        <div>
          <Label className="text-xs">Document Type</Label>
          <Select
            value={data.pdfConfig?.documentType || "general"}
            onValueChange={(value) => {
              // Handle document type change
            }}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value} className="text-xs">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Filename</Label>
          <Input
            value={data.pdfConfig?.filename || ""}
            placeholder="document.pdf"
            onChange={(e) => {
              // Handle filename change
            }}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  )
} 