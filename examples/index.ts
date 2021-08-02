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
    logQueries: true,
  });

  await conn.connect(() => {
    console.log(">> connected to db");
  });

  const { rows, err } = await User.findMany();
  if (err) return console.log("ERROR: ", err);

  rows?.forEach((r) => console.log(r));
})();
