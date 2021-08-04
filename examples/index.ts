import "reflect-metadata";
import { Connection } from "../src/connection";
import { Photo } from "./schemas/Photo";
import { Topic } from "./schemas/Topic";
import { User } from "./schemas/User";

(async () => {
  const conn = new Connection({
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "postgres",
    database: "orm_db",
    tables: [User, Topic, Photo],
    synchronize: true,
    logQueries: true,
  });

  await conn.connect(() => {
    console.log(">> connected to db");
  });

  const { rows, err } = await User.findMany<User>();
  if (err) return console.log("ERROR: ", err);

  if (Array.isArray(rows)) {
    rows.forEach((r) => {
      console.log(r);
    });
  }
})();
