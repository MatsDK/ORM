import "reflect-metadata";
import { Connection } from "../src/connection";
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
  });

  await conn.connect(() => {
    console.log(">> connected to db");
  });

  // const newUser: User = new conn.tables["User21"]();

  // console.log(getOrCreateOrmHandler().connectionHandler);
})();
