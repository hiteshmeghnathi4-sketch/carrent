const path = require("path");
const express = require("express");
const session = require("express-session");
const apiRoutes = require("./routes/apiRoutes");
const publicRoutes = require("./routes/publicRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const {
  formatDays,
  formatSeats,
  translateAvailability,
  translateCategory,
  translateCity,
  translateDescription,
  translateFuel,
  translateRole,
  translateStatus,
  translateTransmission,
} = require("./lib/i18n");
const { initializeStore, readData } = require("./lib/store");
const { UPLOAD_DIR } = require("./lib/uploads");

initializeStore();

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/uploads", express.static(UPLOAD_DIR));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "drivemint-session-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  const data = readData();
  const currentUser = data.users.find((user) => user.id === req.session.userId);

  if (currentUser && currentUser.active) {
    req.user = currentUser;
  } else {
    req.user = null;
    delete req.session.userId;
  }

  res.locals.user = req.user;
  res.locals.isAdmin = req.user?.role === "admin";
  res.locals.currentPath = req.path;
  res.locals.flash = req.session.flash || null;
  res.locals.formatCurrency = (value) =>
    new Intl.NumberFormat("gu-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  res.locals.formatDate = (value) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("gu-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  res.locals.formatDateRange = (start, end) =>
    `${res.locals.formatDate(start)} થી ${res.locals.formatDate(end)}`;
  res.locals.formatDays = formatDays;
  res.locals.formatSeats = formatSeats;
  res.locals.translateAvailability = translateAvailability;
  res.locals.translateCategory = translateCategory;
  res.locals.translateCity = translateCity;
  res.locals.translateDescription = translateDescription;
  res.locals.translateFuel = translateFuel;
  res.locals.translateRole = translateRole;
  res.locals.translateStatus = translateStatus;
  res.locals.translateTransmission = translateTransmission;
  delete req.session.flash;

  next();
});

app.use("/api", apiRoutes);
app.use(publicRoutes);
app.use(userRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).render("404", {
    title: "પેજ મળ્યું નથી",
    message: "તમે માંગેલ પેજ ઉપલબ્ધ નથી.",
  });
});

module.exports = app;
