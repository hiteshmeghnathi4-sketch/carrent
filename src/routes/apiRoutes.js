const express = require("express");
const bcrypt = require("bcryptjs");
const { createApiTokenValue, sanitizeUser, serializeBooking, serializeCar } = require("../lib/apiUtils");
const {
  calculateRentalDays,
  createId,
  decorateBookings,
  getCities,
  hasDateOverlap,
  readData,
  writeData,
} = require("../lib/store");
const {
  carPhotoUpload,
  cleanupRequestFile,
  formatUploadError,
  removeUploadedImage,
} = require("../lib/uploads");
const { requireApiAuth, requireApiAdmin } = require("../middleware/apiAuth");

const router = express.Router();

function respondError(res, statusCode, message) {
  return res.status(statusCode).json({
    error: message,
  });
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }

  return fallback;
}

function issueApiToken(data, userId) {
  const token = createApiTokenValue();

  data.apiTokens.push({
    id: createId("token"),
    userId,
    token,
    createdAt: new Date().toISOString(),
  });

  return token;
}

function uploadCarPhotoApi(req, res, next) {
  carPhotoUpload.single("photo")(req, res, (error) => {
    if (error) {
      return respondError(res, 400, formatUploadError(error));
    }

    return next();
  });
}

function buildCarPayload(req, fallbackImage = "") {
  const cleanedName = String(req.body.name || "").trim();
  const cleanedBrand = String(req.body.brand || "").trim();
  const cleanedCity = String(req.body.city || "").trim();
  const cleanedCategory = String(req.body.category || "").trim();
  const cleanedTransmission = String(req.body.transmission || "").trim();
  const cleanedFuel = String(req.body.fuel || "").trim();
  const cleanedImage = String(req.body.image || "").trim();
  const cleanedDescription = String(req.body.description || "").trim();
  const resolvedImage = req.file ? `/uploads/${req.file.filename}` : cleanedImage || fallbackImage;
  const parsedPrice = Number(req.body.pricePerDay);
  const parsedSeats = Number(req.body.seats) || 5;

  return {
    name: cleanedName,
    brand: cleanedBrand,
    city: cleanedCity,
    category: cleanedCategory,
    transmission: cleanedTransmission,
    fuel: cleanedFuel,
    seats: parsedSeats,
    pricePerDay: parsedPrice,
    image: resolvedImage,
    description: cleanedDescription,
    available: parseBoolean(req.body.available, true),
    featured: parseBoolean(req.body.featured, false),
  };
}

function validateCarPayload(payload) {
  if (
    !payload.name ||
    !payload.brand ||
    !payload.city ||
    !payload.category ||
    !payload.transmission ||
    !payload.fuel ||
    !payload.image ||
    !payload.pricePerDay
  ) {
    return "Please fill in all required car details, including a car photo.";
  }

  return "";
}

function serializeAuthPayload(user, token) {
  return {
    token,
    user: sanitizeUser(user),
  };
}

router.post("/auth/signup", async (req, res) => {
  const data = readData();
  const cleanedName = String(req.body.name || "").trim();
  const cleanedEmail = String(req.body.email || "").trim().toLowerCase();
  const cleanedPhone = String(req.body.phone || "").trim();
  const cleanedCity = String(req.body.city || "").trim();
  const password = String(req.body.password || "");

  if (!cleanedName || !cleanedEmail || !cleanedPhone || !cleanedCity || !password) {
    return respondError(res, 400, "Please complete every signup field.");
  }

  if (password.length < 6) {
    return respondError(res, 400, "Password should be at least 6 characters long.");
  }

  const existingUser = data.users.find((user) => user.email.toLowerCase() === cleanedEmail);

  if (existingUser) {
    return respondError(res, 409, "An account with that email already exists.");
  }

  const newUser = {
    id: createId("user"),
    name: cleanedName,
    email: cleanedEmail,
    phone: cleanedPhone,
    city: cleanedCity,
    role: "user",
    active: true,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };

  data.users.push(newUser);
  const token = issueApiToken(data, newUser.id);
  writeData(data);

  return res.status(201).json(serializeAuthPayload(newUser, token));
});

