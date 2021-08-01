import { ColumnType, TableType } from "../types";

export class QueryBuilder {
  constructor() {}

  findTablesQuery(): string {
    let query = `SELECT table_name FROM information_schema.tables `;
    return (query += `WHERE table_schema='public' AND table_type='BASE TABLE';`);
  }

  createTableQuery(tableConfig: TableType, columns: ColumnType[]): string {
    let query: string = "CREATE TABLE ";

    query += `"${tableConfig.name}"(`;

    for (const [idx, col] of columns.entries()) {
      query += `${idx !== 0 ? "," : ""} "${col.name}" ${col.type}${
        !col.options.nullable ? " NOT NULL" : ""
      }`;
    }

    query += ` );`;

    return query;
  }

  dropTableQuery(tableName: string): string {
    return `DROP TABLE "${tableName}";`;
  }

  getColumnsQuery(tableName: string): string {
    let query = `SELECT column_name, data_type, is_nullable, udt_name `;
    return (query += ` FROM information_schema.columns WHERE table_name = '${tableName}';`);
  }

  createColumnQuery(colum: ColumnType, tableName: string): string {
    let query = `ALTER TABLE "${tableName}" ADD COLUMN "${colum.name}" ${colum.type}`;
    return (query += `${colum.options.nullable ? "" : " NOT NULL"} ;`);
  }

  createUpdateColumnQuery(column: ColumnType, tableName: string): string {
    let query = `ALTER TABLE "${tableName}" `;

    if (column.options.nullable) {
      query += ` ALTER COLUMN "${column.name}" DROP NOT NULL`;
    } else {
      query += ` ALTER COLUMN "${column.name}" SET NOT NULL`;
    }

    query += `, ALTER COLUMN "${column.name}" TYPE ${column.type}${
      column.options.array ? "[]" : ""
    }`;
    query += `  USING "${column.name}"::${column.type}${
      column.options.array ? "[]" : ""
    };`;

    return query;
  }

  dropColumnQuery(columnName: string, tableName: string): string {
    return `ALTER TABLE "${tableName}" DROP COLUMN "${columnName}";`;
  }

  bundleQueries(queries: string[]): string {
    let query = `BEGIN ;`;
    queries.forEach((q) => (query += `${q}`));
    query += `COMMIT ;`;

    return query;
  }
}
