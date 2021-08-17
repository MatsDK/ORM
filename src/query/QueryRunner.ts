import { highlight } from "cli-highlight";
import { Client } from "pg";
import { QueryRunnerResult } from "../connection";
import { columnRowsType } from "../connection/helpers";
import { getOrCreateOrmHandler } from "../lib/Global";
import {
  ColumnType,
  FindManyProperties,
  InsertParams,
  QueryRunnerFindReturnType,
  RelationObject,
  TableType,
} from "../types";
import { QueryBuilder } from "./QueryBuilder";
import { QueryRelation } from "./QueryRelation";
import {
  constructQueryReturnTypes,
  constructRelationObjs,
  constructThisQueryOptions,
  deleteProps,
  getReturnColumns,
} from "./queryRelationsHelper";

export class QueryRunner {
  #conn: Client | undefined;
  #queryRelationsHandler: QueryRelation;

  queryBuilder: QueryBuilder = new QueryBuilder();

  constructor(conn: Client | undefined) {
    this.#conn = conn;
    this.#queryRelationsHandler = new QueryRelation(this);
  }

  async query(query: string, params?: string[]): Promise<QueryRunnerResult> {
    if (!this.#conn) return { rows: undefined, err: "There is no connection" };

    getOrCreateOrmHandler().connectionHandler?.connData.logQueries &&
      console.log(
        "Query: ",
        highlight(query, { language: "sql", ignoreIllegals: true }),
        "Values:",
        params || []
      );

    try {
      return {
        ...(await this.#conn.query({ text: query, values: params })),
        err: undefined,
      };
    } catch (error) {
      return { err: error.message, rows: undefined };
    }
  }

  async findMany({
    tableName,
    tableTarget,
    options = {},
  }: FindManyProperties): Promise<QueryRunnerFindReturnType> {
    const { columns, deleteColumns } = constructQueryReturnTypes(
      tableName,
      tableTarget,
      options.returning
    );
    const relationsObjs: RelationObject[] = constructRelationObjs(
      getOrCreateOrmHandler().metaDataStore.getRelationsOfTable(tableTarget),
      options.returning,
      options.where
    );

    const { query, params } = this.queryBuilder.createFindQuery({
        tableName,
        columns,
        options: {
          ...options,
          where: constructThisQueryOptions({ ...options }, relationsObjs),
        },
      }),
      { err, rows } = await this.query(query, params);

    let newRows: any[] = rows || [];

    for (const relation of relationsObjs) {
      if (options.returning && !(options.returning || {})[relation.propertyKey])
        continue;

      const { rows: relationRows, err: relationErr } =
        await this.#queryRelationsHandler.queryRelation(
          rows || [],
          relation,
          relation.propertyKey,
          tableName,
          (options.returning || {})[relation.propertyKey]
        );

      if (relationErr) return { err: relationErr, rows: undefined };

      newRows =
        relationRows ||
        rows?.map((r) => ({
          ...r,
          [relation.propertyKey]: relation.options.array ? [] : null,
        })) ||
        [];
    }

    if (err) return { err, rows: undefined };

    return {
      rows: deleteProps(newRows, deleteColumns),
    };
  }

  async insert({
    values,
    table,
    options,
  }: InsertParams): Promise<QueryRunnerFindReturnType> {
    if (!Array.isArray(values)) values = [values];

    if (!values.length) return { rows: [] };

    const insertColumns: Set<string> = new Set();

    for (const row of values as any[])
      Object.keys(row).forEach((key: string) => insertColumns.add(key));

    const columns =
      getOrCreateOrmHandler().metaDataStore.getColumnsOfTable(table);
    const returnColumns = getReturnColumns({
      tableColumns: columns,
      returnObj: options.returning || {},
    });

    const { query, params } = this.queryBuilder.createInsertQuery({
      values,
      tableName: table.name,
      insertColumns: Array.from(insertColumns),
      options,
      returnColumns,
    });

    return await this.query(query, params);
  }

  async getSequences(): Promise<QueryRunnerResult> {
    return await this.query(
      "SELECT c.relname FROM pg_class c WHERE c.relkind = 'S';"
    );
  }

  async createSequences(seq: string[]): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.createSequencesQuery(seq);

    return await this.query(query);
  }

  async deleteSequences(seq: string[]): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.createDeleteSequencesQuery(seq);

    return await this.query(query);
  }

  async getTablePrimaryColumns(
    tables: Map<string, TableType>
  ): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.getPrimaryColumnsQuery(tables);

    return await this.query(query);
  }

  async columnSynchronizeQueries(
    queries: string[]
  ): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.bundleQueries(queries);

    return await this.query(query);
  }

  async getTablesInDatabase(): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.findTablesQuery();

    return await this.query(query);
  }

  async createTableInDatabase(
    tableConfig: TableType,
    colums: ColumnType[]
  ): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.createTableQuery(tableConfig, colums);

    return await this.query(query);
  }

  async dropTableInDatabase(tableName: string): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.dropTableQuery(tableName);

    return await this.query(query);
  }

  async getTableColumns(
    tables: Map<string, TableType>
  ): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.getColumnsQuery(tables);

    return await this.query(query);
  }

  async createColumnInDatabase(
    column: ColumnType,
    tableName: string
  ): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.createColumnQuery(column, tableName);

    return await this.query(query);
  }

  async updateColumnInDatabase(
    column: ColumnType,
    tableName: string,
    dbColumn: columnRowsType | undefined
  ): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.createUpdateColumnQuery(
      column,
      tableName,
      dbColumn
    );

    return await this.query(query);
  }

  async dropColumnInTable(
    columnName: string,
    tableName: string
  ): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.dropColumnQuery(columnName, tableName);

    return await this.query(query);
  }
}
