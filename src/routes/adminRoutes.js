const express = require("express");
const { setFlash } = require("../lib/flash");
const { requireAdmin } = require("../middleware/auth");
const {
  createId,
  decorateBookings,
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

const router = express.Router();

function uploadCarPhoto(getRedirectPath) {
  return (req, res, next) => {
    carPhotoUpload.single("photo")(req, res, (error) => {
      if (error) {
        const redirectPath =
          typeof getRedirectPath === "function" ? getRedirectPath(req) : getRedirectPath;
        setFlash(req, "error", formatUploadError(error));
        return res.redirect(redirectPath);
      }

      return next();
    });
  };
}

router.use(requireAdmin);

router.get("/", (req, res) => {
  const data = readData();
  const decoratedBookings = decorateBookings(data.bookings, data.cars, data.users);
  const acceptedBookings = decoratedBookings.filter(
    (booking) => booking.status === "accepted"
  );
  const revenueByCity = acceptedBookings.reduce((summary, booking) => {
    const city = booking.displayCar.city;
    summary[city] = (summary[city] || 0) + booking.totalPrice;
    return summary;
  }, {});

  res.render("admin/dashboard", {
    title: "એડમિન ડેશબોર્ડ",
    stats: {
      cars: data.cars.length,
      users: data.users.filter((user) => user.role === "user").length,
      bookings: data.bookings.length,
      pendingBookings: data.bookings.filter((booking) => booking.status === "pending").length,
      acceptedRevenue: acceptedBookings.reduce(
        (total, booking) => total + booking.totalPrice,
        0
      ),
    },
    recentBookings: decoratedBookings
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 5),
    revenueByCity,
  });
});

router.get("/cars", (req, res) => {
  const data = readData();

  res.render("admin/cars/index", {
    title: "કાર મેનેજમેન્ટ",
    cars: data.cars.sort((left, right) => left.city.localeCompare(right.city)),
  });
});

router.get("/cars/new", (req, res) => {
  res.render("admin/cars/form", {
    title: "કાર ઉમેરો",
    formMode: "create",
    car: {
      name: "",
      brand: "",
      city: "",
      category: "",
      transmission: "",
      fuel: "",
      seats: 5,
      pricePerDay: "",
      image: "",
      description: "",
      available: true,
      featured: false,
    },
  });
});

router.post("/cars", uploadCarPhoto("/admin/cars/new"), (req, res) => {
  const data = readData();
  const {
    name,
    brand,
    city,
    category,
    transmission,
    fuel,
    seats,
    pricePerDay,
    image,
    description,
    available,
    featured,
  } = req.body;
  const cleanedName = String(name || "").trim();
  const cleanedBrand = String(brand || "").trim();
  const cleanedCity = String(city || "").trim();
  const cleanedCategory = String(category || "").trim();
  const cleanedTransmission = String(transmission || "").trim();
  const cleanedFuel = String(fuel || "").trim();
  const cleanedImage = String(image || "").trim();
  const cleanedDescription = String(description || "").trim();
  const resolvedImage = req.file ? `/uploads/${req.file.filename}` : cleanedImage;
  const parsedPrice = Number(pricePerDay);
  const parsedSeats = Number(seats) || 5;

  if (
    !cleanedName ||
    !cleanedBrand ||
    !cleanedCity ||
    !cleanedCategory ||
    !cleanedTransmission ||
    !cleanedFuel ||
    !resolvedImage ||
    !parsedPrice
  ) {
    cleanupRequestFile(req.file);
    setFlash(req, "error", "કૃપા કરીને કારની બધી જરૂરી વિગતો, સહિત ફોટો, ભરો.");
    return res.redirect("/admin/cars/new");
  }

  data.cars.push({
    id: createId("car"),
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
    available: available === "on",
    featured: featured === "on",
    createdAt: new Date().toISOString(),
  });

  writeData(data);
  setFlash(req, "success", "કાર ફ્લીટમાં ઉમેરાઈ ગઈ.");
  return res.redirect("/admin/cars");
});

router.get("/cars/:id/edit", (req, res) => {
  const data = readData();
  const car = data.cars.find((item) => item.id === req.params.id);

  if (!car) {
    setFlash(req, "error", "માગેલી કાર મળી નથી.");
    return res.redirect("/admin/cars");
  }

  res.render("admin/cars/form", {
    title: `${car.name} સંપાદિત કરો`,
    formMode: "edit",
    car,
  });
});

router.post(
  "/cars/:id/update",
  uploadCarPhoto((req) => `/admin/cars/${req.params.id}/edit`),
  (req, res) => {
  const data = readData();
  const car = data.cars.find((item) => item.id === req.params.id);

  if (!car) {
    cleanupRequestFile(req.file);
    setFlash(req, "error", "માગેલી કાર મળી નથી.");
    return res.redirect("/admin/cars");
  }

  const cleanedName = String(req.body.name || "").trim();
  const cleanedBrand = String(req.body.brand || "").trim();
  const cleanedCity = String(req.body.city || "").trim();
  const cleanedCategory = String(req.body.category || "").trim();
  const cleanedTransmission = String(req.body.transmission || "").trim();
  const cleanedFuel = String(req.body.fuel || "").trim();
  const cleanedImage = String(req.body.image || "").trim();
  const cleanedDescription = String(req.body.description || "").trim();
  const resolvedImage = req.file ? `/uploads/${req.file.filename}` : cleanedImage || car.image;
  const parsedPrice = Number(req.body.pricePerDay);
  const parsedSeats = Number(req.body.seats) || 5;

  if (
    !cleanedName ||
    !cleanedBrand ||
    !cleanedCity ||
    !cleanedCategory ||
    !cleanedTransmission ||
    !cleanedFuel ||
    !resolvedImage ||
    !parsedPrice
  ) {
    cleanupRequestFile(req.file);
    setFlash(req, "error", "કૃપા કરીને કારની બધી જરૂરી વિગતો, સહિત ફોટો, ભરો.");
    return res.redirect(`/admin/cars/${car.id}/edit`);
  }

  const previousImage = car.image;

  Object.assign(car, {
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
    available: req.body.available === "on",
    featured: req.body.featured === "on",
  });

  writeData(data);

  if (previousImage !== car.image) {
    removeUploadedImage(previousImage);
  }

  setFlash(req, "success", "કારની વિગતો અપડેટ થઈ ગઈ.");
  return res.redirect("/admin/cars");
});

