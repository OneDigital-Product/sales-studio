"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FileCategory =
  | "census"
  | "plan_summary"
  | "claims_history"
  | "renewal_letter"
  | "proposal"
  | "contract"
  | "other";

interface FileData {
  category?: FileCategory;
}

interface RequirementsChecklistProps {
  files: FileData[];
}

// Define required document types
const REQUIRED_DOCUMENTS: {
  category: FileCategory;
  label: string;
  description: string;
}[] = [
  {
    category: "census",
    label: "Census Data",
    description:
      "Employee census file with demographics and coverage information",
  },
  {
    category: "plan_summary",
    label: "Plan Summary",
    description: "Current plan summary or benefits documentation",
  },
  {
    category: "renewal_letter",
    label: "Renewal Letter",
    description: "Most recent renewal letter from current carrier",
  },
];

export function RequirementsChecklist({ files }: RequirementsChecklistProps) {
  // Get uploaded categories
  const uploadedCategories = new Set(
    files.map((f) => f.category).filter((c) => c !== undefined)
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-primary/10 p-4">
        <p className="text-gray-700 text-sm">
          The following documents are required for a complete quote. Upload
          missing documents to improve quote processing time.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {REQUIRED_DOCUMENTS.map((doc) => {
              const isUploaded = uploadedCategories.has(doc.category);
              return (
                <TableRow
                  className={isUploaded ? "bg-green-50" : "bg-yellow-50"}
                  key={doc.category}
                >
                  <TableCell>
                    {isUploaded ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-yellow-600" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{doc.label}</span>
                      {!isUploaded && (
                        <span className="font-normal text-xs text-yellow-700">
                          (Missing)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {doc.description}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-md border bg-gray-50 p-4">
        <p className="font-medium text-gray-700 text-sm">Completion Summary</p>
        <p className="mt-1 text-gray-600 text-xs">
          {uploadedCategories.size} of {REQUIRED_DOCUMENTS.length} required
          documents uploaded (
          {Math.round(
            (uploadedCategories.size / REQUIRED_DOCUMENTS.length) * 100
          )}
          % complete)
        </p>
      </div>
    </div>
  );
}
