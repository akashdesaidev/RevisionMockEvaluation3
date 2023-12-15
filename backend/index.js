const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { connection } = require("./Models/db");
const { UserModel } = require("./Models/UserModel");
const { Authentication } = require("./Middleware");

require("dotenv").config();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 5);
    const user = new UserModel({ email, password: hashedPassword, name });
    const savedUser = await user.save();

    const { password: hashedPasswordResponse, ...userWithoutPassword } =
      savedUser._doc;

    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User creation error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    bcrypt.compare(password, user.password, function (err, result) {
      if (result) {
        var token = jwt.sign({ email: user.email }, "shhhhh");

        res.status(200).json({ message: token });
      } else {
        res.status(401).json({ error: "Wrong credentials" });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use(Authentication);

app.get("/getProfile", async (req, res) => {
  const email = req.email;
  const user = await UserModel.findOne({ email });
  const { password: hashedPasswordResponse, ...userWithoutPassword } =
    user._doc;

  res.json(userWithoutPassword);
});

app.get("/calculate", (req, res) => {
  try {
    const { annualInstalmentAmount, annualInterestRate, totalNumberOfYears } =
      req.query;
console.log(annualInstalmentAmount, annualInterestRate, totalNumberOfYears )

    const i = annualInterestRate / 100;
    const n = totalNumberOfYears;
    const totalInvestmentAmount = annualInstalmentAmount * n;

    const totalMaturityValue =
      annualInstalmentAmount * ((Math.pow(1 + i, n) - 1) / i);

    const totalInterestGained = totalMaturityValue - totalInvestmentAmount;

    res.json({
      totalInvestmentAmount,
      totalInterestGained,
      totalMaturityValue,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.status(200).json("Api is working");
});

app.listen(PORT, async () => {
  try {
    await connection;
    console.log("connection to MongoDB established");
  } catch (err) {
    console.error(err);
  }
  console.log(`Listening on port: ${PORT}`);
});
