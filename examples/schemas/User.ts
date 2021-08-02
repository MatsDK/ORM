import { Bool, Float4, Int, Int2, Int8, Text } from "../../src/db_types";
import { Column } from "../../src/decorators/Column";
import { PrimaryColumn } from "../../src/decorators/PrimaryColumns";
import { Relation } from "../../src/decorators/Relation";
import { Table } from "../../src/decorators/Table";
import { BaseTable } from "../../src/table/BaseTable";
import { Photo } from "./Photo";

@Table({ name: "User21" })
export class User extends BaseTable {
  @PrimaryColumn(() => Int, { name: "ID" })
  id: number;

  @Column(() => Text, { nullable: false })
  userName: string;

  @Relation(() => [Photo], {
    on: { "User21.ID": "PHOTO.ownerId" },
  })
  photos: Photo[];
}
