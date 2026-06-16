const express = require("express");
const multer = require("multer");
const path = require("path");
const QRCode = require("qrcode");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());

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
  try {
    const cleanName = slugify(req.file.originalname);
    fileMap[cleanName] = req.file.filename;

    const publicUrl = `${req.protocol}://${req.get("host")}/file/${cleanName}`;
    const qr = await QRCode.toDataURL(publicUrl);

    res.json({
      url: publicUrl,
      qr
    });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

app.post("/generate-url-qr", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL required" });
    }

    const qr = await QRCode.toDataURL(url);

    res.json({
      url,
      qr
    });
  } catch (error) {
    res.status(500).json({ error: "QR generation failed" });
  }
});

app.get("/file/:name", (req, res) => {
  const realFile = fileMap[req.params.name];

  if (!realFile) {
    return res.status(404).send("File not found");
  }

  res.sendFile(path.join(__dirname, "uploads", realFile));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});