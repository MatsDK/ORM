export class BaseTable {
  target: string;

  constructor() {
    this.target = this.constructor.name;
  }

  findMany() {
    console.log("find many");
  }
}
