const express = require("express");
const { userModel, dataModel } = require("./app");
const app = express();
app.use(express.json());
const port = 3000;
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

app.get("/", (req, res) => {
  res.send("Hello this is Flutter + Node Combo..");
});

app.post("/signup", async function (req, res) {
  console.log(req.body);
  const { username, password, email } = req.body;
  try {
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: "Please provide every field",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userAccount = await userModel.create({
      username,
      password: hashedPassword,
      email,
    });
    res.status(201).json({
      success: true,
      message: "New user account created successfully!",
      data: userAccount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create user account.",
      error: err.message,
    });
  }
});

app.post("/login", async function (req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide username and password",
    });
  }

  try {
    const userAccount = await userModel.findOne({ email: email });

    if (!userAccount) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    var token = jwt.sign({ foo: userAccount._id }, "SecretKey");

    const isPasswordValid = await bcrypt.compare(
      password,
      userAccount.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        username: userAccount.username,
        email: userAccount.email,
        token: token,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to login.",
      error: err.message,
    });
  }
});

// POST a data
app.post("/datas", async (req, res) => {
  const { title, description, userId, isCompleted } = req.body;
  console.log(title, description, userId, isCompleted);

  try {
    const data = await dataModel.create({
      title,
      description,
      userId,
      isCompleted,
    });

    res.status(201).json({
      success: true,
      message: "successfully created a data",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed Create data.",
      error: err.message,
    });
  }
});

// Get ths data
app.get("/datas", async (req, res) => {
  const authHeader = req.headers["authorization"];

  // Remove "Bearer " if present
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  if (!token) {
    res.status(400).json({
      success: false,
      message: "Please provide your token",
    });
  }

  console.log(token);

  jwt.verify(token, "SecretKey", async (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid token" });
    }
    console.log("Decoded JWT:", decoded.foo);
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const data = await dataModel
      .find({
        userId: decoded.foo,
      })
      .skip(skip)
      .limit(limit);

    const total = await dataModel.countDocuments({ userId: decoded.foo });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "successfully retrieved data",
      data: data,
      pagination: {
        totalItems: total,
        totalPages: totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  });
});

// pagination example

app.listen(port, () => {
  console.log(`Server listenning on port number: ${port}`);
});
