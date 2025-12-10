"use client";

import { useMutation, useQuery } from "convex/react";
import { Copy } from "lucide-react";
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

interface CloneCensusDialogProps {
  censusUploadId: Id<"census_uploads">;
  currentClientId: Id<"clients">;
  censusFileName: string;
  trigger?: React.ReactNode;
}

export function CloneCensusDialog({
  censusUploadId,
  currentClientId,
  censusFileName,
  trigger,
}: CloneCensusDialogProps) {
  const [open, setOpen] = useState(false);
  const [targetClientId, setTargetClientId] = useState<Id<"clients"> | null>(
    null
  );
  const [isCloning, setIsCloning] = useState(false);

  const clients = useQuery(api.clients.getClients, { includeArchived: false });
  const toast = useToast();
  const cloneCensus = useMutation(api.census.cloneCensus);

  // Filter out the current client from the selection
  const availableClients = clients?.filter(
    (client) => client._id !== currentClientId
  );

  const handleClone = async () => {
    if (!targetClientId) {
      toast.error("Please select a target client");
      return;
    }

    setIsCloning(true);

    try {
      console.log("[Dialog] Starting clone:", {
        censusUploadId,
        targetClientId,
      });

      const result = await cloneCensus({
        censusUploadId,
        targetClientId,
      });

      console.log("[Dialog] Clone result:", result);
      toast.success(
        `Census cloned successfully! New ID: ${result.newCensusId}`
      );
      setOpen(false);
      setTargetClientId(null);
    } catch (error) {
      console.error("[Dialog] Failed to clone census:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to clone census: ${errorMessage}`);
    } finally {
      setIsCloning(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isCloning) {
      setOpen(newOpen);
      if (!newOpen) {
        setTargetClientId(null);
      }
    }
  };

  const selectedClient = availableClients?.find(
    (c) => c._id === targetClientId
  );

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Clone Census
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Census Data</DialogTitle>
          <DialogDescription>
            Copy census data from "{censusFileName}" to another client. The
            target client will have all rows and columns duplicated as a new
            census upload.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="target-client">Target Client</Label>
            <Select
              disabled={isCloning}
              onValueChange={(value) =>
                setTargetClientId(value as Id<"clients">)
              }
              value={targetClientId || undefined}
            >
              <SelectTrigger id="target-client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {availableClients && availableClients.length > 0 ? (
                  availableClients.map((client) => (
                    <SelectItem key={client._id} value={client._id}>
                      {client.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="none">
                    No other clients available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedClient && (
            <div className="rounded-md bg-primary/10 p-3 text-blue-900 text-sm">
              <p className="font-medium">Census will be cloned to:</p>
              <p className="mt-1">
                {selectedClient.name}
                {selectedClient.contactEmail && (
                  <span className="text-primary">
                    {" "}
                    ({selectedClient.contactEmail})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            disabled={isCloning}
            onClick={() => handleOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={!targetClientId || isCloning} onClick={handleClone}>
            {isCloning ? "Cloning..." : "Clone Census"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
