"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";

// =============================================
// TYPES
// =============================================
export interface FilterDropdownProps {
  setSelectedKeys: (keys: any[]) => void;
  selectedKeys: any[];
  confirm: (config?: { closeDropdown?: boolean }) => void;
  clearFilters?: () => void;
  close?: () => void;
}

export interface TableColumnType<T = any> {
  title: ReactNode;
  key: string;
  dataIndex?: string;
  width?: number | string;
  fixed?: "left" | "right";
  align?: "left" | "center" | "right";
  sorter?: ((a: T, b: T) => number) | boolean;
  render?: (value: any, record: T, index: number) => ReactNode;
  filterDropdown?: (props: FilterDropdownProps) => ReactNode;
  filterIcon?: (filtered: boolean) => ReactNode;
  onFilter?: (value: any, record: T) => boolean;
  filters?: Array<{ text: ReactNode; value: any }>;
  hidden?: boolean;
  [key: string]: any;
}

// Alias so column files can do a drop-in replacement of antd's ColumnsType
export type ColumnsType<T> = TableColumnType<T>[];

interface PaginationConfig {
  pageSize: number;
  current?: number;
  total?: number;
  showSizeChanger?: boolean;
  onChange?: (page: number) => void;
}

export interface CustomTableProps<T> {
  columns: TableColumnType<T>[];
  dataSource: T[];
  rowKey: string | ((record: T) => string);
  loading?: boolean;
  pagination?: PaginationConfig | false;
  scroll?: { x?: string | number; y?: number };
  bordered?: boolean;
  onChange?: (
    pagination: any,
    filters: Record<string, any[]>,
    sorter: any,
    extra: { currentDataSource: T[] }
  ) => void;
}

// =============================================
// ICONS — pure SVG, no external deps
// =============================================
function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  return (
    <span className="inline-flex flex-col gap-0.5 ml-0.5">
      <svg viewBox="0 0 6 4" className={`w-2 h-2 ${direction === "asc" ? "text-blue-500" : "text-gray-300 dark:text-gray-600"}`} fill="currentColor">
        <path d="M3 0L6 4H0L3 0Z" />
      </svg>
      <svg viewBox="0 0 6 4" className={`w-2 h-2 ${direction === "desc" ? "text-blue-500" : "text-gray-300 dark:text-gray-600"}`} fill="currentColor">
        <path d="M3 4L0 0H6L3 4Z" />
      </svg>
    </span>
  );
}

