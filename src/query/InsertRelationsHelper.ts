import { InsertOptions } from "../types";

interface FindReturnTypeParams {
  options: InsertOptions;
  relationName: string;
}

export const FindReturnType = ({
  options,
  relationName,
}: FindReturnTypeParams) => {
  let returningOption: any = false;

  if (typeof options.returning === "boolean")
    returningOption = options.returning;
  else if (typeof (options.returning || {})[relationName] === "boolean")
    returningOption = (options.returning || {})[relationName];
  else if (
    typeof options.returning === "undefined" ||
    typeof (options.returning || {})[relationName] === "undefined"
  )
    returningOption = false;
  else {
    if (Array.isArray(options.returning[relationName]))
      returningOption = options.returning[relationName][0];
    else returningOption = options.returning[relationName];
  }
  return returningOption;
};
