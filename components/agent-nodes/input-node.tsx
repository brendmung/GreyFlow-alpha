import { memo } from "react"
import { Handle, Position } from "reactflow"
import { Bot, Loader2, MessageSquare } from "lucide-react"

interface InputNodeData {
  label: string
  prompt?: string
  isExecuting?: boolean
  isCompleted?: boolean
  hasError?: boolean
}

interface InputNodeProps {
  data: InputNodeData
  isConnectable: boolean
}

export const InputNode = memo(({ data, isConnectable }: InputNodeProps) => {
  const isExecuting = data.isExecuting
  const isCompleted = data.isCompleted
  const hasError = data.hasError
  const prompt = data.prompt || "Enter your input..."

  return (
    <div
      className={`px-4 py-2 shadow-md rounded-md bg-white border-2 w-64 transition-all duration-300 ${
        hasError
          ? "border-red-500 bg-red-50"
          : isExecuting
            ? "border-blue-600 bg-blue-50 shadow-lg animate-pulse"
            : isCompleted
              ? "border-green-500 bg-green-50"
              : "border-blue-500"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        isConnectable={isConnectable}
        className={`w-3 h-3 transition-colors ${
          hasError ? "bg-red-500" : isExecuting ? "bg-blue-600" : isCompleted ? "bg-green-500" : "bg-blue-500"
        }`}
      />
      <div className="flex items-center">
        <div
          className={`rounded-full w-8 h-8 flex items-center justify-center transition-colors ${
            hasError ? "bg-red-100" : isExecuting ? "bg-blue-200" : isCompleted ? "bg-green-100" : "bg-blue-100"
          }`}
        >
          {isExecuting ? (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          ) : (
            <MessageSquare
              className={`w-4 h-4 ${hasError ? "text-red-500" : isCompleted ? "text-green-500" : "text-blue-500"}`}
            />
          )}
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold">{data.label}</div>
          <div className="text-xs text-gray-500">Input Agent</div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
        {prompt}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        isConnectable={isConnectable}
        className={`w-3 h-3 transition-colors ${
          hasError ? "bg-red-500" : isExecuting ? "bg-blue-600" : isCompleted ? "bg-green-500" : "bg-blue-500"
        }`}
      />
    </div>
  )
})

InputNode.displayName = "InputNode"

