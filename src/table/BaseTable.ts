import { getOrCreateOrmHandler } from "../lib/Global";
import { FindReturnType } from "../types";

type ReturnCondition<T> =
  | {
      [P in keyof T]?: ReturnCondition<T[P]> | boolean;
    }
  | { [key: string]: boolean | any };

export interface FindManyOptions<Entity = any> {
  returning?: ReturnCondition<Entity>;
}

export class BaseTable {
  #target: string;

  constructor() {
    this.#target = this.constructor.name;
  }

  static async findMany<T extends BaseTable>(
    options?: FindManyOptions<T>
  ): Promise<FindReturnType<T>> {
    const tableName: string | undefined = (Array.from(
      getOrCreateOrmHandler().metaDataStore.tables
    ).find(([_, t]) => t.target === this.name) || [undefined])[0];

    if (!tableName) return { rows: undefined, err: "Table not found" };

    if (options?.returning)
      options.returning = formatReturning(options.returning);

    return await getOrCreateOrmHandler()
      .getOrCreateQueryRunner()
      .findMany({ tableName, tableTarget: this.name, options });
  }
}

const formatReturning = (returning: any): any => {
  if (returning)
    for (const key of Object.keys(returning)) {
      if (Array.isArray(returning[key]))
        returning[key] = formatReturning(returning[key][0]);
      else if (typeof returning[key] === "object")
        returning[key] = formatReturning(returning[key]);
    }

  return returning;
};
