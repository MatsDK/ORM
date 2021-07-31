import { getOrCreateOrmHandler } from "../lib/Global";
import { Client, QueryResult } from "pg";
import { QueryBuilder } from "../query/QueryBuilder";
import { synchronize } from "./synchronize";

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
    const { err } = await synchronize();
    if (err) console.log("ERROR: ", err);
  }
}
