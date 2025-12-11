"use client";

import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { read, utils } from "xlsx";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MILLISECONDS_PER_DAY = 86_400_000;
const MAX_EXCEL_SERIAL = 1_000_000;

type CensusImportProps = {
  clientId: Id<"clients">;
  fileId?: Id<"files">;
  onSuccess?: (result: {
    censusUploadId: Id<"census_uploads">;
    previousCensusId: Id<"census_uploads"> | null;
  }) => void;
  file: File;
  onCancel: () => void;
};

export function CensusImport({
  clientId,
  fileId,
  onSuccess,
  file,
  onCancel,
}: CensusImportProps) {
  type RowData = Record<string, unknown>;

  const [previewData, setPreviewData] = useState<RowData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveCensus = useMutation(api.census.saveCensus);

  // Convert Excel serial number to date string
  const excelSerialToDate = (serial: number): string => {
    // Excel epoch is January 1, 1900
    const excelEpoch = new Date(1900, 0, 1);
    // Excel incorrectly treats 1900 as a leap year, so subtract 1 day for dates after Feb 28, 1900
    const daysSince1900 = serial - (serial > 59 ? 1 : 0);
    const date = new Date(
      excelEpoch.getTime() + daysSince1900 * MILLISECONDS_PER_DAY
    );
    return date.toISOString().split("T")[0];
  };

  // Check if a value is likely an Excel date serial number
  const isExcelDateSerial = (value: unknown): boolean =>
    typeof value === "number" &&
    value > 1 &&
    value < MAX_EXCEL_SERIAL &&
    value % 1 !== 0;

  // Check if a column header suggests it's a date column
  const isDateColumn = (header: string): boolean => {
    const lowerHeader = header.toLowerCase();
    return (
      lowerHeader.includes("date") ||
      lowerHeader.includes("dob") ||
      lowerHeader.includes("birth")
    );
  };

  // Parse the file as soon as it's available
  if (file && previewData.length === 0 && !error) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Parse with raw: true to get actual values, then convert dates
        const jsonData = utils.sheet_to_json(sheet, {
          header: 1,
          raw: true,
          defval: "",
        });

        if (jsonData.length === 0) {
          setError("File is empty");
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as unknown[][];

        // Convert rows to objects based on headers
        const formattedRows = rows.map((row) => {
          const rowData: RowData = {};
          headers.forEach((header, index) => {
            let value = row[index];
            // Convert Excel date serial numbers to date strings
            if (
              isDateColumn(header) &&
              (isExcelDateSerial(value) ||
                (typeof value === "number" &&
                  value > 1 &&
                  value < MAX_EXCEL_SERIAL))
            ) {
              value = excelSerialToDate(value as number);
            }
            rowData[header] = value;
          });
          return rowData;
        });

        setColumns(headers);
        setPreviewData(formattedRows);
      } catch (err) {
        console.error("Error parsing file:", err);
        setError(
          "Failed to parse file. Please ensure it's a valid Excel or CSV file."
        );
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const handleImport = async () => {
    if (!file || previewData.length === 0) {
      return;
    }

    setIsUploading(true);
    try {
      const result = await saveCensus({
        clientId,
        fileId,
        fileName: file.name,
        columns,
        rows: previewData,
      });
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error("Error saving census:", err);
      setError("Failed to save census data.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Confirm Census Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="space-y-3">
              <Alert title="Error" variant="error">
                {error}
              </Alert>
              {previewData.length === 0 && (
                <div className="flex gap-2">
                  <Button onClick={onCancel} variant="outline">
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}

          {previewData.length > 0 && !error ? (
            <div className="space-y-4">
              <div className="max-h-[300px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead className="whitespace-nowrap" key={col}>
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 5).map((row) => {
                      const rowKey = JSON.stringify(row);
                      return (
                        <TableRow key={rowKey}>
                          {columns.map((col) => {
                            const cellData = row[col];
                            let displayValue = "";
                            if (cellData !== undefined) {
                              // Format date strings (YYYY-MM-DD format)
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
                            return (
                              <TableCell
                                className="whitespace-nowrap"
                                key={`${rowKey}-${col}`}
                              >
                                {displayValue}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <p className="text-muted-foreground text-xs">
                Showing first 5 of {previewData.length} rows from{" "}
                <strong>{file.name}</strong>.
              </p>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={isUploading}
                  onClick={handleImport}
                >
                  {isUploading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isUploading ? "Importing..." : "Confirm & Import as Census"}
                </Button>
                <Button
                  disabled={isUploading}
                  onClick={onCancel}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            !error && (
              <div className="text-muted-foreground text-sm">
                Parsing file...
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
