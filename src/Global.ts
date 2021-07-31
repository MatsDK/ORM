import { ORMHandler } from "./Handler";
import { GlobalType } from "./types";

export const Global: GlobalType = global as unknown as GlobalType;

export const getOrCreateOrmHandler = (): ORMHandler =>
  Global.ORM_HANDLER || (Global.ORM_HANDLER = new ORMHandler());
