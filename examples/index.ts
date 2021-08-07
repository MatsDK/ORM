import "reflect-metadata";
import { Connection } from "../src/connection";
import { Equal, IsNull } from "../src/query/operators";
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
    console.log("\n>> connected to db\n");
  });

  const { rows, err } = await User.findMany<User>({
    // where: { id: 1, photos: [{ topics: [{ id: 2 }] }] },
    where: { age: IsNull() },
    // limit: 2,
    returning: {
      photos: [
        {
          topics: true,
          id: true,
        },
      ],
      userName: true,
      id: true,
    },
  });
  if (err) return console.log("ERROR: ", err);

  if (Array.isArray(rows)) {
    rows.forEach((r) => {
      console.log(r);
    });
  }
})();
