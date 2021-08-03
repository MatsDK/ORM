export interface ColumnDecoratorOptions {
  name?: string;
  array?: boolean;
  nullable?: boolean;
  default?: any;
  primary?: boolean;
  default?: any;
}

export interface PrimaryColumnDecoratorOptions {
  name?: string;
}

export interface ColumnOptions extends ColumnDecoratorOptions {
  arrayDepth?: number;
  sequence?: boolean;
}

export type typeFunctionOrOptions =
  | ((type?: any) => Function | [Function] | ColumnTypes | [ColumnTypes])
  | ColumnDecoratorOptions;

export type PrimarytypeFunctionOrOptions =
  | ((type?: any) => Function | [Function] | ColumnTypes | [ColumnTypes])
  | PrimaryColumnDecoratorOptions;

export type ColumnType = (
  typeFunctionOrOptions?: typeFunctionOrOptions,
  maybeOptions?: ColumnDecoratorOptions
) => PropertyDecorator;

export type PrimaryColumnType = (
  typeFunctionOrOptions?: PrimarytypeFunctionOrOptions,
  maybeOptions?: PrimaryColumnDecoratorOptions
) => PropertyDecorator;

export interface TableOptions {
  name?: string;
  schema?: string;
}
