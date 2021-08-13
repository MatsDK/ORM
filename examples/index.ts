import "reflect-metadata";
import { Connection } from "../src/connection";
import {
  Between,
  Equal,
  ILike,
  In,
  Includes,
  IsNull,
  LessThan,
  LessThanOrEqual,
  Like,
  MoreThan,
  MoreThanOrEqual,
  Not,
} from "../src/query/operators/operators";
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

  // const { err, rows } = await Photo.findMany<Photo>({
  //   where: { id: 1 },
  //   returning: { userId: true, id: true, topics: true },
  //   order: { id: "asc" },
  // });
  const res = await User.insert<User>([
    { age: 21, userName: null },
    { userName: "test" },
  ]);

  if (res.err) return console.log("ERROR: ", res.err);

  // if (Array.isArray(rows)) {
  //   rows.forEach((r) => {
  //     console.log(r);
  //   });
  // }
})();
