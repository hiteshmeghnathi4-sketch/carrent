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

  const cars = [
    {
      id: "car_compass",
      name: "Compass Trailhawk",
      brand: "Jeep",
      city: "Delhi",
      category: "SUV",
      transmission: "Automatic",
      fuel: "Diesel",
      seats: 5,
      pricePerDay: 5200,
      image:
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
      available: true,
      featured: true,
      description:
        "A premium SUV tuned for long highway drives, weekend escapes, and confident city cruising.",
      createdAt: now,
    },
    {
      id: "car_city",
      name: "City ZX",
      brand: "Honda",
      city: "Mumbai",
      category: "Sedan",
      transmission: "Automatic",
      fuel: "Petrol",
      seats: 5,
      pricePerDay: 3200,
      image:
        "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
      available: true,
      featured: true,
      description:
        "Comfort-first sedan with refined cabin space, ideal for urban business trips and family travel.",
      createdAt: now,
    },
    {
      id: "car_thar",
      name: "Thar LX",
      brand: "Mahindra",
      city: "Bengaluru",
      category: "SUV",
      transmission: "Manual",
      fuel: "Petrol",
      seats: 4,
      pricePerDay: 4500,
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      available: true,
      featured: false,
      description:
        "Adventure-led icon with bold styling and open-road personality for quick getaways.",
      createdAt: now,
    },
    {
      id: "car_xuv700",
      name: "XUV700 AX7",
      brand: "Mahindra",
      city: "Hyderabad",
      category: "SUV",
      transmission: "Automatic",
      fuel: "Petrol",
      seats: 7,
      pricePerDay: 6100,
      image:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
      available: true,
      featured: true,
      description:
        "Spacious 7-seater loaded with comfort and safety for larger groups and airport runs.",
      createdAt: now,
    },
    {
      id: "car_i20",
      name: "i20 N Line",
      brand: "Hyundai",
      city: "Pune",
      category: "Hatchback",
      transmission: "Manual",
      fuel: "Petrol",
      seats: 5,
      pricePerDay: 2400,
      image:
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80",
      available: true,
      featured: false,
      description:
        "Sporty compact hatchback that makes city traffic feel far lighter and more fun.",
      createdAt: now,
    },
    {
      id: "car_ioniq5",
      name: "Ioniq 5",
      brand: "Hyundai",
      city: "Chennai",
      category: "EV",
      transmission: "Automatic",
      fuel: "Electric",
      seats: 5,
      pricePerDay: 6800,
      image:
        "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80",
      available: true,
      featured: true,
      description:
        "Futuristic electric crossover with instant torque, a lounge-like cabin, and standout design.",
      createdAt: now,
    },
  ];

  const users = [
    {
      id: "user_admin",
      name: "DriveMint Admin",
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
      name: "Aarav Mehta",
      email: "aarav@example.com",
      phone: "9876543210",
      city: "Bengaluru",
      role: "user",
      active: true,
      passwordHash: bcrypt.hashSync("user123", 10),
      createdAt: now,
    },
  ];

  const bookings = [
    {
      id: "booking_seed_1",
      userId: "user_demo",
      carId: "car_xuv700",
      carSnapshot: {
        name: "XUV700 AX7",
        brand: "Mahindra",
        city: "Hyderabad",
        image:
          "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
        pricePerDay: 6100,
      },
      pickupDate: "2026-05-12",
      returnDate: "2026-05-14",
      days: 3,
      totalPrice: 18300,
      status: "accepted",
      note: "Need doorstep pickup near Hitech City.",
      createdAt: now,
    },
    {
      id: "booking_seed_2",
      userId: "user_demo",
      carId: "car_city",
      carSnapshot: {
        name: "City ZX",
        brand: "Honda",
        city: "Mumbai",
        image:
          "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
        pricePerDay: 3200,
      },
      pickupDate: "2026-05-21",
      returnDate: "2026-05-22",
      days: 2,
      totalPrice: 6400,
      status: "pending",
      note: "Business meeting run.",
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
