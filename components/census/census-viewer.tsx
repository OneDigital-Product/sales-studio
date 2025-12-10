"use client";

import { useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  Download,
  Filter,
  Loader2,
  Mail,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

type FilterMode = "all" | "valid" | "issues";

type CensusViewerProps = {
  censusUploadId: Id<"census_uploads">;
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

const getScoreColor = (score: number) => {
  if (score >= 90) {
    return "text-green-600";
  }
  if (score >= 70) {
    return "text-yellow-600";
  }
  return "text-red-600";
};

const getRequiredForLabel = (requiredFor: ValidationIssue["requiredFor"]) => {
  switch (requiredFor) {
    case "PEO":
      return "PEO";
    case "ACA":
      return "ACA";
    default:
      return "PEO + ACA";
  }
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

export function CensusViewer({ censusUploadId }: CensusViewerProps) {
  const data = useQuery(api.census.getCensus, {
    censusUploadId,
    paginationOpts: { numItems: 50, cursor: null },
  });
  const validation = useQuery(api.censusValidation.getValidation, {
    censusUploadId,
  });
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fetch all census rows for export
  const fetchAllRows = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "census:getAllCensusRows",
          args: { censusUploadId },
          format: "json",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch census data");
    }

    const exportData = await response.json();
    return exportData.value;
  };

  // Export census data to CSV
  const handleExportCSV = async () => {
    if (!data?.upload) {
      return;
    }

    try {
      setIsExporting(true);

      const { upload, rows } = await fetchAllRows();

      // Generate CSV content
      const csvLines: string[] = [];

      // Header row
      const escapeCsvValue = (value: string) => {
        if (
          value.includes(",") ||
          value.includes('"') ||
          value.includes("\n")
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };
      csvLines.push(upload.columns.map(escapeCsvValue).join(","));

      // Data rows
      for (const row of rows) {
        const rowData = row.data as Record<string, unknown>;
        const rowValues = upload.columns.map((col) => {
          const value = rowData[col];
          if (value === null || value === undefined) {
            return "";
          }
          return escapeCsvValue(String(value));
        });
        csvLines.push(rowValues.join(","));
      }

      // Create blob and download
      const csvContent = csvLines.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        upload.fileName.replace(/\.(csv|xlsx)$/i, "") + "-export.csv"
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export census:", error);
      alert("Failed to export census data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export census data to Excel
  const handleExportExcel = async () => {
    if (!data?.upload) {
      return;
    }

    try {
      setIsExporting(true);

      const { upload, rows } = await fetchAllRows();

      // Build data array for Excel
      const excelData: unknown[][] = [];

      // Header row
      excelData.push(upload.columns);

      // Data rows
      for (const row of rows) {
        const rowData = row.data as Record<string, unknown>;
        const rowValues = upload.columns.map((col) => {
          const value = rowData[col];
          if (value === null || value === undefined) {
            return "";
          }
          return value;
        });
        excelData.push(rowValues);
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths (auto-fit)
      const colWidths = upload.columns.map((col) => ({
        wch: Math.max(col.length, 12),
      }));
      worksheet["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Census Data");

      // Generate file and download
      const fileName =
        upload.fileName.replace(/\.(csv|xlsx)$/i, "") + "-export.xlsx";
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Failed to export census:", error);
      alert("Failed to export census data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate column statistics
  const columnStats = useMemo(() => {
    if (!(data && selectedColumn)) {
      return null;
    }

    const values: unknown[] = [];
    const numericValues: number[] = [];
    const nonEmptyValues: unknown[] = [];

    for (const row of data.rows.page) {
      const rowData = row.data as Record<string, unknown>;
      const value = rowData[selectedColumn];

      values.push(value);

      if (value !== null && value !== undefined && value !== "") {
        nonEmptyValues.push(value);

        // Try to parse as number
        const numValue = Number(value);
        if (!Number.isNaN(numValue)) {
          numericValues.push(numValue);
        }
      }
    }

    const totalCount = values.length;
    const nonEmptyCount = nonEmptyValues.length;
    const emptyCount = totalCount - nonEmptyCount;
    const isNumeric =
      numericValues.length > 0 && numericValues.length === nonEmptyCount;

    // Calculate unique values
    const uniqueValues = new Set(nonEmptyValues.map((v) => String(v)));

    let stats: {
      totalCount: number;
      nonEmptyCount: number;
      emptyCount: number;
      uniqueCount: number;
      isNumeric: boolean;
      min?: number;
      max?: number;
      avg?: number;
      sum?: number;
    } = {
      totalCount,
      nonEmptyCount,
      emptyCount,
      uniqueCount: uniqueValues.size,
      isNumeric,
    };

    if (isNumeric && numericValues.length > 0) {
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const avg = sum / numericValues.length;

      stats = {
        ...stats,
        min,
        max,
        avg,
        sum,
      };
    }

    return stats;
  }, [data, selectedColumn]);

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

  // Filter and sort rows - MUST be before early return to maintain hooks order
  const filteredRows = useMemo(() => {
    if (!data) {
      return [];
    }

    let filtered = data.rows.page.filter((row) => {
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

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aData = (a.data as Record<string, unknown>)[sortColumn];
        const bData = (b.data as Record<string, unknown>)[sortColumn];

        // Handle null/undefined values
        if (aData === null || aData === undefined) {
          return sortDirection === "asc" ? 1 : -1;
        }
        if (bData === null || bData === undefined) {
          return sortDirection === "asc" ? -1 : 1;
        }

        // Try numeric comparison first
        const aNum = Number(aData);
        const bNum = Number(bData);
        if (!(Number.isNaN(aNum) || Number.isNaN(bNum))) {
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
        }

        // Fall back to string comparison
        const aStr = String(aData).toLowerCase();
        const bStr = String(bData).toLowerCase();
        if (sortDirection === "asc") {
          return aStr.localeCompare(bStr);
        }
        return bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [data, filterMode, validRows, rowsWithIssues, sortColumn, sortDirection]);

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Loading census data...
          </span>
        </CardContent>
      </Card>
    );
  }

  const { upload, rows } = data;

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, start with ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getCellClassName = (column: string, rowIndex: number) => {
    const field = findFieldForColumn(column);
    if (!field) {
      return "";
    }
    if (columnIssues.has(field)) {
      return "bg-red-50 text-red-900";
    }
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
  const isValidating = validation === undefined;
  const issues = validation?.issues ?? [];
  const hasIssues = issues.length > 0;

  // Group issues by type for display
  const missingColumns = issues.filter((i) => i.issueType === "missing_column");
  const missingValues = issues.filter((i) => i.issueType === "missing_value");
  const invalidValues = issues.filter((i) => i.issueType === "invalid_value");

  const renderIssueItem = (issue: ValidationIssue) => (
    <div
      className="flex items-start gap-2"
      key={`${issue.field}-${issue.issueType}`}
    >
      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{issue.message}</span>
          <span className="text-muted-foreground text-sm">
            {getRequiredForLabel(issue.requiredFor)}
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          {issue.issueType === "missing_column"
            ? "This column was not found in the census file"
            : `Affects ${issue.affectedRows.length} row${issue.affectedRows.length === 1 ? "" : "s"}`}
        </p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{upload.fileName}</span>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={isExporting} size="sm" variant="outline">
                  <Download className="mr-1 h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export Census"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      <CardContent className="space-y-6">
        {/* Validation Summary */}
        {isValidating ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Validating...
          </div>
        ) : hasValidation ? (
          <div className="space-y-6">
            {/* Issues */}
            {hasIssues && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                {/* Issue items */}
                {[...missingColumns, ...missingValues, ...invalidValues].map(
                  (issue) => renderIssueItem(issue)
                )}

                {/* Readiness Stats */}
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">PEO Ready</span>
                    <span className="text-muted-foreground text-sm">
                      {validation.peoValidRows} of {validation.totalRows} rows
                      valid
                    </span>
                  </div>
                  <span
                    className={`font-medium ${getScoreColor(validation.peoScore)}`}
                  >
                    {validation.peoScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">ACA Ready</span>
                    <span className="text-muted-foreground text-sm">
                      {validation.acaValidRows} of {validation.totalRows} rows
                      valid
                    </span>
                  </div>
                  <span
                    className={`font-medium ${getScoreColor(validation.acaScore)}`}
                  >
                    {validation.acaScore}%
                  </span>
                </div>

                {/* Request Missing Info */}
                <div className="border-t pt-3">
                  <Button
                    asChild
                    className="w-full"
                    size="sm"
                    variant="outline"
                  >
                    <a href={buildMailtoLink(issues)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Request Missing Info
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Data Table */}
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
                  const isSelected = selectedColumn === col;
                  return (
                    <TableHead
                      className={cn(
                        "whitespace-nowrap",
                        isMissingColumn && "bg-red-50 text-red-900"
                      )}
                      key={col}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          className="flex items-center gap-1 hover:text-primary"
                          onClick={() => handleSort(col)}
                          title="Click to sort"
                          type="button"
                        >
                          <span>{col}</span>
                          {sortColumn === col && (
                            <>
                              {sortDirection === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )}
                            </>
                          )}
                        </button>
                        <Popover
                          onOpenChange={(open) => {
                            if (open) {
                              setSelectedColumn(col);
                            } else if (isSelected) {
                              setSelectedColumn(null);
                            }
                          }}
                          open={isSelected}
                        >
                          <PopoverTrigger asChild>
                            <button
                              className="hover:text-primary"
                              title="View column statistics"
                              type="button"
                            >
                              <BarChart3 className="h-3 w-3 opacity-50" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-80">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold">{col}</h4>
                                <p className="text-muted-foreground text-sm">
                                  Column Statistics
                                </p>
                              </div>
                              {columnStats && (
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Total Rows
                                    </span>
                                    <span className="font-medium">
                                      {columnStats.totalCount}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Non-Empty
                                    </span>
                                    <span className="font-medium">
                                      {columnStats.nonEmptyCount}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Empty
                                    </span>
                                    <span className="font-medium">
                                      {columnStats.emptyCount}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Unique Values
                                    </span>
                                    <span className="font-medium">
                                      {columnStats.uniqueCount}
                                    </span>
                                  </div>
                                  {columnStats.isNumeric && (
                                    <>
                                      <div className="border-t pt-2">
                                        <p className="mb-2 font-medium">
                                          Numeric Statistics
                                        </p>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Minimum
                                        </span>
                                        <span className="font-medium">
                                          {columnStats.min?.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Maximum
                                        </span>
                                        <span className="font-medium">
                                          {columnStats.max?.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Average
                                        </span>
                                        <span className="font-medium">
                                          {columnStats.avg?.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 0,
                                              maximumFractionDigits: 2,
                                            }
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Sum
                                        </span>
                                        <span className="font-medium">
                                          {columnStats.sum?.toLocaleString()}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
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

                      let displayValue = "";
                      if (
                        cellData !== undefined &&
                        cellData !== null &&
                        cellData !== ""
                      ) {
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
        <div className="flex items-center justify-between text-muted-foreground text-sm">
          <span>
            Showing {filteredRows.length} of {rows.page.length} rows
            {filterMode !== "all" && ` (filtered: ${filterMode})`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
