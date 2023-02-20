import express from "express";

import path from "path";
import multer from "multer";

import {
  acceptFriendRequest,
  cancelFriendRequest,
  createConversation,
  declineFriendRequest,
  deleteFriend,
  getConversation,
  getConversationsByUser,
  getFriendList,
  getFriendRequestReceivedByUser,
  getFriendRequestSent,
  getIsFriend,
  getIsFriendReqReceived,
  getIsFriendReqSent,
  getMessagesByConversation,
  getUser,
  getUserById,
  hasFriendRequest,
  sendFriendRequest,
  sendMessage,
  updatePassword,
  updateUser,
  updateUserCover,
} from "../controllers/user.js";

const router = express.Router();
export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads/users");
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
router.get("/me", getUser);
router.get("/finduser/:id", getUserById);
router.get("/friendslist", getFriendList);
// Friend Requests

router.get("/friendrequestsRecieved", getFriendRequestReceivedByUser);

router.get("/friendrequestsSent", getFriendRequestSent);
router.get("/hasFriendRequest", hasFriendRequest);
// Conversation
router.get("/conversations", getConversationsByUser);
router.get("/conversations/:id", getConversation);
router.get("/messagesByConversation/:id", getMessagesByConversation);
router.get("/isFriend/:id", getIsFriend);
router.get("/isFriendReqReceived/:id", getIsFriendReqReceived);
router.get("/isFriendReqSent/:id", getIsFriendReqSent);

// ---------------------  POST ---------------------

// Friend Requests
router.post("/sendFriendRequest/:id", sendFriendRequest);
router.post("/acceptFriendRequest/:id", acceptFriendRequest);

// Conversation
router.post("/createConversation", createConversation);
router.post("/sendMessage/:id", sendMessage);
router.post("/changePassword", updatePassword);
// ---------------------  UPDATE ---------------------
router.put("/updateUser", upload.single("profilePicture"), updateUser);
router.put("/updateUserCover", upload.single("coverPicture"), updateUserCover);

// ---------------------  DELETE ---------------------
// Friend Requests
router.delete("/declineFriendRequest/:id", declineFriendRequest);
router.delete("/deleteFriend/:id", deleteFriend);
router.delete("/cancelFriendRequest/:id", cancelFriendRequest);

// ---------------------  PATCH ---------------------

export default router;
