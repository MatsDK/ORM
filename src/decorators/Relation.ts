import {
  ColumnOptions,
  typeFunctionOrOptions,
} from "../helpers/decoratorsTypes";
import { findTypeAndOptoins } from "../helpers/findTypeAndOptions";
import { getOrCreateOrmHandler } from "../lib/Global";
import { FindOperator } from "../query/operators/FindOperator";

export interface RelationOptions {
  name?: string;
  array?: boolean;
  on: { [key: string]: any } | FindOperator;
}

type RelationTypeOrOptions<T> =
  | RelationOptions
  | ((type?: any) => T)
  | ((type?: any) => [T]);

export const Relation = <T extends Function>(
  typeFunction: RelationTypeOrOptions<T>,
  maybeOptions?: RelationOptions
): PropertyDecorator => {
  return (target, propertyKey) => {
    if (typeof propertyKey === "symbol") return "Symbol error";

    const { options, getType } = findTypeAndOptoins({
      propertyKey,
      targetObject: target,
      options: (maybeOptions || {}) as ColumnOptions,
      typeFunctionOrOptions: typeFunction as typeFunctionOrOptions,
      relation: true,
    });

    const values: any[] = Object.values(options.on!)[0] as any,
      thisTableProperty: any[] = Object.entries(options.on!)[0];

    if (Array.isArray(values)) {
      if (typeof values[0] === "function" && typeof values[1] !== undefined)
        options.on = (values[0] as any)(values[1], thisTableProperty[0]);
    } else if (typeof values !== undefined)
      options.on = new FindOperator("Equal", "", values, thisTableProperty[0]);

    getOrCreateOrmHandler().metaDataStore.addRelation({
      name: !!options.name ? options.name : propertyKey,
      target: target.constructor.name,
      type: getType(),
      options: options as any,
    });
  };
};
