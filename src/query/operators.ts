import { ConditionObj } from "../helpers/decoratorsTypes";

export const Any = (prop: string, tableProp: string): ConditionObj => {
  return { name: "any", property: prop, thisTableProperty: tableProp, raw: "" };
};

export const IsNull = (): ConditionObj => {
  return { name: "IsNull", raw: "IS NULL" };
};

export const Equal = (value: any): ConditionObj => {
  return {
    name: "Equal",
    raw: value,
  };
};
