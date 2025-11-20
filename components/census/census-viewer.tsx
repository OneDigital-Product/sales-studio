"use client";

import { useQuery } from "convex/react";
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

type CensusViewerProps = {
  censusUploadId: Id<"census_uploads">;
};

export function CensusViewer({ censusUploadId }: CensusViewerProps) {
  const data = useQuery(api.census.getCensus, {
    censusUploadId,
    paginationOpts: { numItems: 50, cursor: null },
  });

  if (!data) {
    return <div className="p-4">Loading census data...</div>;
  }

  const { upload, rows } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{upload.fileName}</span>
          <span className="font-normal text-muted-foreground text-sm">
            {upload.rowCount} rows • Uploaded{" "}
            {new Date(upload.uploadedAt).toLocaleDateString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                {upload.columns.map((col) => (
                  <TableHead className="whitespace-nowrap" key={col}>
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.page.map((row) => (
                <TableRow key={row._id}>
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
                    if (cellData !== undefined) {
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

                    return (
                      <TableCell
                        className="whitespace-nowrap"
                        key={`${row._id}-${col}`}
                      >
                        {displayValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-center text-muted-foreground text-sm">
          Showing first {rows.page.length} rows.
        </div>
      </CardContent>
    </Card>
  );
}
