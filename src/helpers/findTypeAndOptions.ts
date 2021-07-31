import { ColumnTypes, TypeClass } from "../db_types";
import { typeFunctionOrOptions, ColumnOptions } from "./decoratorsTypes";
import { bannedTypes } from "./returnTypes";

type findTypeAndOptions = (params: {
  typeFunctionOrOptions?: typeFunctionOrOptions;
  Columnoptions: ColumnOptions;
  targetObject: Object;
  propertyKey: string;
}) => { getType: () => string; options: ColumnOptions };

export const findTypeAndOptoins: findTypeAndOptions = ({
  typeFunctionOrOptions,
  Columnoptions,
  targetObject,
  propertyKey,
}) => {
  let type: ColumnTypes | undefined;

  const options =
    (typeof typeFunctionOrOptions === "function"
      ? Columnoptions
      : typeFunctionOrOptions) || {};

  if (typeof typeFunctionOrOptions === "function") {
    let thisType = typeFunctionOrOptions();
    if (thisType) {
      if (Array.isArray(thisType)) {
        options.array = true;
        thisType = thisType[0];
      }

      type =
        typeof thisType === "function"
          ? (new (thisType as any)() as TypeClass).type
          : thisType;
    }
  }

  const reflectMetaDataType = Reflect
    ? Reflect.getMetadata("design:type", targetObject, propertyKey)
    : undefined;

  if (reflectMetaDataType && !type && reflectMetaDataType)
    if (!bannedTypes.includes(reflectMetaDataType))
      type = findTypeWithConstructor(reflectMetaDataType) || undefined;

  if (typeof type !== "string")
    throw new Error(`Type not found of: ${propertyKey}`);

  options.array = !!options.array;

  return { getType: () => type || "", options };
};

const findTypeWithConstructor = (
  constructor: Function
): ColumnTypes | undefined => {
  if (constructor.name === "String") return "text";
  else if (constructor.name === "Boolean") return "bool";
  else if (constructor.name === "Date") return "date";
};
