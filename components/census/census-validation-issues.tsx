"use client";

import { AlertCircle, AlertTriangle, XCircle } from "lucide-react";
import { useState } from "react";

type ValidationIssue = {
  field: string;
  issueType: "missing_column" | "missing_value" | "invalid_value";
  affectedRows: number[];
  message: string;
  requiredFor: "PEO" | "ACA" | "both";
};

type CensusValidationIssuesProps = {
  issues: ValidationIssue[];
};

const getIssueIcon = (issueType: ValidationIssue["issueType"]) => {
  switch (issueType) {
    case "missing_column":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "missing_value":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "invalid_value":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getRequiredForBadge = (requiredFor: ValidationIssue["requiredFor"]) => {
  switch (requiredFor) {
    case "PEO":
      return (
        <span className="rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-700 text-xs">
          PEO
        </span>
      );
    case "ACA":
      return (
        <span className="rounded bg-purple-100 px-1.5 py-0.5 font-medium text-purple-700 text-xs">
          ACA
        </span>
      );
    default:
      return (
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700 text-xs">
          PEO + ACA
        </span>
      );
  }
};

const formatAffectedRows = (rows: number[], expanded: boolean) => {
  // Convert from 0-indexed to 1-indexed for display
  const displayRows = rows.map((r) => r + 1);

  if (displayRows.length === 0) {
    return "No rows affected";
  }

  if (!expanded && displayRows.length > 10) {
    return `Rows ${displayRows.slice(0, 10).join(", ")} and ${displayRows.length - 10} more`;
  }

  if (displayRows.length <= 10) {
    return `Row${displayRows.length === 1 ? "" : "s"} ${displayRows.join(", ")}`;
  }

  return `Rows ${displayRows.join(", ")}`;
};

export function CensusValidationIssues({
  issues,
}: CensusValidationIssuesProps) {
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Group issues by type
  const missingColumns = issues.filter((i) => i.issueType === "missing_column");
  const missingValues = issues.filter((i) => i.issueType === "missing_value");
  const invalidValues = issues.filter((i) => i.issueType === "invalid_value");

  const renderIssueGroup = (
    title: string,
    groupIssues: ValidationIssue[],
    startIndex: number
  ) => {
    if (groupIssues.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-muted-foreground text-sm">{title}</h4>
        <ul className="space-y-2">
          {groupIssues.map((issue, idx) => {
            const globalIndex = startIndex + idx;
            const isExpanded = expandedIssues.has(globalIndex);
            const hasMoreRows = issue.affectedRows.length > 10;

            return (
              <li
                className="rounded-md border bg-muted/50 p-3"
                key={`${issue.field}-${issue.issueType}`}
              >
                <div className="flex items-start gap-2">
                  {getIssueIcon(issue.issueType)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{issue.message}</span>
                      {getRequiredForBadge(issue.requiredFor)}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {issue.issueType === "missing_column"
                        ? "This column was not found in the census file"
                        : formatAffectedRows(issue.affectedRows, isExpanded)}
                      {hasMoreRows && issue.issueType !== "missing_column" && (
                        <button
                          className="ml-2 text-blue-600 text-xs hover:underline"
                          onClick={() => toggleExpand(globalIndex)}
                          type="button"
                        >
                          {isExpanded ? "Show less" : "Show all"}
                        </button>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Affects {issue.affectedRows.length} row
                      {issue.affectedRows.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-4 rounded-md border bg-muted/30 p-4">
      {renderIssueGroup("Missing Columns", missingColumns, 0)}
      {renderIssueGroup("Missing Values", missingValues, missingColumns.length)}
      {renderIssueGroup(
        "Invalid Values",
        invalidValues,
        missingColumns.length + missingValues.length
      )}
    </div>
  );
}
