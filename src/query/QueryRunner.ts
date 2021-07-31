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

  async getTablesInDatabase(): Promise<QueryRunnerResult> {
    if (!this.conn) return { err: "There is no connection", rows: undefined };
    const query = this.queryBuilder.findTablesQuery();

    return { ...(await this.conn.query(query)), err: undefined };
  }

  async createTableInDatabase(
    tableConfig: TableType,
    colums: ColumnType[]
  ): Promise<{ err: undefined | string }> {
    if (!this.conn) return { err: "There is no connection" };
    const query = this.queryBuilder.createTableQuery(tableConfig, colums);

    try {
      await this.conn.query(query);

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
      await this.conn.query(query);

      return { err: undefined };
    } catch (error) {
      return { err: error.message };
    }
  }
}
