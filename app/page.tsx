"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { RecentActivityWidget } from "@/components/activity/recent-activity-widget";
import { BookmarkedClientsWidget } from "@/components/bookmarks/bookmarked-clients-widget";
import { MergeClientsDialog } from "@/components/clients/merge-clients-dialog";
import { OutstandingRequestsWidget } from "@/components/info-requests/outstanding-requests-widget";
import { QuoteDashboard } from "@/components/quotes/quote-dashboard";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../convex/_generated/api";

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

export default function Home() {
  const clients = useQuery(api.clients.getClientsWithQuotes, {
    includeArchived: false,
  });
  const archivedClients = useQuery(api.clients.getClientsWithQuotes, {
    includeArchived: true,
  });
  const createClient = useMutation(api.clients.createClient);
  const restoreClient = useMutation(api.clients.restoreClient);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("clients");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "newest">(
    "name-asc"
  );
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setNameError("");
    setEmailError("");

    // Validate name (required)
    if (!name.trim()) {
      setNameError("Client name is required");
      return;
    }

    // Validate email format (if provided)
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

  const handleRestoreClient = async (clientId: string, clientName: string) => {
    try {
      await restoreClient({ clientId: clientId as any });
      // Show success notification
      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50";
      toast.textContent = `${clientName} has been restored successfully`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error) {
      console.error("Failed to restore client:", error);
      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50";
      toast.textContent = "Failed to restore client";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

  // Filter and sort clients
  const filteredClients = clients
    ?.filter((client) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const nameMatch = client.name.toLowerCase().includes(query);
      const emailMatch = client.contactEmail?.toLowerCase().includes(query);
      return nameMatch || emailMatch;
    })
    .sort((a, b) => {
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto space-y-8 p-4 md:p-8">
        <Breadcrumb className="mb-4" items={[{ label: "Home", href: "/" }]} />
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h1 className="font-bold text-4xl text-gray-900">Sales Studio</h1>
            <p className="mt-2 text-gray-600">
              Manage your clients and quoting data.
            </p>
          </div>

          <div className="flex gap-3">
            <MergeClientsDialog />
            <Link href="/stats">
              <Button variant="outline">📊 Statistics</Button>
            </Link>
            <Dialog onOpenChange={setIsModalOpen} open={isModalOpen}>
              <DialogTrigger asChild>
                <Button>+ Add Client</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new client here. Click save when
                    you're done.
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

        <BookmarkedClientsWidget />

        <OutstandingRequestsWidget />

        <RecentActivityWidget />

        <Tabs onValueChange={setActiveTab} value={activeTab}>
          <TabsList>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="dashboard">Quote Dashboard</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div>
                    <CardTitle>Current Clients</CardTitle>
                    <CardDescription>
                      A list of all your active clients.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select
                      onValueChange={(value) =>
                        setSortBy(value as "name-asc" | "name-desc" | "newest")
                      }
                      value={sortBy}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-full sm:w-64"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      type="search"
                      value={searchQuery}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Desktop table view */}
                <div className="hidden md:block">
                  {clients === undefined ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner size="lg" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Quote Status</TableHead>
                          <TableHead>Documents</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients?.map((client) => (
                          <TableRow
                            className="cursor-pointer transition-all hover:bg-gray-50 hover:shadow-sm"
                            key={client._id}
                            onClick={() =>
                              (window.location.href = `/clients/${client._id}`)
                            }
                          >
                            <TableCell className="font-medium">
                              {client.name}
                            </TableCell>
                            <TableCell>{client.contactEmail || "—"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1.5">
                                {client.peoQuote && (
                                  <Badge
                                    className={`border text-xs ${getStatusColor(
                                      client.peoQuote.status,
                                      client.peoQuote.isBlocked
                                    )}`}
                                    variant="outline"
                                  >
                                    PEO: {formatStatus(client.peoQuote.status)}
                                  </Badge>
                                )}
                                {client.acaQuote && (
                                  <Badge
                                    className={`border text-xs ${getStatusColor(
                                      client.acaQuote.status,
                                      client.acaQuote.isBlocked
                                    )}`}
                                    variant="outline"
                                  >
                                    ACA: {formatStatus(client.acaQuote.status)}
                                  </Badge>
                                )}
                                {!(client.peoQuote || client.acaQuote) && (
                                  <span className="text-gray-400 text-sm">
                                    No quotes
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="min-w-[100px] flex-1">
                                  <div className="h-2 w-full rounded-full bg-gray-200">
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
                                </div>
                                <span className="whitespace-nowrap text-gray-600 text-sm">
                                  {client.documentCompleteness.percentage}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Link
                                href={`/clients/${client._id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button size="sm" variant="outline">
                                  Manage Quote
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredClients?.length === 0 && (
                          <TableRow>
                            <TableCell
                              className="h-24 text-center text-gray-500"
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
                  )}
                </div>

                {/* Mobile card view */}
                <div className="space-y-4 md:hidden">
                  {clients === undefined ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner size="lg" />
                    </div>
                  ) : (
                    filteredClients?.map((client) => (
                      <Card
                        className="cursor-pointer p-4 transition-all hover:shadow-md"
                        key={client._id}
                        onClick={() =>
                          (window.location.href = `/clients/${client._id}`)
                        }
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {client.name}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {client.contactEmail || "—"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="mb-1.5 font-medium text-gray-700 text-xs">
                              Quote Status
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {client.peoQuote && (
                                <Badge
                                  className={`border text-xs ${getStatusColor(
                                    client.peoQuote.status,
                                    client.peoQuote.isBlocked
                                  )}`}
                                  variant="outline"
                                >
                                  PEO: {formatStatus(client.peoQuote.status)}
                                </Badge>
                              )}
                              {client.acaQuote && (
                                <Badge
                                  className={`border text-xs ${getStatusColor(
                                    client.acaQuote.status,
                                    client.acaQuote.isBlocked
                                  )}`}
                                  variant="outline"
                                >
                                  ACA: {formatStatus(client.acaQuote.status)}
                                </Badge>
                              )}
                              {!(client.peoQuote || client.acaQuote) && (
                                <span className="text-gray-400 text-sm">
                                  No quotes
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="mb-1.5 font-medium text-gray-700 text-xs">
                              Documents
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="min-w-[100px] flex-1">
                                <div className="h-2 w-full rounded-full bg-gray-200">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      client.documentCompleteness.percentage ===
                                      100
                                        ? "bg-green-600"
                                        : "bg-primary"
                                    }`}
                                    style={{
                                      width: `${client.documentCompleteness.percentage}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <span className="whitespace-nowrap text-gray-600 text-sm">
                                {client.documentCompleteness.percentage}%
                              </span>
                            </div>
                          </div>

                          <Link
                            className="block"
                            href={`/clients/${client._id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              className="w-full"
                              size="sm"
                              variant="outline"
                            >
                              Manage Quote
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    ))
                  )}
                  {clients !== undefined && filteredClients?.length === 0 && (
                    <div className="py-12 text-center text-gray-500">
                      {searchQuery
                        ? "No clients match your search."
                        : "No clients found. Add one to get started."}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <QuoteDashboard />
          </TabsContent>

          <TabsContent value="archived">
            <Card>
              <CardHeader>
                <CardTitle>Archived Clients</CardTitle>
                <CardDescription>
                  Clients that have been archived. Click on a client to restore
                  it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {archivedClients === undefined ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Archived Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedClients?.filter((c) => c.isArchived).length ===
                      0 ? (
                        <TableRow>
                          <TableCell
                            className="text-center text-gray-500"
                            colSpan={4}
                          >
                            No archived clients
                          </TableCell>
                        </TableRow>
                      ) : (
                        archivedClients
                          ?.filter((c) => c.isArchived)
                          .map((client) => (
                            <TableRow key={client._id}>
                              <TableCell className="font-medium">
                                {client.name}
                              </TableCell>
                              <TableCell>
                                {client.contactEmail || "—"}
                              </TableCell>
                              <TableCell>
                                {client.archivedAt
                                  ? new Date(
                                      client.archivedAt
                                    ).toLocaleDateString()
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  onClick={() =>
                                    handleRestoreClient(client._id, client.name)
                                  }
                                  size="sm"
                                  variant="default"
                                >
                                  Restore
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
