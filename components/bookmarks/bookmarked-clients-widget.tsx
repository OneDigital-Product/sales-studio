"use client";

import { useQuery } from "convex/react";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../../convex/_generated/api";

const formatStatus = (status: string) =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export function BookmarkedClientsWidget() {
  const bookmarkedClients = useQuery(api.bookmarks.getBookmarkedClients);

  if (!bookmarkedClients || bookmarkedClients.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-yellow-600" />
          <CardTitle>Bookmarked Clients</CardTitle>
        </div>
        <CardDescription>Quick access to your starred clients</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookmarkedClients.map((client) => (
            <Link
              className="block rounded-lg border border-input p-3 transition-colors hover:bg-muted/50"
              href={`/clients/${client._id}`}
              key={client._id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-sans font-semibold text-foreground text-sm">
                    {client.name}
                  </h3>
                  {client.contactEmail && (
                    <p className="text-muted-foreground text-sm">
                      {client.contactEmail}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {client.peoQuoteStatus && (
                      <Badge className="text-xs" variant="outline">
                        PEO: {formatStatus(client.peoQuoteStatus)}
                      </Badge>
                    )}
                    {client.acaQuoteStatus && (
                      <Badge className="text-xs" variant="outline">
                        ACA: {formatStatus(client.acaQuoteStatus)}
                      </Badge>
                    )}
                    {client.documentCount > 0 && (
                      <Badge className="text-xs" variant="secondary">
                        {client.documentCount} doc
                        {client.documentCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
                <Bookmark className="h-4 w-4 flex-shrink-0 fill-yellow-500 text-yellow-600" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
