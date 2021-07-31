export interface ColumnOptions {
  name?: string;
  array?: boolean;
  nullbale?: boolean;
  default?: any;
}

export type typeFunctionOrOptions =
  | ((type?: any) => Function | [Function] | ColumnTypes | [ColumnTypes])
  | ColumnOptions;

export type ColumnType = (
  typeFunctionOrOptions?: typeFunctionOrOptions,
  maybeOptions?: ColumnOptions
) => PropertyDecorator;

export interface TableOptions {
  name?: string;
  schema?: string;
}
