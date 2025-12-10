"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VerifyFileDialogProps {
  onVerify: (verifiedBy: string) => Promise<void>;
  fileName: string;
  trigger?: React.ReactNode;
}

export function VerifyFileDialog({
  onVerify,
  fileName,
  trigger,
}: VerifyFileDialogProps) {
  const [open, setOpen] = useState(false);
  const [verifiedBy, setVerifiedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedBy.trim()) return;

    setSubmitting(true);
    try {
      await onVerify(verifiedBy.trim());
      setOpen(false);
      setVerifiedBy("");
    } catch (error) {
      console.error("Failed to verify file:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setVerifiedBy("");
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark as Verified
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark File as Verified</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>File</Label>
            <div className="text-gray-600 text-sm">{fileName}</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="verifiedBy">Verified By</Label>
            <Input
              id="verifiedBy"
              onChange={(e) => setVerifiedBy(e.target.value)}
              placeholder="Enter your name"
              required
              value={verifiedBy}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              disabled={submitting}
              onClick={handleCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={!verifiedBy.trim() || submitting} type="submit">
              {submitting ? "Verifying..." : "Mark as Verified"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
