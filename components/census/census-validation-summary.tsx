"use client";

import { useQuery } from "convex/react";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CensusValidationIssues } from "./census-validation-issues";

type CensusValidationSummaryProps = {
  censusUploadId: Id<"census_uploads">;
  onDismiss?: () => void;
};

type ValidationIssue = {
  field: string;
  issueType: "missing_column" | "missing_value" | "invalid_value";
  affectedRows: number[];
  message: string;
  requiredFor: "PEO" | "ACA" | "both";
};

const getScoreColor = (score: number) => {
  if (score >= 90) {
    return "text-green-600";
  }
  if (score >= 70) {
    return "text-yellow-600";
  }
  return "text-red-600";
};

const getScoreIcon = (score: number) => {
  if (score >= 90) {
    return "bg-green-500";
  }
  if (score >= 70) {
    return "bg-yellow-500";
  }
  return "bg-red-500";
};

const getProgressColor = (score: number) => {
  if (score >= 90) {
    return "bg-green-500";
  }
  if (score >= 70) {
    return "bg-yellow-500";
  }
  return "bg-red-500";
};

const buildMailtoLink = (issues: ValidationIssue[]) => {
  const subject = encodeURIComponent("Missing Census Data Required");

  const issuesList = issues
    .map((issue) => {
      const rowCount = issue.affectedRows.length;
      if (issue.issueType === "missing_column") {
        return `- Missing "${issue.field}" column (affects all rows)`;
      }
      const rowPreview =
        rowCount <= 5
          ? `rows ${issue.affectedRows.map((r) => r + 1).join(", ")}`
          : `${rowCount} rows`;
      return `- ${issue.message} (${rowPreview})`;
    })
    .join("\n");

  const body = encodeURIComponent(
    `Hi,

We found the following issues with the census data:

${issuesList}

Please provide the missing information so we can proceed with your quote.

Thanks`
  );

  return `mailto:?subject=${subject}&body=${body}`;
};

export function CensusValidationSummary({
  censusUploadId,
  onDismiss,
}: CensusValidationSummaryProps) {
  const validation = useQuery(api.censusValidation.getValidation, {
    censusUploadId,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Loading state
  if (validation === undefined) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Validating census data...
          </span>
        </CardContent>
      </Card>
    );
  }

  // No validation yet (still processing)
  if (validation === null) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Validation in progress...
          </span>
        </CardContent>
      </Card>
    );
  }

  // Dismissed by user
  if (dismissed) {
    return null;
  }

  const { peoScore, acaScore, issues, totalRows, peoValidRows, acaValidRows } =
    validation;
  const hasIssues = issues.length > 0;
  const peoIssues = issues.filter(
    (i: ValidationIssue) => i.requiredFor === "PEO" || i.requiredFor === "both"
  );
  const acaIssues = issues.filter(
    (i: ValidationIssue) => i.requiredFor === "ACA" || i.requiredFor === "both"
  );

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasIssues ? (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          Census Validation Results
        </CardTitle>
        <CardDescription>
          {totalRows} rows analyzed
          {hasIssues
            ? ` - ${issues.length} issue${issues.length === 1 ? "" : "s"} found`
            : " - All data valid"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score bars */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">PEO Ready</span>
              <span className={getScoreColor(peoScore)}>{peoScore}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${getProgressColor(peoScore)}`}
                style={{ width: `${peoScore}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {peoValidRows} of {totalRows} rows valid
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">ACA Ready</span>
              <span className={getScoreColor(acaScore)}>{acaScore}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${getProgressColor(acaScore)}`}
                style={{ width: `${acaScore}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {acaValidRows} of {totalRows} rows valid
            </p>
          </div>
        </div>

        {/* Issues summary */}
        {hasIssues && (
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-sm">
              {peoIssues.length > 0 && (
                <span className="flex items-center gap-1">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${getScoreIcon(peoScore)}`}
                  />
                  {peoIssues.length} PEO issue
                  {peoIssues.length === 1 ? "" : "s"}
                </span>
              )}
              {acaIssues.length > 0 && (
                <span className="flex items-center gap-1">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${getScoreIcon(acaScore)}`}
                  />
                  {acaIssues.length} ACA issue
                  {acaIssues.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Expandable issues list */}
        {hasIssues && showDetails && <CensusValidationIssues issues={issues} />}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {hasIssues && (
            <>
              <Button
                onClick={() => setShowDetails(!showDetails)}
                size="sm"
                variant="outline"
              >
                {showDetails ? "Hide Details" : "View Details"}
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={buildMailtoLink(issues)}>
                  <Mail className="mr-1 h-4 w-4" />
                  Request Missing Info
                </a>
              </Button>
            </>
          )}
          <Button onClick={handleDismiss} size="sm" variant="ghost">
            {hasIssues ? "Proceed Anyway" : "Dismiss"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
