"use client";

import { useMutation } from "convex/react";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface CreateRequestDialogProps {
  clientId: Id<"clients">;
  trigger?: React.ReactNode;
  prePopulatedItems?: Array<{ description: string; category?: string }>;
  defaultQuoteType?: "PEO" | "ACA" | "both";
}

export function CreateRequestDialog({
  clientId,
  trigger,
  prePopulatedItems,
  defaultQuoteType,
}: CreateRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [quoteType, setQuoteType] = useState<
    "PEO" | "ACA" | "both" | undefined
  >(defaultQuoteType);
  const [title, setTitle] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<
    Array<{ description: string; category?: string }>
  >([{ description: "", category: "" }]);

  const createRequest = useMutation(api.info_requests.createInfoRequest);

  // Pre-populate items when dialog opens with validation issues
  useEffect(() => {
    if (open && prePopulatedItems && prePopulatedItems.length > 0) {
      setItems(prePopulatedItems);
      if (defaultQuoteType) {
        setQuoteType(defaultQuoteType);
      }
    }
  }, [open, prePopulatedItems, defaultQuoteType]);

  const addItem = () => {
    setItems([...items, { description: "", category: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: "description" | "category",
    value: string
  ) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updated);
  };

  const handleSubmit = async () => {
    // Filter out empty items
    const validItems = items.filter((item) => item.description.trim() !== "");

    if (!title.trim()) {
      alert("Please add a request title");
      return;
    }
    if (validItems.length === 0) {
      alert("Please add at least one request item");
      return;
    }

    await createRequest({
      clientId,
      title: title.trim(),
      quoteType,
      items: validItems,
      requestedBy: requestedBy.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setQuoteType(undefined);
    setTitle("");
    setRequestedBy("");
    setNotes("");
    setItems([{ description: "", category: "" }]);
    setOpen(false);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger || <Button>Request Missing Info</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Missing Information</DialogTitle>
          <DialogDescription>
            Create a request for missing or incomplete information from the
            client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you requesting?"
              value={title}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quoteType">Quote Type (Optional)</Label>
            <Select
              onValueChange={(value) =>
                setQuoteType(value as "PEO" | "ACA" | "both" | undefined)
              }
              value={quoteType}
            >
              <SelectTrigger id="quoteType">
                <SelectValue placeholder="Select quote type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="PEO">PEO</SelectItem>
                <SelectItem value="ACA">ACA</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestedBy">Requested By (Optional)</Label>
            <Input
              id="requestedBy"
              onChange={(e) => setRequestedBy(e.target.value)}
              placeholder="Enter your name..."
              value={requestedBy}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Request Items</Label>
              <Button
                onClick={addItem}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  className="flex items-start gap-2 rounded-lg border p-3"
                  key={index}
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      placeholder="Description (required)"
                      value={item.description}
                    />
                    <Input
                      onChange={(e) =>
                        updateItem(index, "category", e.target.value)
                      }
                      placeholder="Category (optional)"
                      value={item.category}
                    />
                  </div>
                  {items.length > 1 && (
                    <Button
                      onClick={() => removeItem(index)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or context..."
              rows={3}
              value={notes}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
