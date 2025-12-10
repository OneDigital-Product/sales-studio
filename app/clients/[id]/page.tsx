"use client";

import { useMutation, useQuery } from "convex/react";
import {
  Bookmark,
  BookmarkCheck,
  Copy,
  FileText,
  GitCompare,
  Pencil,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { read, utils } from "xlsx";
import { CensusImport } from "@/components/census/census-import";
import { CensusValidationSummary } from "@/components/census/census-validation-summary";
import { CensusViewer } from "@/components/census/census-viewer";
import { CommentFeed } from "@/components/comments/comment-feed";
import { DocumentCenter } from "@/components/files/document-center";
import { DocumentCompletenessIndicator } from "@/components/files/document-completeness-indicator";
import { FileUploadDialog } from "@/components/files/file-upload-dialog";
import { CreateRequestDialog } from "@/components/info-requests/create-request-dialog";
import { RequestsPanel } from "@/components/info-requests/requests-panel";
import { QuoteStatusCard } from "@/components/quotes/quote-status-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const CENSUS_FILE_REGEX = /\.(xlsx|xls|csv)$/i;

// Format timestamp to human-readable format
const formatLastModified = (timestamp: number | undefined) => {
  if (!timestamp) return null;

  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
};

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as Id<"clients">;

  const client = useQuery(api.clients.getClient, { id: clientId });
  const files = useQuery(api.files.getFiles, { clientId });
  const activeCensus = useQuery(api.census.getActiveCensus, { clientId });
  const censusHistory = useQuery(api.census.getCensusHistory, { clientId });
  const qualityHistory = useQuery(api.censusValidation.getQualityHistory, {
    clientId,
  });
  const quotes = useQuery(api.quotes.getQuotesByClient, { clientId });
  const isBookmarked = useQuery(api.bookmarks.isBookmarked, { clientId });

  const toast = useToast();

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const deleteFile = useMutation(api.files.deleteFile);
  const markFileAsVerified = useMutation(api.files.markFileAsVerified);
  const setActiveCensus = useMutation(api.census.setActiveCensus);
  const updateClient = useMutation(api.clients.updateClient);
  const deleteClientMutation = useMutation(api.clients.deleteClient);
  const addBookmark = useMutation(api.bookmarks.addBookmark);
  const removeBookmark = useMutation(api.bookmarks.removeBookmark);

  const [uploading, setUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [pendingCensusFile, setPendingCensusFile] = useState<File | null>(null);
  const [pendingCensusFileId, setPendingCensusFileId] =
    useState<Id<"files"> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [censusTab, setCensusTab] = useState<"active" | "history" | "trend">(
    "active"
  );
  const [selectedHistoricalCensusId, setSelectedHistoricalCensusId] =
    useState<Id<"census_uploads"> | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<
    Id<"census_uploads">[]
  >([]);
  const [showingComparison, setShowingComparison] = useState(false);
  const [undoInfo, setUndoInfo] = useState<{
    previousCensusId: Id<"census_uploads">;
    replacedAt: number;
  } | null>(null);

  const CENSUS_KEYWORDS = [
    "dob",
    "date of birth",
    "birth",
    "gender",
    "sex",
    "salary",
    "zip",
    "plan",
    "tier",
    "coverage",
  ];

  const isCensusFile = async (file: File): Promise<boolean> => {
    if (!CENSUS_FILE_REGEX.test(file.name)) {
      return false;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = utils.sheet_to_json(sheet, { header: 1 });

          if (jsonData.length === 0) {
            resolve(false);
            return;
          }

          const headers = (jsonData[0] as string[]).map((h) => h.toLowerCase());
          const matchCount = headers.filter((h) =>
            CENSUS_KEYWORDS.some((k) => h.includes(k))
          ).length;
          resolve(matchCount >= 2);
        } catch {
          resolve(false);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Auto-detect file category based on filename
  const detectFileCategory = (
    filename: string
  ):
    | "census"
    | "plan_summary"
    | "claims_history"
    | "renewal_letter"
    | "proposal"
    | "contract"
    | "other"
    | undefined => {
    const lower = filename.toLowerCase();
    if (lower.includes("plan") && lower.includes("summary"))
      return "plan_summary";
    if (lower.includes("claims") || lower.includes("claim history"))
      return "claims_history";
    if (lower.includes("renewal")) return "renewal_letter";
    if (lower.includes("proposal")) return "proposal";
    if (lower.includes("contract")) return "contract";
    return; // Will be set to census or other later
  };

  const uploadSingleFile = async (
    file: File,
    index: number,
    totalFiles: number
  ) => {
    const isCensus = await isCensusFile(file);
    const detectedCategory = detectFileCategory(file.name);

    const postUrl = await generateUploadUrl();
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();

    const fileId = await saveFile({
      storageId,
      clientId,
      name: file.name,
      type: isCensus ? "Census" : "Quote Data",
      category: isCensus ? "census" : (detectedCategory ?? "other"),
      uploadedBy: "Current User", // TODO: Replace with actual user name when auth is implemented
      mimeType: file.type,
      fileSize: file.size,
    });

    if (isCensus && (index === totalFiles - 1 || !pendingCensusFile)) {
      setPendingCensusFile(file);
      setPendingCensusFileId(fileId);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    setUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        await uploadSingleFile(selectedFiles[i], i, selectedFiles.length);
      }

      const fileCount = selectedFiles.length;
      toast.success(
        `Successfully uploaded ${fileCount} file${fileCount > 1 ? "s" : ""}`
      );

      e.target.value = "";
    } catch {
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDialogUpload = async (
    file: File,
    category:
      | "census"
      | "plan_summary"
      | "claims_history"
      | "renewal_letter"
      | "proposal"
      | "contract"
      | "other",
    relevantTo?: string[],
    isRequired?: boolean,
    description?: string
  ) => {
    try {
      const isCensus = category === "census" || (await isCensusFile(file));

      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(
          `Upload failed with status ${result.status}. Please try again.`
        );
      }

      const { storageId } = await result.json();

      const fileId = await saveFile({
        storageId,
        clientId,
        name: file.name,
        type: isCensus ? "Census" : "Quote Data",
        category,
        relevantTo,
        isRequired,
        description,
        uploadedBy: "Current User", // TODO: Replace with actual user name when auth is implemented
        mimeType: file.type,
        fileSize: file.size,
      });

      if (isCensus) {
        setPendingCensusFile(file);
        setPendingCensusFileId(fileId);
      }
    } catch (error) {
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error(
        "Failed to upload file. Please check your internet connection and try again."
      );
    }
  };

  const handleDelete = async (fileId: Id<"files">) => {
    try {
      await deleteFile({ id: fileId });
      toast.success("File deleted successfully");
    } catch {
      toast.error("Failed to delete file. Please try again.");
    }
  };

  const handleVerifyFile = async (fileId: Id<"files">, verifiedBy: string) => {
    try {
      await markFileAsVerified({ fileId, verifiedBy });
      toast.success("File marked as verified");
    } catch (error) {
      toast.error("Failed to verify file. Please try again.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) {
      return;
    }

    setUploading(true);
    try {
      for (let i = 0; i < droppedFiles.length; i++) {
        await uploadSingleFile(droppedFiles[i], i, droppedFiles.length);
      }

      const fileCount = droppedFiles.length;
      toast.success(
        `Successfully uploaded ${fileCount} file${fileCount > 1 ? "s" : ""}`
      );
    } catch {
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = () => {
    setEditName(client?.name || "");
    setEditEmail(client?.contactEmail || "");
    setEditNotes(client?.notes || "");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateClient({
        id: clientId,
        name: editName,
        contactEmail: editEmail,
        notes: editNotes,
      });
      setIsEditModalOpen(false);
      toast.success("Client information updated successfully");
    } catch {
      toast.error("Failed to update client information. Please try again.");
    }
  };

  const handleDeleteClick = () => {
    setDeleteConfirmation("");
    setIsDeleteDialogOpen(true);
  };

  const handleUndoCensusReplacement = async () => {
    if (!undoInfo) return;
    try {
      await setActiveCensus({
        clientId,
        censusUploadId: undoInfo.previousCensusId,
      });
      setUndoInfo(null);
      toast.success("Census replacement undone successfully");
    } catch {
      toast.error("Failed to undo census replacement. Please try again.");
    }
  };

  const handleBookmarkToggle = async () => {
    try {
      if (isBookmarked) {
        await removeBookmark({ clientId });
        toast.success("Bookmark removed");
      } else {
        await addBookmark({ clientId });
        toast.success("Client bookmarked");
      }
    } catch {
      toast.error("Failed to update bookmark. Please try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation !== client?.name) {
      return;
    }
    try {
      await deleteClientMutation({ clientId });
      toast.success("Client deleted successfully");
      // Navigate back to home page after deletion
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch {
      toast.error("Failed to delete client. Please try again.");
    }
  };

  const handleCopyClientInfo = async () => {
    try {
      const clientInfo = `Client Name: ${client.name}
Email: ${client.contactEmail || "N/A"}
Notes: ${client.notes || "N/A"}`;
      await navigator.clipboard.writeText(clientInfo);
      setCopySuccess(true);
      toast.success("Client information copied to clipboard");
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard. Please try again.");
    }
  };

  if (client === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (client === null) {
    return <div className="p-8">Client not found.</div>;
  }

  const renderRightPanel = () => {
    if (pendingCensusFile) {
      return (
        <CensusImport
          clientId={clientId}
          file={pendingCensusFile}
          fileId={pendingCensusFileId ?? undefined}
          onCancel={() => {
            setPendingCensusFile(null);
            setPendingCensusFileId(null);
          }}
          onSuccess={(result) => {
            setPendingCensusFile(null);
            setPendingCensusFileId(null);
            // If there was a previous census, save undo info
            if (result.previousCensusId) {
              setUndoInfo({
                previousCensusId: result.previousCensusId,
                replacedAt: Date.now(),
              });
              toast.success("Census data imported and replaced successfully");
              // Auto-hide undo notification after 30 seconds
              setTimeout(() => setUndoInfo(null), 30_000);
            } else {
              toast.success("Census data imported successfully");
            }
          }}
        />
      );
    }

    if (activeCensus) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Census Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              onValueChange={(v) =>
                setCensusTab(v as "active" | "history" | "trend")
              }
              value={censusTab}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="active">Active Census</TabsTrigger>
                <TabsTrigger value="history">Census History</TabsTrigger>
                <TabsTrigger value="trend">Quality Trend</TabsTrigger>
              </TabsList>

              <TabsContent className="space-y-4" value="active">
                <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <TableIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-blue-900">
                        Smart Census Active
                      </h2>
                      {censusHistory && censusHistory.length > 1 && (
                        <Select
                          key={activeCensus._id}
                          onValueChange={(val) =>
                            setActiveCensus({
                              clientId,
                              censusUploadId: val as Id<"census_uploads">,
                            })
                          }
                          value={activeCensus._id}
                        >
                          <SelectTrigger className="h-8 w-[240px] bg-white">
                            <SelectValue placeholder="Select version" />
                          </SelectTrigger>
                          <SelectContent>
                            {censusHistory.map((upload) => (
                              <SelectItem key={upload._id} value={upload._id}>
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">
                                    {upload.fileName}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {new Date(
                                      upload.uploadedAt
                                    ).toLocaleString()}{" "}
                                    • {upload.rowCount} rows
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <p className="mt-1 text-blue-700 text-sm">
                      Parsing data from <strong>{activeCensus.fileName}</strong>
                      .
                    </p>
                  </div>
                </div>
                <CensusValidationSummary
                  censusUploadId={activeCensus._id}
                  clientId={clientId}
                />
                <CensusViewer censusUploadId={activeCensus._id} />
              </TabsContent>

              <TabsContent className="space-y-4" value="history">
                {censusHistory && censusHistory.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-gray-600 text-sm">
                        {censusHistory.length} census upload
                        {censusHistory.length !== 1 ? "s" : ""} found
                      </div>
                      <div className="flex items-center gap-2">
                        {!comparisonMode && censusHistory.length >= 2 && (
                          <Button
                            onClick={() => {
                              setComparisonMode(true);
                              setSelectedForComparison([]);
                              setSelectedHistoricalCensusId(null);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <GitCompare className="mr-2 h-4 w-4" />
                            Compare Versions
                          </Button>
                        )}
                        {comparisonMode && (
                          <>
                            <Button
                              disabled={selectedForComparison.length !== 2}
                              onClick={() => {
                                setShowingComparison(true);
                                setComparisonMode(false);
                              }}
                              size="sm"
                            >
                              <GitCompare className="mr-2 h-4 w-4" />
                              Compare ({selectedForComparison.length}/2)
                            </Button>
                            <Button
                              onClick={() => {
                                setComparisonMode(false);
                                setSelectedForComparison([]);
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {showingComparison && (
                          <Button
                            onClick={() => {
                              setShowingComparison(false);
                              setSelectedForComparison([]);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Back to List
                          </Button>
                        )}
                      </div>
                    </div>
                    {showingComparison && selectedForComparison.length === 2 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {selectedForComparison.map((censusId) => {
                            const census = censusHistory.find(
                              (c) => c._id === censusId
                            );
                            if (!census) return null;
                            return (
                              <div className="space-y-4" key={censusId}>
                                <Card>
                                  <CardHeader>
                                    <h3 className="font-semibold text-gray-900">
                                      {census.fileName}
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                      {new Date(
                                        census.uploadedAt
                                      ).toLocaleString()}{" "}
                                      • {census.rowCount} rows
                                    </p>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <CensusValidationSummary
                                      censusUploadId={censusId}
                                      clientId={clientId}
                                    />
                                    <CensusViewer censusUploadId={censusId} />
                                  </CardContent>
                                </Card>
                              </div>
                            );
                          })}
                        </div>
                        <Card className="bg-blue-50">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-2">
                              <GitCompare className="h-5 w-5 text-blue-600" />
                              <div>
                                <h4 className="font-semibold text-blue-900">
                                  Side-by-Side Comparison
                                </h4>
                                <p className="text-blue-700 text-sm">
                                  Compare the two census versions above to
                                  identify differences in data, row counts, and
                                  validation results.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {censusHistory.map((upload) => (
                          <Card
                            className={`transition-colors ${
                              comparisonMode
                                ? "cursor-pointer hover:bg-gray-50"
                                : selectedHistoricalCensusId === upload._id
                                  ? "cursor-pointer border-blue-500 bg-blue-50"
                                  : "cursor-pointer hover:bg-gray-50"
                            } ${
                              selectedForComparison.includes(upload._id)
                                ? "border-blue-500 bg-blue-50"
                                : ""
                            }`}
                            key={upload._id}
                            onClick={() => {
                              if (comparisonMode) {
                                // Toggle selection for comparison
                                if (
                                  selectedForComparison.includes(upload._id)
                                ) {
                                  setSelectedForComparison(
                                    selectedForComparison.filter(
                                      (id) => id !== upload._id
                                    )
                                  );
                                } else if (selectedForComparison.length < 2) {
                                  setSelectedForComparison([
                                    ...selectedForComparison,
                                    upload._id,
                                  ]);
                                }
                              } else {
                                setSelectedHistoricalCensusId(upload._id);
                              }
                            }}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  {comparisonMode && (
                                    <input
                                      checked={selectedForComparison.includes(
                                        upload._id
                                      )}
                                      className="h-4 w-4"
                                      disabled={
                                        !selectedForComparison.includes(
                                          upload._id
                                        ) && selectedForComparison.length >= 2
                                      }
                                      onChange={() => {}}
                                      type="checkbox"
                                    />
                                  )}
                                  <div>
                                    <h3 className="font-semibold text-gray-900">
                                      {upload.fileName}
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                      {new Date(
                                        upload.uploadedAt
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-700 text-xs">
                                    {upload.rowCount} rows
                                  </span>
                                  {upload._id === activeCensus._id && (
                                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-700 text-xs">
                                      Active
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            {!comparisonMode &&
                              selectedHistoricalCensusId === upload._id && (
                                <CardContent className="space-y-4 border-t pt-4">
                                  <CensusValidationSummary
                                    censusUploadId={upload._id}
                                    clientId={clientId}
                                  />
                                  <CensusViewer censusUploadId={upload._id} />
                                </CardContent>
                              )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-300 border-dashed bg-gray-50 p-8 text-center">
                    <TableIcon className="mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-gray-600">No census history found</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent className="space-y-4" value="trend">
                {qualityHistory && qualityHistory.length > 0 ? (
                  <div className="space-y-6">
                    <div className="rounded-lg border bg-white p-6">
                      <h3 className="mb-4 font-semibold text-lg">
                        Data Quality Over Time
                      </h3>
                      <div className="space-y-6">
                        {/* Chart visualization */}
                        <div className="relative h-[400px] rounded-lg border bg-gray-50 p-4">
                          {/* Y-axis label */}
                          <div className="-translate-y-1/2 -rotate-90 absolute top-1/2 left-2 font-medium text-gray-600 text-sm">
                            Quality Score (%)
                          </div>

                          {/* Chart area */}
                          <div className="relative ml-8 h-full">
                            {/* Y-axis grid lines and labels */}
                            <div className="absolute inset-0 flex flex-col justify-between border-gray-300 border-b border-l pr-4 pb-6">
                              {[100, 75, 50, 25, 0].map((value) => (
                                <div
                                  className="relative flex items-center"
                                  key={value}
                                >
                                  <span className="-left-10 absolute text-gray-600 text-xs">
                                    {value}
                                  </span>
                                  <div className="w-full border-gray-200 border-t" />
                                </div>
                              ))}
                            </div>

                            {/* Plot area */}
                            <div className="absolute inset-0 flex items-end justify-around pr-4 pb-6 pl-0">
                              {qualityHistory.map((point, index) => {
                                const maxScore = Math.max(
                                  point.peoScore,
                                  point.acaScore
                                );
                                const peoHeight = `${point.peoScore}%`;
                                const acaHeight = `${point.acaScore}%`;

                                return (
                                  <div
                                    className="flex flex-1 flex-col items-center justify-end gap-1"
                                    key={point.censusUploadId}
                                  >
                                    {/* Data points */}
                                    <div className="relative flex w-full items-end justify-center gap-2">
                                      {/* PEO score bar */}
                                      <div
                                        className="group relative w-6 cursor-pointer rounded-t bg-blue-500 transition-opacity hover:opacity-80"
                                        style={{ height: peoHeight }}
                                        title={`PEO: ${point.peoScore}%`}
                                      >
                                        <div className="-top-6 -translate-x-1/2 pointer-events-none absolute left-1/2 hidden whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-white text-xs group-hover:block">
                                          PEO: {point.peoScore}%
                                        </div>
                                      </div>

                                      {/* ACA score bar */}
                                      <div
                                        className="group relative w-6 cursor-pointer rounded-t bg-purple-500 transition-opacity hover:opacity-80"
                                        style={{ height: acaHeight }}
                                        title={`ACA: ${point.acaScore}%`}
                                      >
                                        <div className="-top-6 -translate-x-1/2 pointer-events-none absolute left-1/2 hidden whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-white text-xs group-hover:block">
                                          ACA: {point.acaScore}%
                                        </div>
                                      </div>
                                    </div>

                                    {/* X-axis label */}
                                    <div className="mt-2 w-full text-center text-gray-600 text-xs">
                                      <div className="truncate font-medium">
                                        {new Date(
                                          point.uploadedAt
                                        ).toLocaleDateString()}
                                      </div>
                                      <div className="text-gray-400">
                                        v{index + 1}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* X-axis label */}
                          <div className="-translate-x-1/2 absolute bottom-0 left-1/2 font-medium text-gray-600 text-sm">
                            Census Versions
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded bg-blue-500" />
                            <span className="text-gray-700 text-sm">
                              PEO Score
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded bg-purple-500" />
                            <span className="text-gray-700 text-sm">
                              ACA Score
                            </span>
                          </div>
                        </div>

                        {/* Data summary table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="px-4 py-2 text-left font-medium text-gray-700 text-sm">
                                  Version
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700 text-sm">
                                  Upload Date
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700 text-sm">
                                  File Name
                                </th>
                                <th className="px-4 py-2 text-center font-medium text-gray-700 text-sm">
                                  Rows
                                </th>
                                <th className="px-4 py-2 text-center font-medium text-gray-700 text-sm">
                                  PEO Score
                                </th>
                                <th className="px-4 py-2 text-center font-medium text-gray-700 text-sm">
                                  ACA Score
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {qualityHistory.map((point, index) => (
                                <tr
                                  className="border-b hover:bg-gray-50"
                                  key={point.censusUploadId}
                                >
                                  <td className="px-4 py-2 text-gray-900 text-sm">
                                    v{index + 1}
                                  </td>
                                  <td className="px-4 py-2 text-gray-600 text-sm">
                                    {new Date(
                                      point.uploadedAt
                                    ).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 text-gray-900 text-sm">
                                    {point.fileName}
                                  </td>
                                  <td className="px-4 py-2 text-center text-gray-600 text-sm">
                                    {point.totalRows}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <span
                                      className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                                        point.peoScore >= 90
                                          ? "bg-green-100 text-green-800"
                                          : point.peoScore >= 70
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {point.peoScore}%
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <span
                                      className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                                        point.acaScore >= 90
                                          ? "bg-green-100 text-green-800"
                                          : point.acaScore >= 70
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {point.acaScore}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-300 border-dashed bg-gray-50 p-8 text-center">
                    <TableIcon className="mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-gray-600">
                      No quality history available. Upload multiple census
                      versions to see quality trends.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="flex h-full min-h-[400px] flex-col items-center justify-center border-dashed bg-gray-50/50 p-8 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-4">
          <TableIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="font-semibold text-gray-900 text-xl">
          No Census Data Yet
        </h2>
        <p className="mt-2 max-w-md text-gray-500">
          Upload an Excel or CSV file with employee data (Name, DOB, Plan Type)
          to activate the Smart Census view.
        </p>
      </Card>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-8">
        <div className="flex flex-col gap-4">
          <Link className="w-fit text-blue-700 hover:underline" href="/">
            &larr; Back to Dashboard
          </Link>

          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-start gap-3">
              <div>
                <h1 className="font-bold text-3xl text-gray-900">
                  {client.name}
                </h1>
                {client.contactEmail && (
                  <p className="text-gray-600">{client.contactEmail}</p>
                )}
                {client.notes && (
                  <p className="mt-1 text-gray-500">{client.notes}</p>
                )}
                {client.lastModified && (
                  <p className="mt-1 text-gray-400 text-sm">
                    Last modified: {formatLastModified(client.lastModified)}
                  </p>
                )}
              </div>
              <Button
                className="mt-1"
                onClick={handleEditClick}
                size="sm"
                variant="ghost"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
              <Button
                className={
                  isBookmarked
                    ? "border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                    : ""
                }
                onClick={handleBookmarkToggle}
                variant="outline"
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                    Bookmarked
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Bookmark
                  </>
                )}
              </Button>
              <Button
                className={
                  copySuccess
                    ? "border-green-500 bg-green-50 text-green-600"
                    : ""
                }
                onClick={handleCopyClientInfo}
                variant="outline"
              >
                <Copy className="mr-2 h-4 w-4" />
                {copySuccess ? "Copied!" : "Copy Client Info"}
              </Button>
              <CreateRequestDialog clientId={clientId} />
              <Button className="bg-green-600 hover:bg-green-700" disabled>
                PEO Quoting
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700" disabled>
                Perfect Quote
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDeleteClick}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Client
              </Button>
            </div>
          </div>
        </div>

        {/* Quote Status Section */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <QuoteStatusCard
            clientId={clientId}
            quote={quotes?.find((q) => q.type === "PEO") ?? null}
            type="PEO"
          />
          <QuoteStatusCard
            clientId={clientId}
            quote={quotes?.find((q) => q.type === "ACA") ?? null}
            type="ACA"
          />
        </div>

        {/* Document Completeness Indicator */}
        <DocumentCompletenessIndicator files={files ?? []} />

        {/* Outstanding Requests Section */}
        <RequestsPanel clientId={clientId} />

        {/* Undo Census Replacement Banner */}
        {undoInfo && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <TableIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900 text-sm">
                    Census data has been replaced
                  </p>
                  <p className="text-blue-700 text-xs">
                    The previous census version is still available in history
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
                  onClick={handleUndoCensusReplacement}
                  size="sm"
                  variant="outline"
                >
                  Undo Replacement
                </Button>
                <Button
                  className="text-blue-700 hover:bg-blue-100"
                  onClick={() => setUndoInfo(null)}
                  size="sm"
                  variant="ghost"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Management Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Document Center</CardTitle>
            <FileUploadDialog onUpload={handleDialogUpload} />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Magic Upload Dropzone */}
            {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: Drag and drop requires event handlers on div */}
            {/* biome-ignore lint/a11y/useSemanticElements: Dropzone needs to be a container div */}
            <div
              aria-label="File upload dropzone"
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              role="region"
            >
              <form className="space-y-4" onSubmit={handleUpload}>
                <div className="space-y-2">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <Label
                      className="cursor-pointer font-medium text-blue-700 hover:underline"
                      htmlFor="file"
                    >
                      Click to Upload
                    </Label>
                    <span className="text-gray-500 text-sm">
                      or drag and drop files
                    </span>
                  </div>
                  <Input
                    className="hidden"
                    id="file"
                    multiple
                    onChange={handleUpload}
                    type="file" // Auto-submit on selection for smoother flow
                  />
                  <p className="text-gray-400 text-xs">
                    Supports Excel, CSV, PDF, Word, PPT
                  </p>
                </div>
                {uploading && (
                  <p className="animate-pulse text-blue-700 text-sm">
                    Uploading & Analyzing...
                  </p>
                )}
              </form>
            </div>

            {/* Document Center */}
            <DocumentCenter
              clientId={clientId}
              files={files || []}
              onDeleteFile={handleDelete}
              onVerifyFile={handleVerifyFile}
            />
          </CardContent>
        </Card>

        {/* Activity Feed Section */}
        <CommentFeed clientId={clientId} />

        {/* Census Information Section */}
        <div>{renderRightPanel()}</div>
      </div>

      {/* Edit Client Dialog */}
      <Dialog onOpenChange={setIsEditModalOpen} open={isEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Client Information</DialogTitle>
            <DialogDescription>
              Update the client details below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Client name"
                required
                value={editName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="contact@client.com"
                type="email"
                value={editEmail}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Additional client details..."
                value={editNotes}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Client Dialog */}
      <Dialog onOpenChange={setIsDeleteDialogOpen} open={isDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              client and all associated data including files, census data,
              quotes, and comments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-900 text-sm">
                To confirm deletion, please type the client name below:
              </p>
              <p className="mt-1 font-semibold text-red-900">{client.name}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">Client Name</Label>
              <Input
                id="delete-confirm"
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type client name to confirm"
                value={deleteConfirmation}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={deleteConfirmation !== client.name}
              onClick={handleDeleteConfirm}
              variant="destructive"
            >
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
