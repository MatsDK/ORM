import { create } from "domain";
import { QueryRunnerResult } from ".";
import {
  formatColumnRows,
  columnHasChanged,
  getColumnToUpdate,
  createSequences,
  deleteSequences,
  columnRowsType,
} from "../helpers/synchronizeHelpers";
import { getOrCreateOrmHandler } from "../lib/Global";
import { ColumnType } from "../types";

export const synchronize = async (): Promise<{ err: string | undefined }> => {
  const handler = getOrCreateOrmHandler();
  const { metaDataStore } = handler;

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

  // Loop over tables and if table exists in database check if colums match
  // else create table in database
  for (const [tableName, tableConfig] of metaDataStore.tables.entries()) {
    const columns = handler.metaDataStore.getColumnsOfTable(tableConfig);

    if (rows.find((r) => r.table_name === tableName)) {
      const { rows, err } = await handler
        .getOrCreateQueryRunner()
        .getTableColumns(tableName);

      if (err) return { err };
      if (!rows) return { err: "Rows not found" };

      const { dbColumns, err: err1 } = await formatColumnRows(rows, tableName);
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
      !Array.from(metaDataStore.tables).find(([_, t]) => t.name === table_name)
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
    // Array.from(handler.metaDataStore.columns).map(([_, c]) => c)
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
            tableName
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
