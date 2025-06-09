"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
}: {
  targetRole: string;
  setTargetRole: (value: string) => void;
  targetIndustry: string;
  setTargetIndustry: (value: string) => void;
}) => (
  <div className="grid gap-4 py-4 px-4">
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
);

export function ImproveResumeModal({
  isOpen,
  onClose,
  onStartImprovement,
}: ImproveResumeModalProps) {
  const [targetRole, setTargetRole] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [isImproving, setIsImproving] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

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

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-purple-500" />
              Improve Your Resume
            </DialogTitle>
            <DialogDescription>
              Tell us your goal, and our AI will rewrite your resume to match
              it.
            </DialogDescription>
          </DialogHeader>
          <FormContent
            targetRole={targetRole}
            setTargetRole={setTargetRole}
            targetIndustry={targetIndustry}
            setTargetIndustry={setTargetIndustry}
          />
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

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Sparkles className="text-purple-500" />
              Improve Your Resume
            </DrawerTitle>
            <DrawerDescription>
              Tell us your goal, and our AI will rewrite your resume to match
              it.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <FormContent
              targetRole={targetRole}
              setTargetRole={setTargetRole}
              targetIndustry={targetIndustry}
              setTargetIndustry={setTargetIndustry}
            />
          </div>
          <DrawerFooter className="pt-2">
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
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
