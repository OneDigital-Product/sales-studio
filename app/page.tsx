"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { OutstandingRequestsWidget } from "@/components/info-requests/outstanding-requests-widget";
import { QuoteDashboard } from "@/components/quotes/quote-dashboard";
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
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "underwriting":
      return "bg-purple-100 text-purple-800 border-purple-300";
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
  const clients = useQuery(api.clients.getClientsWithQuotes);
  const createClient = useMutation(api.clients.createClient);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("clients");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "newest">(
    "name-asc"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createClient({ name, contactEmail: email, notes });
    setName("");
    setEmail("");
    setNotes("");
    setIsModalOpen(false);
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
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h1 className="font-bold text-4xl text-gray-900">Sales Studio</h1>
            <p className="mt-2 text-gray-600">
              Manage your clients and quoting data.
            </p>
          </div>

          <Dialog onOpenChange={setIsModalOpen} open={isModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                + Add Client
              </Button>
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
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Corp"
                    required
                    value={name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@acme.com"
                    type="email"
                    value={email}
                  />
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

        <OutstandingRequestsWidget />

        <Tabs onValueChange={setActiveTab} value={activeTab}>
          <TabsList>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="dashboard">Quote Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Clients</CardTitle>
                    <CardDescription>
                      A list of all your active clients.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) =>
                        setSortBy(value as "name-asc" | "name-desc" | "newest")
                      }
                      value={sortBy}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-64"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      type="search"
                      value={searchQuery}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Quote Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients?.map((client) => (
                      <TableRow key={client._id}>
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
                        <TableCell className="text-right">
                          <Link href={`/clients/${client._id}`}>
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
                          colSpan={4}
                        >
                          {searchQuery
                            ? "No clients match your search."
                            : "No clients found. Add one to get started."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <QuoteDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
