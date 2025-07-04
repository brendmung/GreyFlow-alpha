import { memo } from "react"
import { Handle, Position } from "reactflow"
import { FileText, Loader2, Settings } from "lucide-react"

export const WordNode = memo(({ data, isConnectable }) => {
  const isExecuting = data.isExecuting
  const isCompleted = data.isCompleted
  const hasError = data.hasError

  return (
    <div
      className={`px-4 py-2 shadow-md rounded-md border-2 w-48 transition-all duration-300 ${
        hasError
          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
          : isExecuting
            ? "border-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 shadow-lg animate-pulse"
            : isCompleted
              ? "border-green-500 bg-green-50 dark:bg-green-950/30"
              : "border-cyan-500 bg-white dark:bg-gray-800"
      }`}
    >
      <div className="flex items-center">
        <div
          className={`rounded-full w-8 h-8 flex items-center justify-center transition-colors ${
            hasError
              ? "bg-red-100 dark:bg-red-900/50"
              : isExecuting
                ? "bg-cyan-200 dark:bg-cyan-900/50"
                : isCompleted
                  ? "bg-green-100 dark:bg-green-900/50"
                  : "bg-cyan-100 dark:bg-cyan-900/50"
          }`}
        >
          {isExecuting ? (
            <Loader2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-spin" />
          ) : (
            <FileText
              className={`w-4 h-4 ${
                hasError
                  ? "text-red-500 dark:text-red-400"
                  : isCompleted
                    ? "text-green-500 dark:text-green-400"
                    : "text-cyan-500 dark:text-cyan-400"
              }`}
            />
          )}
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{data.label}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Word Generator</div>
        </div>
      </div>
      {data.wordConfig?.filename && (
        <div className="mt-1 flex items-center">
          <Settings className="w-3 h-3 text-gray-400 mr-1" />
          <div className="text-xs text-gray-400 truncate">{data.wordConfig.filename}</div>
        </div>
      )}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        isConnectable={isConnectable}
        className={`w-3 h-3 transition-colors ${
          hasError ? "bg-red-500" : isExecuting ? "bg-cyan-600" : isCompleted ? "bg-green-500" : "bg-cyan-500"
        }`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        isConnectable={isConnectable}
        className={`w-3 h-3 transition-colors ${
          hasError ? "bg-red-500" : isExecuting ? "bg-cyan-600" : isCompleted ? "bg-green-500" : "bg-cyan-500"
        }`}
      />
    </div>
  )
})

WordNode.displayName = "WordNode"
