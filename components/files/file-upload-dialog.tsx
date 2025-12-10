"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  onUpload: (
    file: File,
    category: FileCategory,
    relevantTo?: string[],
    isRequired?: boolean,
    description?: string
  ) => Promise<void>;
  trigger?: React.ReactNode;
}

export function FileUploadDialog({ onUpload, trigger }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<FileCategory>("other");
  const [uploading, setUploading] = useState(false);
  const [relevantToPEO, setRelevantToPEO] = useState(false);
  const [relevantToACA, setRelevantToACA] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null); // Clear any previous errors
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
    setError(null); // Clear any previous errors
    try {
      const relevantTo = [];
      if (relevantToPEO) relevantTo.push("PEO");
      if (relevantToACA) relevantTo.push("ACA");

      await onUpload(
        selectedFile,
        category,
        relevantTo.length > 0 ? relevantTo : undefined,
        isRequired,
        description || undefined
      );
      setOpen(false);
      setSelectedFile(null);
      setCategory("other");
      setRelevantToPEO(false);
      setRelevantToACA(false);
      setIsRequired(false);
      setDescription("");
      setError(null);
    } catch (error) {
      // Display user-friendly error message
      console.error("Upload failed:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "An unexpected error occurred while uploading the file. Please try again."
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedFile(null);
    setCategory("other");
    setRelevantToPEO(false);
    setRelevantToACA(false);
    setIsRequired(false);
    setDescription("");
    setError(null);
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
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
              <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="font-medium">Upload failed</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}
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

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              disabled={uploading}
              id="description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the file..."
              type="text"
              value={description}
            />
          </div>

          <div className="space-y-2">
            <Label>Relevant To</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={relevantToPEO}
                  disabled={uploading}
                  id="relevant-peo"
                  onCheckedChange={setRelevantToPEO}
                />
                <Label
                  className="cursor-pointer font-normal"
                  htmlFor="relevant-peo"
                >
                  PEO Team
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={relevantToACA}
                  disabled={uploading}
                  id="relevant-aca"
                  onCheckedChange={setRelevantToACA}
                />
                <Label
                  className="cursor-pointer font-normal"
                  htmlFor="relevant-aca"
                >
                  ACA Team
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={isRequired}
              disabled={uploading}
              id="is-required"
              onCheckedChange={setIsRequired}
            />
            <Label className="cursor-pointer font-normal" htmlFor="is-required">
              Required Document
            </Label>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              disabled={uploading}
              onClick={handleCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={!selectedFile || uploading}
              type="submit"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
