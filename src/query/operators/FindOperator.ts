import { AnyValue } from "../../types";

export class FindOperator {
  name: string;
  raw: AnyValue | AnyValue[];

  prop?: string;
  thisTableProp?: string;

  constructor(
    name: string,
    raw: AnyValue | AnyValue[],
    prop?: string,
    thisTableProp?: string
  ) {
    this.name = name;
    this.raw = raw;
    this.prop = prop;
    this.thisTableProp = thisTableProp;
  }
}
