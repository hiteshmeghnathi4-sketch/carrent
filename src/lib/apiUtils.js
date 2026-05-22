const crypto = require("crypto");

function createApiTokenValue() {
  return crypto.randomBytes(32).toString("hex");
}

function getBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function resolveImageUrl(req, imagePath) {
  if (!imagePath) {
    return "";
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  return `${getBaseUrl(req)}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
  };
}

function serializeCar(req, car) {
  if (!car) {
    return null;
  }

  return {
    id: car.id,
    name: car.name,
    brand: car.brand,
    city: car.city,
    category: car.category,
    transmission: car.transmission,
    fuel: car.fuel,
    seats: car.seats,
    pricePerDay: car.pricePerDay,
    image: car.image,
    imageUrl: resolveImageUrl(req, car.image),
    available: car.available,
    featured: car.featured,
    description: car.description,
    createdAt: car.createdAt,
  };
}

function serializeBooking(req, booking) {
  const displayCar = booking.displayCar || booking.car || booking.carSnapshot;
  const snapshot = displayCar
    ? {
        ...displayCar,
        imageUrl: resolveImageUrl(req, displayCar.image),
      }
    : null;

  return {
    id: booking.id,
    userId: booking.userId,
    carId: booking.carId,
    pickupDate: booking.pickupDate,
    returnDate: booking.returnDate,
    days: booking.days,
    totalPrice: booking.totalPrice,
    status: booking.status,
    note: booking.note,
    createdAt: booking.createdAt,
    car: booking.car ? serializeCar(req, booking.car) : snapshot,
    user: sanitizeUser(booking.user),
  };
}

module.exports = {
  createApiTokenValue,
  getBaseUrl,
  resolveImageUrl,
  sanitizeUser,
  serializeBooking,
  serializeCar,
};
