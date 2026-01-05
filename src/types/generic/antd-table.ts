import type { ColumnType, ColumnGroupType } from "antd/es/table";

export type ExportRender<T> = (
  value: any,
  record: T,
  index?: number
) => any;

export type TableColumn<T> =
  | (ColumnType<T> & { exportRender?: ExportRender<T> })
  | (ColumnGroupType<T> & { exportRender?: ExportRender<T> });
