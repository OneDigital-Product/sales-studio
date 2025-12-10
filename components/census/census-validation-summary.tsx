"use client";

import { useQuery } from "convex/react";
import { AlertCircle, CheckCircle2, FileQuestion, XCircle } from "lucide-react";
import { useMemo } from "react";
import { CreateRequestDialog } from "@/components/info-requests/create-request-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type CensusValidationSummaryProps = {
  censusUploadId: Id<"census_uploads">;
  clientId: Id<"clients">;
};

export function CensusValidationSummary({
  censusUploadId,
  clientId,
}: CensusValidationSummaryProps) {
  const validation = useQuery(api.censusValidation.getValidation, {
    censusUploadId,
  });

  // Convert validation issues to request items
  const prePopulatedItems = useMemo(() => {
    if (!validation || validation.issues.length === 0) {
      return [];
    }
    return validation.issues.map((issue) => ({
      description: `${issue.message} (${issue.issueType === "missing_column" ? "affects all rows" : `affects ${issue.affectedRows.length} rows`})`,
      category: "Census Data",
    }));
  }, [validation]);

  // Determine default quote type based on issues
  const defaultQuoteType = useMemo(() => {
    if (!validation || validation.issues.length === 0) {
      return;
    }
    const hasPeoIssues = validation.issues.some(
      (i) => i.requiredFor === "PEO" || i.requiredFor === "both"
    );
    const hasAcaIssues = validation.issues.some(
      (i) => i.requiredFor === "ACA" || i.requiredFor === "both"
    );
    if (hasPeoIssues && hasAcaIssues) return "both";
    if (hasPeoIssues) return "PEO";
    if (hasAcaIssues) return "ACA";
    return;
  }, [validation]);

  if (!validation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Census Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Running validation...</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-50 border-green-200";
    if (score >= 70) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Census Validation Summary</CardTitle>
            {validation.issues.length > 0 && (
              <CreateRequestDialog
                clientId={clientId}
                defaultQuoteType={defaultQuoteType}
                prePopulatedItems={prePopulatedItems}
                trigger={
                  <Button size="sm" variant="outline">
                    <FileQuestion className="mr-2 h-4 w-4" />
                    Request Missing Info
                  </Button>
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`rounded-lg border p-4 ${getScoreBgColor(validation.peoScore)}`}
            >
              <div className="font-medium text-muted-foreground text-sm">
                PEO Score
              </div>
              <div
                className={`font-bold text-3xl ${getScoreColor(validation.peoScore)}`}
              >
                {validation.peoScore}%
              </div>
              <div className="mt-1 text-muted-foreground text-xs">
                {validation.peoValidRows} of {validation.totalRows} rows valid
              </div>
            </div>
            <div
              className={`rounded-lg border p-4 ${getScoreBgColor(validation.acaScore)}`}
            >
              <div className="font-medium text-muted-foreground text-sm">
                ACA Score
              </div>
              <div
                className={`font-bold text-3xl ${getScoreColor(validation.acaScore)}`}
              >
                {validation.acaScore}%
              </div>
              <div className="mt-1 text-muted-foreground text-xs">
                {validation.acaValidRows} of {validation.totalRows} rows valid
              </div>
            </div>
          </div>

          {/* Issues */}
          {validation.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Validation Issues</h4>
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {validation.issues.map((issue, index) => (
                  <div
                    className="flex items-start gap-2 rounded-md border bg-white p-3"
                    key={`${issue.field}-${issue.issueType}-${index}`}
                  >
                    {issue.issueType === "missing_column" ? (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    ) : issue.issueType === "missing_value" ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {issue.message}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 text-xs">
                          {issue.requiredFor}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {issue.issueType === "missing_column"
                          ? "Affects all rows"
                          : `Affects ${issue.affectedRows.length} row${issue.affectedRows.length === 1 ? "" : "s"}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success state */}
          {validation.issues.length === 0 && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <div className="font-medium text-green-900 text-sm">
                  No validation issues found
                </div>
                <div className="text-green-700 text-xs">
                  All rows contain valid data for both PEO and ACA requirements
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
