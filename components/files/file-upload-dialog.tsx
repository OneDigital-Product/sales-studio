"use client";

import { Upload } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FileCategory =
  | "census"
  | "plan_summary"
  | "claims_history"
  | "renewal_letter"
  | "proposal"
  | "contract"
  | "other";

const CATEGORY_OPTIONS: { value: FileCategory; label: string }[] = [
  { value: "census", label: "Census Data" },
  { value: "plan_summary", label: "Plan Summary" },
  { value: "claims_history", label: "Claims History" },
  { value: "renewal_letter", label: "Renewal Letter" },
  { value: "proposal", label: "Proposal" },
  { value: "contract", label: "Contract" },
  { value: "other", label: "Other" },
];

interface FileUploadDialogProps {
  onUpload: (file: File, category: FileCategory) => Promise<void>;
  trigger?: React.ReactNode;
}

export function FileUploadDialog({ onUpload, trigger }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<FileCategory>("other");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect category based on filename
      const detectedCategory = detectFileCategory(file.name);
      if (detectedCategory) {
        setCategory(detectedCategory);
      }
    }
  };

  const detectFileCategory = (filename: string): FileCategory | undefined => {
    const lower = filename.toLowerCase();
    if (lower.includes("plan") && lower.includes("summary"))
      return "plan_summary";
    if (lower.includes("claims") || lower.includes("claim history"))
      return "claims_history";
    if (lower.includes("renewal")) return "renewal_letter";
    if (lower.includes("proposal")) return "proposal";
    if (lower.includes("contract")) return "contract";
    if (
      lower.includes("census") ||
      lower.includes("employee") ||
      lower.includes("roster")
    )
      return "census";
    return;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      await onUpload(selectedFile, category);
      setOpen(false);
      setSelectedFile(null);
      setCategory("other");
    } catch (error) {
      // Error handling
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedFile(null);
    setCategory("other");
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              disabled={uploading}
              id="file"
              onChange={handleFileChange}
              required
              type="file"
            />
            {selectedFile && (
              <p className="text-muted-foreground text-sm">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              disabled={uploading}
              onValueChange={(value) => setCategory(value as FileCategory)}
              value={category}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              disabled={uploading}
              onClick={handleCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={!selectedFile || uploading} type="submit">
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
