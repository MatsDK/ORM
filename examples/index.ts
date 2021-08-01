import "reflect-metadata";
import { Connection } from "../src/connection";
import { getOrCreateOrmHandler } from "../src/lib/Global";
import { User } from "./schemas/User";

(async () => {
  const conn = new Connection({
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "postgres",
    database: "orm_db",
    tables: [User],
    synchronize: true,
    logQueries: true,
  });

  await conn.connect(() => {
    console.log(">> connected to db");
  });

  // User.findMany();

  console.log(getOrCreateOrmHandler().metaDataStore.relations);
})();
