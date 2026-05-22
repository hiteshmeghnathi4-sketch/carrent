const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { createId } = require("./store");

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, "..", "..", "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    callback(null, `${Date.now()}-${createId("photo")}${extension}`);
  },
});

const carPhotoUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
      return callback(null, true);
    }

    return callback(new Error("Please upload a valid image file."));
  },
});

function isUploadedImage(imagePath) {
  return typeof imagePath === "string" && imagePath.startsWith("/uploads/");
}

function removeUploadedImage(imagePath) {
  if (!isUploadedImage(imagePath)) {
    return;
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(imagePath));

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function cleanupRequestFile(file) {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
}

function formatUploadError(error) {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return "Car photo must be 5 MB or smaller.";
  }

  return error.message || "Unable to upload the selected image.";
}

module.exports = {
  MAX_FILE_SIZE,
  UPLOAD_DIR,
  carPhotoUpload,
  cleanupRequestFile,
  formatUploadError,
  isUploadedImage,
  removeUploadedImage,
};