function FilterIcon({ filtered }: { filtered: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`w-3.5 h-3.5 transition-colors ${filtered ? "text-blue-500" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.553.894l-4 2A1 1 0 017 17v-6.586L3.293 6.707A1 1 0 013 6V3z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// =============================================
// MAIN COMPONENT
// =============================================
export default function CustomTable<T extends Record<string, any>>({
  columns: rawColumns,
  dataSource,
  rowKey,
  loading = false,
  pagination,
  scroll,
  bordered = false,
  onChange,
}: CustomTableProps<T>) {
  const visibleColumns = useMemo(() => rawColumns.filter((c) => !c.hidden), [rawColumns]);

  // Sort state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // appliedFilters: key → confirmed filter values
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any[]>>({});
  // pendingKeys: values being edited in the currently open dropdown
  const [pendingKeys, setPendingKeys] = useState<any[]>([]);
  // which column's filter dropdown is visible
  const [activeFilterKey, setActiveFilterKey] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(
    pagination !== false ? (pagination?.current ?? 1) : 1
  );

  // Stable ref for onChange to avoid stale closure
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Ref attached to the active dropdown container for click-outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeFilterKey) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveFilterKey(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeFilterKey]);

  // Sync external current page
  useEffect(() => {
    if (pagination !== false && pagination?.current != null) {
      setCurrentPage(pagination.current);
    }
  }, [pagination]);

  const getRowKey = useCallback(
    (record: T) => {
      if (typeof rowKey === "function") return rowKey(record);
      return String(record[rowKey as string]);
    },
    [rowKey]
  );

  const getDeepValue = (record: T, dataIndex?: string): any => {
    if (!dataIndex) return undefined;
    return dataIndex.split(".").reduce((obj: any, k) => obj?.[k], record);
  };

  // Apply column filters
  const filteredData = useMemo(() => {
    const source = Array.isArray(dataSource) ? dataSource : [];
    return source.filter((record) =>
      Object.entries(appliedFilters).every(([key, values]) => {
        if (!values || values.length === 0) return true;
        const col = visibleColumns.find((c) => c.key === key);
        if (!col?.onFilter) return true;
        return values.some((v) => col.onFilter!(v, record));
      })
    );
  }, [dataSource, appliedFilters, visibleColumns]);

  // Apply sort
  const processedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = visibleColumns.find((c) => c.key === sortKey);
    if (!col?.sorter || typeof col.sorter !== "function") return filteredData;
    return [...filteredData].sort((a, b) => {
      const r = (col.sorter as (a: T, b: T) => number)(a, b);
      return sortDir === "asc" ? r : -r;
    });
  }, [filteredData, sortKey, sortDir, visibleColumns]);

  // Notify parent whenever the visible (filtered+sorted) data changes
  const prevRef = useRef<T[]>([]);
  useEffect(() => {
    if (prevRef.current === processedData) return;
    prevRef.current = processedData;
    const ps = pagination !== false ? (pagination?.pageSize ?? 50) : processedData.length;
    onChangeRef.current?.(
      { current: currentPage, pageSize: ps },
      appliedFilters,
      sortKey ? { columnKey: sortKey, order: sortDir === "asc" ? "ascend" : "descend" } : null,
      { currentDataSource: processedData }
    );
  }); // runs every render but ref guard prevents double-fire

  // Pagination
  const pageSize = pagination !== false ? (pagination?.pageSize ?? 50) : processedData.length;
  const isServerPaged = pagination !== false && pagination?.total != null;
  const total = isServerPaged ? (pagination as PaginationConfig).total! : processedData.length;
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

  const pagedData = isServerPaged
    ? processedData
    : processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (pagination !== false) {
      (pagination as PaginationConfig).onChange?.(page);
    }
  };

  const handleSort = (col: TableColumnType<T>) => {
    if (!col.sorter) return;
    setSortDir(sortKey === col.key ? (d) => (d === "asc" ? "desc" : "asc") : "asc");
    setSortKey(col.key);
    setCurrentPage(1);
  };

  const openFilter = (key: string) => {
    setPendingKeys([...(appliedFilters[key] ?? [])]);
    setActiveFilterKey((prev) => (prev === key ? null : key));
  };

  const confirmFilter = (key: string, values?: any[]) => {
    const toApply = values ?? pendingKeys;
    setAppliedFilters((prev) => ({ ...prev, [key]: toApply }));
    setActiveFilterKey(null);
    setCurrentPage(1);
  };

  const clearFilter = (key: string) => {
    setPendingKeys([]);
    setAppliedFilters((prev) => ({ ...prev, [key]: [] }));
    setActiveFilterKey(null);
    setCurrentPage(1);
  };

  const renderFilterContent = (col: TableColumnType<T>) => {
    if (col.filterDropdown) {
      return col.filterDropdown({
        selectedKeys: pendingKeys,
        setSelectedKeys: (keys) => setPendingKeys(keys),
        confirm: (config) => {
          confirmFilter(col.key);
          if (config?.closeDropdown !== false) setActiveFilterKey(null);
        },
        clearFilters: () => clearFilter(col.key),
        close: () => setActiveFilterKey(null),
      });
    }

    if (col.filters) {
      return (
        <div className="p-2 min-w-[150px]">
          <div className="space-y-0.5 mb-2 max-h-52 overflow-y-auto">
            {col.filters.map((f, i) => {
              const checked = pendingKeys.includes(f.value);
              return (
                <label
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/60 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    onClick={() =>
                      setPendingKeys((prev) =>
                        checked ? prev.filter((v) => v !== f.value) : [...prev, f.value]
                      )
                    }
                    className="w-3.5 h-3.5 rounded text-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span>{f.text}</span>
                </label>
              );
            })}
          </div>
          <div className="flex gap-1.5 border-t border-gray-100 dark:border-gray-700 pt-2">
            <button
              onClick={() => confirmFilter(col.key)}
              className="flex-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded px-2 py-1 transition-colors"
            >
              OK
            </button>
            <button
              onClick={() => clearFilter(col.key)}
              className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded px-2 py-1 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Pagination page numbers with ellipsis
  const pageNumbers = useMemo<(number | "…")[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (currentPage > 3) pages.push("…");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  const borderCls = bordered
    ? "border border-gray-200 dark:border-gray-700"
    : "";
  const cellBorderCls = bordered
    ? "border-r border-gray-100 dark:border-gray-700/60 last:border-r-0"
    : "";

  const rowBg = (idx: number) =>
    idx % 2 === 1
      ? "bg-gray-50 dark:bg-gray-800/40"
      : "bg-white dark:bg-gray-900/0";

  const stickyBg = (idx: number) =>
    idx % 2 === 1
      ? "bg-gray-50 dark:bg-gray-800"
      : "bg-white dark:bg-gray-900";

  return (
    <div className="relative">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Memuat data...</span>
          </div>
        </div>
      )}

      {/* Scroll wrapper */}
      <div
        className={`overflow-auto rounded-xl ${borderCls}`}
        style={{
          maxHeight: scroll?.y ? `${scroll.y}px` : undefined,
          minWidth: scroll?.x === "max-content" ? "max-content" : undefined,
        }}
      >
        <table
          className="w-full text-sm text-left"
          style={{ minWidth: scroll?.x === "max-content" ? "max-content" : scroll?.x }}
        >
          {/* HEADER */}
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-[5]">
            <tr>
              {visibleColumns.map((col) => {
                const isFiltered = (appliedFilters[col.key]?.length ?? 0) > 0;
                const isSorted = sortKey === col.key;
                const isFilterOpen = activeFilterKey === col.key;
                const hasFilter = !!(col.filterDropdown || col.filters);
                const isSortable = !!col.sorter;

                return (
                  <th
                    key={col.key}
                    style={{
                      width: col.width,
                      minWidth: col.width,
                      ...(col.fixed === "right"
                        ? { position: "sticky", right: 0, zIndex: 6 }
                        : col.fixed === "left"
                        ? { position: "sticky", left: 0, zIndex: 6 }
                        : {}),
                    }}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 whitespace-nowrap border-b border-gray-200 dark:border-gray-700 ${cellBorderCls} ${
                      col.fixed ? "bg-gray-50 dark:bg-gray-800" : ""
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1 ${
                        col.align === "center"
                          ? "justify-center"
                          : col.align === "right"
                          ? "justify-end"
                          : "justify-between"
                      }`}
                    >
                      <span
                        onClick={() => isSortable && handleSort(col)}
                        className={`flex items-center gap-1 select-none ${
                          isSortable
                            ? "cursor-pointer hover:text-blue-500 transition-colors"
                            : ""
                        }`}
                      >
                        {col.title}
                        {isSortable && (
                          <SortIcon direction={isSorted ? sortDir : null} />
                        )}
                      </span>

                      {hasFilter && (
                        <div
                          className="relative"
                          ref={isFilterOpen ? dropdownRef : undefined}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openFilter(col.key);
                            }}
                            className={`p-0.5 rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 ${
                              isFiltered ? "bg-blue-50 dark:bg-blue-900/30" : ""
                            }`}
                          >
                            {col.filterIcon ? (
                              col.filterIcon(isFiltered)
                            ) : (
                              <FilterIcon filtered={isFiltered} />
                            )}
                          </button>

                          {isFilterOpen && (
                            <div
                              className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              {renderFilterContent(col)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/40">
            {pagedData.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-4 py-14 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                    <svg
                      className="w-10 h-10 opacity-40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <span className="text-sm">Tidak ada data</span>
                  </div>
                </td>
              </tr>
            ) : (
              pagedData.map((record, rowIdx) => (
                <tr
                  key={getRowKey(record)}
                  className={`${rowBg(rowIdx)} hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors`}
                >
                  {visibleColumns.map((col) => {
                    const rawValue = getDeepValue(record, col.dataIndex);
                    const cell = col.render
                      ? col.render(
                          rawValue,
                          record,
                          (currentPage - 1) * pageSize + rowIdx
                        )
                      : (rawValue ?? "-");

                    const isFixed = !!col.fixed;

                    return (
                      <td
                        key={col.key}
                        style={{
                          width: col.width,
                          ...(col.fixed === "right"
                            ? { position: "sticky", right: 0, zIndex: 2 }
                            : col.fixed === "left"
                            ? { position: "sticky", left: 0, zIndex: 2 }
                            : {}),
                        }}
                        className={`px-4 py-3 text-gray-700 dark:text-gray-300 ${
                          col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                            ? "text-right"
                            : ""
                        } ${cellBorderCls} ${isFixed ? stickyBg(rowIdx) : ""}`}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {pagination !== false && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isServerPaged
              ? `Total: ${total} data`
              : `${Math.min((currentPage - 1) * pageSize + 1, total)}–${Math.min(
                  currentPage * pageSize,
                  total
                )} dari ${total}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹
            </button>

            {pageNumbers.map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-2 py-1.5 text-xs text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePageChange(p as number)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    currentPage === p
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
