import { Bool, Float4, Int, Int2, Int8, Text } from "../../src/db_types";
import { Column } from "../../src/decorators/Column";
import { Relation } from "../../src/decorators/Relation";
import { Table } from "../../src/decorators/Table";
import { Any } from "../../src/query/operators/operators";
import { BaseTable } from "../../src/table/BaseTable";
import { Topic } from "./Topic";

@Table({ name: "Photos" })
export class Photo extends BaseTable {
  @Column(() => Int, { nullable: true })
  id: number;

  @Column(() => Int, { nullable: true })
  userId: number;

  @Column(() => [Text], { name: "Keywords" })
  name: string[];

  @Relation(() => [Topic], { on: { "Photo.Keywords": [Any, "Topic.name"] } })
  topics: Topic[];
}
