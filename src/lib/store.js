const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function isoDateValue(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function calculateRentalDays(startDate, endDate) {
  const difference = isoDateValue(endDate) - isoDateValue(startDate);
  return Math.max(1, Math.floor(difference / ONE_DAY_MS) + 1);
}

function hasDateOverlap(startA, endA, startB, endB) {
  return (
    isoDateValue(startA) <= isoDateValue(endB) &&
    isoDateValue(startB) <= isoDateValue(endA)
  );
}

function getDefaultData() {
  const now = new Date().toISOString();

  const users = [
    {
      id: "user_admin",
      name: "DriveMint એડમિન",
      email: "admin@drivemint.com",
      phone: "9999999999",
      city: "Delhi",
      role: "admin",
      active: true,
      passwordHash: bcrypt.hashSync("admin123", 10),
      createdAt: now,
    },
    {
      id: "user_demo",
      name: "આરવ મહેતા",
      email: "aarav@example.com",
      phone: "9876543210",
      city: "Bengaluru",
      role: "user",
      active: true,
      passwordHash: bcrypt.hashSync("user123", 10),
      createdAt: now,
    },
  ];

  return {
    users,
    cars,
    bookings,
    apiTokens: [],
  };
}

function normalizeData(data) {
  if (!Array.isArray(data.users)) {
    data.users = [];
  }

  if (!Array.isArray(data.cars)) {
    data.cars = [];
  }

  if (!Array.isArray(data.bookings)) {
    data.bookings = [];
  }

  if (!Array.isArray(data.apiTokens)) {
    data.apiTokens = [];
  }

  return data;
}

function initializeStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (fs.existsSync(DATA_FILE)) {
    return;
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(getDefaultData(), null, 2));
}

function readData() {
  initializeStore();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return normalizeData(JSON.parse(raw));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(normalizeData(data), null, 2));
}

function getCities(cars) {
  return [...new Set(cars.map((car) => car.city))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function decorateBookings(bookings, cars, users) {
  return bookings.map((booking) => {
    const car = cars.find((item) => item.id === booking.carId);
    const user = users.find((item) => item.id === booking.userId);

    return {
      ...booking,
      car,
      user,
      displayCar: car || booking.carSnapshot,
    };
  });
}

module.exports = {
  calculateRentalDays,
  createId,
  decorateBookings,
  getCities,
  hasDateOverlap,
  initializeStore,
  normalizeData,
  readData,
  writeData,
};
