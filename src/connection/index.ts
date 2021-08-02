import { getOrCreateOrmHandler } from "../lib/Global";
import { Client, QueryResult } from "pg";
import { synchronize } from "./synchronize";

interface ConnectionOptions extends ConnData {
  username: string;
}

interface ConnData {
  logQueries?: boolean;
  synchronize?: boolean;
  tables: Function[];
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
  #conn: Client;

  constructor({ tables, logQueries = false, ...rest }: ConnectionOptions) {
    const { metaDataStore, setConnection } = getOrCreateOrmHandler();

    for (const table of tables) {
      const { name } = (Array.from(metaDataStore.tables).find(
        ([_, t]) => t.target === table.name
      ) || ["", {}])[1];

      if (name) this.tables[name] = table;
    }

    const { username, synchronize = false, ...ConnData } = rest;
    this.connData = {
      user: username,
      synchronize,
      tables,
      logQueries,
      ...ConnData,
    };

    getOrCreateOrmHandler().setConnection(this);
  }

  getConn() {
    return this.#conn;
  }

  async connect(cb?: () => void) {
    return new Promise(async (res, rej) => {
      const { database, host, port, user, password } = this.connData,
        c = new Client({ database, host, port, user, password });

      c.connect(async (err) => {
        if (err) rej(err);

        this.#conn = c;
        getOrCreateOrmHandler().setConnection(this);

        if (this.connData.synchronize) await this.#synchronize();

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