router.post("/auth/login", async (req, res) => {
  const data = readData();
  const cleanedEmail = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!cleanedEmail || !password) {
    return respondError(res, 400, "Please enter both email and password.");
  }

  const user = data.users.find((item) => item.email.toLowerCase() === cleanedEmail);

  if (!user) {
    return respondError(res, 404, "No account was found for that email.");
  }

  if (!user.active) {
    return respondError(res, 403, "This account is currently inactive.");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);

  if (!matches) {
    return respondError(res, 401, "Incorrect password. Please try again.");
  }

  const token = issueApiToken(data, user.id);
  writeData(data);

  return res.json(serializeAuthPayload(user, token));
});

router.get("/auth/me", requireApiAuth, (req, res) => {
  return res.json({
    user: sanitizeUser(req.apiUser),
  });
});

router.post("/auth/logout", requireApiAuth, (req, res) => {
  const data = req.apiData;
  data.apiTokens = data.apiTokens.filter((token) => token.token !== req.apiTokenValue);
  writeData(data);

  return res.json({
    message: "Logged out successfully.",
  });
});

router.get("/cars", (req, res) => {
  const data = readData();
  const requestedCity = String(req.query.city || "").trim().toLowerCase();
  const includeUnavailable = parseBoolean(req.query.includeUnavailable, false);

  const cars = data.cars
    .filter((car) => (includeUnavailable ? true : car.available))
    .filter((car) => (!requestedCity ? true : car.city.toLowerCase().includes(requestedCity)))
    .sort((left, right) => left.city.localeCompare(right.city));

  return res.json({
    cities: getCities(data.cars),
    cars: cars.map((car) => serializeCar(req, car)),
  });
});

router.get("/cars/:id", (req, res) => {
  const data = readData();
  const car = data.cars.find((item) => item.id === req.params.id);

  if (!car) {
    return respondError(res, 404, "That car is no longer available in the catalog.");
  }

  const relatedCars = data.cars
    .filter((item) => item.id !== car.id && item.city === car.city)
    .slice(0, 3);

  return res.json({
    car: serializeCar(req, car),
    relatedCars: relatedCars.map((item) => serializeCar(req, item)),
  });
});

router.get("/bookings", requireApiAuth, (req, res) => {
  const bookings = decorateBookings(req.apiData.bookings, req.apiData.cars, req.apiData.users)
    .filter((booking) => booking.userId === req.apiUser.id)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  return res.json({
    bookings: bookings.map((booking) => serializeBooking(req, booking)),
  });
});

router.post("/bookings", requireApiAuth, (req, res) => {
  if (req.apiUser.role !== "user") {
    return respondError(res, 403, "Only customer accounts can place bookings.");
  }

  const { carId, pickupDate, returnDate, note } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  const data = req.apiData;
  const car = data.cars.find((item) => item.id === carId);

  if (!car || !car.available) {
    return respondError(res, 404, "That car is not available right now.");
  }

  if (!pickupDate || !returnDate) {
    return respondError(res, 400, "Please choose both pickup and return dates.");
  }

  if (pickupDate < today || returnDate < pickupDate) {
    return respondError(res, 400, "Please select a valid future date range.");
  }

  const acceptedConflict = data.bookings.some(
    (booking) =>
      booking.carId === car.id &&
      booking.status === "accepted" &&
      hasDateOverlap(pickupDate, returnDate, booking.pickupDate, booking.returnDate)
  );

  if (acceptedConflict) {
    return respondError(
      res,
      409,
      "Those dates overlap with an accepted booking. Please choose another range."
    );
  }

  const days = calculateRentalDays(pickupDate, returnDate);
  const newBooking = {
    id: createId("booking"),
    userId: req.apiUser.id,
    carId: car.id,
    carSnapshot: {
      name: car.name,
      brand: car.brand,
      city: car.city,
      image: car.image,
      pricePerDay: car.pricePerDay,
    },
    pickupDate,
    returnDate,
    days,
    totalPrice: days * car.pricePerDay,
    status: "pending",
    note: String(note || "").trim(),
    createdAt: new Date().toISOString(),
  };

  data.bookings.push(newBooking);
  writeData(data);

  return res.status(201).json({
    message: "Booking request submitted. We will review it shortly.",
    booking: serializeBooking(req, {
      ...newBooking,
      car,
      user: req.apiUser,
      displayCar: car,
    }),
  });
});

