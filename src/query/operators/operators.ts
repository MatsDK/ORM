import { AnyValue } from "../../types";
import { FindOperator } from "./FindOperator";

export const Any = (prop: string, tableProp: string): FindOperator => {
  return new FindOperator("Any", "", prop, tableProp);
};

export const IsNull = (): FindOperator => {
  return new FindOperator("IsNull", "");
};

export const Equal = (value: any): FindOperator => {
  return new FindOperator("Equal", value);
};

export const Not = (value: FindOperator | AnyValue): FindOperator => {
  const isObject = value instanceof FindOperator;

  return new FindOperator(
    isObject ? `Not-${(value as FindOperator).name}` : "Not",
    isObject ? (value as FindOperator).raw : (value as AnyValue)
  );
};

export const MoreThan = (value: AnyValue): FindOperator => {
  return new FindOperator("MoreThan", value);
};

export const MoreThanOrEqual = (value: AnyValue): FindOperator => {
  return new FindOperator("MoreThanOrEqual", value);
};

export const LessThan = (value: AnyValue): FindOperator => {
  return new FindOperator("LessThan", value);
};

export const LessThanOrEqual = (value: AnyValue): FindOperator => {
  return new FindOperator("LessThanOrEqual", value);
};

export const Between = (value1: AnyValue, value2: AnyValue): FindOperator => {
  return new FindOperator("Between", [value1, value2]);
};

export const Like = (value: string): FindOperator => {
  return new FindOperator("Like", value);
};

export const ILike = (value: string): FindOperator => {
  return new FindOperator("ILike", value);
};
