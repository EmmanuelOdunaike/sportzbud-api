import bcrypt from "bcryptjs";
import { createError } from "../utils/error.js";
import jwt from "jsonwebtoken";
import prisma from "../prisma/prisma.js";

// @route POST api/auth/register to register

export const register = async (req, res, next) => {
  const { email, password, firstName, lastName, dob, gender, location } =
    req.body;

  const hashedPassword = await bcrypt.hash(password, 12);
  if (
    !email ||
    !password ||
    !firstName ||
    !lastName ||
    !dob ||
    !gender ||
    !location
  ) {
    return res.status(400).json({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }

  const age = new Date().getFullYear() - new Date(dob).getFullYear();

  if (age < 18) {
    return res.status(400).json({ message: "You must be 18 or older" });
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        dob: new Date(dob),
        age: age,
        gender: gender,
        location: location,
        fullName: `${firstName} ${lastName}`,
      },
    });
    const token = jwt.sign({ user }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.status(200).json({ token, user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// @route POST api/auth/login  to login
export const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please enter all fields" });
  }
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ user }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return res.status(200).json({ token, user });
};
