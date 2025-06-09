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

const FormContent = ({
  targetRole,
  setTargetRole,
  targetIndustry,
  setTargetIndustry,
  isImproving,
  handleStart,
}: {
  targetRole: string;
  setTargetRole: (value: string) => void;
  targetIndustry: string;
  setTargetIndustry: (value: string) => void;
  isImproving: boolean;
  handleStart: () => void;
}) => (
  <>
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="target-role">Target Role</Label>
        <Input
          id="target-role"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g., Senior Software Engineer"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="target-industry">Industry</Label>
        <Input
          id="target-industry"
          value={targetIndustry}
          onChange={(e) => setTargetIndustry(e.target.value)}
          placeholder="e.g., Tech / SaaS"
        />
      </div>
    </div>
    <DialogFooter>
      <Button
        type="button"
        onClick={handleStart}
        disabled={isImproving || !targetRole.trim() || !targetIndustry.trim()}
        className="w-full"
      >
        {isImproving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Start Improvement
      </Button>
    </DialogFooter>
  </>
);

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
      <DialogContent className="sm:max-w-[425px] w-[90%] rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-purple-500" />
            Improve Your Resume
          </DialogTitle>
          <DialogDescription>
            Tell us your goal, and our AI will rewrite your resume to match it.
          </DialogDescription>
        </DialogHeader>
        <FormContent
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          targetIndustry={targetIndustry}
          setTargetIndustry={setTargetIndustry}
          isImproving={isImproving}
          handleStart={handleStart}
        />
      </DialogContent>
    </Dialog>
  );
}
