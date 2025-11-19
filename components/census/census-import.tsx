"use client";

import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { read, utils } from "xlsx";
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

type CensusImportProps = {
  clientId: Id<"clients">;
  onSuccess?: () => void;
  file: File;
  onCancel: () => void;
};

export function CensusImport({
  clientId,
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

  // Parse the file as soon as it's available
  if (file && previewData.length === 0 && !error) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(sheet, { header: 1 });

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
            rowData[header] = row[index];
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
      await saveCensus({
        clientId,
        fileName: file.name,
        columns,
        rows: previewData,
      });
      if (onSuccess) {
        onSuccess();
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
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {previewData.length > 0 ? (
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
                          {columns.map((col) => (
                            <TableCell
                              className="whitespace-nowrap"
                              key={`${rowKey}-${col}`}
                            >
                              {String(row[col] ?? "")}
                            </TableCell>
                          ))}
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
