"use client"

import { useState } from "react"
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

interface NewWorkflowDialogProps {
  isOpen: boolean;
  onClose: (e?: React.MouseEvent | React.KeyboardEvent) => void;
  onConfirm: (name: string) => void;
}

export function NewWorkflowDialog({ isOpen, onClose, onConfirm }: NewWorkflowDialogProps) {
  const [workflowName, setWorkflowName] = useState("New Workflow")

  const handleConfirm = () => {
    onConfirm(workflowName)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
          <DialogDescription>
            Enter a name for your new workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow Name"
            className="w-full"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={(e) => onClose(e)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Create Workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