router.post("/cars/:id/delete", (req, res) => {
  const data = readData();
  const nextCars = data.cars.filter((item) => item.id !== req.params.id);

  if (nextCars.length === data.cars.length) {
    setFlash(req, "error", "માગેલી કાર મળી નથી.");
    return res.redirect("/admin/cars");
  }

  const deletedCar = data.cars.find((item) => item.id === req.params.id);
  data.cars = nextCars;
  writeData(data);

  if (deletedCar) {
    removeUploadedImage(deletedCar.image);
  }

  setFlash(req, "success", "કાર ફ્લીટમાંથી દૂર કરી દેવામાં આવી.");
  return res.redirect("/admin/cars");
});

router.get("/bookings", (req, res) => {
  const data = readData();
  const status = String(req.query.status || "all");
  let bookings = decorateBookings(data.bookings, data.cars, data.users).sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
  );

  if (status !== "all") {
    bookings = bookings.filter((booking) => booking.status === status);
  }

  res.render("admin/bookings", {
    title: "બુકિંગ મેનેજમેન્ટ",
    bookings,
    status,
  });
});

router.post("/bookings/:id/status", (req, res) => {
  const { status } = req.body;
  const data = readData();
  const booking = data.bookings.find((item) => item.id === req.params.id);

  if (!booking) {
    setFlash(req, "error", "બુકિંગ મળી નથી.");
    return res.redirect("/admin/bookings");
  }

  if (!["accepted", "rejected"].includes(status)) {
    setFlash(req, "error", "બુકિંગની સ્થિતિ માટે અમાન્ય અપડેટ.");
    return res.redirect("/admin/bookings");
  }

  if (status === "accepted") {
    const conflictingBooking = data.bookings.find(
      (item) =>
        item.id !== booking.id &&
        item.carId === booking.carId &&
        item.status === "accepted" &&
        hasDateOverlap(
          booking.pickupDate,
          booking.returnDate,
          item.pickupDate,
          item.returnDate
        )
    );

    if (conflictingBooking) {
      setFlash(
        req,
        "error",
        "આ વિનંતી એ જ કારની બીજી મંજૂર થયેલી બુકિંગ સાથે અથડાય છે."
      );
      return res.redirect("/admin/bookings");
    }
  }

  booking.status = status;
  writeData(data);

  setFlash(
    req,
    "success",
    `બુકિંગ સફળતાપૂર્વક ${status === "accepted" ? "મંજૂર" : "નકારેલ"} કરી દેવામાં આવી.`
  );
  return res.redirect("/admin/bookings");
});

router.get("/users", (req, res) => {
  const data = readData();
  const users = data.users.map((user) => ({
    ...user,
    bookings: data.bookings.filter((booking) => booking.userId === user.id).length,
    revenue: data.bookings
      .filter((booking) => booking.userId === user.id && booking.status === "accepted")
      .reduce((total, booking) => total + booking.totalPrice, 0),
  }));

  res.render("admin/users", {
    title: "વપરાશકર્તા મેનેજમેન્ટ",
    users,
  });
});

router.post("/users/:id/status", (req, res) => {
  const data = readData();
  const user = data.users.find((item) => item.id === req.params.id);

  if (!user) {
    setFlash(req, "error", "માગેલ વપરાશકર્તા મળ્યા નથી.");
    return res.redirect("/admin/users");
  }

  if (user.id === req.user.id) {
    setFlash(req, "error", "તમે તમારું પોતાનું એડમિન એકાઉન્ટ નિષ્ક્રિય કરી શકતા નથી.");
    return res.redirect("/admin/users");
  }

  user.active = !user.active;
  writeData(data);

  setFlash(
    req,
    "success",
    `${user.name} ને ${user.active ? "ફરી સક્રિય" : "નિષ્ક્રિય"} કરવામાં આવ્યા છે.`
  );
  return res.redirect("/admin/users");
});

router.post("/users/:id/role", (req, res) => {
  const data = readData();
  const user = data.users.find((item) => item.id === req.params.id);
  const nextRole = req.body.role;

  if (!user) {
    setFlash(req, "error", "માગેલ વપરાશકર્તા મળ્યા નથી.");
    return res.redirect("/admin/users");
  }

  if (!["user", "admin"].includes(nextRole)) {
    setFlash(req, "error", "અમાન્ય ભૂમિકા પસંદગી.");
    return res.redirect("/admin/users");
  }

  if (user.id === req.user.id && nextRole !== "admin") {
    setFlash(req, "error", "તમે તમારું પોતાનું એડમિન ઍક્સેસ દૂર કરી શકતા નથી.");
    return res.redirect("/admin/users");
  }

  user.role = nextRole;
  writeData(data);

  setFlash(req, "success", `${user.name} ની ભૂમિકા ${nextRole === "admin" ? "એડમિન" : "વપરાશકર્તા"} તરીકે અપડેટ થઈ.`);
  return res.redirect("/admin/users");
});

module.exports = router;
