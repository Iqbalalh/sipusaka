"use client";
import Link from "next/link";
import React, { useState } from "react";
import Button from "../ui/button/Button";

interface ComponentCardProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
  createName?: string;
  createUrl?: string;
  desc?: string;
  rightComponent?: React.ReactNode;
  count?: number;
  header?: boolean;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  createUrl,
  createName,
  className = "",
  desc = "",
  rightComponent,
  count,
  header = true,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header */}
      {header && (
        <div className="px-6 py-5">
          <div className="flex justify-between items-center gap-4">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              {title}: {count}
            </h3>

            <div className="flex items-center gap-3">
              {rightComponent && <div>{rightComponent}</div>}

              {createUrl && (
                <Link href={createUrl}>
                  <Button
                    onClick={() => setIsLoading(true)}
                    disabled={isLoading}
                    size="sm"
                  >
                    {createName}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {desc && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {desc}
            </p>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
