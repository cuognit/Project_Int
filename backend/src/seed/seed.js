import "dotenv/config";
import { faker } from "@faker-js/faker";

import sequelize from "../config/database.js";
import {
  User,
  Product,
  Order,
  OrderItem,
} from "../models/index.js";

// =========================================================
// CẤU HÌNH
// =========================================================

const TOTAL_USERS = 50;
const TOTAL_PRODUCTS = 100;
const TOTAL_ORDERS = 600;

const FAMILY_NAMES = [
  "Nguyễn",
  "Trần",
  "Lê",
  "Phạm",
  "Hoàng",
  "Phan",
  "Vũ",
  "Võ",
  "Đặng",
  "Bùi",
  "Đỗ",
  "Hồ",
  "Ngô",
  "Dương",
  "Lý",
];

const MIDDLE_NAMES = [
  "Văn",
  "Thị",
  "Minh",
  "Hoàng",
  "Quốc",
  "Đức",
  "Ngọc",
  "Thanh",
  "Thu",
  "Hải",
  "Quang",
  "Gia",
  "Xuân",
];

const GIVEN_NAMES = [
  "Anh",
  "Bảo",
  "Nam",
  "Trang",
  "Hương",
  "Tuấn",
  "Linh",
  "Huy",
  "Phương",
  "Long",
  "Yến",
  "Tùng",
  "Mai",
  "Khang",
  "Đức",
  "Dũng",
  "Thảo",
  "Hiếu",
  "Hà",
  "Quỳnh",
  "Cường",
  "Sơn",
  "Thành",
  "Hạnh",
  "Nhung",
];

const STREETS = [
  "Nguyễn Trãi",
  "Trần Duy Hưng",
  "Nguyễn Xiển",
  "Hồ Tùng Mậu",
  "Thái Hà",
  "Giải Phóng",
  "Lê Văn Lương",
  "Phạm Văn Đồng",
  "Nguyễn Chí Thanh",
  "Quang Trung",
  "Xuân Thủy",
  "Kim Mã",
  "Nguyễn Khang",
  "Láng Hạ",
  "Tố Hữu",
  "Nguyễn Văn Cừ",
  "Minh Khai",
  "Tây Sơn",
  "Trần Phú",
  "Hoàng Quốc Việt",
];

const DISTRICTS = [
  "Thanh Xuân",
  "Cầu Giấy",
  "Nam Từ Liêm",
  "Đống Đa",
  "Hai Bà Trưng",
  "Bắc Từ Liêm",
  "Hà Đông",
  "Ba Đình",
  "Long Biên",
  "Hoàng Mai",
];

const PRODUCT_BASES = [
  {
    name: "Chuột không dây Logitech M331",
    sku: "LOG-M331",
    price: 329_000,
  },
  {
    name: "Bàn phím cơ DareU EK87",
    sku: "DAR-EK87",
    price: 649_000,
  },
  {
    name: "Tai nghe Bluetooth Baseus WM02",
    sku: "BAS-WM02",
    price: 399_000,
  },
  {
    name: "Cáp sạc Type-C Baseus 100W",
    sku: "BAS-C100",
    price: 149_000,
  },
  {
    name: "Củ sạc nhanh Anker Nano",
    sku: "ANK-NANO",
    price: 349_000,
  },
  {
    name: "Pin dự phòng Xiaomi",
    sku: "XMI-PB",
    price: 469_000,
  },
  {
    name: "Webcam Logitech C270 HD",
    sku: "LOG-C270",
    price: 589_000,
  },
  {
    name: "Loa Bluetooth JBL Go",
    sku: "JBL-GO",
    price: 899_000,
  },
  {
    name: "USB SanDisk Ultra Flair",
    sku: "SDK-USB",
    price: 189_000,
  },
  {
    name: "Ổ cứng SSD Samsung 870 EVO",
    sku: "SSG-870",
    price: 1_150_000,
  },
  {
    name: "Ổ cứng SSD Kingston NV2",
    sku: "KST-NV2",
    price: 1_490_000,
  },
  {
    name: "RAM Kingston Fury DDR4",
    sku: "KST-FURY",
    price: 890_000,
  },
  {
    name: "Màn hình LG IPS",
    sku: "LG-MON",
    price: 2_490_000,
  },
  {
    name: "Giá đỡ laptop nhôm",
    sku: "PK-LAP",
    price: 279_000,
  },
  {
    name: "Đế tản nhiệt laptop CoolCold",
    sku: "CLC-FAN",
    price: 389_000,
  },
  {
    name: "Hub USB Type-C Ugreen",
    sku: "UGR-HUB",
    price: 699_000,
  },
  {
    name: "Camera IP Xiaomi",
    sku: "XMI-CAM",
    price: 799_000,
  },
  {
    name: "Router WiFi TP-Link Archer",
    sku: "TPL-ROUTER",
    price: 649_000,
  },
  {
    name: "Đèn bàn LED Xiaomi",
    sku: "XMI-LAMP",
    price: 549_000,
  },
  {
    name: "Ghế công thái học Sihoo",
    sku: "SIH-CHAIR",
    price: 3_890_000,
  },
];

