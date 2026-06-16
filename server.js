const express = require("express");
const multer = require("multer");
const path = require("path");
const QRCode = require("qrcode");

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

function slugify(name) {
  return name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const fileMap = {};

app.post("/upload", upload.single("file"), async (req, res) => {
  const cleanName = slugify(req.file.originalname);
  fileMap[cleanName] = req.file.filename;

  const publicUrl = `${req.protocol}://${req.get("host")}/file/${cleanName}`;
  const qr = await QRCode.toDataURL(publicUrl);

  res.json({ url: publicUrl, qr });
});

app.get("/file/:name", (req, res) => {
  const realFile = fileMap[req.params.name];
  if (!realFile) return res.status(404).send("File not found");

  res.sendFile(path.join(__dirname, "uploads", realFile));
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:3000");
});