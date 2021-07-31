import { Bool, Float4, Int, Int2, Int8 } from "../db_types";
import { Column } from "../decorators/Column";
import { Table } from "../decorators/Table";
import { BaseTable } from "../table/BaseTable";

@Table({ name: "User21" })
export class User extends BaseTable {
  @Column({ nullable: true })
  name: string;

  @Column((returnType) => Int, { name: "ID" })
  id: number;

  @Column({ name: "verified", nullable: false })
  v: boolean;

  @Column({ nullable: true })
  lastName: string;
}
