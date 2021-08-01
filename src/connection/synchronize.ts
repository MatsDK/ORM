import { QueryRunnerResult } from ".";
import {
  formatColumnRows,
  columnHasChanged,
} from "../helpers/synchronizeHelpers";
import { getOrCreateOrmHandler } from "../lib/Global";

export const synchronize = async (): Promise<{ err: string | undefined }> => {
  const handler = getOrCreateOrmHandler();
  const { metaDataStore } = handler;

  const { err, rows }: QueryRunnerResult = await handler
    .getOrCreateQueryRunner()
    .getTablesInDatabase();

  if (err) return { err };
  if (!rows) return { err: "Rows not found" };

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

      const dbColumns = formatColumnRows(rows);
      const columnQueries: string[] = [];

      for (const column of columns) {
        if (!dbColumns.find((c) => c.columnName === column.name))
          columnQueries.push(
            handler
              .getOrCreateQueryRunner()
              .queryBuilder.createColumnQuery(column, tableName)
          );
        else if (
          columnHasChanged(
            column,
            dbColumns.find((c) => c.columnName === column.name)!
          )
        )
          columnQueries.push(
            handler
              .getOrCreateQueryRunner()
              .queryBuilder.createUpdateColumnQuery(column, tableName)
          );
      }

      for (const { columnName } of dbColumns) {
        if (!columns.find((c) => c.name === columnName))
          columnQueries.push(
            handler
              .getOrCreateQueryRunner()
              .queryBuilder.dropColumnQuery(columnName, tableName)
          );
      }

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

  return { err: undefined };
};
