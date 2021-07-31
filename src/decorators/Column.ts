import { ColumnTypes, TypeClass } from "../db_types";
import { getOrCreateOrmHandler } from "../lib/Global";
import { ColumnType } from "../helpers/decoratorsTypes";
import { findTypeAndOptoins } from "../helpers/findTypeAndOptions";

export const Column: ColumnType = (
  typeFunctionOrOptions,
  maybeOptions
): PropertyDecorator => {
  return (target, propertyKey) => {
    if (typeof propertyKey === "symbol") throw new Error("Symbol");

    const { getType, options } = findTypeAndOptoins({
      typeFunctionOrOptions,
      Columnoptions: maybeOptions || {},
      propertyKey,
      targetObject: target,
    });

    getOrCreateOrmHandler().metaDataStore.addColumn({
      name: options.name || propertyKey,
      target: target.constructor.name,
      type: getType(),
      options,
    });
  };
};
