"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FileData {
  _id: string;
  category?: string;
  isRequired?: boolean;
}

interface DocumentCompletenessIndicatorProps {
  files: FileData[];
}

export function DocumentCompletenessIndicator({
  files,
}: DocumentCompletenessIndicatorProps) {
  // Define which categories are typically required
  const REQUIRED_CATEGORIES = ["census", "plan_summary", "renewal_letter"];

  // Count total required documents expected
  const totalRequired = REQUIRED_CATEGORIES.length;

  // Count how many required categories have files uploaded
  const uploadedCategories = new Set(
    files
      .filter((f) => f.category && REQUIRED_CATEGORIES.includes(f.category))
      .map((f) => f.category)
  );

  // Also count files explicitly marked as required
  const explicitlyRequiredFiles = files.filter((f) => f.isRequired);
  const totalExplicitRequired = explicitlyRequiredFiles.length;

  // Calculate completeness percentage
  // Use either category-based or explicit required count, whichever is higher
  const uploadedRequired = Math.max(
    uploadedCategories.size,
    explicitlyRequiredFiles.length
  );
  const totalRequiredDocs = Math.max(totalRequired, totalExplicitRequired);

  const completenessPercentage =
    totalRequiredDocs > 0
      ? Math.round((uploadedRequired / totalRequiredDocs) * 100)
      : 100;

  const isComplete = completenessPercentage === 100;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-medium text-sm">
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-yellow-600" />
          )}
          Document Completeness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-2xl">
              {completenessPercentage}%
            </span>
            <span className="text-gray-600 text-sm">
              {uploadedRequired} of {totalRequiredDocs} required
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full transition-all ${
                isComplete ? "bg-green-600" : "bg-blue-600"
              }`}
              style={{ width: `${completenessPercentage}%` }}
            />
          </div>
          {!isComplete && (
            <p className="mt-2 text-gray-500 text-xs">
              Upload missing required documents to reach 100%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
