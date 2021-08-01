import { ColumnTypes, TypeClass } from "../db_types";
import {
  typeFunctionOrOptions,
  ColumnOptions,
  ColumnType,
} from "./decoratorsTypes";
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

        const { depth, type } = findArrayTypeAndDepth(thisType);
        thisType = type;
        options.arrayDepth = depth;
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
  options.nullable = !!options.nullable;

  return { getType: () => type || "", options };
};

const findTypeWithConstructor = (
  constructor: Function
): ColumnTypes | undefined => {
  if (constructor.name === "String") return "text";
  else if (constructor.name === "Boolean") return "bool";
  else if (constructor.name === "Date") return "date";
};

type ArrayType = (ColumnTypes | Function)[];
const findArrayTypeAndDepth = (
  thisArray: ArrayType,
  depth = 1
): { depth: number; type: ColumnTypes } =>
  Array.isArray(thisArray[0])
    ? findArrayTypeAndDepth(thisArray[0], depth + 1)
    : {
        depth,
        type:
          typeof thisArray[0] === "function"
            ? (new (thisArray[0] as any)() as TypeClass).type
            : thisArray[0],
      };
