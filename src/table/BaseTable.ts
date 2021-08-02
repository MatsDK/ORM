import { getOrCreateOrmHandler } from "../lib/Global";
import { FindReturnType } from "../types";

export class BaseTable {
  target: string;

  constructor() {
    this.target = this.constructor.name;
    // console.log(this.constructor);
  }

  static async findMany(): Promise<FindReturnType> {
    const tableName: string | undefined = (Array.from(
      getOrCreateOrmHandler().metaDataStore.tables
    ).find(([_, t]) => t.target === this.name) || [undefined])[0];

    if (!tableName) return { rows: undefined, err: "Table not found" };

    return await getOrCreateOrmHandler()
      .getOrCreateQueryRunner()
      .findMany({ tableName, tableTarget: this.name });
  }
}
