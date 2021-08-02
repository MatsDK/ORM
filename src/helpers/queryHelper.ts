import { getOrCreateOrmHandler } from "../lib/Global";
import { ColumnType } from "../types";

export const constructQueryReturnTypes = (
  tableName: string,
  tableTarget: string
): ColumnType[] => {
  const columns: [string, ColumnType][] = JSON.parse(
    JSON.stringify(Array.from(getOrCreateOrmHandler().metaDataStore.columns))
  );

  return columns
    .filter(([_, c]) => c.target === tableTarget)
    .map(([_, c]) => c)
    .map((c) => ({ ...c, name: (c.name = `"${tableName}"."${c.name}"`) }));
};

export const createCondition = (
  obj: { [key: string]: any },
  tableName1: string,
  tableName2: string
): string => {
  let condition: string = "";

  Object.entries(obj).map(([x, y]) => {
    const left: string = `"${tableName1}"."${x.split(".")[1]}"`;
    const right: string = `"${tableName2}"."${y.split(".")[1]}"`;

    condition = `${left}=${right}`;
  });

  return condition;
};
