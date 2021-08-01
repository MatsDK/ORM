import { Bool, Float4, Int, Int2, Int8, Text } from "../../src/db_types";
import { Column } from "../../src/decorators/Column";
import { Table } from "../../src/decorators/Table";
import { BaseTable } from "../../src/table/BaseTable";

@Table()
export class Photo extends BaseTable {
  @Column()
  name: string;
}
