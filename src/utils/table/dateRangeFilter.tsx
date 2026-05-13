import React from "react";
import { DatePicker, Button, Space } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import dayjs from "dayjs";

/**
 * Returns antd column props that add a date-range filter dropdown.
 * dataIndex: the key on the record that holds a date string (ISO or YYYY-MM-DD).
 */
export function getDateRangeFilterProps<T>(dataIndex: keyof T) {
  return {
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }: FilterDropdownProps) => {
      const value = selectedKeys[0] ? String(selectedKeys[0]).split(",") : [];
      const parseDate = (s?: string): dayjs.Dayjs | null => {
        if (!s) return null;
        const d = dayjs(s, "DD/MM/YYYY", true);
        return d.isValid() ? d : null;
      };
      const rangeValue: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [
        parseDate(value[0]),
        parseDate(value[1]),
      ];

      return (
        <div style={{ padding: 8 }}>
          <DatePicker.RangePicker
            value={rangeValue as any}
            format="DD/MM/YYYY"
            onChange={(_, dateStrings) => {
              if (dateStrings[0] && dateStrings[1]) {
                setSelectedKeys([dateStrings.join(",")]);
              } else {
                setSelectedKeys([]);
              }
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 80 }}
            >
              Filter
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              size="small"
              style={{ width: 80 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      );
    },
    onFilter: (value: any, record: T) => {
      const raw = record[dataIndex];
      if (!raw) return false;
      const parts = String(value).split(",");
      if (parts.length < 2) return true;
      const [fromStr, toStr] = parts;
      const date = dayjs(raw as string);
      const from = dayjs(fromStr, "DD/MM/YYYY").startOf("day");
      const to = dayjs(toStr, "DD/MM/YYYY").endOf("day");
      return date.isAfter(from.subtract(1, "ms")) && date.isBefore(to.add(1, "ms"));
    },
  };
}
