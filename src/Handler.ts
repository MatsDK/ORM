import { Connection } from "./connection";
import { ColumnType, TableType } from "./types";

export class ORMHandler {
  metaDataStore: MetaDataStore = new MetaDataStore();
  connectionHandler: Connection | undefined = undefined;

  setConnection(conn: Connection) {
    this.connectionHandler = conn;
  }
}

class MetaDataStore {
  tables: Map<string, TableType> = new Map();
  columns: Map<string, ColumnType> = new Map();

  addTable(table: TableType) {
    this.tables.set(table.name, table);
  }

  addColumn(column: ColumnType) {
    this.columns.set(column.name, column);
  }
}
