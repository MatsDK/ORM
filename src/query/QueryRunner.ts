import { highlight } from "cli-highlight";
import { Client } from "pg";
import { QueryRunnerResult } from "../connection";
import { ConditionObj } from "../helpers/decoratorsTypes";
import {
  constructQueryReturnTypes,
  getRelationCondtionProperties,
  constructRelationObjs,
  getValuesForQuery,
  alreadyQueried,
  addRelationRows,
} from "../helpers/queryHelper";
import { getOrCreateOrmHandler } from "../lib/Global";
import { ColumnType, QuerryRunnerFindReturnType, TableType } from "../types";
import { QueryBuilder } from "./QueryBuilder";

interface FindManyOptions {
  tableName: string;
  tableTarget: string;
}

export type RelationColumn = ColumnType & { alias: string };

export interface RelationObject {
  condition: ConditionObj;
  joinedTable: {
    name: string;
    targetName: string;
  };
  columns: RelationColumn[];
  propertyKey: string;
  options: {
    array: boolean;
  };
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
  }: FindManyOptions): Promise<QuerryRunnerFindReturnType> {
    const columns = constructQueryReturnTypes(tableName, tableTarget);

    const { query, params } = this.queryBuilder.createFindQuery({
        tableName,
        columns,
      }),
      { err, rows } = await this.query(query, params);

    const relationsObjs: RelationObject[] = constructRelationObjs(
      getOrCreateOrmHandler().metaDataStore.getRelationsOfTable(tableTarget)
    );

    let newRows: any[] = rows || [];
    for (const relation of relationsObjs) {
      const { rows: relationRows, err: relationErr } = await this.queryRelation(
        rows || [],
        relation,
        relation.propertyKey,
        tableName
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

    return err ? { err, rows: undefined } : { rows: newRows || [] };
  }

  async queryRelation(
    rows: any[],
    { columns, joinedTable, condition, options }: RelationObject,
    propertyKey: string,
    tableName: string,
    queriedRelations: string[][] = []
  ): Promise<QuerryRunnerFindReturnType> {
    const { relationTableProperty, thisTableProperty } =
      getRelationCondtionProperties(condition);

    let relationRows: any[] = [];

    if (rows.map((r) => r[relationTableProperty]).length) {
      const { query, params } = this.queryBuilder.createFindRelationRowsQuery({
        tableName: joinedTable.name,
        columns,
        propertyKey: thisTableProperty,
        values: getValuesForQuery(condition, rows, relationTableProperty),
      });

      if (!query) return { err: "Wrong query", rows: undefined };

      const { err, rows: relRows } = await this.query(query, params);

      queriedRelations.push([
        `${tableName}.${relationTableProperty}`,
        `${joinedTable.name}.${thisTableProperty}`,
      ]);

      if (err) return { err, rows: undefined };
      if (relRows) relationRows = relRows;
    }

    const thisTableRelations =
      getOrCreateOrmHandler().metaDataStore.getRelationsOfTable(
        joinedTable.targetName
      );
    const relationsObjs: RelationObject[] =
      constructRelationObjs(thisTableRelations);

    let newRows: any[] = relationRows || [];

    for (const relation of relationsObjs) {
      if (
        alreadyQueried(
          queriedRelations,
          joinedTable,
          thisTableProperty,
          relation
        )
      )
        continue;

      const { rows: newRelationRows, err } = await this.queryRelation(
        relationRows,
        relation,
        relation.propertyKey,
        tableName,
        queriedRelations
      );

      if (err) return { err, rows: undefined };

      newRows =
        newRelationRows ||
        rows?.map((r: any) => ({
          ...r,
          [relation.propertyKey]: relation.options.array ? [] : null,
        })) ||
        [];
    }

    const dataMap: Map<any, any[] | any> = new Map();

    for (const row of newRows || []) {
      if (options.array) {
        if (dataMap.has(row[thisTableProperty])) {
          dataMap.set(row[thisTableProperty], [
            ...(dataMap.get(row[thisTableProperty]) || []),
            row,
          ]);
        } else {
          dataMap.set(row[thisTableProperty], [row]);
        }
      } else if (!dataMap.has(row[thisTableProperty])) {
        dataMap.set(row[thisTableProperty], row);
      }
    }

    return addRelationRows(
      condition,
      rows,
      propertyKey,
      dataMap,
      relationTableProperty,
      options
    );
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
