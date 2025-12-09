"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { FileCommentDialog } from "./file-comment-dialog";

type FileCommentButtonProps = {
  clientId: Id<"clients">;
  fileId: Id<"files">;
  fileName: string;
};

export function FileCommentButton({
  clientId,
  fileId,
  fileName,
}: FileCommentButtonProps) {
  const commentCount = useQuery(api.comments.getTargetCommentCount, {
    targetType: "file",
    targetId: fileId,
  });

  return (
    <FileCommentDialog
      clientId={clientId}
      commentCount={commentCount ?? 0}
      fileId={fileId}
      fileName={fileName}
    />
  );
}
