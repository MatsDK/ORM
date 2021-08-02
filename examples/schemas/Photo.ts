import { Bool, Float4, Int, Int2, Int8, Text } from "../../src/db_types";
import { Column } from "../../src/decorators/Column";
import { PrimaryColumn } from "../../src/decorators/PrimaryColumns";
import { Table } from "../../src/decorators/Table";
import { BaseTable } from "../../src/table/BaseTable";

@Table({ name: "PHOTO" })
export class Photo extends BaseTable {
  @PrimaryColumn(() => Int)
  id: number;

  @Column(() => Int)
  ownerId: number;

  @Column(() => [Text], { name: "Keywords" })
  name: string[];
}
