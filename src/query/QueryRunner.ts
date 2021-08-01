import { Client } from "pg";
import { QueryRunnerResult } from "../connection";
import { getOrCreateOrmHandler } from "../lib/Global";
import { ColumnType, TableType } from "../types";
import { QueryBuilder } from "./QueryBuilder";

export class QueryRunner {
  #conn: Client | undefined;

  queryBuilder: QueryBuilder = new QueryBuilder();

  constructor(conn: Client | undefined) {
    this.#conn = conn;
  }

  async query(query: string): Promise<any> {
    if (!this.#conn) return { rows: undefined, err: "There is no connection" };

    getOrCreateOrmHandler().connectionHandler?.connData.logQueries &&
      console.log("Query: ", query);

    try {
      return { ...(await this.#conn!.query(query)), err: undefined };
    } catch (error) {
      return { err: error.message, rows: undefined };
    }
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

  async getTableColumns(tableName: string): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.getColumnsQuery(tableName);

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
    tableName: string
  ): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.createUpdateColumnQuery(column, tableName);

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
