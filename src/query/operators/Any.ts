import { ConditionObj } from "../../helpers/decoratorsTypes";

export const Any = (prop: string, tableProp: string): ConditionObj => {
  return { type: "any", property: prop, thisTableProperty: tableProp };
};
