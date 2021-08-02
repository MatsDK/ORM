import { Client } from "pg";
import { QueryRunnerResult } from "../connection";
import {
  constructQueryReturnTypes,
  createCondition,
} from "../helpers/queryHelper";
import { getOrCreateOrmHandler } from "../lib/Global";
import { ColumnType, FindReturnType, TableType } from "../types";
import { QueryBuilder } from "./QueryBuilder";

interface FindManyOptions {
  tableName: string;
  tableTarget: string;
}

export interface RelationObject {
  condition: string;
  columns: ColumnType[];
}

export class QueryRunner {
  #conn: Client | undefined;

  queryBuilder: QueryBuilder = new QueryBuilder();

  constructor(conn: Client | undefined) {
    this.#conn = conn;
  }

  async query(query: string, params?: string[]): Promise<any> {
    if (!this.#conn) return { rows: undefined, err: "There is no connection" };

    getOrCreateOrmHandler().connectionHandler?.connData.logQueries &&
      console.log("Query: ", query);

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
  }: FindManyOptions): Promise<FindReturnType> {
    const [_, relations] = Array.from(
      getOrCreateOrmHandler().metaDataStore.relations
    ).filter(([relationTarget, _]) => relationTarget === tableTarget)[0];

    const columns = constructQueryReturnTypes(tableName, tableTarget);

    const relationsObjs: RelationObject[] = [];
    for (const relation of relations) {
      const relationTable = (Array.from(
        getOrCreateOrmHandler().metaDataStore.tables
      ).find(([_, t]) => t.target === relation.type) || [])[1];

      if (!relationTable) continue;
      const relationColumns = constructQueryReturnTypes(
        relationTable.name,
        relation.type
      );

      const condition = createCondition(
        relation.options.on,
        tableName,
        relationTable.name
      );
      relationsObjs.push({ condition, columns: relationColumns });
    }

    console.log(relationsObjs);

    const { query, params } = this.queryBuilder.createFindQuery({
        tableName,
        columns,
        relations: relationsObjs,
      }),
      { err, rows } = await this.query(query, params);

    return err ? { err, rows: undefined } : { rows };
  }

  async getTablePrimaryColumns(tableName: string): Promise<QueryRunnerResult> {
    const query = this.queryBuilder.getPrimaryColumnsQuery(tableName);

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
