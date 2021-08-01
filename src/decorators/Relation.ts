import { getOrCreateOrmHandler } from "../lib/Global";

interface RelationOptions {
  name?: string;
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

    const options: RelationOptions =
      (typeof typeFunction === "function" ? maybeOptions : maybeOptions) || {};

    getOrCreateOrmHandler().metaDataStore.addRelation({
      name: options.name || propertyKey,
      target: target.constructor.name,
    });
  };
};
