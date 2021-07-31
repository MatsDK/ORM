import { Bool, Float4, Float8, Int, Int2, Int8 } from "../db_types";
import { Column } from "../decorators/Column";
import { Table } from "../decorators/Table";
import { BaseTable } from "../table/BaseTable";

@Table({ name: "User21" })
export class User extends BaseTable {
  @Column()
  name: string;

  @Column((returnType) => ["int"], { name: "ID" })
  id: number;
}