const PRODUCT_VARIANTS = [
  {
    label: "Đen",
    priceRate: 100,
  },
  {
    label: "Trắng",
    priceRate: 102,
  },
  {
    label: "Xám",
    priceRate: 105,
  },
  {
    label: "Phiên bản Plus",
    priceRate: 112,
  },
  {
    label: "Phiên bản Pro",
    priceRate: 120,
  },
];

const ORDER_NOTES = [
  "Vui lòng gọi trước khi giao.",
  "Giao hàng trong giờ hành chính.",
  "Có thể giao hàng vào buổi tối.",
  "Để hàng tại quầy lễ tân giúp tôi.",
  "Kiểm tra sản phẩm trước khi nhận.",
  "Giao hàng sau 17 giờ.",
  "Nếu không liên lạc được vui lòng nhắn tin.",
];

// =========================================================
// HÀM TẠO DỮ LIỆU
// =========================================================

function generateVietnamesePhone(index) {
  const prefixes = [
    "032",
    "033",
    "034",
    "035",
    "036",
    "037",
    "038",
    "039",
    "070",
    "076",
    "077",
    "078",
    "079",
    "081",
    "082",
    "083",
    "084",
    "085",
    "086",
    "088",
  ];

  const prefix = prefixes[index % prefixes.length];

  const suffix = String(
    1_000_000 + index * 7_919
  ).slice(-7);

  return `${prefix}${suffix}`;
}

function generateOrderCode(index) {
  return `ORD-${String(index).padStart(6, "0")}`;
}

function getNumericPrice(product) {
  return Number(product.price);
}

function generateUsers(count) {
  const users = [];
  const usedNames = new Set();

  while (users.length < count) {
    const fullName = [
      faker.helpers.arrayElement(FAMILY_NAMES),
      faker.helpers.arrayElement(MIDDLE_NAMES),
      faker.helpers.arrayElement(GIVEN_NAMES),
    ].join(" ");

    if (usedNames.has(fullName)) {
      continue;
    }

    usedNames.add(fullName);

    const index = users.length;

    const houseNumber = faker.number.int({
      min: 1,
      max: 250,
    });

    const street =
      faker.helpers.arrayElement(STREETS);

    const district =
      faker.helpers.arrayElement(DISTRICTS);

    users.push({
      fullName,

      email:
        `customer${String(index + 1).padStart(3, "0")}` +
        "@example.com",

      phone: generateVietnamesePhone(index),

      address:
        `${houseNumber} ${street}, ` +
        `${district}, Hà Nội`,
    });
  }

  return users;
}

function generateProducts() {
  const products = [];

  PRODUCT_BASES.forEach((baseProduct, baseIndex) => {
    PRODUCT_VARIANTS.forEach(
      (variant, variantIndex) => {
        const productIndex = products.length + 1;

        const price =
          Math.round(
            (
              baseProduct.price *
              variant.priceRate /
              100
            ) / 1000
          ) * 1000;

        products.push({
          name:
            `${baseProduct.name} - ${variant.label}`,

          sku:
            `${baseProduct.sku}-` +
            `${String(variantIndex + 1).padStart(2, "0")}`,

          description:
            `${baseProduct.name}, màu/phiên bản ` +
            `${variant.label.toLowerCase()}. ` +
            "Sản phẩm chính hãng, được kiểm tra trước " +
            "khi giao và hỗ trợ đổi trả theo chính sách.",

          price,

          stock: faker.number.int({
            min: baseIndex < 5 ? 30 : 5,
            max: baseIndex < 5 ? 180 : 100,
          }),

          imageUrl:
            `https://picsum.photos/seed/` +
            `product-${productIndex}/600/600`,

          /*
           * Khoảng 95% sản phẩm đang bán.
           */
          isActive:
            faker.number.int({
              min: 1,
              max: 100,
            }) <= 95,
        });
      }
    );
  });

  return products.slice(0, TOTAL_PRODUCTS);
}

/**
 * Chọn phần tử theo trọng số.
 */
function weightedElement(items, weights) {
  const totalWeight = weights.reduce(
    (total, weight) => total + weight,
    0
  );

  let random = faker.number.int({
    min: 1,
    max: totalWeight,
  });

  for (
    let index = 0;
    index < items.length;
    index += 1
  ) {
    random -= weights[index];

    if (random <= 0) {
      return items[index];
    }
  }

  return items[items.length - 1];
}

