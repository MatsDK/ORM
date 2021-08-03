import { ColumnTypes } from "../db_types";
import { getOrCreateOrmHandler } from "../lib/Global";
import { ColumnType } from "../types";

export const columnHasChanged = (
  column: ColumnType,
  dbColumn: columnRowsType
): boolean => {
  return (
    column.type !== dbColumn.columnType ||
    column.options.nullable !== dbColumn.isNullable ||
    !!column.options.primary !== !!dbColumn.primary ||
    column.options.array !== dbColumn.array ||
    (typeof column.options.default === "string"
      ? column.options.default.toLowerCase()
      : column.options.default) != dbColumn.default
  );
};

export type columnRowsType = {
  columnName: string;
  columnType: ColumnTypes;
  isNullable: boolean;
  array: boolean;
  primary: boolean;
  default: any;
};

export const formatColumnRows = async (
  rows: any[],
  tableName: string
): Promise<{ dbColumns?: columnRowsType[]; err?: string }> => {
  let { rows: primaryKeys, err: err1 } = await getOrCreateOrmHandler()
    .getOrCreateQueryRunner()
    .getTablePrimaryColumns(tableName);
  if (err1) return { err: err1, dbColumns: undefined };

  primaryKeys = primaryKeys?.map(({ column_name }) => column_name) as string[];
  const newRows: columnRowsType[] = [];

  for (const row of rows) {
    newRows.push({
      columnName: row.column_name,
      columnType:
        row.data_type === "ARRAY"
          ? (row.udt_name as string).startsWith("_")
            ? row.udt_name.slice(1)
            : row.udt_name
          : row.udt_name,
      isNullable: row.is_nullable === "YES",
      array: row.data_type === "ARRAY",
      primary: primaryKeys.includes(row.column_name),
      default: row.column_default,
    });
  }

  return { dbColumns: newRows };
};

export const getColumnToUpdate = (
  column: ColumnType,
  dbColumns: columnRowsType[]
): ColumnType => {
  const thisDbColumn = dbColumns.find((c) => c.columnName === column.name);

  if (thisDbColumn?.primary === column.options.primary) {
    return { ...column, options: { ...column.options, primary: false } };
  } else return column;
};

export const createSequences = async (
  columns: ColumnType[],
  tableName: string,
  sequences: string[]
): Promise<boolean | string> => {
  const createSequences: string[] = [];
  for (const column of columns) {
    if (column.options.sequence) {
      const sequenceName = `${tableName}_${column.name}_seq`;
      column.options.default = `nextval('${sequenceName}'::regclass)`;

      if (!sequences.includes(sequenceName.toLowerCase()))
        createSequences.push(sequenceName);
      console.log(column.options.default);
    } else if (typeof column.options.default === "string") {
      column.options.default = `'${column.options.default}'`;
      console.log(column.options.default);
    }
  }

  if (!createSequences.length) return true;

  const { err: createErr } = await getOrCreateOrmHandler()
    .getOrCreateQueryRunner()
    .createSequences(createSequences);

  return createErr || true;
};

export const deleteSequences = async (
  sequences: string[],
  columns: ColumnType[]
): Promise<boolean | string> => {
  let deleteSequences = [...sequences];

  columns.forEach((c) => {
    if (
      typeof c.options.default === "string" &&
      deleteSequences.findIndex((s) => s === c.options.default.toLowerCase())
    )
      deleteSequences = deleteSequences.filter(
        (s) => s == c.options.default.toLowerCase()
      );
  });

  if (!deleteSequences.length) {
    return true;
  }

  const { err } = await getOrCreateOrmHandler()
    .getOrCreateQueryRunner()
    .deleteSequences(deleteSequences);

  return err || true;
};
