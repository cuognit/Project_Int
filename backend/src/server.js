import 'dotenv/config';
import { createServer } from 'node:http';
import app from './app.js';
import sequelize from './config/database.js';
import { User, Product, Order, OrderItem } from './models/index.js';
import { migrateUserAuthColumns } from './database/userAuth.migration.js';
import { migrateRefreshSessions } from './database/refreshSession.migration.js';
import { migrateCommerceSupportTables } from './database/commerceSupport.migration.js';
import { migrateProductCategories } from './database/productCategory.migration.js';
import { initializeNotificationGateway } from './socket/notification.gateway.js';
const port = process.env.PORT || 3000;

const startServer = async () => {
  await sequelize.authenticate();
  console.log('Kết nối cơ sở dữ liệu thành công');
  await migrateUserAuthColumns();
  await migrateProductCategories();
  await migrateRefreshSessions();
  await migrateCommerceSupportTables();
  await sequelize.sync();
  console.log('Đồng bộ hóa cơ sở dữ liệu thành công');
  const httpServer = createServer(app);
  initializeNotificationGateway(httpServer);
  httpServer.listen(port, () => console.log(`Backend đang chạy tại http://localhost:${port}`));
};

startServer().catch((error) => {
  console.error('Không thể khởi động backend:', error);
  process.exit(1);
});
