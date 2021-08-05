import {
  ColumnType,
  CreateFindQueryParams,
  CreateFindRelationRowsQueryParams,
  CreateQueryReturnType,
  TableType,
} from "../types";

export class QueryBuilder {
  constructor() {}

  createFindQuery({
    tableName,
    columns,
  }: CreateFindQueryParams): CreateQueryReturnType {
    let query = `SELECT ${columns.map((c, idx) => `${c.name}`).join(", ")} `;

    query += ` FROM "${tableName}"`;

    return {
      query,
      params: [],
    };
  }

  createFindRelationRowsQuery({
    columns,
    tableName,
    propertyKey,
    values,
  }: CreateFindRelationRowsQueryParams):
    | CreateQueryReturnType
    | { query: undefined; params: undefined } {
    let query = `SELECT ${columns
      .map((c) => `${c.name}`)
      .join(", ")} FROM "${tableName}" `;

    query += `WHERE "${tableName}"."${propertyKey}" IN (${values
      .map((_, idx) => `$${idx + 1}`)
      .join(", ")}); `;

    return { query, params: values };
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
      }${col.options.default ? ` DEFAULT ${col.options.default}` : " "}${
        !col.options.nullable ? " NOT NULL" : ""
      }`;
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

  createSequencesQuery(seq: string[]): string {
    const query: string[] = [];

    for (const sequence of seq) query.push(`CREATE SEQUENCE ${sequence}`);

    return `${query.join(" UNION ")};`;
  }

  createDeleteSequencesQuery(seq: string[]): string {
    const query: string[] = [];

    for (const sequence of seq) query.push(`DROP SEQUENCE ${sequence}`);

    return `${query.join(" UNION ")};`;
  }

  dropTableQuery(tableName: string): string {
    return `DROP TABLE "${tableName}";`;
  }

  getColumnsQuery(tableName: string): string {
    let query = `SELECT column_name, data_type, is_nullable, udt_name, column_default `;
    return (query += ` FROM information_schema.columns WHERE table_name = '${tableName}';`);
  }

  createColumnQuery(colum: ColumnType, tableName: string): string {
    let query = `ALTER TABLE "${tableName}" ADD COLUMN "${colum.name}" ${colum.type}`;
    return (query += `${colum.options.nullable ? "" : " NOT NULL"} ;`);
  }

  createUpdateColumnQuery(column: ColumnType, tableName: string): string {
    let query = `ALTER TABLE "${tableName}" `;

    if (column.options.primary) {
      query += ` ADD PRIMARY KEY ("${column.name}")`;
    } else {
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
      }`;
    }

    if (column.options.default)
      query += `, ALTER COLUMN "${column.name}" SET DEFAULT ${column.options.default} `;
    else query += `, ALTER COLUMN "${column.name}" DROP DEFAULT`;

    query += ";";

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
