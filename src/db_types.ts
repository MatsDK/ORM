export type ColumnTypes =
  | "int"
  | "int4"
  | "int2"
  | "int8"
  | "bool"
  | "boolean"
  | "text"
  | "float8"
  | "float4"
  | "date";

export class TypeClass {
  type: ColumnTypes;
}

export class Int {
  type: ColumnTypes;
  constructor() {
    this.type = "int";
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

export class Float8 {
  type: ColumnTypes;
  constructor() {
    this.type = "float8";
  }
}

export class Float4 {
  type: ColumnTypes;
  constructor() {
    this.type = "float4";
  }
}

export class Date {
  type: ColumnTypes;
  constructor() {
    this.type = "date";
  }
}
