import { getOrCreateOrmHandler } from "../lib/Global";
import { RelationColumn, RelationObject } from "../query/QueryRunner";
import { ColumnType, RelationType } from "../types";

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

export const createCondition = (
  obj: { [key: string]: string },
  tableName1: string,
  tableName2: string
): string => {
  let condition: string = "";

  Object.entries(obj).map(([x, y]) => {
    const left: string = `"${tableName1}"."${x.split(".")[1]}"`;
    const right: string = `"${tableName2}"."${y.split(".")[1]}"`;

    condition = `${left}=${right}`;
  });

  return condition;
};

export const getRelationCondtionProperties = (
  condition: { [key: string]: string },
  thisTableName: string,
  tableName: string
) => {
  const [x, y]: string[] = createCondition(
    condition,
    tableName,
    thisTableName
  ).split("=");

  return x.includes(thisTableName)
    ? {
        thisTableProperty: x.split(".")[1].replace(/\"/g, ""),
        relationTableProperty: y.split(".")[1].replace(/\"/g, ""),
      }
    : {
        thisTableProperty: y.split(".")[1].replace(/\"/g, ""),
        relationTableProperty: x.split(".")[1].replace(/\"/g, ""),
      };
};

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
      condition: relation.options.on,
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
