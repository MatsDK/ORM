import { ColumnTypes } from "../db_types";
import { ColumnType } from "../types";

export const columnHasChanged = (
  column: ColumnType,
  dbColumn: columnRowsType
): boolean =>
  column.type !== dbColumn.columnType ||
  column.options.nullable !== dbColumn.isNullable ||
  column.options.array !== dbColumn.array;

export type columnRowsType = {
  columnName: string;
  columnType: ColumnTypes;
  isNullable: boolean;
  array: boolean;
};

export const formatColumnRows = (rows: any[]): columnRowsType[] => {
  const newRows: columnRowsType[] = [];
  for (const { column_name, data_type, is_nullable, udt_name } of rows) {
    newRows.push({
      columnName: column_name,
      columnType:
        data_type === "ARRAY"
          ? (udt_name as string).startsWith("_")
            ? udt_name.slice(1)
            : udt_name
          : udt_name,
      isNullable: is_nullable === "YES",
      array: data_type === "ARRAY",
    });
  }

  return newRows;
};
