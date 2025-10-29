import { useMemo } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

export default function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}: TablePaginationProps) {
  const getPageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between gap-4" data-testid="table-pagination">
      <div className="text-sm text-muted-foreground" data-testid="text-pagination-info">
        {totalItems === 0 ? (
          "Showing 0 items"
        ) : (
          `Showing ${startItem.toLocaleString()} to ${endItem.toLocaleString()} of ${totalItems.toLocaleString()} items`
        )}
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={() => {
                if (currentPage > 1) onPageChange(currentPage - 1);
              }}
              disabled={currentPage === 1}
              className="gap-1 pl-2.5"
              data-testid="button-pagination-previous"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
          </PaginationItem>

          {getPageNumbers.map((page, index) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <Button
                  type="button"
                  variant={currentPage === page ? "outline" : "ghost"}
                  size="icon"
                  onClick={() => onPageChange(page as number)}
                  data-testid={`button-pagination-page-${page}`}
                >
                  {page}
                </Button>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={() => {
                if (currentPage < totalPages) onPageChange(currentPage + 1);
              }}
              disabled={currentPage === totalPages}
              className="gap-1 pr-2.5"
              data-testid="button-pagination-next"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
