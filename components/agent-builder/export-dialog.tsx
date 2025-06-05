"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onExport: (name: string) => void
  defaultName: string
}

export function ExportDialog({ isOpen, onClose, onExport, defaultName }: ExportDialogProps) {
  const [workflowName, setWorkflowName] = useState(defaultName)

  useEffect(() => {
    setWorkflowName(defaultName)
  }, [defaultName])

  const handleExport = () => {
    onExport(workflowName)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Workflow</DialogTitle>
          <DialogDescription>
            Enter a name for your workflow before exporting.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow Name"
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 