router.get("/profile", requireApiAuth, (req, res) => {
  const userBookings = req.apiData.bookings.filter((booking) => booking.userId === req.apiUser.id);

  return res.json({
    user: sanitizeUser(req.apiUser),
    bookingSummary: {
      total: userBookings.length,
      accepted: userBookings.filter((booking) => booking.status === "accepted").length,
      pending: userBookings.filter((booking) => booking.status === "pending").length,
      rejected: userBookings.filter((booking) => booking.status === "rejected").length,
    },
  });
});

router.put("/profile", requireApiAuth, async (req, res) => {
  const data = req.apiData;
  const user = data.users.find((item) => item.id === req.apiUser.id);
  const cleanedName = String(req.body.name || "").trim();
  const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
  const cleanedPhone = String(req.body.phone || "").trim();
  const cleanedCity = String(req.body.city || "").trim();
  const password = String(req.body.password || "");

  if (!cleanedName || !normalizedEmail || !cleanedPhone || !cleanedCity) {
    return respondError(res, 400, "Please complete all profile fields.");
  }

  if (password && password.length < 6) {
    return respondError(res, 400, "New password should be at least 6 characters long.");
  }

  const emailTaken = data.users.some(
    (item) => item.id !== user.id && item.email.toLowerCase() === normalizedEmail
  );

  if (emailTaken) {
    return respondError(res, 409, "That email is already being used by another account.");
  }

  user.name = cleanedName;
  user.email = normalizedEmail;
  user.phone = cleanedPhone;
  user.city = cleanedCity;

  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  writeData(data);

  return res.json({
    message: "Your profile was updated successfully.",
    user: sanitizeUser(user),
  });
});

router.get("/admin/dashboard", requireApiAdmin, (req, res) => {
  const decoratedBookings = decorateBookings(req.apiData.bookings, req.apiData.cars, req.apiData.users);
  const acceptedBookings = decoratedBookings.filter((booking) => booking.status === "accepted");
  const revenueByCityMap = acceptedBookings.reduce((summary, booking) => {
    const city = booking.displayCar.city;
    summary[city] = (summary[city] || 0) + booking.totalPrice;
    return summary;
  }, {});

  return res.json({
    stats: {
      cars: req.apiData.cars.length,
      users: req.apiData.users.filter((user) => user.role === "user").length,
      bookings: req.apiData.bookings.length,
      pendingBookings: req.apiData.bookings.filter((booking) => booking.status === "pending")
        .length,
      acceptedRevenue: acceptedBookings.reduce(
        (total, booking) => total + booking.totalPrice,
        0
      ),
    },
    revenueByCity: Object.entries(revenueByCityMap).map(([city, revenue]) => ({
      city,
      revenue,
    })),
    recentBookings: decoratedBookings
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 5)
      .map((booking) => serializeBooking(req, booking)),
  });
});

router.get("/admin/cars", requireApiAdmin, (req, res) => {
  const cars = [...req.apiData.cars].sort((left, right) => left.city.localeCompare(right.city));

  return res.json({
    cars: cars.map((car) => serializeCar(req, car)),
  });
});

router.post("/admin/cars", requireApiAdmin, uploadCarPhotoApi, (req, res) => {
  const data = req.apiData;
  const payload = buildCarPayload(req);
  const validationError = validateCarPayload(payload);

  if (validationError) {
    cleanupRequestFile(req.file);
    return respondError(res, 400, validationError);
  }

  const car = {
    id: createId("car"),
    ...payload,
    createdAt: new Date().toISOString(),
  };

  data.cars.push(car);
  writeData(data);

  return res.status(201).json({
    message: "Car added to the fleet.",
    car: serializeCar(req, car),
  });
});

router.put("/admin/cars/:id", requireApiAdmin, uploadCarPhotoApi, (req, res) => {
  const data = req.apiData;
  const car = data.cars.find((item) => item.id === req.params.id);

  if (!car) {
    cleanupRequestFile(req.file);
    return respondError(res, 404, "The requested car could not be found.");
  }

  const payload = buildCarPayload(req, car.image);
  const validationError = validateCarPayload(payload);

  if (validationError) {
    cleanupRequestFile(req.file);
    return respondError(res, 400, validationError);
  }

  const previousImage = car.image;

  Object.assign(car, payload);
  writeData(data);

  if (previousImage !== car.image) {
    removeUploadedImage(previousImage);
  }

  return res.json({
    message: "Car details updated.",
    car: serializeCar(req, car),
  });
});

