"use client";

import { useQuery } from "convex/react";
import { AlertCircle, CheckCircle2, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type ValidationIssue = {
  field: string;
  issueType: "missing_column" | "missing_value" | "invalid_value";
  affectedRows: number[];
  message: string;
  requiredFor: "PEO" | "ACA" | "both";
};

type ValidationData = {
  issues: ValidationIssue[];
} | null;

type FilterMode = "all" | "valid" | "issues";

type CensusViewerProps = {
  censusUploadId: Id<"census_uploads">;
  validation?: ValidationData;
};

// Map column names to field names using the same normalization logic as validation
const normalizeColumnName = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[_\-\s]+/g, " ");

const FIELD_ALIASES: Record<string, string[]> = {
  employee_name: [
    "name",
    "employee",
    "full name",
    "first name",
    "employee name",
  ],
  date_of_birth: ["dob", "birth date", "birthdate", "date of birth"],
  zip_code: ["zip", "postal code", "zipcode", "zip code"],
  salary: ["annual salary", "compensation", "pay", "wage", "salary"],
  coverage_tier: [
    "tier",
    "coverage",
    "plan tier",
    "ee/es/ec/fam",
    "coverage tier",
  ],
  hours_per_week: ["hours", "weekly hours", "hrs/wk", "hours per week"],
  hire_date: ["start date", "date of hire", "employment date", "hire date"],
};

const findFieldForColumn = (column: string): string | null => {
  const normalized = normalizeColumnName(column);
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    const allNames = [field, ...aliases].map(normalizeColumnName);
    if (allNames.includes(normalized)) {
      return field;
    }
  }
  return null;
};

