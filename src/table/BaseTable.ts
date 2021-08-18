import { getOrCreateOrmHandler } from "../lib/Global";
import {
  DeleteOptions,
  FindManyOptions,
  FindReturnType,
  InsertOptions,
  InsertValues,
  UpdateOptions,
} from "../types";

export class BaseTable {
  static async findMany<T extends BaseTable>(
    options?: FindManyOptions<T>
  ): Promise<FindReturnType<T>> {
    const table = getOrCreateOrmHandler().metaDataStore.getTableByTarget(
      this.name
    );

    if (!table) return { rows: undefined, err: "Table not found" };

    if (options?.returning)
      options.returning = formatReturning(options.returning);

    return await getOrCreateOrmHandler()
      .getOrCreateQueryRunner()
      .findMany({ tableName: table.name, tableTarget: this.name, options });
  }

  static async findOne<T extends BaseTable>(
    options?: FindManyOptions<T>
  ): Promise<FindReturnType<T>> {
    const table = getOrCreateOrmHandler().metaDataStore.getTableByTarget(
      this.name
    );

    if (!table) return { rows: undefined, err: "Table not found" };

    if (options?.returning)
      options.returning = formatReturning(options.returning);

    if (options) options.limit = 1;

    return await getOrCreateOrmHandler()
      .getOrCreateQueryRunner()
      .findMany({ tableName: table.name, tableTarget: this.name, options });
  }

  static async insert<T extends BaseTable>(
    values?: InsertValues<T>,
    insertOptions: InsertOptions<T> = {}
  ): Promise<{ err?: string; rows?: any[] }> {
    const table = getOrCreateOrmHandler().metaDataStore.getTableByTarget(
      this.name
    );

    if (!table) return { err: "Table not found" };

    return await getOrCreateOrmHandler()
      .getOrCreateQueryRunner()
      .insert({
        values: values || [],
        table,
        options: insertOptions || {},
      });
  }

  static async delete<T extends BaseTable>(
    deleteOptions: DeleteOptions<T> = {}
  ): Promise<{ err?: string; rowCount?: number }> {
    const table = getOrCreateOrmHandler().metaDataStore.getTableByTarget(
      this.name
    );

    if (!table) return { err: "Tabl not found" };

    return await getOrCreateOrmHandler()
      .getOrCreateQueryRunner()
      .delete({ options: deleteOptions, tableName: table.name });
  }

  static async update<T extends BaseTable>(
    updateOptions: UpdateOptions<T>
  ): Promise<{ err?: string; rowCount?: number }> {
    const table = getOrCreateOrmHandler().metaDataStore.getTableByTarget(
      this.name
    );
    if (!table) return { err: "Table not found" };

    if (!updateOptions?.set || !Object.keys(updateOptions.set).length)
      return {};

    return await getOrCreateOrmHandler().getOrCreateQueryRunner().update({
      options: updateOptions,
      table,
    });
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
