import { getOrCreateOrmHandler } from "../lib/Global";
import { RelationColumn, RelationObject } from "./QueryRunner";
import { ColumnType, RelationType, TableType } from "../types";
import { FindCondition, FindManyOptions } from "../table/BaseTable";
import { FindOperator } from "./operators/FindOperator";

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

  if (returning && returning != true) {
    const relationCols: string[] = [];
    newColumns = [];

    for (const relation of getOrCreateOrmHandler().metaDataStore.getRelationsOfTable(
      tableTarget
    )) {
      relationCols.push(relation.options.on.thisTableProp.split(".")[1]);
    }

    Array.from(getOrCreateOrmHandler().metaDataStore.relations)
      .map(([_, r]) => r)
      .forEach((relations) => {
        for (const rel of relations)
          if (rel.type === tableTarget)
            relationCols.push(rel.options.on.prop.split(".")[1]);
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

export const getRelationCondtionProperties = (condition: FindOperator) => {
  return {
    relationTableProperty: condition.thisTableProp!.split(".")[1],
    thisTableProperty: condition.prop!.split(".")[1],
  };
};

export const constructRelationObjs = (
  relations: RelationType[],
  returnProps: any,
  findCondition: any
): RelationObject[] => {
  const relationsObjs: RelationObject[] = [];

  for (const relation of relations || []) {
    const relationTable = (Array.from(
      getOrCreateOrmHandler().metaDataStore.tables
    ).find(([_, t]) => t.target === relation.type) || [])[1];

    const thisFindCondition = Array.isArray(findCondition)
      ? [...findCondition].map((f) => f[relation.name]).filter((f) => !!f)
      : (findCondition || {})[relation.name];

    if (!relationTable) continue;

    const { columns, deleteColumns } = constructQueryReturnTypes(
      relationTable.name,
      relation.type,
      (returnProps || {})[relation.name]
    );

    relationsObjs.push({
      condition: relation.options.on as FindOperator,
      columns,
      deleteColumns,
      joinedTable: {
        targetName: relationTable.target,
        name: relationTable.name,
      },
      propertyKey: relation.name,
      options: {
        findCondition: thisFindCondition,
        array: !!relation.options.array,
      },
    });
  }
  return relationsObjs;
};

export const getValuesForQuery = (
  condition: FindOperator,
  rows: any[],
  relationTableProperty: string
): any[] => {
  let values: any[] = [];
  if (condition.name === "Equal")
    values = rows.map((r) => r[relationTableProperty]);
  else if (condition.name === "Any")
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
  condition: FindOperator,
  rows: any[],
  propertyKey: string,
  newRows: any[],
  relationTableProperty: string,
  options: { array: boolean },
  deleteColumns: string[],
  thisTableProperty: string
): { rows: any[] } => {
  const dataMap = createDataMap(newRows, options, thisTableProperty);

  return condition.name === "Equal"
    ? {
        rows: rows.map((r) => {
          let value = dataMap.get(r[relationTableProperty]);

          if (value)
            value = deleteProps(
              Array.isArray(value) ? value : [value],
              deleteColumns
            );

          if (!options.array && value != undefined) value = value[0];

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
              ? (dataMap.get(value) || []).forEach(values.add, values)
              : values.add(dataMap.get(value));
          }

          let value: any = options.array
            ? Array.from(values)
            : Array.from(values)[0];

          value = deleteProps(
            Array.isArray(value) ? value : [value],
            deleteColumns
          );

          return {
            ...r,
            [propertyKey]: options.array ? value : value[0],
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

export const createDataMap = (
  newRows: any[],
  options: { array: boolean },
  thisTableProperty: string
) => {
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

  return dataMap;
};

export const constructThisQueryOptions = (
  options: FindManyOptions,
  relationsObjs: RelationObject[]
) => {
  const thisQueryOptions: FindCondition<any> | undefined = Array.isArray(
    options.where
  )
    ? [...options.where]
    : {
        ...options.where,
      };

  for (const { propertyKey } of relationsObjs) {
    if (Array.isArray(thisQueryOptions))
      for (const condition of thisQueryOptions)
        delete (condition as any)[propertyKey];
    else if ((thisQueryOptions as any)[propertyKey])
      delete (thisQueryOptions as any)[propertyKey];
  }

  return thisQueryOptions;
};
