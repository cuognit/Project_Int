import "dotenv/config";
import { Sequelize } from "sequelize";

const dbUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/dummy_db";

const sequelize = new Sequelize(dbUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

export default sequelize;