function generateUserWeights(userCount) {
  return Array.from(
    { length: userCount },
    (_, index) => {
      /*
       * Hai người cuối chưa có đơn.
       */
      if (index >= userCount - 2) {
        return 0;
      }

      /*
       * Một số khách hàng VIP mua nhiều.
       */
      if (index === 0) return 30;
      if (index === 1) return 24;
      if (index === 2) return 20;
      if (index === 3) return 16;
      if (index === 4) return 13;

      if (index < 10) return 8;
      if (index < 20) return 5;
      if (index < 35) return 3;

      return 1;
    }
  );
}

function generateProductWeights(productCount) {
  return Array.from(
    { length: productCount },
    (_, index) => {
      /*
       * Nhóm sản phẩm đầu có doanh số cao hơn.
       */
      if (index < 10) return 15;
      if (index < 30) return 8;
      if (index < 60) return 4;

      return 2;
    }
  );
}

function selectUniqueProducts(
  products,
  numberOfProducts
) {
  const selectedProducts = [];
  const availableProducts = [...products];

  const availableWeights =
    generateProductWeights(products.length);

  while (
    selectedProducts.length < numberOfProducts &&
    availableProducts.length > 0
  ) {
    const product = weightedElement(
      availableProducts,
      availableWeights
    );

    const productIndex =
      availableProducts.findIndex(
        (item) => item.id === product.id
      );

    selectedProducts.push(product);

    availableProducts.splice(productIndex, 1);
    availableWeights.splice(productIndex, 1);
  }

  return selectedProducts;
}

/**
 * Dữ liệu gần hiện tại xuất hiện nhiều hơn.
 */
function generateOrderDate() {
  const now = new Date();

  const startDate = new Date(
    "2026-01-01T00:00:00.000Z"
  );

  const progress = Math.sqrt(
    faker.number.int({
      min: 0,
      max: 10_000,
    }) / 10_000
  );

  const timestamp =
    startDate.getTime() +
    progress *
      (now.getTime() - startDate.getTime());

  const createdAt = new Date(timestamp);

  /*
   * Đơn thường được đặt từ 8h đến 22h.
   */
  createdAt.setHours(
    faker.number.int({
      min: 8,
      max: 21,
    }),
    faker.number.int({
      min: 0,
      max: 59,
    }),
    faker.number.int({
      min: 0,
      max: 59,
    }),
    0
  );

  return createdAt > now
    ? now
    : createdAt;
}

/**
 * Trạng thái phụ thuộc vào thời gian tạo đơn.
 */
function generateOrderStatus(createdAt) {
  const now = new Date();

  const ageInDays =
    (now.getTime() - createdAt.getTime()) /
    (1000 * 60 * 60 * 24);

  const random = faker.number.int({
    min: 1,
    max: 100,
  });

  /*
   * Đơn trong ngày.
   */
  if (ageInDays < 1) {
    if (random <= 55) return "PENDING";
    if (random <= 85) return "CONFIRMED";
    if (random <= 95) return "SHIPPING";

    return "CANCELLED";
  }

  /*
   * Đơn từ 1 đến 3 ngày.
   */
  if (ageInDays < 3) {
    if (random <= 15) return "PENDING";
    if (random <= 45) return "CONFIRMED";
    if (random <= 85) return "SHIPPING";
    if (random <= 94) return "COMPLETED";

    return "CANCELLED";
  }

  /*
   * Đơn từ 3 đến 7 ngày.
   */
  if (ageInDays < 7) {
    if (random <= 5) return "PENDING";
    if (random <= 15) return "CONFIRMED";
    if (random <= 40) return "SHIPPING";
    if (random <= 92) return "COMPLETED";

    return "CANCELLED";
  }

  /*
   * Đơn cũ chủ yếu hoàn thành.
   */
  if (random <= 92) {
    return "COMPLETED";
  }

  return "CANCELLED";
}

function generateQuantity(price) {
  const random = faker.number.int({
    min: 1,
    max: 100,
  });

  /*
   * Sản phẩm đắt thường chỉ mua một chiếc.
   */
  if (price >= 2_000_000) {
    return random <= 95 ? 1 : 2;
  }

  if (price >= 500_000) {
    if (random <= 82) return 1;
    if (random <= 97) return 2;

    return 3;
  }

  if (random <= 60) return 1;
  if (random <= 88) return 2;
  if (random <= 97) return 3;

  return faker.number.int({
    min: 4,
    max: 5,
  });
}