router.delete("/admin/cars/:id", requireApiAdmin, (req, res) => {
  const data = req.apiData;
  const deletedCar = data.cars.find((item) => item.id === req.params.id);

  if (!deletedCar) {
    return respondError(res, 404, "The requested car could not be found.");
  }

  data.cars = data.cars.filter((item) => item.id !== req.params.id);
  writeData(data);
  removeUploadedImage(deletedCar.image);

  return res.json({
    message: "Car removed from the fleet.",
  });
});

router.get("/admin/bookings", requireApiAdmin, (req, res) => {
  const requestedStatus = String(req.query.status || "all");
  let bookings = decorateBookings(req.apiData.bookings, req.apiData.cars, req.apiData.users).sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
  );

  if (requestedStatus !== "all") {
    bookings = bookings.filter((booking) => booking.status === requestedStatus);
  }

  return res.json({
    bookings: bookings.map((booking) => serializeBooking(req, booking)),
  });
});

router.patch("/admin/bookings/:id/status", requireApiAdmin, (req, res) => {
  const nextStatus = String(req.body.status || "");
  const data = req.apiData;
  const booking = data.bookings.find((item) => item.id === req.params.id);

  if (!booking) {
    return respondError(res, 404, "The booking could not be found.");
  }

  if (!["accepted", "rejected"].includes(nextStatus)) {
    return respondError(res, 400, "Invalid booking status update.");
  }

  if (nextStatus === "accepted") {
    const conflictingBooking = data.bookings.find(
      (item) =>
        item.id !== booking.id &&
        item.carId === booking.carId &&
        item.status === "accepted" &&
        hasDateOverlap(booking.pickupDate, booking.returnDate, item.pickupDate, item.returnDate)
    );

    if (conflictingBooking) {
      return respondError(
        res,
        409,
        "This request overlaps with another accepted booking for the same car."
      );
    }
  }

  booking.status = nextStatus;
  writeData(data);

  const decorated = decorateBookings([booking], data.cars, data.users)[0];

  return res.json({
    message: `Booking ${nextStatus === "accepted" ? "accepted" : "rejected"} successfully.`,
    booking: serializeBooking(req, decorated),
  });
});

router.get("/admin/users", requireApiAdmin, (req, res) => {
  const users = req.apiData.users.map((user) => ({
    ...sanitizeUser(user),
    bookings: req.apiData.bookings.filter((booking) => booking.userId === user.id).length,
    revenue: req.apiData.bookings
      .filter((booking) => booking.userId === user.id && booking.status === "accepted")
      .reduce((total, booking) => total + booking.totalPrice, 0),
  }));

  return res.json({
    users,
  });
});

router.patch("/admin/users/:id/status", requireApiAdmin, (req, res) => {
  const data = req.apiData;
  const user = data.users.find((item) => item.id === req.params.id);

  if (!user) {
    return respondError(res, 404, "The requested user could not be found.");
  }

  if (user.id === req.apiUser.id) {
    return respondError(res, 400, "You cannot deactivate your own admin account.");
  }

  user.active = !user.active;

  if (!user.active) {
    data.apiTokens = data.apiTokens.filter((token) => token.userId !== user.id);
  }

  writeData(data);

  return res.json({
    message: `${user.name} has been ${user.active ? "reactivated" : "deactivated"}.`,
    user: sanitizeUser(user),
  });
});

router.patch("/admin/users/:id/role", requireApiAdmin, (req, res) => {
  const data = req.apiData;
  const user = data.users.find((item) => item.id === req.params.id);
  const nextRole = String(req.body.role || "");

  if (!user) {
    return respondError(res, 404, "The requested user could not be found.");
  }

  if (!["user", "admin"].includes(nextRole)) {
    return respondError(res, 400, "Invalid role selection.");
  }

  if (user.id === req.apiUser.id && nextRole !== "admin") {
    return respondError(res, 400, "You cannot remove your own admin access.");
  }

  user.role = nextRole;
  writeData(data);

  return res.json({
    message: `${user.name}'s role was updated to ${nextRole}.`,
    user: sanitizeUser(user),
  });
});

module.exports = router;
