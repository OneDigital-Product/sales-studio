"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1", className)}
    >
      <ol className="flex items-center gap-1">
        {items.map((item, index) => (
          <li className="flex items-center gap-1" key={index}>
            {item.href ? (
              <Link
                className="font-sans text-primary text-sm hover:underline"
                href={item.href}
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-sans text-foreground text-sm">
                {item.label}
              </span>
            )}
            {index < items.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
