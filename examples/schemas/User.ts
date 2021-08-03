import { Bool, Float4, ID, Int, Int2, Int8, Text } from "../../src/db_types";
import { Column } from "../../src/decorators/Column";
import { PrimaryColumn } from "../../src/decorators/PrimaryColumns";
import { Relation } from "../../src/decorators/Relation";
import { Table } from "../../src/decorators/Table";
import { BaseTable } from "../../src/table/BaseTable";
import { Photo } from "./Photo";

@Table({ name: "User21" })
export class User extends BaseTable {
  @PrimaryColumn(() => ID, { name: "id" })
  id: number;

  @Column(() => Text, { nullable: false, default: "usernameDefault" })
  userName: string;

  @Relation(() => [Photo], {
    name: "photos",
    on: { "User21.id": "PHOTO.ownerId" },
  })
  photos21: Photo[];
}
