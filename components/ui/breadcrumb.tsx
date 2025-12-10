import { ChevronRight } from "lucide-react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li className="flex items-center gap-2" key={index}>
              {item.href && !isLast ? (
                <Link
                  className="text-gray-600 transition-colors hover:text-gray-900"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast ? "font-medium text-gray-900" : "text-gray-600"
                  }
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <ChevronRight
                  aria-hidden="true"
                  className="h-4 w-4 text-gray-400"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
