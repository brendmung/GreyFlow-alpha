import { memo } from "react"
import { Handle, Position } from "reactflow"
import { MessageSquare, Loader2 } from "lucide-react"

export const OutputNode = memo(({ data, isConnectable }) => {
  const isExecuting = data.isExecuting
  const isCompleted = data.isCompleted
  const hasError = data.hasError

  return (
    <div
      className={`px-4 py-2 shadow-md rounded-md bg-white border-2 w-48 transition-all duration-300 ${
        hasError
          ? "border-red-500 bg-red-50"
          : isExecuting
            ? "border-purple-600 bg-purple-50 shadow-lg animate-pulse"
            : isCompleted
              ? "border-green-500 bg-green-50"
              : "border-purple-500"
      }`}
    >
      <div className="flex items-center">
        <div
          className={`rounded-full w-8 h-8 flex items-center justify-center transition-colors ${
            hasError ? "bg-red-100" : isExecuting ? "bg-purple-200" : isCompleted ? "bg-green-100" : "bg-purple-100"
          }`}
        >
          {isExecuting ? (
            <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
          ) : (
            <MessageSquare
              className={`w-4 h-4 ${hasError ? "text-red-500" : isCompleted ? "text-green-500" : "text-purple-500"}`}
            />
          )}
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold">{data.label}</div>
          <div className="text-xs text-gray-500">Response Agent</div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        isConnectable={isConnectable}
        className={`w-3 h-3 transition-colors ${
          hasError ? "bg-red-500" : isExecuting ? "bg-purple-600" : isCompleted ? "bg-green-500" : "bg-purple-500"
        }`}
      />
    </div>
  )
})

OutputNode.displayName = "OutputNode"
