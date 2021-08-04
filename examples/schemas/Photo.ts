import { Bool, Float4, Int, Int2, Int8, Text } from "../../src/db_types";
import { Column } from "../../src/decorators/Column";
import { PrimaryColumn } from "../../src/decorators/PrimaryColumns";
import { Relation } from "../../src/decorators/Relation";
import { Table } from "../../src/decorators/Table";
import { BaseTable } from "../../src/table/BaseTable";
import { Topic } from "./Topic";

@Table({ name: "Photo" })
export class Photo extends BaseTable {
  @Column(() => Int, { nullable: true })
  id: number;

  @Column(() => Int, { nullable: true })
  userId: number;

  @Column(() => [Text], { name: "Keywords" })
  name: string[];

  @Relation(() => [Topic], { on: { "Photo.id": "Topic.photoId" } })
  topics: Topic[];
}
