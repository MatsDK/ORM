import { ColumnTypes, TypeClass } from "../db_types";
import { ColumnOptions, typeFunctionOrOptions } from "./decoratorsTypes";
import { bannedTypes } from "./returnTypes";

type findTypeAndOptions = (params: {
  typeFunctionOrOptions?: typeFunctionOrOptions;
  options: ColumnOptions;
  targetObject: Object;
  propertyKey: string;
  relation: boolean;
}) => { getType: () => string; options: ColumnOptions };

export const findTypeAndOptoins: findTypeAndOptions = ({
  typeFunctionOrOptions,
  options: opt,
  targetObject,
  propertyKey,
  relation,
}) => {
  let type: any;

  const options: ColumnOptions =
    (typeof typeFunctionOrOptions === "function"
      ? opt
      : typeFunctionOrOptions) || {};

  if (typeof typeFunctionOrOptions === "function") {
    let thisType = typeFunctionOrOptions();

    if (thisType) {
      if (Array.isArray(thisType)) {
        options.array = true;

        const { depth, type } = findArrayTypeAndDepth(thisType, relation);
        thisType = { name: type };
        options.arrayDepth = depth;
      }

      if (relation) type = thisType.name;
      else {
        if (typeof thisType === "function") {
          const thisTypeClass = new (thisType as any)() as TypeClass;
          type = thisTypeClass.type;

          if (thisTypeClass.sequence) options.sequence = true;
        } else type = thisType.name;
      }
    }
  }

  const reflectMetaDataType = Reflect
    ? Reflect.getMetadata("design:type", targetObject, propertyKey)
    : undefined;

  if (reflectMetaDataType && !type)
    if (!bannedTypes.includes(reflectMetaDataType))
      type = relation
        ? reflectMetaDataType.name
        : findTypeWithConstructor(reflectMetaDataType) || undefined;

  if (typeof type !== "string")
    throw new Error(`Type not found of: ${propertyKey}`);

  options.array = !!options.array;
  options.arrayDepth == null && options.array && 1;

  !relation && (options.nullable = !!options.nullable);
  options.primary && (options.nullable = false);

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
  relation: boolean,
  depth = 1
): { depth: number; type: ColumnTypes | string } =>
  Array.isArray(thisArray[0])
    ? findArrayTypeAndDepth(thisArray[0], relation, depth + 1)
    : {
        depth,
        type: relation
          ? (thisArray[0] as Function).name
          : typeof thisArray[0] === "function"
          ? (new (thisArray[0] as any)() as TypeClass).type
          : thisArray[0],
      };
