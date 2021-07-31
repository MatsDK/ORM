import { Client } from "pg";
import { QueryRunnerResult } from "../connection";
import { ColumnType, TableType } from "../types";
import { QueryBuilder } from "./QueryBuilder";

export class QueryRunner {
  conn: Client | undefined;

  queryBuilder: QueryBuilder = new QueryBuilder();

  constructor(conn: Client | undefined) {
    this.conn = conn;
  }

  async query(query: string): Promise<any> {
    console.log("QUERY:", query.trim());
    return this.conn!.query(query);
  }

  async getTablesInDatabase(): Promise<QueryRunnerResult> {
    if (!this.conn) return { err: "There is no connection", rows: undefined };
    const query = this.queryBuilder.findTablesQuery();

    return { ...(await this.query(query)), err: undefined };
  }

  async createTableInDatabase(
    tableConfig: TableType,
    colums: ColumnType[]
  ): Promise<{ err: undefined | string }> {
    if (!this.conn) return { err: "There is no connection" };
    const query = this.queryBuilder.createTableQuery(tableConfig, colums);

    try {
      await this.query(query);

      return { err: undefined };
    } catch (error) {
      return { err: error.message };
    }
  }

  async dropTableInDatabase(
    tableName: string
  ): Promise<{ err: string | undefined }> {
    if (!this.conn) return { err: "There is no connection" };
    const query = this.queryBuilder.dropTableQuery(tableName);

    try {
      await this.query(query);

      return { err: undefined };
    } catch (error) {
      return { err: error.message };
    }
  }

  async getTableColumns(tableName: string): Promise<QueryRunnerResult> {
    if (!this.conn) return { err: "There is no connection", rows: undefined };
    const query = this.queryBuilder.getColumnsQuery(tableName);

    try {
      const res = await this.query(query);

      return { ...res, err: undefined };
    } catch (error) {
      return { err: error.message, rows: undefined };
    }
  }

  async createColumnInDatabase(
    column: ColumnType,
    tableName: string
  ): Promise<{ err: string | undefined }> {
    if (!this.conn) return { err: "There is no connection" };
    const query = this.queryBuilder.createColumnQuery(column, tableName);

    try {
      const res = await this.query(query);

      return { err: undefined };
    } catch (error) {
      return { err: error.message };
    }
  }

  async updateColumnInDatabase(
    column: ColumnType,
    tableName: string
  ): Promise<{ err: string | undefined }> {
    if (!this.conn) return { err: "There is no connection" };
    const query = this.queryBuilder.createUpdateColumnQuery(column, tableName);

    try {
      await this.query(query);

      return { err: undefined };
    } catch (error) {
      return { err: error.message };
    }
  }

  async dropColumnInTable(
    columnName: string,
    tableName: string
  ): Promise<{ err: string | undefined }> {
    if (!this.conn) return { err: "There is no connection" };
    const query = this.queryBuilder.dropColumnQuery(columnName, tableName);

    try {
      await this.query(query);

      return { err: undefined };
    } catch (error) {
      return { err: error.message };
    }
  }
}