function generateShippingFee(subtotal) {
  /*
   * Miễn phí vận chuyển từ 1 triệu.
   */
  if (subtotal >= 1_000_000) {
    return 0;
  }

  if (subtotal >= 500_000) {
    return faker.helpers.arrayElement([
      0,
      20_000,
      25_000,
      30_000,
    ]);
  }

  return faker.helpers.arrayElement([
    20_000,
    25_000,
    30_000,
    35_000,
    40_000,
  ]);
}

function generateNote() {
  /*
   * Khoảng 25% đơn có ghi chú.
   */
  const hasNote =
    faker.number.int({
      min: 1,
      max: 100,
    }) <= 25;

  if (!hasNote) {
    return null;
  }

  return faker.helpers.arrayElement(
    ORDER_NOTES
  );
}

// =========================================================
// SEED DATABASE
// =========================================================

async function seedDatabase() {
  let transaction;

  try {
    /*
     * Seed cố định giúp dữ liệu giống nhau
     * giữa các lần chạy.
     */
    faker.seed(2026);

    await sequelize.authenticate();

    console.log("Đã kết nối PostgreSQL");

    /*
     * CẢNH BÁO:
     * force: true sẽ xóa toàn bộ bảng và dữ liệu.
     * Chỉ chạy trong môi trường development/demo.
     */
    await sequelize.sync({
      force: true,
    });

    transaction =
      await sequelize.transaction();

    // =====================================================
    // 1. TẠO 50 USERS
    // =====================================================

    const userData =
      generateUsers(TOTAL_USERS);

    const users = await User.bulkCreate(
      userData,
      {
        transaction,
        returning: true,
      }
    );

    console.log(
      `Đã tạo ${users.length} người dùng`
    );

    // =====================================================
    // 2. TẠO 100 PRODUCTS
    // =====================================================

    const productData = generateProducts();

    const products =
      await Product.bulkCreate(
        productData,
        {
          transaction,
          returning: true,
        }
      );

    console.log(
      `Đã tạo ${products.length} sản phẩm`
    );

    // =====================================================
    // 3. TẠO 600 ORDERS VÀ ORDER ITEMS
    // =====================================================

    const userOrderWeights =
      generateUserWeights(users.length);

    let totalOrderItems = 0;

    for (
      let orderIndex = 1;
      orderIndex <= TOTAL_ORDERS;
      orderIndex += 1
    ) {
      const user = weightedElement(
        users,
        userOrderWeights
      );

      const createdAt = generateOrderDate();

      const status =
        generateOrderStatus(createdAt);

      /*
       * Phần lớn đơn có 1 hoặc 2 sản phẩm.
       */
      const numberOfProducts =
        weightedElement(
          [1, 2, 3, 4, 5],
          [42, 32, 16, 7, 3]
        );

      const selectedProducts =
        selectUniqueProducts(
          products,
          numberOfProducts
        );

      const itemData =
        selectedProducts.map((product) => {
          const unitPrice =
            getNumericPrice(product);

          const quantity =
            generateQuantity(unitPrice);

          const totalPrice =
            unitPrice * quantity;

          return {
            product,
            quantity,
            unitPrice,
            totalPrice,
          };
        });

      const subtotal = itemData.reduce(
        (total, item) =>
          total + item.totalPrice,
        0
      );

      const shippingFee =
        generateShippingFee(subtotal);

      const totalAmount =
        subtotal + shippingFee;

      const order = await Order.create(
        {
          orderCode:
            generateOrderCode(orderIndex),

          userId: user.id,

          status,

          /*
           * Snapshot thông tin giao hàng.
           */
          shippingName: user.fullName,
          shippingPhone: user.phone,
          shippingAddress: user.address,

          subtotal,
          shippingFee,
          totalAmount,

          note: generateNote(),

          createdAt,
          updatedAt: createdAt,
        },
        {
          transaction,
        }
      );

      const orderItems = itemData.map(
        (item) => ({
          orderId: order.id,
          productId: item.product.id,

          /*
           * Snapshot thông tin sản phẩm.
           */
          productName:
            item.product.name,

          productSku:
            item.product.sku,

          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,

          createdAt,
          updatedAt: createdAt,
        })
      );

      await OrderItem.bulkCreate(
        orderItems,
        {
          transaction,
        }
      );

      totalOrderItems +=
        orderItems.length;
    }

    await transaction.commit();

    console.log("================================");
    console.log("Seed database thành công");
    console.log(`Users: ${users.length}`);
    console.log("Users dự kiến có đơn: 48");
    console.log("Users chưa có đơn: 2");
    console.log(
      `Products: ${products.length}`
    );
    console.log(`Orders: ${TOTAL_ORDERS}`);
    console.log(
      `Order items: ${totalOrderItems}`
    );
    console.log("================================");
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error(
      "Seed database thất bại:"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seedDatabase();