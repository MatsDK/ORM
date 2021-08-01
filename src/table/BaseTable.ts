export class BaseTable {
  target: string;

  constructor() {
    this.target = this.constructor.name;
    console.log(this.constructor);
  }

  static findMany() {
    console.log("find many", this.name);
  }
}
