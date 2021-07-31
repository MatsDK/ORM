import { ColumnType, TableType } from "../types";

export class QueryBuilder {
  constructor() {}

  findTablesQuery(): string {
    return `SELECT table_name FROM information_schema.tables 
            WHERE table_schema='public' AND table_type='BASE TABLE';`;
  }

  createTableQuery(tableConfig: TableType, columns: ColumnType[]): string {
    let query: string = "CREATE TABLE ";

    query += `"${tableConfig.name}"(`;

    for (const [idx, col] of columns.entries()) {
      query += `${idx !== 0 ? "," : ""}\n${col.name} ${col.type}${
        !col.options.nullable ? " NOT NULL" : ""
      }`;
    }

    query += `\n);`;

    return query;
  }

  dropTableQuery(tableName: string): string {
    return `DROP TABLE "${tableName}";`;
  }
}
