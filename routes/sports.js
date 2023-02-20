import express from "express";

import {
  createSport,
  deleteSport,
  findSportsInterestByUserID,
  getSportById,
  getSports,
  isFollowing,
  sportsFollow,
  sportsUser,
  UnFollowSport,
  updateSport,
} from "../controllers/sport.js";

const router = express.Router();

// ---------------------  GET ---------------------
router.get("/sports", getSports);
router.get("/sports/:id", getSportById);
router.get("/sports/users/:id", sportsUser);
router.get("/isFollowing", isFollowing)
router.get("/sports/interest/:id", findSportsInterestByUserID)
// ---------------------  POST ---------------------
router.post("/createSport", createSport);
router.post("/sportFollow", sportsFollow)


// ---------------------  PUT ---------------------
router.put("/updateSport/:id", updateSport);

// ---------------------  DELETE ---------------------
router.delete("/deleteSport/:id", deleteSport);
router.delete("/sportUnfollow/:sportId", UnFollowSport)

export default router;
