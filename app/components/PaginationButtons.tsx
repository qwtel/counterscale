import React from "react";

import { ArrowLeft, ArrowRight } from "lucide-react";

interface PaginationButtonsProps {
    page: number;
    hasMore: boolean;
    handlePagination: (page: number) => void;
}

const PaginationButtons: React.FC<PaginationButtonsProps> = ({
    page,
    hasMore,
    handlePagination,
}) => {
    return (
        <div className="p-2 pr-0 grid grid-cols-[auto,2rem,2rem] text-right border-t sticky bottom-6 bg-card" style={{ marginTop: "-2px" }}>
            <div></div>
            <button
                onClick={() => {
                    if (page > 1) handlePagination(page - 1);
                }}
                className={
                    page > 1
                        ? `text-primary hover:cursor-pointer`
                        : `text-orange-300 dark:text-gray-700`
                }
            >
                <ArrowLeft />
            </button>
            <button
                onClick={() => {
                    if (hasMore) handlePagination(page + 1);
                }}
                className={
                    hasMore
                        ? "text-primary hover:cursor-pointer"
                        : "text-orange-300 dark:text-gray-700"
                }
            >
                <ArrowRight />
            </button>
        </div>
    );
};

export default PaginationButtons;
