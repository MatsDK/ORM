import {
  ColumnType,
  CreateFindQueryParams,
  CreateQueryReturnType,
  TableType,
} from "../types";

export class QueryBuilder {
  constructor() {}

  createFindQuery({
    tableName,
    columns,
    relations,
  }: CreateFindQueryParams): CreateQueryReturnType {
    return {
      query: `SELECT ${columns
        .map((c, idx) => `${c.name}`)
        .join(", ")} FROM "${tableName}";`,
      params: [],
    };
  }

  findTablesQuery(): string {
    let query = `SELECT table_name FROM information_schema.tables `;
    return (query += `WHERE table_schema='public' AND table_type='BASE TABLE';`);
  }

  createTableQuery(tableConfig: TableType, columns: ColumnType[]): string {
    let query: string = "CREATE TABLE ";

    query += `"${tableConfig.name}"(`;

    for (const [idx, col] of columns.entries()) {
      query += `${idx !== 0 ? "," : ""} "${col.name}" ${col.type}${
        col.options.primary ? " PRIMARY KEY" : " "
      }${!col.options.nullable ? " NOT NULL" : ""}`;
    }

    query += ` );`;

    return query;
  }

  getPrimaryColumnsQuery(tableName: string): string {
    let query = `SELECT kcu.column_name `;
    query += `FROM information_schema.table_constraints tco JOIN information_schema.key_column_usage kcu `;
    query += `ON kcu.constraint_name = tco.constraint_name AND kcu.constraint_schema = tco.constraint_schema `;
    query += `AND kcu.constraint_name = tco.constraint_name JOIN information_schema.columns i `;
    query += `ON kcu.column_name = i.column_name WHERE tco.constraint_type = 'PRIMARY KEY' AND tco.table_name = '${tableName}';`;

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

    if (column.options.primary) {
      query += `, DROP COLUMN "${column.name}"`;
      query += `, ADD COLUMN "${column.name}" ${column.type} PRIMARY KEY;`;
    } else {
      query += `, ALTER COLUMN "${column.name}" TYPE ${column.type}${
        column.options.array ? "[]" : ""
      };`;
      query += `  USING "${column.name}"::${column.type}${
        column.options.array ? "[]" : ""
      };`;
    }

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
