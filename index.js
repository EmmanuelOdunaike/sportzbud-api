import express from "express";
import dotenv from "dotenv";
import path from "path";
import multer from "multer";
import authRoute from "./routes/auth.js";
import userRoute from "./routes/users.js";
import postRoute from "./routes/posts.js";
import sportRoute from "./routes/sports.js";
import communityRoute from "./routes/community.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { verifyToken } from "./utils/verifyToken.js";
import formidabble from "express-formidable";
const app = express();
// app.use(formidabble());
// app.use(formData.parse());
dotenv.config();

//middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const __dirname = path.resolve();
export const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
  fileFilter(req, file, callback) {
    const extension =
      [".png", ".jpg", ".jpeg"].indexOf(
        path.extname(file.originalname).toLowerCase()
      ) >= 0;
    const mimeType =
      ["image/png", "image/jpg", "image/jpeg"].indexOf(file.mimetype) >= 0;

    if (extension && mimeType) {
      return callback(null, true);
    }

    callback(
      new Error(
        "Invalid file type. Only picture file on type PNG and JPG are allowed!"
      )
    );
  },
}).array("image", 5);

app.use(express.static(path.join(__dirname, "./public")));
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", verifyToken, userRoute);
app.use("/api/v1/post", verifyToken, postRoute);
app.use("/api/v1/sport", verifyToken, sportRoute);
app.use("/api/v1/community", verifyToken, communityRoute);

app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: err.stack,
  });
});

app.use((req, res, next) => {
  const err = new Error("Not Found");

  err.status = 404;
  next(err);
});

app.listen(process.env.PORT, () => {
  console.log("Connected to backend.");
});
