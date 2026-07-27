import "dotenv/config";
import sequelize from "../config/database.js";
import { migrateUserAuthColumns } from "./userAuth.migration.js";
import { migrateRefreshSessions } from "./refreshSession.migration.js";
import { migrateCommerceSupportTables } from "./commerceSupport.migration.js";
import { migrateProductCategories } from "./productCategory.migration.js";

try {
  await sequelize.authenticate();
  await migrateUserAuthColumns();
  await migrateProductCategories();
  await migrateRefreshSessions();
  await migrateCommerceSupportTables();
  console.log("Migration cơ sở dữ liệu hoàn tất");
} catch (error) {
  console.error("Migration cơ sở dữ liệu thất bại:", error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
