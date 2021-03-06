import { create } from "domain";
import { QueryRunnerResult } from ".";
import {
  formatColumnRows,
  columnHasChanged,
  getColumnToUpdate,
  createSequences,
  deleteSequences,
  columnRowsType,
} from "./helpers";
import { getOrCreateOrmHandler } from "../lib/Global";
import { ColumnType } from "../types";

export const synchronize = async (): Promise<{ err: string | undefined }> => {
  const handler = getOrCreateOrmHandler();

  const { err, rows }: QueryRunnerResult = await handler
    .getOrCreateQueryRunner()
    .getTablesInDatabase();

  if (err) return { err };
  if (!rows) return { err: "Rows not found" };

  // Create new sequence that are declared in tables
  let { rows: sequences, err: sequenceErr } = await handler
    .getOrCreateQueryRunner()
    .getSequences();
  if (sequenceErr) return { err: sequenceErr };
  sequences = sequences?.map((s) => s.relname) || [];

  const createSequencesRes = await createSequences(
    sequences,
    Array.from(handler.metaDataStore.columns).reduce(
      (a: ColumnType[], c: [any, ColumnType[]]) => [...a, ...c[1]],
      []
    )
  );
  if (typeof createSequencesRes === "string")
    return { err: createSequencesRes };

  const { rows: tableColumns, err: tableColumnsErr } = await handler
    .getOrCreateQueryRunner()
    .getTableColumns(handler.metaDataStore.tables);

  if (tableColumnsErr || !tableColumns) return { err: "Could not get columns" };

  const { rows: primaryAndUniqueKeys, err: primaryAndUniqueKeysErr } =
    await getOrCreateOrmHandler()
      .getOrCreateQueryRunner()
      .getTablePrimaryColumns(handler.metaDataStore.tables);

  if (primaryAndUniqueKeysErr || !primaryAndUniqueKeys)
    return { err: primaryAndUniqueKeysErr };

  // Loop over tables and if table exists in database check if colums match
  // else create table in database
  for (const [
    tableName,
    tableConfig,
  ] of handler.metaDataStore.tables.entries()) {
    const columns = handler.metaDataStore.getColumnsOfTable(tableConfig);

    if (rows.find((r) => r.table_name === tableName)) {
      const thisTableCols: any[] = tableColumns.filter(
        (tc) => tc.table_name === tableName
      );

      if (err) return { err };
      if (!thisTableCols) return { err: "Rows not found" };

      const { dbColumns, err: err1 } = await formatColumnRows(
        thisTableCols,
        primaryAndUniqueKeys.filter((p) => p.table_name === tableName)
      );
      if (err1) return { err: err1 };

      const columnQueries: string[] = matchColumns(
        columns,
        dbColumns,
        tableName
      );

      if (columnQueries.length) {
        const res = await handler
          .getOrCreateQueryRunner()
          .columnSynchronizeQueries(columnQueries);

        if (res.err) return { err: res.err };
      }
    } else {
      const { err } = await handler
        .getOrCreateQueryRunner()
        .createTableInDatabase(tableConfig, columns);

      if (err) return { err };
    }
  }

  // if table name exists in database but not declared anymore remove table
  for (const { table_name } of rows) {
    if (
      !Array.from(handler.metaDataStore.tables).find(
        ([_, t]) => t.name === table_name
      )
    ) {
      const { err } = await handler
        .getOrCreateQueryRunner()
        .dropTableInDatabase(table_name);

      if (err) return { err };
    }
  }

  // Delete ununsed sequences after removing their reference in columns
  const deleteSequencesRes = await deleteSequences(
    sequences,
    Array.from(handler.metaDataStore.columns).reduce(
      (a: ColumnType[], c: [any, ColumnType[]]) => [...a, ...c[1]],
      []
    )
  );
  if (typeof deleteSequencesRes === "string")
    return { err: deleteSequencesRes };

  return { err: undefined };
};

const matchColumns = (
  columns: ColumnType[],
  dbColumns: columnRowsType[] | undefined,
  tableName: string
): string[] => {
  const columnQueries: string[] = [],
    handler = getOrCreateOrmHandler();

  for (const column of columns) {
    if (!dbColumns!.find((c) => c.columnName === column.name))
      columnQueries.push(
        handler
          .getOrCreateQueryRunner()
          .queryBuilder.createColumnQuery(column, tableName)
      );
    else if (
      columnHasChanged(
        column,
        dbColumns!.find((c) => c.columnName === column.name)!
      )
    )
      columnQueries.push(
        handler
          .getOrCreateQueryRunner()
          .queryBuilder.createUpdateColumnQuery(
            getColumnToUpdate(column, dbColumns!),
            tableName,
            dbColumns!.find((c) => c.columnName === column.name)!
          )
      );
  }

  for (const { columnName } of dbColumns!) {
    if (!columns.find((c) => c.name === columnName))
      columnQueries.push(
        handler
          .getOrCreateQueryRunner()
          .queryBuilder.dropColumnQuery(columnName, tableName)
      );
  }
  return columnQueries;
};
