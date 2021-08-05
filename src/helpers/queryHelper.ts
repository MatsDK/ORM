import { getOrCreateOrmHandler } from "../lib/Global";
import { RelationColumn, RelationObject } from "../query/QueryRunner";
import { ColumnType, RelationType, TableType } from "../types";
import { ConditionObj } from "./decoratorsTypes";

export const constructQueryReturnTypes = (
  tableName: string,
  tableTarget: string
): RelationColumn[] => {
  const columns: Array<[string, ColumnType[]]> = JSON.parse(
    JSON.stringify(Array.from(getOrCreateOrmHandler().metaDataStore.columns))
  );

  return columns
    .filter(([targetName, _]) => targetName === tableTarget)[0][1]
    .map((c) => ({
      ...c,
      name: (c.name = `"${tableName}"."${c.name}"`),
      alias: `__${tableName}__${c.name.split(".")[1].replace(/\"/g, "")}`,
    }));
};

export const getRelationCondtionProperties = (condition: ConditionObj) => ({
  relationTableProperty: condition.thisTableProperty.split(".")[1],
  thisTableProperty: condition.property.split(".")[1],
});

export const constructRelationObjs = (
  relations: RelationType[]
): RelationObject[] => {
  const relationsObjs: RelationObject[] = [];

  for (const relation of relations || []) {
    const relationTable = (Array.from(
      getOrCreateOrmHandler().metaDataStore.tables
    ).find(([_, t]) => t.target === relation.type) || [])[1];

    if (!relationTable) continue;

    relationsObjs.push({
      condition: relation.options.on as ConditionObj,
      columns: constructQueryReturnTypes(relationTable.name, relation.type),
      joinedTable: {
        targetName: relationTable.target,
        name: relationTable.name,
      },
      propertyKey: relation.name,
      options: {
        array: !!relation.options.array,
      },
    });
  }
  return relationsObjs;
};

export const getValuesForQuery = (
  condition: ConditionObj,
  rows: any[],
  relationTableProperty: string
): any[] => {
  let values: any[] = [];
  if (condition.type === "equal")
    values = rows.map((r) => r[relationTableProperty]);
  else if (condition.type === "any")
    values = Array.from(
      new Set(
        rows
          .map((r) => r[relationTableProperty])
          .reduce((a: any[], c: any[]) => [...a, ...c], [])
      )
    );

  return values;
};

export const alreadyQueried = (
  queriedRelations: string[][],
  joinedTable: { name: string; targetName: string },
  thisTableProperty: string,
  relation: RelationObject
): boolean =>
  !!queriedRelations.find(([relationTable, thisTable]) => {
    relationTable.split(".")[0] === joinedTable.name &&
      relationTable.split(".")[1] === thisTableProperty &&
      thisTable.split(".")[0] === relation.joinedTable.name &&
      thisTable.split(".")[1] === relation.propertyKey;
  });

export const addRelationRows = (
  condition: ConditionObj,
  rows: any[],
  propertyKey: string,
  dataMap: Map<string, any>,
  relationTableProperty: string,
  options: { array: boolean }
): { rows: any[] } =>
  condition.type === "equal"
    ? {
        rows: rows.map((r) => ({
          ...r,
          [propertyKey]:
            dataMap.get(r[relationTableProperty]) ||
            (options.array ? [] : null),
        })),
      }
    : {
        rows: rows.map((r) => {
          const values = new Set();
          for (const value of r[relationTableProperty]) {
            options.array
              ? dataMap.get(value).forEach(values.add, values)
              : values.add(dataMap.get(value));
          }

          return {
            ...r,
            [propertyKey]: options.array
              ? Array.from(values)
              : Array.from(values)[0],
          };
        }),
      };