export function CensusViewer({
  censusUploadId,
  validation,
}: CensusViewerProps) {
  const data = useQuery(api.census.getCensus, {
    censusUploadId,
    paginationOpts: { numItems: 50, cursor: null },
  });
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Build issue maps for efficient lookup
  const { rowIssues, columnIssues, rowsWithIssues, validRows } = useMemo(() => {
    const issuesByRow = new Map<number, Map<string, ValidationIssue>>();
    const missingColumns = new Set<string>();
    const rowsWithProblems = new Set<number>();

    if (validation?.issues) {
      for (const issue of validation.issues) {
        if (issue.issueType === "missing_column") {
          missingColumns.add(issue.field);
        } else {
          for (const rowIndex of issue.affectedRows) {
            rowsWithProblems.add(rowIndex);
            if (!issuesByRow.has(rowIndex)) {
              issuesByRow.set(rowIndex, new Map());
            }
            issuesByRow.get(rowIndex)?.set(issue.field, issue);
          }
        }
      }
    }

    // Calculate valid rows (total rows minus rows with issues)
    const allRows = data?.rows.page.map((r) => r.rowIndex) ?? [];
    const rowsWithoutIssues = new Set(
      allRows.filter((idx) => !rowsWithProblems.has(idx))
    );

    return {
      rowIssues: issuesByRow,
      columnIssues: missingColumns,
      rowsWithIssues: rowsWithProblems,
      validRows: rowsWithoutIssues,
    };
  }, [validation, data]);

  if (!data) {
    return <div className="p-4">Loading census data...</div>;
  }

  const { upload, rows } = data;

  // Filter rows based on filter mode
  const filteredRows = rows.page.filter((row) => {
    if (filterMode === "all") {
      return true;
    }
    if (filterMode === "valid") {
      return validRows.has(row.rowIndex);
    }
    if (filterMode === "issues") {
      return rowsWithIssues.has(row.rowIndex);
    }
    return true;
  });

  const getCellClassName = (column: string, rowIndex: number) => {
    const field = findFieldForColumn(column);
    if (!field) {
      return "";
    }

    // Check if this column is entirely missing
    if (columnIssues.has(field)) {
      return "bg-red-50 text-red-900";
    }

    // Check if this specific cell has an issue
    const issue = rowIssues.get(rowIndex)?.get(field);
    if (!issue) {
      return "";
    }

    return issue.issueType === "missing_value"
      ? "bg-red-50 text-red-600"
      : "bg-yellow-50 text-yellow-700";
  };

  const getCellTitle = (column: string, rowIndex: number) => {
    const field = findFieldForColumn(column);
    if (!field) {
      return;
    }

    if (columnIssues.has(field)) {
      return `Column "${field}" not found in census`;
    }

    const issue = rowIssues.get(rowIndex)?.get(field);
    return issue?.message;
  };

  const hasValidation = validation !== undefined && validation !== null;
  const issueCount = validation?.issues?.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{upload.fileName}</span>
          <div className="flex items-center gap-2">
            {hasValidation && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Filter className="mr-1 h-4 w-4" />
                    {filterMode === "all" && "All Rows"}
                    {filterMode === "valid" && "Valid Only"}
                    {filterMode === "issues" && "Issues Only"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterMode("all")}>
                    All Rows ({rows.page.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMode("valid")}>
                    Valid Only ({validRows.size})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMode("issues")}>
                    Issues Only ({rowsWithIssues.size})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <span className="font-normal text-muted-foreground text-sm">
              {upload.rowCount} rows
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {hasValidation && (
                  <TableHead className="w-[40px]" title="Row Status" />
                )}
                <TableHead className="w-[50px]">#</TableHead>
                {upload.columns.map((col) => {
                  const field = findFieldForColumn(col);
                  const isMissingColumn = field && columnIssues.has(field);
                  return (
                    <TableHead
                      className={cn(
                        "whitespace-nowrap",
                        isMissingColumn && "bg-red-50 text-red-900"
                      )}
                      key={col}
                      title={
                        isMissingColumn
                          ? `Column "${field}" has validation issues`
                          : undefined
                      }
                    >
                      {col}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => {
                const hasRowIssues = rowsWithIssues.has(row.rowIndex);
                return (
                  <TableRow key={row._id}>
                    {hasValidation && (
                      <TableCell className="text-center">
                        {hasRowIssues ? (
                          <span title="This row has validation issues">
                            <AlertCircle className="mx-auto h-4 w-4 text-yellow-500" />
                          </span>
                        ) : (
                          <span title="Valid row">
                            <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                          </span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground text-xs">
                      {row.rowIndex + 1}
                    </TableCell>
                    {upload.columns.map((col) => {
                      const rowData = row as Record<string, unknown>;
                      const cellData = (
                        rowData.data as Record<string, unknown>
                      )?.[col];

                      // Format date values
                      let displayValue = "";
                      if (
                        cellData !== undefined &&
                        cellData !== null &&
                        cellData !== ""
                      ) {
                        // Check if it's a date string (YYYY-MM-DD format)
                        if (
                          typeof cellData === "string" &&
                          DATE_STRING_REGEX.test(cellData)
                        ) {
                          const date = new Date(cellData);
                          displayValue = date.toLocaleDateString();
                        } else {
                          displayValue = String(cellData);
                        }
                      }

                      const cellClassName = hasValidation
                        ? getCellClassName(col, row.rowIndex)
                        : "";
                      const cellTitle = hasValidation
                        ? getCellTitle(col, row.rowIndex)
                        : undefined;

                      return (
                        <TableCell
                          className={cn("whitespace-nowrap", cellClassName)}
                          key={`${row._id}-${col}`}
                          title={cellTitle}
                        >
                          {displayValue || (
                            <span className="text-muted-foreground italic">
                              empty
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between text-muted-foreground text-sm">
          <span>
            Showing {filteredRows.length} of {rows.page.length} rows
            {filterMode !== "all" && ` (filtered: ${filterMode})`}
          </span>
          {hasValidation && issueCount > 0 && (
            <span className="text-yellow-600">
              {issueCount} validation issue{issueCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
