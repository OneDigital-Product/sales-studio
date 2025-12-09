"use client";

import { useMutation } from "convex/react";
import { MessageSquare } from "lucide-react";
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
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type FileCommentDialogProps = {
  clientId: Id<"clients">;
  fileId: Id<"files">;
  fileName: string;
  commentCount?: number;
};

export function FileCommentDialog({
  clientId,
  fileId,
  fileName,
  commentCount = 0,
}: FileCommentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorTeam, setAuthorTeam] = useState<"PEO" | "ACA" | "Sales">("PEO");

  const addComment = useMutation(api.comments.addComment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(content.trim() && authorName.trim())) {
      return;
    }

    try {
      await addComment({
        clientId,
        targetType: "file",
        targetId: fileId,
        content: content.trim(),
        authorName: authorName.trim(),
        authorTeam,
      });

      setContent("");
      setAuthorName("");
      setAuthorTeam("PEO");
      setIsOpen(false);
    } catch {
      // Error silently handled
    }
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label={`Comment on ${fileName}`}
          className="relative h-8 w-8"
          size="icon"
          variant="ghost"
        >
          <MessageSquare className="h-4 w-4" />
          {commentCount > 0 && (
            <span className="-right-1 -top-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs">
              {commentCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Comment on File</DialogTitle>
          <DialogDescription>
            Add a comment about <strong>{fileName}</strong>
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="author-name">Your Name</Label>
            <Input
              id="author-name"
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="John Doe"
              required
              value={authorName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author-team">Team</Label>
            <Select
              onValueChange={(value) =>
                setAuthorTeam(value as "PEO" | "ACA" | "Sales")
              }
              value={authorTeam}
            >
              <SelectTrigger id="author-team">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PEO">PEO Team</SelectItem>
                <SelectItem value="ACA">ACA Team</SelectItem>
                <SelectItem value="Sales">Sales Team</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment-content">Comment</Label>
            <Textarea
              id="comment-content"
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your comment about this file..."
              required
              rows={4}
              value={content}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button type="submit">Add Comment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
