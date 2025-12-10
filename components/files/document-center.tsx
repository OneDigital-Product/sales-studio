"use client";

import { Download, Trash } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileCommentButton } from "../comments/file-comment-button";
import { VerifyFileDialog } from "./verify-file-dialog";

// File type based on schema
type FileCategory =
  | "census"
  | "plan_summary"
  | "claims_history"
  | "renewal_letter"
  | "proposal"
  | "contract"
  | "other";

interface FileData {
  _id: string;
  name: string;
  uploadedAt: number;
  url?: string;
  category?: FileCategory;
  relevantTo?: ("PEO" | "ACA")[];
  isVerified?: boolean;
  verifiedBy?: string;
}

interface DocumentCenterProps {
  files: FileData[];
  clientId: string;
  onVerifyFile: (fileId: string, verifiedBy: string) => void;
  onDeleteFile: (fileId: string) => void;
}

// Category display names and order
const CATEGORY_CONFIG: Record<FileCategory, { label: string; order: number }> =
  {
    census: { label: "Census Data", order: 1 },
    plan_summary: { label: "Plan Summary", order: 2 },
    claims_history: { label: "Claims History", order: 3 },
    renewal_letter: { label: "Renewal Letters", order: 4 },
    proposal: { label: "Proposals", order: 5 },
    contract: { label: "Contracts", order: 6 },
    other: { label: "Other Documents", order: 7 },
  };

export function DocumentCenter({
  files,
  clientId,
  onVerifyFile,
  onDeleteFile,
}: DocumentCenterProps) {
  // Filter state: "all" or specific category
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  // Team filter state: "all", "PEO", or "ACA"
  const [teamFilter, setTeamFilter] = useState<string>("all");

  // Apply team filter to files first
  const teamFilteredFiles =
    teamFilter === "all"
      ? files
      : files.filter(
          (file) =>
            file.relevantTo &&
            file.relevantTo.includes(teamFilter as "PEO" | "ACA")
        );

  // Group files by category
  const groupedFiles = teamFilteredFiles.reduce(
    (acc, file) => {
      const category = (file.category || "other") as FileCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(file);
      return acc;
    },
    {} as Record<FileCategory, FileData[]>
  );

  // Sort categories by configured order
  const sortedCategories = Object.keys(groupedFiles).sort(
    (a, b) =>
      CATEGORY_CONFIG[a as FileCategory].order -
      CATEGORY_CONFIG[b as FileCategory].order
  ) as FileCategory[];

  // Filter categories based on selection
  const filteredCategories =
    categoryFilter === "all"
      ? sortedCategories
      : sortedCategories.filter((cat) => cat === categoryFilter);

  if (files.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Name</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="h-24 text-center text-gray-500" colSpan={2}>
                No files yet.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  // Show message if teamFilteredFiles is empty after filtering
  if (teamFilteredFiles.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-gray-500">
        No files match the selected team filter.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Category Filter */}
        <div className="flex items-center gap-3">
          <label
            className="font-medium text-gray-700 text-sm"
            htmlFor="category-filter"
          >
            Filter by Category:
          </label>
          <Select onValueChange={setCategoryFilter} value={categoryFilter}>
            <SelectTrigger className="w-[200px]" id="category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_CONFIG)
                .sort((a, b) => a[1].order - b[1].order)
                .map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Team Filter */}
        <div className="flex items-center gap-3">
          <label
            className="font-medium text-gray-700 text-sm"
            htmlFor="team-filter"
          >
            Filter by Team:
          </label>
          <Select onValueChange={setTeamFilter} value={teamFilter}>
            <SelectTrigger className="w-[200px]" id="team-filter">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="PEO">PEO Team</SelectItem>
              <SelectItem value="ACA">ACA Team</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Sections */}
      {filteredCategories.map((category) => (
        <div className="space-y-2" key={category}>
          {/* Category Header */}
          <h3 className="font-semibold text-gray-700 text-lg">
            {CATEGORY_CONFIG[category].label}
          </h3>

          {/* Files Table for Category */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Name</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedFiles[category]?.map((file) => (
                  <TableRow key={file._id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="block">{file.name}</span>
                          {file.isVerified && (
                            <Badge
                              className="bg-green-600 text-xs"
                              variant="default"
                            >
                              ✓ Verified
                            </Badge>
                          )}
                          {file.isRequired && (
                            <Badge className="text-xs" variant="destructive">
                              Required
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </span>
                          {file.relevantTo && file.relevantTo.length > 0 && (
                            <div className="flex gap-1">
                              {file.relevantTo.map((team) => (
                                <Badge
                                  className="text-xs"
                                  key={team}
                                  variant={
                                    team === "PEO" ? "default" : "secondary"
                                  }
                                >
                                  {team}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {file.isVerified && file.verifiedBy && (
                            <span className="text-gray-500 text-xs">
                              by {file.verifiedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <FileCommentButton
                          clientId={clientId}
                          fileId={file._id}
                          fileName={file.name}
                        />
                        {!file.isVerified && (
                          <VerifyFileDialog
                            fileName={file.name}
                            onVerify={(verifiedBy) =>
                              onVerifyFile(file._id, verifiedBy)
                            }
                          />
                        )}
                        {file.url && (
                          <Button
                            aria-label={`Download ${file.name}`}
                            asChild
                            className="h-8 w-8"
                            size="icon"
                            variant="ghost"
                          >
                            <a
                              href={file.url}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          aria-label={`Delete ${file.name}`}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => onDeleteFile(file._id)}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete {file.name}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}
