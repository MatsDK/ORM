import { ColumnTypes, TypeClass } from "../db_types";
import { getOrCreateOrmHandler } from "../lib/Global";
import {
  ColumnOptions,
  ColumnType,
  PrimaryColumnType,
} from "../helpers/decoratorsTypes";
import { findTypeAndOptoins } from "../helpers/findTypeAndOptions";

export const PrimaryColumn: PrimaryColumnType = (
  typeFunctionOrOptions,
  maybeOptions
): PropertyDecorator => {
  return (target, propertyKey) => {
    if (typeof propertyKey === "symbol") throw new Error("Symbol");

    const { getType, options } = findTypeAndOptoins({
      typeFunctionOrOptions,
      options: (maybeOptions || {}) as ColumnOptions,
      propertyKey,
      targetObject: target,
      relation: false,
    });

    getOrCreateOrmHandler().metaDataStore.addColumn({
      name: options.name || propertyKey,
      target: target.constructor.name,
      type: getType(),
      options: { ...options, primary: true, nullable: false },
    });
  };
};
