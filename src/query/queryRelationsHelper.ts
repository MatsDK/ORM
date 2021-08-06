import { getOrCreateOrmHandler } from "../lib/Global";
import { RelationColumn, RelationObject } from "./QueryRunner";
import { ColumnType, RelationType, TableType } from "../types";
import { ConditionObj } from "../helpers/decoratorsTypes";

export const constructQueryReturnTypes = (
  tableName: string,
  tableTarget: string,
  returning: any
): { columns: RelationColumn[]; deleteColumns: string[] } => {
  const columns = (
    JSON.parse(
      JSON.stringify(Array.from(getOrCreateOrmHandler().metaDataStore.columns))
    ) as Array<[string, ColumnType[]]>
  ).filter(([targetName, _]) => targetName === tableTarget)[0][1];

  let deleteColumns: string[] = [],
    newColumns: ColumnType[] = columns;

  if (!returning || returning != true) {
    const relationCols: string[] = [];

    newColumns = [];

    for (const relation of getOrCreateOrmHandler().metaDataStore.getRelationsOfTable(
      tableTarget
    )) {
      relationCols.push(relation.options.on.thisTableProperty.split(".")[1]);
    }

    Array.from(getOrCreateOrmHandler().metaDataStore.relations)
      .map(([_, r]) => r)
      .forEach((relations) => {
        for (const rel of relations)
          if (rel.type === tableTarget)
            relationCols.push(rel.options.on.property.split(".")[1]);
      });

    for (const col of columns) {
      if (!!returning[col.name]) newColumns.push(col);
      else if (relationCols.includes(col.name)) {
        newColumns.push(col);
        deleteColumns.push(col.name);
      }
    }
  }

  return {
    columns: newColumns.map((c) => ({
      ...c,
      name: (c.name = `"${tableName}"."${c.name}"`),
      alias: `__${tableName}__${c.name.split(".")[1].replace(/\"/g, "")}`,
    })),
    deleteColumns,
  };
};

export const getRelationCondtionProperties = (condition: ConditionObj) => ({
  relationTableProperty: condition.thisTableProperty.split(".")[1],
  thisTableProperty: condition.property.split(".")[1],
});

export const constructRelationObjs = (
  relations: RelationType[],
  returnProps: any
): RelationObject[] => {
  const relationsObjs: RelationObject[] = [];

  for (const relation of relations || []) {
    const relationTable = (Array.from(
      getOrCreateOrmHandler().metaDataStore.tables
    ).find(([_, t]) => t.target === relation.type) || [])[1];

    if (!relationTable) continue;

    const { columns, deleteColumns } = constructQueryReturnTypes(
      relationTable.name,
      relation.type,
      returnProps[relation.name]
    );

    relationsObjs.push({
      condition: relation.options.on as ConditionObj,
      columns,
      deleteColumns,
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
  options: { array: boolean },
  deleteColumns: string[]
): { rows: any[] } => {
  return condition.type === "equal"
    ? {
        rows: rows.map((r) => {
          let value = dataMap.get(r[relationTableProperty]);

          if (value)
            value = deleteProps(
              Array.isArray(value) ? value : [value],
              deleteColumns
            );

          return {
            ...r,
            [propertyKey]: value || (options.array ? [] : null),
          };
        }),
      }
    : {
        rows: rows.map((r) => {
          const values = new Set();
          for (const value of r[relationTableProperty]) {
            options.array
              ? dataMap.get(value).forEach(values.add, values)
              : values.add(dataMap.get(value));
          }

          let value = options.array
            ? Array.from(values)
            : Array.from(values)[0];

          value = deleteProps(
            Array.isArray(value) ? value : [value],
            deleteColumns
          );

          return {
            ...r,
            [propertyKey]: value,
          };
        }),
      };
};

export const deleteProps = (rows: any[], deleteColumns: string[]): any[] =>
  rows.map((r) => {
    deleteColumns.forEach((col) => {
      delete r[col];
    });

    return r;
  });
