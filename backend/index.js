require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { type } = require("os");

const app = express();
const port = process.env.PORT || 4000;

const JWT_SECRET = process.env.JWT_SECRET || "secret_ecom";

//  Enable CORS with specific frontend URLs
app.use(
  cors({
    origin: [
      "https://shoppy-ecommerce-website-frontend.onrender.com",
      "https://shoppy-ecommerce-website-admin.onrender.com",
      "http://localhost:3000",
    ],
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);

//  Allow JSON requests
app.use(express.json());

//Databse Connection with MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

//API Creation

app.get("/", (req, res) => {
  res.send("Express App is Running");
});

// Image Storage Engine

const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });

//Creating Upload Endpoint for image

app.use("/images", express.static(path.join(__dirname, "./upload/images")));

app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    // image_url: `http://localhost:${port}/images/${req.file.filename}`,
    image_url: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
});

//Schema for Creating products

const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id + 1;
  } else {
    id = 1;
  }

  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  console.log(product);
  await product.save();
  console.log("saved");
  res.json({
    success: true,
    name: req.body.name,
  });
});

//Creating API For deleting Product

app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({
    success: true,
    name: req.body.name,
  });
});

//Creating API Getting All Products

app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("All Products Fteched");
  res.send(products);
});

// Schema Creating for User Model

const Users = mongoose.model("Users", {
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

//Careating EndPoint for registering User

app.post("/signup", async (req, res) => {
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({
      success: false,
      errors: "Existing User Found With Same Email Address",
    });
  }
  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }

  // const saltRounds = 10;
  // const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

  const user = new Users({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });

  try {
    await user.save();
    const data = {
      user: { id: user.id },
    };
    const token = jwt.sign(data, process.env.JWT_SECRET);
    res.json({
      success: true,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Error saving user", details: err.message });
  }
});

// Creating EndPonit for User Login

app.post("/login", async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).json({ success: false, errors: "Wrong Email ID" });
  }

  // const isPasswordValid = await bcrypt.compare(
  //   req.body.password,
  //   user.password
  // );

  if (!password) {
    return res.status(400).json({ success: false, errors: "Wrong Password" });
  }

  const data = {
    user: {
      id: user.id,
    },
  };

  const token = jwt.sign(data, process.env.JWT_SECRET);
  res.json({ success: true, token });
});

//Creating endPoint for newcollection data

app.get("/newcollections", async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(0).slice(-8);
  console.log("NEW COLLECTION FETCHED");
  res.send(newcollection);
});

//Creating endPoint for popularinwomen data

app.get("/popularinwomen", async (req, res) => {
  let products = await Product.find({ category: "women" });
  let popular_in_women = products.slice(0, 4);
  console.log("Poppular in women products fetched");
  res.send(popular_in_women);
});

// creating middleware for fetch user

const fetchUser = async (req, res, next) => {
  const token = req.header("auth-token");

  if (!token) {
    res.status(401).send({ error: "Please authoticate using valid user " });
  } else {
    try {
      const data = jwt.verify(token, process.env.JWT_SECRET);
      req.user = data.user;
      next();
    } catch (error) {
      res.status(401).send({ error: "Please authoticate using valid user" });
    }
  }
};

//Creating endPoint for adding products to cartdata

app.post("/addtocart", fetchUser, async (req, res) => {
  try {
    let userData = await Users.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    const itemId = req.body.itemId;
    userData.cartData[itemId] = (userData.cartData[itemId] || 0) + 1;

    await Users.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });
    res.json({ message: "Added to cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// creating endpoint for removing products to cartdata

app.post("/removefromcart", fetchUser, async (req, res) => {
  console.log("Removed", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] > 0)
    userData.cartData[req.body.itemId] -= 1;
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.json({ message: "Removed" });
});

//Crating endpoint to get cartdata

app.post("/getcart", fetchUser, async (req, res) => {
  console.log("GetCart");
  let userData = await Users.findOne({ _id: req.user.id });

  if (!userData) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(userData.cartData);
});

app.listen(port, () => {
  console.log(`Server Running Successfully on Port ${port}`);
});
