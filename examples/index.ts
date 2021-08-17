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

  // const { rows, err } = await User.findMany({ where: {} });

  // const { err, rows } = await User.insert<User>(
  //   { age: 22, userName: null },
  //   { returning: { id: true } }
  // );

  // if (err) return console.log("ERROR: ", err);

  const { err } = await User.delete<User>({
    where: { id: In([33, 37]) },
    limit: 1,
    skip: 1,
  });

  // console.log(rows);
  // if (Array.isArray(rows)) {
  //   rows.forEach((r) => {
  //     console.log(r);
  //   });
  // }
})();
