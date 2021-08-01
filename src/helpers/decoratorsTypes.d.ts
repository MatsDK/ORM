export interface ColumnDecoratorOptions {
  name?: string;
  array?: boolean;
  nullable?: boolean;
  default?: any;
}

export interface ColumnOptions extends ColumnDecoratorOptions {
  arrayDepth?: number;
}

export type typeFunctionOrOptions =
  | ((type?: any) => Function | [Function] | ColumnTypes | [ColumnTypes])
  | ColumnOptions;

export type ColumnType = (
  typeFunctionOrOptions?: typeFunctionOrOptions,
  maybeOptions?: ColumnDecoratorOptions
) => PropertyDecorator;

export interface TableOptions {
  name?: string;
  schema?: string;
}
