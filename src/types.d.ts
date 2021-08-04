import { Component1 } from ".";
import { ORMHandler } from "./lib/Handler";
import { ColumnOptions, TableOptions } from "./helpers/decoratorsTypes";
import { RelationOptions } from "./decorators/Relation";
import { RelationObject } from "./query/QueryRunner";

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
export type QuerryRunnerFindReturnType =
  | { rows: any; err: string }
  | { rows: any[]; err?: string };

export interface CreateFindQueryParams {
  columns: ColumnType[];
  tableName: string;
}
export interface CreateFindRelationRowsQueryParams {
  tableName: string;
  columns: ColumnType[];
  values: any[];
  propertyKey: string;
}

export type CreateQueryReturnType = { query: string; params: any[] };
