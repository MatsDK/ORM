import { findTypeAndOptoins } from "../helpers/findTypeAndOptions";
import { getOrCreateOrmHandler } from "../lib/Global";

export interface RelationOptions {
  name?: string;
  array?: boolean;
}

type RelationTypeOrOptions<T> =
  | RelationOptions
  | ((type?: any) => T)
  | ((type?: any) => [T]);

export const Relation = <T>(
  typeFunction: RelationTypeOrOptions<T>,
  maybeOptions?: RelationOptions
): PropertyDecorator => {
  return (target, propertyKey) => {
    if (typeof propertyKey === "symbol") return "Symbol error";

    const { options, getType } = findTypeAndOptoins({
      propertyKey,
      targetObject: target,
      options: maybeOptions || {},
      typeFunctionOrOptions: typeFunction,
      relation: true,
    });

    getOrCreateOrmHandler().metaDataStore.addRelation({
      name: !!options.name ? options.name : propertyKey,
      target: target.constructor.name,
      type: getType(),
      options,
    });
  };
};
