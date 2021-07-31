import { getOrCreateOrmHandler } from "../lib/Global";
import { TableOptions } from "../helpers/decoratorsTypes";

export const Table = (options: TableOptions = {}): ClassDecorator => {
  return (target) => {
    getOrCreateOrmHandler().metaDataStore.addTable({
      target: target.name,
      name: typeof options?.name === "string" ? options.name : target.name,
      options,
    });
  };
};
