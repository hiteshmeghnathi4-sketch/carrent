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
    setFlash(req, "error", "આ કાર હાલમાં ઉપલબ્ધ નથી.");
    return res.redirect("/cars");
  }

  if (!pickupDate || !returnDate) {
    setFlash(req, "error", "કૃપા કરીને પિકઅપ અને રિટર્નની બંને તારીખો પસંદ કરો.");
    return res.redirect(`/cars/${car.id}`);
  }

  if (pickupDate < today || returnDate < pickupDate) {
    setFlash(req, "error", "કૃપા કરીને માન્ય ભવિષ્ય તારીખ શ્રેણી પસંદ કરો.");
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
      "આ તારીખો પહેલેથી મંજૂર થયેલી બુકિંગ સાથે મેળ ખાય છે. કૃપા કરીને બીજી તારીખો પસંદ કરો."
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

  setFlash(req, "success", "બુકિંગ વિનંતી મોકલાઈ ગઈ છે. અમે ટૂંક સમયમાં તેની સમીક્ષા કરીશું.");
  return res.redirect("/bookings");
});

router.get("/bookings", requireAuth, (req, res) => {
  const data = readData();
  const bookings = decorateBookings(data.bookings, data.cars, data.users)
    .filter((booking) => booking.userId === req.user.id)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  res.render("bookings/index", {
    title: "બુકિંગ ઇતિહાસ",
    bookings,
  });
});

router.get("/profile", requireAuth, (req, res) => {
  const data = readData();
  const userBookings = data.bookings.filter((booking) => booking.userId === req.user.id);

  res.render("profile", {
    title: "તમારી પ્રોફાઇલ",
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
    setFlash(req, "error", "તમારું સેશન સમાપ્ત થયું છે. કૃપા કરીને ફરી લોગિન કરો.");
    return res.redirect("/login");
  }

  const cleanedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const cleanedPhone = String(phone || "").trim();
  const cleanedCity = String(city || "").trim();

  if (!cleanedName || !normalizedEmail || !cleanedPhone || !cleanedCity) {
    setFlash(req, "error", "કૃપા કરીને પ્રોફાઇલના બધા ફીલ્ડ ભરો.");
    return res.redirect("/profile");
  }

  if (password && String(password).length < 6) {
    setFlash(req, "error", "નવો પાસવર્ડ ઓછામાં ઓછા 6 અક્ષરનો હોવો જોઈએ.");
    return res.redirect("/profile");
  }

  const emailTaken = data.users.some(
    (item) => item.id !== user.id && item.email.toLowerCase() === normalizedEmail
  );

  if (emailTaken) {
    setFlash(req, "error", "આ ઇમેઇલ પહેલેથી જ બીજા એકાઉન્ટમાં ઉપયોગમાં છે.");
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
  setFlash(req, "success", "તમારી પ્રોફાઇલ સફળતાપૂર્વક અપડેટ થઈ ગઈ.");
  return res.redirect("/profile");
});

module.exports = router;
