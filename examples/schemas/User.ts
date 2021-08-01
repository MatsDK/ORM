import { Bool, Float4, Int, Int2, Int8, Text } from "../../src/db_types";
import { Column } from "../../src/decorators/Column";
import { Relation } from "../../src/decorators/Relation";
import { Table } from "../../src/decorators/Table";
import { BaseTable } from "../../src/table/BaseTable";
import { Photo } from "./Photo";

@Table({ name: "User21" })
export class User extends BaseTable {
  @Column(() => Text, { nullable: false })
  userName: string;

  @Column(() => Int, { name: "ID", nullable: false })
  id: number;

  @Relation(() => [Photo], { name: "PHOTOS" })
  photo: Photo[];
}
