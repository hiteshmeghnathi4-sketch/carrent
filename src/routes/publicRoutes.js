const express = require("express");
const bcrypt = require("bcryptjs");
const { setFlash } = require("../lib/flash");
const { requireGuest } = require("../middleware/auth");
const { createId, getCities, readData, writeData } = require("../lib/store");

const router = express.Router();

router.get("/", (req, res) => {
  const data = readData();
  const featuredCars = data.cars.filter((car) => car.featured && car.available);
  const stats = {
    cars: data.cars.length,
    cities: getCities(data.cars).length,
    bookings: data.bookings.length,
  };

  res.render("home", {
    title: "પ્રીમિયમ કાર ભાડે",
    featuredCars,
    stats,
    cities: getCities(data.cars),
  });
});

router.get("/signup", requireGuest, (req, res) => {
  res.render("auth/signup", {
    title: "એકાઉન્ટ બનાવો",
  });
});

router.post("/signup", requireGuest, async (req, res) => {
  const { name, email, phone, city, password } = req.body;
  const data = readData();
  const cleanedName = String(name || "").trim();
  const cleanedEmail = String(email || "").trim().toLowerCase();
  const cleanedPhone = String(phone || "").trim();
  const cleanedCity = String(city || "").trim();

  if (!cleanedName || !cleanedEmail || !cleanedPhone || !cleanedCity || !password) {
    setFlash(req, "error", "કૃપા કરીને સાઇનઅપના બધા ફીલ્ડ ભરો.");
    return res.redirect("/signup");
  }

  if (String(password).length < 6) {
    setFlash(req, "error", "પાસવર્ડ ઓછામાં ઓછા 6 અક્ષરનો હોવો જોઈએ.");
    return res.redirect("/signup");
  }

  const existingUser = data.users.find(
    (user) => user.email.toLowerCase() === cleanedEmail
  );

  if (existingUser) {
    setFlash(req, "error", "આ ઇમેઇલ સાથેનું એકાઉન્ટ પહેલેથી જ ઉપલબ્ધ છે.");
    return res.redirect("/signup");
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
  writeData(data);

  req.session.userId = newUser.id;
  setFlash(req, "success", "DriveMint માં તમારું સ્વાગત છે. તમારું એકાઉન્ટ તૈયાર છે.");
  return res.redirect("/cars");
});

router.get("/login", requireGuest, (req, res) => {
  res.render("auth/login", {
    title: "લોગિન",
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const data = readData();
  const cleanedEmail = String(email || "").trim().toLowerCase();

  if (!cleanedEmail || !password) {
    setFlash(req, "error", "કૃપા કરીને ઇમેઇલ અને પાસવર્ડ બંને દાખલ કરો.");
    return res.redirect("/login");
  }

  const user = data.users.find(
    (item) => item.email.toLowerCase() === cleanedEmail
  );

  if (!user) {
    setFlash(req, "error", "આ ઇમેઇલ માટે કોઈ એકાઉન્ટ મળ્યું નથી.");
    return res.redirect("/login");
  }

  if (!user.active) {
    setFlash(req, "error", "આ એકાઉન્ટ હાલમાં નિષ્ક્રિય છે.");
    return res.redirect("/login");
  }

  const matches = await bcrypt.compare(password || "", user.passwordHash);

  if (!matches) {
    setFlash(req, "error", "પાસવર્ડ ખોટો છે. કૃપા કરીને ફરી પ્રયત્ન કરો.");
    return res.redirect("/login");
  }

  req.session.userId = user.id;
  setFlash(req, "success", `ફરી સ્વાગત છે, ${user.name.split(" ")[0]}.`);
  return res.redirect(user.role === "admin" ? "/admin" : "/cars");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

router.get("/cars", (req, res) => {
  const data = readData();
  const requestedCity = String(req.query.city || "").trim();
  const query = requestedCity.toLowerCase();

  const cars = data.cars
    .filter((car) => car.available)
    .filter((car) => (!query ? true : car.city.toLowerCase().includes(query)))
    .sort((left, right) => left.city.localeCompare(right.city));

  res.render("cars/index", {
    title: "કાર્સ જુઓ",
    cars,
    cities: getCities(data.cars),
    filters: {
      city: requestedCity,
    },
  });
});

router.get("/cars/:id", (req, res) => {
  const data = readData();
  const car = data.cars.find((item) => item.id === req.params.id);

  if (!car) {
    return res.status(404).render("404", {
      title: "કાર મળી નથી",
      message: "આ કાર હવે કેટલોગમાં ઉપલબ્ધ નથી.",
    });
  }

  const relatedCars = data.cars
    .filter((item) => item.id !== car.id && item.city === car.city)
    .slice(0, 3);

  res.render("cars/show", {
    title: car.name,
    car,
    relatedCars,
  });
});

module.exports = router;
