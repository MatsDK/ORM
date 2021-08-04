import { Bool, Float4, ID, Int, Int2, Int8, Text } from "../../src/db_types";
import { Column } from "../../src/decorators/Column";
import { PrimaryColumn } from "../../src/decorators/PrimaryColumns";
import { Relation } from "../../src/decorators/Relation";
import { Table } from "../../src/decorators/Table";
import { BaseTable } from "../../src/table/BaseTable";

@Table()
export class Topic extends BaseTable {
  @PrimaryColumn(() => ID)
  id: number;

  @Column(() => Text)
  name: string[];

  @Column(() => Int)
  photoId: number;
}
