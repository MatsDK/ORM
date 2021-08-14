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
    !!column.options?.unique != !!dbColumn.isUnique ||
    column.options.array !== dbColumn.array ||
    (column.options.sequence
      ? typeof column.options.default === "string"
        ? column.options.default.toLowerCase()
        : column.options.default
      : column.options.default) != dbColumn.default
  );
};

export type columnRowsType = {
  columnName: string;
  columnType: ColumnTypes;
  isNullable: boolean;
  isUnique: any;
  array: boolean;
  primary: any;
  default: any;
};

export const formatColumnRows = async (
  rows: any[],
  primaryAndUniqueKeys: any[]
): Promise<{ dbColumns?: columnRowsType[]; err?: string }> => {
  const primaryKeys =
      primaryAndUniqueKeys?.filter(
        ({ constraint_type }) => constraint_type === "PRIMARY KEY"
      ) || [],
    uniqueKeys =
      primaryAndUniqueKeys?.filter(
        ({ constraint_type }) => constraint_type === "UNIQUE"
      ) || [];

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
      isUnique: uniqueKeys.find((k) => k.column_name === row.column_name),
      array: row.data_type === "ARRAY",
      primary: primaryKeys.find((k) => k.column_name === row.column_name),
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
    column = { ...column, options: { ...column.options, primary: false } };
  }
  return column;
};

export const createSequences = async (
  sequences: string[],
  columns: ColumnType[]
): Promise<boolean | string> => {
  const newSequences: string[] = [];

  for (const column of columns) {
    if (column.options.sequence) {
      const tableName = getTableName(column);
      if (!tableName) continue;

      const sequenceName = `${tableName}__${column.name}__seq`;
      column.options.default = `nextval('${sequenceName}'::regclass)`;

      if (!sequences.includes(sequenceName.toLowerCase()))
        newSequences.push(sequenceName);
    } else if (typeof column.options.default === "string")
      column.options.default = `'${column.options.default}'::${column.type}`;
  }

  if (!newSequences.length) return true;

  const { err: createErr } = await getOrCreateOrmHandler()
    .getOrCreateQueryRunner()
    .createSequences(newSequences);

  return createErr || true;
};

export const deleteSequences = async (
  sequences: string[],
  columns: ColumnType[]
): Promise<boolean | string> => {
  const deleteSequences: string[] = [...sequences];

  for (const column of columns) {
    const idx: boolean | number =
      typeof column.options.default === "string" &&
      sequences.findIndex((s) =>
        column.options.default.toLowerCase().includes(`'${s}'`)
      );

    if (idx >= 0 && typeof idx !== "boolean") deleteSequences.splice(idx, 1);
  }

  if (!deleteSequences.length) return true;

  const { err } = await getOrCreateOrmHandler()
    .getOrCreateQueryRunner()
    .deleteSequences(deleteSequences);

  return err || true;
};

const getTableName = (column: ColumnType): string | undefined =>
  (Array.from(getOrCreateOrmHandler().metaDataStore.tables).find(
    ([_, t]) => t.target === column.target
  ) || [])[0];
