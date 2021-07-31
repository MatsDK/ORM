import { getOrCreateOrmHandler } from "../lib/Global";
import { Client, QueryResult } from "pg";
import { QueryBuilder } from "../query/QueryBuilder";

interface ConnectionOptions extends ConnData {
  username: string;
}

interface ConnData {
  tables: Function[];
  synchronize: boolean;
  host: string;
  port: number;
  password: string;
  database: string;
}

type ConnObject = ConnData & { user: string };

export type QueryRunnerResult =
  | { err: string; rows: undefined }
  | ({ err?: string } & QueryResult<any>);

export class Connection {
  tables: { [key: string]: any } = {};
  connData: ConnObject;
  conn: Client;

  constructor({ tables, ...rest }: ConnectionOptions) {
    const { metaDataStore, setConnection } = getOrCreateOrmHandler();

    for (const table of tables) {
      const { name } = (Array.from(metaDataStore.tables).find(
        ([_, t]) => t.target === table.name
      ) || ["", {}])[1];

      if (name) this.tables[name] = table;
    }

    const { username, ...ConnData } = rest;
    this.connData = { user: username, tables, ...ConnData };

    getOrCreateOrmHandler().setConnection(this);
  }

  connect(cb?: () => void) {
    return new Promise((res, rej) => {
      const { database, host, port, user, password } = this.connData,
        c = new Client({ database, host, port, user, password });

      c.connect((err) => {
        if (err) rej(err);

        this.conn = c;
        getOrCreateOrmHandler().setConnection(this);

        if (this.connData.synchronize) this.#synchronize();

        if (cb) cb();
        res("Connected to database");
      });
    });
  }

  async #synchronize() {
    const handler = getOrCreateOrmHandler();
    const { metaDataStore } = handler;

    const { err, rows }: QueryRunnerResult = await handler
      .getOrCreateQueryRunner()
      .getTablesInDatabase();

    if (err) return console.log("err", err);
    if (!rows) return console.log("Rows not found");

    // Loop over tables and if table exists in database check if colums match
    // else create table in database
    for (const [tableName, tableConfig] of metaDataStore.tables.entries()) {
      if (rows.find((r) => r.table_name === tableName)) {
        console.log("Check if table has changed", tableName);
      } else {
        const columns = handler.metaDataStore.getColumnsOfTable(tableConfig);

        const { err } = await handler
          .getOrCreateQueryRunner()
          .createTableInDatabase(tableConfig, columns);

        if (err) console.log("ERROR: ", err);
      }
    }

    // if table name exists in database but not declared anymore remove table
    for (const { table_name } of rows) {
      if (
        !Array.from(metaDataStore.tables).find(
          ([_, t]) => t.name === table_name
        )
      ) {
        const { err } = await handler
          .getOrCreateQueryRunner()
          .dropTableInDatabase(table_name);

        if (err) console.log("ERROR: ", err);
      }
    }
  }
}
