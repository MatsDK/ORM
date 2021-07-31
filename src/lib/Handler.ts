import { Connection } from "../connection";
import { QueryRunner } from "../query/QueryRunner";
import { ColumnType, TableType } from "../types";

export class ORMHandler {
  metaDataStore: MetaDataStore = new MetaDataStore();
  connectionHandler: Connection | undefined = undefined;
  queryRunner: QueryRunner | undefined;

  setConnection(conn: Connection) {
    this.connectionHandler = conn;
  }

  getOrCreateQueryRunner() {
    return (
      this.queryRunner ||
      (this.queryRunner = new QueryRunner(this.connectionHandler?.conn))
    );
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

  getColumnsOfTable(table: TableType): ColumnType[] {
    return Array.from(this.columns)
      .filter(([_, c]) => c.target === table.target)
      .map(([_, c]) => c);
  }
}