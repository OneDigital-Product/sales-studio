"use client";

import { useMutation, useQuery } from "convex/react";
import { Plus, Search } from "lucide-react";
import { MergeClientsDialog } from "@/components/clients/merge-clients-dialog";
import { MainNav } from "@/components/navigation/main-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
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

export default function ArchivedPage() {
  const archivedClients = useQuery(api.clients.getClientsWithQuotes, {
    includeArchived: true,
  });
  const restoreClient = useMutation(api.clients.restoreClient);

  const handleRestoreClient = async (clientId: string, clientName: string) => {
    try {
      await restoreClient({ clientId: clientId as Id<"clients"> });
      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50";
      toast.textContent = `${clientName} has been restored successfully`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch {
      const toast = document.createElement("div");
      toast.className =
        "fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50";
      toast.textContent = "Failed to restore client";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

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
                disabled
                placeholder="Search clients..."
                type="search"
              />
            </div>
            <MergeClientsDialog />
            <Button disabled>
              <Plus className="mr-1 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden py-0">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-base text-primary">
              Archived Clients
            </CardTitle>
            <CardDescription>
              Clients that have been archived. You can restore them here.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {archivedClients === undefined ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Archived Date</TableHead>
                    <TableHead className="pr-6 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedClients?.filter((c) => c.isArchived).length === 0 ? (
                    <TableRow>
                      <TableCell
                        className="py-12 text-center text-muted-foreground"
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
                          <TableCell className="pl-6 font-medium">
                            {client.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {client.contactEmail || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {client.archivedAt
                              ? new Date(client.archivedAt).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell className="pr-6 text-center">
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
      </div>
    </main>
  );
}
