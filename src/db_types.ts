export type ColumnTypes =
  | "int4"
  | "int2"
  | "int8"
  | "bool"
  | "text"
  | "float4"
  | "float8"
  | "date";

// export const TypeMap: { [key: string]: ColumnTypes } = {
//   integer: "int",
//   text: "text",
//   boolean: "bool",
//   date: "date",
//   smallint: "int2",
//   bigint: "int8",
//   "double precision": "float",
//   real: "float4",
// };

export class TypeClass {
  type: ColumnTypes;
}

export class Int {
  type: ColumnTypes;
  constructor() {
    this.type = "int4";
  }
}

export class Int4 {
  type: ColumnTypes;
  constructor() {
    this.type = "int4";
  }
}

export class Int8 {
  type: ColumnTypes;
  constructor() {
    this.type = "int8";
  }
}

export class Int2 {
  type: ColumnTypes;
  constructor() {
    this.type = "int2";
  }
}

export class Bool {
  type: ColumnTypes;
  constructor() {
    this.type = "bool";
  }
}

export class Text {
  type: ColumnTypes;
  constructor() {
    this.type = "text";
  }
}

export class Float4 {
  type: ColumnTypes;
  constructor() {
    this.type = "float4";
  }
}

export class Float {
  type: ColumnTypes;
  constructor() {
    this.type = "float8";
  }
}

export class Float8 {
  type: ColumnTypes;
  constructor() {
    this.type = "float8";
  }
}

export class Date {
  type: ColumnTypes;
  constructor() {
    this.type = "date";
  }
}
