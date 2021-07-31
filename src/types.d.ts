import { Component1 } from ".";
import { ORMHandler } from "./Handler";
import { TableOptions } from "./helpers/decoratorsTypes";

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
