"use client";

import { useMutation, useQuery } from "convex/react";
import {
  Bookmark,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { MergeClientsDialog } from "@/components/clients/merge-clients-dialog";
import { MainNav } from "@/components/navigation/main-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

type QuoteStatus =
  | "not_started"
  | "intake"
  | "underwriting"
  | "proposal_ready"
  | "presented"
  | "accepted"
  | "declined";

const getStatusColor = (status: QuoteStatus, isBlocked?: boolean) => {
  if (isBlocked) return "bg-red-100 text-red-800 border-red-300";
  switch (status) {
    case "not_started":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "intake":
      return "bg-primary/10 text-foreground border-primary/20";
    case "underwriting":
      return "bg-secondary text-foreground border-secondary";
    case "proposal_ready":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "presented":
      return "bg-teal-100 text-teal-800 border-teal-300";
    case "accepted":
      return "bg-green-100 text-green-800 border-green-300";
    case "declined":
      return "bg-red-100 text-red-800 border-red-300";
  }
};

const formatStatus = (status: QuoteStatus) =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getCombinedStatus = (client: {
  peoQuote?: { status: QuoteStatus; isBlocked?: boolean } | null;
  acaQuote?: { status: QuoteStatus; isBlocked?: boolean } | null;
}) => {
  const hasQuotes = client.peoQuote || client.acaQuote;
  if (!hasQuotes) return { label: "No Quotes", color: "text-gray-400" };

  const isBlocked = client.peoQuote?.isBlocked || client.acaQuote?.isBlocked;
  if (isBlocked) return { label: "Blocked", color: "text-red-600" };

  const statuses = [client.peoQuote?.status, client.acaQuote?.status].filter(
    Boolean
  ) as QuoteStatus[];

  if (statuses.includes("accepted"))
    return { label: "Accepted", color: "text-green-600" };
  if (statuses.includes("declined"))
    return { label: "Declined", color: "text-red-600" };
  if (statuses.includes("presented"))
    return { label: "Presented", color: "text-teal-600" };
  if (statuses.includes("proposal_ready"))
    return { label: "Proposal Ready", color: "text-orange-600" };
  if (statuses.includes("underwriting"))
    return { label: "Underwriting", color: "text-purple-600" };
  if (statuses.includes("intake"))
    return { label: "In Progress", color: "text-primary" };

  return { label: "Not Started", color: "text-gray-500" };
};

export default function Home() {
  const clients = useQuery(api.clients.getClientsWithQuotes, {
    includeArchived: false,
  });
  const bookmarkedClients = useQuery(api.bookmarks.getBookmarkedClients);
  const recentActivity = useQuery(api.comments.getRecentActivity, { limit: 3 });
  const createClient = useMutation(api.clients.createClient);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "newest">(
    "name-asc"
  );
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<Id<"clients">>>(
    new Set()
  );

  const validateEmail = (emailValue: string) => {
    if (!emailValue) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setEmailError("");

    if (!name.trim()) {
      setNameError("Client name is required");
      return;
    }

    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    await createClient({
      name: name.trim(),
      contactEmail: email.trim(),
      notes,
    });
    setName("");
    setEmail("");
    setNotes("");
    setIsModalOpen(false);
  };

  const toggleRowExpansion = (clientId: Id<"clients">) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedRows(newExpanded);
  };

  const bookmarkedIds = new Set(bookmarkedClients?.map((c) => c._id) ?? []);

  const filteredClients = clients
    ?.filter((client) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const nameMatch = client.name.toLowerCase().includes(query);
      const emailMatch = client.contactEmail?.toLowerCase().includes(query);
      return nameMatch || emailMatch;
    })
    .sort((a, b) => {
      const aBookmarked = bookmarkedIds.has(a._id);
      const bBookmarked = bookmarkedIds.has(b._id);
      if (aBookmarked && !bBookmarked) return -1;
      if (!aBookmarked && bBookmarked) return 1;

      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === "newest") {
        return b._creationTime - a._creationTime;
      }
      return 0;
    });

  const getClientRecentActivity = (clientId: Id<"clients">) =>
    recentActivity?.filter((a) => a.clientId === clientId).slice(0, 2);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="mb-6 font-bold text-3xl text-primary md:text-4xl">
          Sales Studio
        </h1>

        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <MainNav />

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients..."
                type="search"
                value={searchQuery}
              />
            </div>

            <Select
              onValueChange={(value) =>
                setSortBy(value as "name-asc" | "name-desc" | "newest")
              }
              value={sortBy}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">A-Z</SelectItem>
                <SelectItem value="name-desc">Z-A</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>

            <MergeClientsDialog />

            <Dialog onOpenChange={setIsModalOpen} open={isModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new client here.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className={nameError ? "border-red-500" : ""}
                      id="name"
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError("");
                      }}
                      placeholder="Acme Corp"
                      value={name}
                    />
                    {nameError && (
                      <p className="text-red-500 text-sm">{nameError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      className={emailError ? "border-red-500" : ""}
                      id="email"
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      placeholder="contact@acme.com"
                      value={email}
                    />
                    {emailError && (
                      <p className="text-red-500 text-sm">{emailError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional client details..."
                      value={notes}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Client</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            {clients === undefined ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-t-0">
                        <TableHead className="w-8 rounded-tl-lg pl-6" />
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="rounded-tr-lg pr-6 text-center">
                          <span className="sr-only">Action</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients?.map((client) => {
                        const isExpanded = expandedRows.has(client._id);
                        const isBookmarked = bookmarkedIds.has(client._id);
                        const combinedStatus = getCombinedStatus(client);
                        const clientActivity = getClientRecentActivity(
                          client._id
                        );

                        return (
                          <Fragment key={client._id}>
                            <TableRow
                              className={`cursor-pointer transition-colors hover:bg-gray-50 ${isBookmarked ? "bg-yellow-50/50" : ""}`}
                              onClick={() => toggleRowExpansion(client._id)}
                            >
                              <TableCell className="w-8 pl-6">
                                <button
                                  className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowExpansion(client._id);
                                  }}
                                  type="button"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </button>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {isBookmarked && (
                                    <Bookmark className="h-3.5 w-3.5 fill-yellow-500 text-yellow-600" />
                                  )}
                                  {client.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {client.contactEmail || "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={`font-medium text-sm ${combinedStatus.color}`}
                                >
                                  {combinedStatus.label}
                                </span>
                              </TableCell>
                              <TableCell className="pr-6 text-right">
                                <Link
                                  href={`/clients/${client._id}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button size="sm" variant="outline">
                                    Manage
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>

                            {isExpanded && (
                              <TableRow key={`${client._id}-expanded`}>
                                <TableCell
                                  className="bg-gray-50/80 px-6 py-4"
                                  colSpan={5}
                                >
                                  <div className="grid gap-6 md:grid-cols-3">
                                    <div>
                                      <h4 className="mb-2 font-medium text-primary text-sm">
                                        Quote Status
                                      </h4>
                                      <div className="space-y-2">
                                        {client.peoQuote ? (
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              className={`border text-xs ${getStatusColor(client.peoQuote.status, client.peoQuote.isBlocked)}`}
                                              variant="outline"
                                            >
                                              PEO:{" "}
                                              {formatStatus(
                                                client.peoQuote.status
                                              )}
                                            </Badge>
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground text-sm">
                                            No PEO quote
                                          </span>
                                        )}
                                        {client.acaQuote ? (
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              className={`border text-xs ${getStatusColor(client.acaQuote.status, client.acaQuote.isBlocked)}`}
                                              variant="outline"
                                            >
                                              ACA:{" "}
                                              {formatStatus(
                                                client.acaQuote.status
                                              )}
                                            </Badge>
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground text-sm">
                                            No ACA quote
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="mb-2 font-medium text-primary text-sm">
                                        Documents
                                      </h4>
                                      <div className="flex items-center gap-3">
                                        <div className="h-2 flex-1 rounded-full bg-gray-200">
                                          <div
                                            className={`h-2 rounded-full transition-all ${
                                              client.documentCompleteness
                                                .percentage === 100
                                                ? "bg-green-600"
                                                : "bg-primary"
                                            }`}
                                            style={{
                                              width: `${client.documentCompleteness.percentage}%`,
                                            }}
                                          />
                                        </div>
                                        <span className="font-medium text-muted-foreground text-sm">
                                          {
                                            client.documentCompleteness
                                              .percentage
                                          }
                                          %
                                        </span>
                                      </div>
                                      <p className="mt-1 text-muted-foreground text-xs">
                                        {
                                          client.documentCompleteness
                                            .uploadedRequired
                                        }{" "}
                                        of{" "}
                                        {
                                          client.documentCompleteness
                                            .totalRequired
                                        }{" "}
                                        required docs
                                      </p>
                                    </div>

                                    <div className="flex self-center justify-end">
                                      <Link
                                        href={`/clients/${client._id}#documents`}
                                      >
                                        <Button size="sm" variant="outline">
                                          <Upload className="mr-1 h-3 w-3" />
                                          Upload documents
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>

                                  {clientActivity &&
                                    clientActivity.length > 0 && (
                                      <div className="mt-4 border-gray-200 border-t pt-4">
                                        <h4 className="mb-2 font-medium text-primary text-sm">
                                          Recent Activity
                                        </h4>
                                        <div className="space-y-2">
                                          {clientActivity.map(
                                            (activity, idx) => (
                                              <div
                                                className="flex items-start gap-2 text-sm"
                                                key={idx}
                                              >
                                                <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-muted-foreground">
                                                  {activity.type === "comment"
                                                    ? `${activity.authorName}: ${activity.content.slice(0, 60)}${activity.content.length > 60 ? "..." : ""}`
                                                    : `Status changed to ${formatStatus(activity.newStatus as QuoteStatus)}`}
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                      {filteredClients?.length === 0 && (
                        <TableRow>
                          <TableCell
                            className="h-24 text-center text-muted-foreground"
                            colSpan={5}
                          >
                            {searchQuery
                              ? "No clients match your search."
                              : "No clients found. Add one to get started."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-2 p-4 md:hidden">
                  {filteredClients?.map((client) => {
                    const isBookmarked = bookmarkedIds.has(client._id);
                    const combinedStatus = getCombinedStatus(client);

                    return (
                      <Link
                        className="block"
                        href={`/clients/${client._id}`}
                        key={client._id}
                      >
                        <div
                          className={`rounded-lg border p-3 transition-colors hover:bg-gray-50 ${isBookmarked ? "border-yellow-200 bg-yellow-50/50" : "border-gray-200"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isBookmarked && (
                                <Bookmark className="h-3.5 w-3.5 fill-yellow-500 text-yellow-600" />
                              )}
                              <span className="font-medium">{client.name}</span>
                            </div>
                            <span className={`text-sm ${combinedStatus.color}`}>
                              {combinedStatus.label}
                            </span>
                          </div>
                          {client.contactEmail && (
                            <p className="mt-1 text-muted-foreground text-sm">
                              {client.contactEmail}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                  {filteredClients?.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                      {searchQuery
                        ? "No clients match your search."
                        : "No clients found. Add one to get started."}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
