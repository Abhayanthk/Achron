"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ResetTimerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function ResetTimerDialog({
  open,
  onOpenChange,
  onConfirm,
}: ResetTimerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Reset Timer?</DialogTitle>
          <DialogDescription className="text-zinc-400">
            A timer is currently running. Switching presets will reset the
            current session.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Switch & Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
