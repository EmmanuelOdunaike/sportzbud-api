import express from "express";
import path from "path";
import multer from "multer";
import {
  createComment,
  deleteComment,
  replyComment,
  updateComment,
} from "../controllers/post.js";
import {
  createPost,
  deletePost,
  DisLikePost,
  DisLikeRemove,
  getCommentsByPost,
  getCommunityPostsByUser,
  getPostsByUser,
  IsDisliked,
  IsLiked,
  LikePost,
  LikeRemove,
  updatePost,
  uploadImages,
} from "../controllers/user.js";

const router = express.Router();
export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const __dirname = path.resolve();
const upload = multer({
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
});
// ---------------------  GET ---------------------

router.get("/postsByUser", getPostsByUser);

router.get("/communityPostsByUser/:id", getCommunityPostsByUser);
router.get("/comments/:postId", getCommentsByPost);
router.get("/isLiked/:id", IsLiked);
router.get("/isDisliked/:id", IsDisliked);

// ---------------------  POST ---------------------
router.post("/createPost", upload.array("image"), createPost);
router.post("/createComment/:postId", createComment);
router.post("/replyComment/", replyComment);
router.post("/like/:id", LikePost);
router.post("/dislike/:id", DisLikePost);

// ---------------------  PUT ---------------------
router.put("/updatePost/:id", updatePost);
router.put("/updateComment/:id", updateComment);

// ---------------------  DELETE ---------------------
router.delete("/deletePost/:id", deletePost);
router.delete("/deleteComment/:id", deleteComment);
router.delete("/likeRemove", LikeRemove);
router.delete("/dislikeRemove", DisLikeRemove);

export default router;
