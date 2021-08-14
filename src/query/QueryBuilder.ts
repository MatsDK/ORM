import { columnRowsType } from "../connection/helpers";
import {
  ColumnType,
  CreateFindQueryParams,
  CreateFindRelationRowsQueryParams,
  createInsertQueryParams,
  CreateQueryReturnType,
  TableType,
} from "../types";
import { createCondition, createOrderQuery } from "./queryBuilderHelper";

export class QueryBuilder {
  createFindQuery({
    tableName,
    columns,
    options,
  }: CreateFindQueryParams): CreateQueryReturnType {
    let query = `SELECT ${columns.map((c) => `${c.name}`).join(", ")} `;

    query += ` FROM "${tableName}"`;

    const { values, query: findQuery } = this.constuctFindConition(
      options.where
    );

    if (findQuery) query += ` WHERE ${findQuery}`;

    if (options.limit != null) query += ` LIMIT ${options.limit}`;

    if (options.skip != null) query += ` OFFSET ${options.skip}`;

    if (options.order && Object.keys(options.order).length)
      query += createOrderQuery(options.order);

    return {
      query,
      params: values,
    };
  }

  constuctFindConition(options: any, values: any[] = []) {
    let query = "";

    if (Array.isArray(options) && options.length) {
      let l = 0;
      options.forEach((o) => (l += Object.keys(o).length));

      if (l) {
        query += `${options
          .map(
            (conditions) => this.constuctFindConition(conditions, values).query
          )
          .join(" OR ")}`;
      }
    } else if (Object.keys(options).length) {
      query += `(${Object.keys(options)
        .map((key) => createCondition(options, values, key))
        .join(" AND ")})`;
    }

    return { values, query };
  }

  createFindRelationRowsQuery({
    columns,
    tableName,
    propertyKey,
    values,
    findCondition,
  }: CreateFindRelationRowsQueryParams):
    | CreateQueryReturnType
    | { query: undefined; params: undefined } {
    let query = `SELECT ${columns
      .map((c) => `${c.name}`)
      .join(", ")} FROM "${tableName}" `;

    query += `WHERE "${tableName}"."${propertyKey}" IN (${values
      .map((_, idx) => `$${idx + 1}`)
      .join(", ")}) `;

    const { query: findConditionQuery, values: newValues } =
      this.constuctFindConition(findCondition || {}, values);

    if (findConditionQuery) {
      values = newValues;
      query += `AND ${findConditionQuery}`;
    }

    return { query, params: values };
  }

  createInsertQuery({
    values,
    insertColumns,
    tableName,
  }: createInsertQueryParams): {
    query: string;
    params: any[];
  } {
    const params: any[] = [];

    let query = `INSERT INTO "${tableName}"(${insertColumns
      .map((key: string) => `"${key}"`)
      .join(", ")}) VALUES`;

    const rowQueries: string[] = [];
    for (const row of values as any[]) {
      const thisRowQuery: string[] = [];

      insertColumns.forEach((key: string) => {
        params.push(row[key] != null ? row[key] : null);
        thisRowQuery.push(`$${params.length}`);
      });

      rowQueries.push(`(${thisRowQuery.join(", ")})`);
    }

    query += ` ${rowQueries.join(", ")};`;

    return { query, params };
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
    let query = `SELECT kcu.column_name, tco.constraint_type, kcu.constraint_name `;
    query += `FROM information_schema.table_constraints tco JOIN information_schema.key_column_usage kcu `;
    query += `ON kcu.constraint_name = tco.constraint_name AND kcu.constraint_schema = tco.constraint_schema `;
    query += `AND kcu.constraint_name = tco.constraint_name JOIN information_schema.columns i `;
    query += `ON kcu.column_name = i.column_name WHERE tco.table_name = '${tableName}';`;

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

  createColumnQuery(column: ColumnType, tableName: string): string {
    let query = `ALTER TABLE "${tableName}" ADD COLUMN "${column.name}" ${
      column.type
    } ${column.options.unique ? "UNIQUE" : ""}`;
    return (query += `${column.options.nullable ? "" : " NOT NULL"} ;`);
  }

  createUpdateColumnQuery(
    column: ColumnType,
    tableName: string,
    dbColumn: columnRowsType | undefined
  ): string {
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

    if (column.options.unique) query += `, ADD UNIQUE ("${column.name}")`;
    else
      query += `, DROP CONSTRAINT "${
        dbColumn?.isUnique.constraint_name || ""
      }"`;

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
