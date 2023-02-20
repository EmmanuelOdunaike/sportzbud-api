import express from "express";
import multer from "multer";
import path from "path";

import {
  AlreadyMemeber,
  createCommunity,
  deleteCommunity,
  deleteMember,
  getCommunities,
  getCommunitiesByUser,
  getCommunityById,
  getCommunityOwnerInfo,
  getMembersByCommunity,
  getMyCommunity,
  joinCommunity,
  leaveCommunity,
  updateCommunity,
} from "../controllers/community.js";
import { getMyPost, getPostsByCommunity } from "../controllers/post.js";

const router = express.Router();

export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads/communities");
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
router.get("/communitiesList", getCommunities);
router.get("/communities/:id", getCommunityById);
router.get("/myCommunities", getMyCommunity);
router.get("/posts/:id", getPostsByCommunity);
router.get("/mypost", getMyPost);
router.get("/members/:id", getMembersByCommunity);
router.get("/communities", getCommunitiesByUser);
router.get("/ownerInfo/:id", getCommunityOwnerInfo);
router.get("/isAlreadyMemeber/:id", AlreadyMemeber);
// ---------------------  POST ---------------------
router.post("/createCommunity", upload.single("image"), createCommunity);
router.post("/joinCommunity/:id", joinCommunity);
// ---------------------  PUT ---------------------
router.put("/updateCommunity/:id", upload.single("image"), updateCommunity);
// ---------------------  DELETE ---------------------
router.delete("/deleteCommunity/:id", deleteCommunity);
router.delete("/leaveCommunity/:id", leaveCommunity);
router.delete("/deleteMember", deleteMember);

export default router;
