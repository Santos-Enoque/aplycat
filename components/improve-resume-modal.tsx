"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImproveResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartImprovement: (targetRole: string, targetIndustry: string) => void;
}

export function ImproveResumeModal({
  isOpen,
  onClose,
  onStartImprovement,
}: ImproveResumeModalProps) {
  const [targetRole, setTargetRole] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [isImproving, setIsImproving] = useState(false);

  const handleStart = () => {
    if (!targetRole.trim() || !targetIndustry.trim()) {
      toast.error("Both fields are required.", {
        description: "Please specify your target role and industry.",
      });
      return;
    }
    setIsImproving(true);
    onStartImprovement(targetRole, targetIndustry);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-purple-500" />
            Improve Your Resume
          </DialogTitle>
          <DialogDescription>
            Tell us your goal, and our AI will rewrite your resume to match it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target-role" className="text-right">
              Target Role
            </Label>
            <Input
              id="target-role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target-industry" className="text-right">
              Industry
            </Label>
            <Input
              id="target-industry"
              value={targetIndustry}
              onChange={(e) => setTargetIndustry(e.target.value)}
              placeholder="e.g., Tech / SaaS"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleStart}
            disabled={
              isImproving || !targetRole.trim() || !targetIndustry.trim()
            }
          >
            {isImproving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Start Improvement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
