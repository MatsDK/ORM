import { getOrCreateOrmHandler } from "../lib/Global";
import {
  QueryNestedRelationsParams,
  QueryRunnerFindReturnType,
  RelationObject,
} from "../types";
import {
  addRelationRows,
  alreadyQueried,
  constructRelationObjs,
  constructThisQueryOptions,
  getRelationCondtionProperties,
  getValuesForQuery,
} from "./queryRelationsHelper";
import { QueryRunner } from "./QueryRunner";

export class QueryRelation {
  queryRunner: QueryRunner;

  constructor(queryRunner: QueryRunner) {
    this.queryRunner = queryRunner;
  }

  async queryRelation(
    rows: any[],
    relation: RelationObject,
    propertyKey: string,
    tableName: string,
    returnProps: any,
    queriedRelations: string[][] = []
  ): Promise<QueryRunnerFindReturnType> {
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
      const { query, params } =
        this.queryRunner.queryBuilder.createFindRelationRowsQuery({
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

      const { err, rows: relRows } = await this.queryRunner.query(
        query,
        params
      );

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
}
