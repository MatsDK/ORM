import { AnyValue } from "../types";
import { RelationOptions } from "./decorators/Relation";
import { ColumnOptions, TableOptions } from "./helpers/decoratorsTypes";
import { ORMHandler } from "./lib/Handler";
import { FindManyOptions } from "./table/BaseTable";

export interface GlobalType extends globalThis {
  ORM_HANDLER: ORMHandler;
}

export interface TableType {
  target: string;
  name: string;
  options: TableOptions;
}

export interface ColumnType {
  name: string;
  target: string;
  type: string;
  options: ColumnOptions;
}

export interface RelationType {
  type: string;
  target: string;
  name: string;
  options: RelationOptions;
}

export type FindReturnType<T> =
  | { rows: T | undefined; err: string }
  | { rows: T[]; err?: string };
export type QueryRunnerFindReturnType =
  | { rows: any; err: string }
  | { rows: any[]; err?: string };

export interface CreateFindQueryParams {
  columns: ColumnType[];
  tableName: string;
  options: FindManyOptions;
}

export interface CreateFindRelationRowsQueryParams {
  tableName: string;
  columns: ColumnType[];
  propertyKey: string;
  values: any[];
  findCondition: any;
}

export type CreateQueryReturnType = { query: string; params: any[] };

export type AnyValue = string | number | boolean;

type ReturnCondition<T> =
  | {
      [P in keyof T]?: ReturnCondition<T[P]> | boolean;
    }
  | { [key: string]: boolean | any };

type findConditionValue = string | number | boolean | FindOperator;

export type FindCondition<T> =
  | {
      [P in keyof T]?: ReturnCondition<T[P]> | findConditionValue;
    }
  | {
      [P in keyof T]?: ReturnCondition<T[P]> | findConditionValue;
    }[]
  | { [key: string]: findConditionValue };

type OrderValues = "ASC" | "asc" | "DESC" | "desc";

type OrderOption<T = any> =
  | {
      [P in keyof T]?: OrderValues;
    }
  | { [key: string]: OrderValues };

export interface FindManyOptions<Entity = any> {
  where?: FindCondition<Entity>;
  returning?: ReturnCondition<Entity>;
  limit?: number;
  skip?: number;
  order?: OrderOption<Entity>;
}

export type InsertValues<T = any> =
  | {
      [P in keyof T]?: InsertValues<T[P]> | AnyValue;
    }
  | {
      [P in keyof T]?: InsertValues<T[P]> | AnyValue;
    }[]
  | { [key: string]: any }
  | { [key: string]: any }[];

export interface QueryNestedRelationsParams {
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

export interface InsertParams {
  values: InsertValues;
  table: TableType;
  options: InsertOptions;
}

export interface DeleteParams {
  options: DeleteOptions;
  tableName: string;
}

export interface FindManyProperties {
  tableName: string;
  tableTarget: string;
  options?: FindManyOptions;
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

export interface createInsertQueryParams {
  values: InsertValues;
  tableName: string;
  insertColumns: string[];
  options: InsertOptions<T>;
  returnColumns: string[];
}

export type InsertOptionsReturning<T = any> = ReturnCondition<T> | boolean;

export interface InsertOptions<T = any> {
  returning?: ReturnCondition<T> | boolean;
}

export interface DeleteOptions<T = any> {
  where?: FindCondition<T>;
  order?: OrderOption<T>;
  limit?: number;
  skip?: number;
}

export interface UpdateOptions<T = any> {
  where?: FindCondition<T>;
  set?: UpdateCondition<T>;
  order?: OrderOption<T>;
  limit?: number;
  skip?: number;
}

export interface UpdateParams {
  options: UpdateOptions;
  table: TableType;
}

export type UpdateCondition<T> =
  | {
      [P in keyof T]?:
        | ReturnCondition<T[P]>
        | findConditionValue
        | findConditionValue[];
    }
  | {
      [P in keyof T]?:
        | ReturnCondition<T[P]>
        | findConditionValue
        | findConditionValue[];
    }[]
  | { [key: string]: findConditionValue };

export interface AddConditionsObj {
  order: any;
  where: any;
  limit: number | undefined;
  skip: number | undefined;
  params: any[];
  tableName: string;
}

export interface InsertRelationsProps {
  table: TableType;
  values: any[];
  options: InsertOptions;
  rows: any[];
}
