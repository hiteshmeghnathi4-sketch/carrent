const express = require("express");
const bcrypt = require("bcryptjs");
const { setFlash } = require("../lib/flash");
const { requireAuth } = require("../middleware/auth");
const {
  calculateRentalDays,
  createId,
  decorateBookings,
  hasDateOverlap,
  readData,
  writeData,
} = require("../lib/store");

const router = express.Router();

router.post("/cars/:id/book", requireAuth, (req, res) => {
  const { pickupDate, returnDate, note } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  const data = readData();
  const car = data.cars.find((item) => item.id === req.params.id);

  if (!car || !car.available) {
    setFlash(req, "error", "That car is not available right now.");
    return res.redirect("/cars");
  }

  if (!pickupDate || !returnDate) {
    setFlash(req, "error", "Please choose both pickup and return dates.");
    return res.redirect(`/cars/${car.id}`);
  }

  if (pickupDate < today || returnDate < pickupDate) {
    setFlash(req, "error", "Please select a valid future date range.");
    return res.redirect(`/cars/${car.id}`);
  }

  const acceptedConflict = data.bookings.some(
    (booking) =>
      booking.carId === car.id &&
      booking.status === "accepted" &&
      hasDateOverlap(
        pickupDate,
        returnDate,
        booking.pickupDate,
        booking.returnDate
      )
  );

  if (acceptedConflict) {
    setFlash(
      req,
      "error",
      "Those dates overlap with an accepted booking. Please choose another range."
    );
    return res.redirect(`/cars/${car.id}`);
  }

  const days = calculateRentalDays(pickupDate, returnDate);
  const newBooking = {
    id: createId("booking"),
    userId: req.user.id,
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

  setFlash(req, "success", "Booking request submitted. We will review it shortly.");
  return res.redirect("/bookings");
});

router.get("/bookings", requireAuth, (req, res) => {
  const data = readData();
  const bookings = decorateBookings(data.bookings, data.cars, data.users)
    .filter((booking) => booking.userId === req.user.id)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  res.render("bookings/index", {
    title: "Booking History",
    bookings,
  });
});

router.get("/profile", requireAuth, (req, res) => {
  const data = readData();
  const userBookings = data.bookings.filter((booking) => booking.userId === req.user.id);

  res.render("profile", {
    title: "Your Profile",
    bookingSummary: {
      total: userBookings.length,
      accepted: userBookings.filter((booking) => booking.status === "accepted").length,
      pending: userBookings.filter((booking) => booking.status === "pending").length,
    },
  });
});

router.post("/profile", requireAuth, async (req, res) => {
  const { name, email, phone, city, password } = req.body;
  const data = readData();
  const user = data.users.find((item) => item.id === req.user.id);

  if (!user) {
    setFlash(req, "error", "Your session expired. Please log in again.");
    return res.redirect("/login");
  }

  const cleanedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const cleanedPhone = String(phone || "").trim();
  const cleanedCity = String(city || "").trim();

  if (!cleanedName || !normalizedEmail || !cleanedPhone || !cleanedCity) {
    setFlash(req, "error", "Please complete all profile fields.");
    return res.redirect("/profile");
  }

  if (password && String(password).length < 6) {
    setFlash(req, "error", "New password should be at least 6 characters long.");
    return res.redirect("/profile");
  }

  const emailTaken = data.users.some(
    (item) => item.id !== user.id && item.email.toLowerCase() === normalizedEmail
  );

  if (emailTaken) {
    setFlash(req, "error", "That email is already being used by another account.");
    return res.redirect("/profile");
  }

  user.name = cleanedName;
  user.email = normalizedEmail;
  user.phone = cleanedPhone;
  user.city = cleanedCity;

  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  writeData(data);
  setFlash(req, "success", "Your profile was updated successfully.");
  return res.redirect("/profile");
});

module.exports = router;
