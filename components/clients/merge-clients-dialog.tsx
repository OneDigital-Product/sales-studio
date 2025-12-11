"use client";

import { useMutation, useQuery } from "convex/react";
import { GitMerge } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface MergeClientsDialogProps {
  clientId1?: Id<"clients">;
  clientId2?: Id<"clients">;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function MergeClientsDialog({
  clientId1,
  clientId2,
  onSuccess,
  trigger,
}: MergeClientsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedClientId1, setSelectedClientId1] = useState<string>(
    clientId1 || ""
  );
  const [selectedClientId2, setSelectedClientId2] = useState<string>(
    clientId2 || ""
  );
  const [primaryClientId, setPrimaryClientId] = useState<Id<"clients"> | null>(
    null
  );
  const [isMerging, setIsMerging] = useState(false);

  const allClients = useQuery(api.clients.getClients, {
    includeArchived: false,
  });
  const client1 = useQuery(
    api.clients.getClient,
    selectedClientId1 ? { id: selectedClientId1 as Id<"clients"> } : "skip"
  );
  const client2 = useQuery(
    api.clients.getClient,
    selectedClientId2 ? { id: selectedClientId2 as Id<"clients"> } : "skip"
  );
  const toast = useToast();
  const mergeClients = useMutation(api.clients.mergeClients);

  const handleMerge = async () => {
    if (!(selectedClientId1 && selectedClientId2)) {
      toast.error("Please select two clients to merge");
      return;
    }

    if (!primaryClientId) {
      toast.error("Please select which client to keep as primary");
      return;
    }

    const secondaryClientId =
      primaryClientId === selectedClientId1
        ? selectedClientId2
        : selectedClientId1;

    setIsMerging(true);

    try {
      await mergeClients({
        primaryClientId,
        secondaryClientId: secondaryClientId as Id<"clients">,
      });

      toast.success("Clients merged successfully!");
      setOpen(false);
      setSelectedClientId1("");
      setSelectedClientId2("");
      setPrimaryClientId(null);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to merge clients:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to merge clients: ${errorMessage}`);
    } finally {
      setIsMerging(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isMerging) {
      setOpen(newOpen);
      if (!newOpen) {
        if (!clientId1) setSelectedClientId1("");
        if (!clientId2) setSelectedClientId2("");
        setPrimaryClientId(null);
      }
    }
  };

  const primaryClient =
    primaryClientId === selectedClientId1 ? client1 : client2;
  const secondaryClient =
    primaryClientId === selectedClientId1 ? client2 : client1;

  // Filter available clients for second dropdown
  const availableClientsForSecond = allClients?.filter(
    (c) => c._id !== selectedClientId1
  );

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="default">
            <GitMerge className="mr-2 h-4 w-4" />
            Merge Clients
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Merge Duplicate Clients</DialogTitle>
          <DialogDescription>
            Select two clients to merge, then choose which one to keep as the
            primary record. All data from the secondary client will be moved to
            the primary client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Show dropdowns if clients not pre-selected */}
          {!(clientId1 && clientId2) && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="client-1-select">First Client</Label>
                <Select
                  disabled={isMerging}
                  onValueChange={setSelectedClientId1}
                  value={selectedClientId1}
                >
                  <SelectTrigger id="client-1-select">
                    <SelectValue placeholder="Select first client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allClients?.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name}
                        {client.contactEmail && ` (${client.contactEmail})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-2-select">Second Client</Label>
                <Select
                  disabled={isMerging || !selectedClientId1}
                  onValueChange={setSelectedClientId2}
                  value={selectedClientId2}
                >
                  <SelectTrigger id="client-2-select">
                    <SelectValue placeholder="Select second client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClientsForSecond?.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name}
                        {client.contactEmail && ` (${client.contactEmail})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Show radio buttons when both clients are selected */}
          {client1 && client2 && (
            <div className="space-y-3">
              <Label>Choose primary client to keep:</Label>
              <RadioGroup
                disabled={isMerging}
                onValueChange={(value) =>
                  setPrimaryClientId(value as Id<"clients">)
                }
                value={primaryClientId || undefined}
              >
                <div className="flex items-start space-x-3 rounded-md border p-4 hover:bg-gray-50">
                  <RadioGroupItem id="client1" value={selectedClientId1} />
                  <div className="flex-1">
                    <Label className="font-medium" htmlFor="client1">
                      {client1.name}
                    </Label>
                    {client1.contactEmail && (
                      <p className="mt-1 text-gray-600 text-sm">
                        {client1.contactEmail}
                      </p>
                    )}
                    {client1.notes && (
                      <p className="mt-1 line-clamp-2 text-gray-500 text-sm">
                        {client1.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-md border p-4 hover:bg-gray-50">
                  <RadioGroupItem id="client2" value={selectedClientId2} />
                  <div className="flex-1">
                    <Label className="font-medium" htmlFor="client2">
                      {client2.name}
                    </Label>
                    {client2.contactEmail && (
                      <p className="mt-1 text-gray-600 text-sm">
                        {client2.contactEmail}
                      </p>
                    )}
                    {client2.notes && (
                      <p className="mt-1 line-clamp-2 text-gray-500 text-sm">
                        {client2.notes}
                      </p>
                    )}
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {primaryClientId && client1 && client2 && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
              <h4 className="mb-2 font-medium font-sans text-sm text-yellow-900">
                What will happen:
              </h4>
              <ul className="space-y-1 text-sm text-yellow-800">
                <li>✓ Primary client: {primaryClient?.name}</li>
                <li>
                  ✓ All files, quotes, census data, comments, and requests from{" "}
                  {secondaryClient?.name} will be moved to {primaryClient?.name}
                </li>
                <li className="font-medium text-red-700">
                  ✗ {secondaryClient?.name} will be permanently deleted
                </li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            disabled={isMerging}
            onClick={() => handleOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={
              !(selectedClientId1 && selectedClientId2 && primaryClientId) ||
              isMerging
            }
            onClick={handleMerge}
            variant="destructive"
          >
            {isMerging ? "Merging..." : "Merge Clients"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
