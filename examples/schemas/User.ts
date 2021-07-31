import { Bool, Float4, Int, Int2, Int8 } from "../../src/db_types";
import { Column } from "../../src/decorators/Column";
import { Table } from "../../src/decorators/Table";
import { BaseTable } from "../../src/table/BaseTable";

@Table({ name: "User21" })
export class User extends BaseTable {
  @Column({ nullable: true })
  name: string;

  @Column(() => Int, { name: "ID" })
  id: number;

  @Column(() => Bool)
  verified: boolean;

  @Column({ nullable: true })
  lastName: string;
}
