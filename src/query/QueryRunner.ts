import { highlight } from "cli-highlight";
import { table } from "console";
import { Client } from "pg";
import { QueryRunnerResult } from "../connection";
import {
  constructQueryReturnTypes,
  createCondition,
  getRelationCondtionProperties,
} from "../helpers/queryHelper";
import { getOrCreateOrmHandler } from "../lib/Global";
import { ColumnType, FindReturnType, TableType } from "../types";
import { QueryBuilder } from "./QueryBuilder";

interface FindManyOptions {
  tableName: string;
  tableTarget: string;
}

export type RelationColumn = ColumnType & { alias: string };

export interface RelationObject {
  condition: string;
  joinedTableName: string;
  columns: RelationColumn[];
  propertyKey: string;
}

export class QueryRunner {
  #conn: Client | undefined;

  queryBuilder: QueryBuilder = new QueryBuilder();

  constructor(conn: Client | undefined) {
    this.#conn = conn;
  }

  async query(query: string, params?: string[]): Promise<QueryRunnerResult> {
    if (!this.#conn) return { rows: undefined, err: "There is no connection" };

    getOrCreateOrmHandler().connectionHandler?.connData.logQueries &&
      console.log(
        "Query: ",
        highlight(query, { language: "sql", ignoreIllegals: true })
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
  }: FindManyOptions): Promise<FindReturnType> {
    const [_, relations] = Array.from(
      getOrCreateOrmHandler().metaDataStore.relations
    ).filter(([relationTarget, _]) => relationTarget === tableTarget)[0];

    const columns = constructQueryReturnTypes(tableName, tableTarget);

    const { query, params } = this.queryBuilder.createFindQuery({
        tableName,
        columns,
      }),
      { err, rows } = await this.query(query, params);

    const relationsObjs: RelationObject[] = [];
    for (const relation of relations) {
      const relationTable = (Array.from(
        getOrCreateOrmHandler().metaDataStore.tables
      ).find(([_, t]) => t.target === relation.type) || [])[1];

      if (!relationTable) continue;

      relationsObjs.push({
        condition: createCondition(
          relation.options.on,
          tableName,
          relationTable.name
        ),
        columns: constructQueryReturnTypes(relationTable.name, relation.type),
        joinedTableName: relationTable.name,
        propertyKey: relation.name,
      });
    }

    let newRows: any[] = rows || [];
    for (const relation of relationsObjs) {
      const { rows: relationRows, err: relationErr } = await this.queryRelation(
        rows || [],
        relation,
        relation.propertyKey
      );

      newRows =
        relationRows ||
        rows?.map((r) => ({ ...r, [relation.propertyKey]: [] })) ||
        [];
    }

    return err ? { err, rows: undefined } : { rows: newRows || [] };
  }

  async queryRelation(
    rows: any[],
    { columns, joinedTableName, condition }: RelationObject,
    propertyKey: string
  ): Promise<FindReturnType> {
    const { relationTableProperty, thisTableProperty } =
      getRelationCondtionProperties(condition, joinedTableName);

    const { query, params } = this.queryBuilder.createFindRelationRowsQuery({
        tableName: joinedTableName,
        columns,
        values: rows.map((r) => r[relationTableProperty]),
        propertyKey: thisTableProperty,
      }),
      { err, rows: relationRows } = await this.query(query, params);

    if (err) return { err, rows: undefined };

    const dataMap: Map<any, any[]> = new Map();
    for (const row of relationRows || []) {
      if (dataMap.has(row[thisTableProperty]))
        dataMap.set(row[thisTableProperty], [
          ...(dataMap.get(row[thisTableProperty]) || []),
          row,
        ]);
      else dataMap.set(row[thisTableProperty], [row]);
    }

    rows = rows.map((r) => ({
      ...r,
      [propertyKey]: dataMap.get(r[relationTableProperty]) || [],
    }));

    return { err: "err", rows };
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
