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

  const { err, rows } = await Photo.findMany<Photo>({
    where: { Keywords: Includes("text1") },
    returning: { userId: true, id: true, topics: true },
  });
  // const { rows, err } = await User.findMany<User>({
  //   where: { userName: ILike("b%") },
  //   returning: {
  //     photos: [
  //       {
  //         topics: true,
  //         id: true,
  //       },
  //     ],
  //     userName: true,
  //     id: true,
  //   },
  // });
  if (err) return console.log("ERROR: ", err);

  if (Array.isArray(rows)) {
    rows.forEach((r) => {
      console.log(r);
    });
  }
})();
