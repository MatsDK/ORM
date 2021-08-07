import { highlight } from "cli-highlight";
import { Client } from "pg";
import { QueryRunnerResult } from "../connection";
import {
  constructQueryReturnTypes,
  getRelationCondtionProperties,
  constructRelationObjs,
  getValuesForQuery,
  alreadyQueried,
  addRelationRows,
  deleteProps,
  constructThisQueryOptions,
} from "./queryRelationsHelper";
import { getOrCreateOrmHandler } from "../lib/Global";
import { ColumnType, QuerryRunnerFindReturnType, TableType } from "../types";
import { QueryBuilder } from "./QueryBuilder";
import { FindCondition, FindManyOptions } from "../table/BaseTable";
import { FindOperator } from "./operators/FindOperator";

interface FindManyProperties {
  tableName: string;
  tableTarget: string;
  options?: FindManyOptions;
}

interface QueryNestedRelationsParams {
  returnProps: any;
  queriedRelations?: string[][];
  rows: any[];
  tables: {
    thisTableProperty: string;
    joinedTable: { name: string; targetName: string };
    tableName: string;
    relationRows: any[];
  };
  findCondition: any;
  relationsObjs: RelationObject[];
}

export type RelationColumn = ColumnType & { alias: string };

export interface RelationObject {
  condition: FindOperator;
  joinedTable: {
    name: string;
    targetName: string;
  };
  columns: RelationColumn[];
  deleteColumns: string[];
  propertyKey: string;
  options: {
    array: boolean;
    findCondition: any;
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
    options = {},
  }: FindManyProperties): Promise<QuerryRunnerFindReturnType> {
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

      const { rows: relationRows, err: relationErr } = await this.queryRelation(
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

  async queryRelation(
    rows: any[],
    relation: RelationObject,
    propertyKey: string,
    tableName: string,
    returnProps: any,
    queriedRelations: string[][] = []
  ): Promise<QuerryRunnerFindReturnType> {
    const { joinedTable, columns, condition, options, deleteColumns } =
      relation;
    if (returnProps === true) returnProps = undefined;

    const { relationTableProperty, thisTableProperty } =
      getRelationCondtionProperties(condition);

    const thisTableRelations =
      getOrCreateOrmHandler().metaDataStore.getRelationsOfTable(
        joinedTable.targetName
      );
    const relationsObjs: RelationObject[] = constructRelationObjs(
      thisTableRelations,
      returnProps,
      relation.options.findCondition
    );

    let relationRows: any[] = [];

    if (rows.map((r) => r[relationTableProperty]).length) {
      const { query, params } = this.queryBuilder.createFindRelationRowsQuery({
        tableName: joinedTable.name,
        columns,
        findCondition: constructThisQueryOptions(
          { where: relation.options.findCondition },
          relationsObjs
        ),
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

    const res = await this.queryNestedRelations({
      returnProps,
      rows: relationRows,
      tables: {
        joinedTable,
        tableName,
        relationRows,
        thisTableProperty,
      },
      findCondition: relation.options.findCondition,
      relationsObjs,
    });
    if (!res.rows || res.err) return { err: res.err, rows: undefined };
    relationRows = res.rows;

    return addRelationRows(
      condition,
      rows,
      propertyKey,
      relationRows || [],
      relationTableProperty,
      options,
      deleteColumns,
      thisTableProperty
    );
  }

  async queryNestedRelations({
    returnProps,
    queriedRelations = [],
    rows,
    tables,
    findCondition,
    relationsObjs,
  }: QueryNestedRelationsParams) {
    const { joinedTable, thisTableProperty, tableName, relationRows } = tables;
    let newRows = rows;

    for (const relation of relationsObjs) {
      if (
        (returnProps && !returnProps[relation.propertyKey]) ||
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
        (returnProps || {})[relation.propertyKey],
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

    return { err: undefined, rows: newRows };
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
