"use client";

import { useMutation, useQuery } from "convex/react";
import {
  Download,
  FileText,
  Pencil,
  Table as TableIcon,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { read, utils } from "xlsx";
import { CensusImport } from "@/components/census/census-import";
import { CensusValidationSummary } from "@/components/census/census-validation-summary";
import { CensusViewer } from "@/components/census/census-viewer";
import { CommentFeed } from "@/components/comments/comment-feed";
import { FileCommentButton } from "@/components/comments/file-comment-button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const CENSUS_FILE_REGEX = /\.(xlsx|xls|csv)$/i;

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as Id<"clients">;

  const client = useQuery(api.clients.getClient, { id: clientId });
  const files = useQuery(api.files.getFiles, { clientId });
  const activeCensus = useQuery(api.census.getActiveCensus, { clientId });
  const censusHistory = useQuery(api.census.getCensusHistory, { clientId });
  const quotes = useQuery(api.quotes.getQuotesByClient, { clientId });

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const deleteFile = useMutation(api.files.deleteFile);
  const setActiveCensus = useMutation(api.census.setActiveCensus);
  const updateClient = useMutation(api.clients.updateClient);

  const [uploading, setUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [pendingCensusFile, setPendingCensusFile] = useState<File | null>(null);
  const [pendingCensusFileId, setPendingCensusFileId] =
    useState<Id<"files"> | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const uploadSingleFile = async (
    file: File,
    index: number,
    totalFiles: number
  ) => {
    const isCensus = await isCensusFile(file);

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

      e.target.value = "";
    } catch {
      // Upload error silently handled
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: Id<"files">) => {
    try {
      await deleteFile({ id: fileId });
    } catch {
      // Delete error silently handled
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
    } catch {
      // Upload error silently handled
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
    } catch {
      // Update error silently handled
    }
  };

  if (client === undefined) {
    return <div className="p-8">Loading...</div>;
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
          onSuccess={() => {
            setPendingCensusFile(null);
            setPendingCensusFileId(null);
          }}
        />
      );
    }

    if (activeCensus) {
      return (
        <div className="space-y-4">
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
                              {new Date(upload.uploadedAt).toLocaleString()} •{" "}
                              {upload.rowCount} rows
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <p className="mt-1 text-blue-700 text-sm">
                Parsing data from <strong>{activeCensus.fileName}</strong>.
              </p>
            </div>
          </div>
          <CensusValidationSummary censusUploadId={activeCensus._id} />
          <CensusViewer censusUploadId={activeCensus._id} />
        </div>
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
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
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
            <div className="flex gap-3">
              <Button className="bg-green-600 hover:bg-green-700" disabled>
                PEO Quoting
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700" disabled>
                Perfect Quote
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

        {/* File Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>Project Files</CardTitle>
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

            {/* File List */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Name</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files?.map((file) => (
                    <TableRow key={file._id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="block">{file.name}</span>
                          <span className="text-gray-500 text-xs">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <FileCommentButton
                            clientId={clientId}
                            fileId={file._id}
                            fileName={file.name}
                          />
                          {file.url && (
                            <Button
                              aria-label={`Download ${file.name}`}
                              asChild
                              className="h-8 w-8"
                              size="icon"
                              variant="ghost"
                            >
                              <a
                                href={file.url}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            aria-label={`Delete ${file.name}`}
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(file._id)}
                            size="icon"
                            variant="ghost"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete {file.name}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {files?.length === 0 && (
                    <TableRow>
                      <TableCell
                        className="h-24 text-center text-gray-500"
                        colSpan={2}
                      >
                        No files yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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
    </main>
  );
}
