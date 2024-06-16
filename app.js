const express = require("express");
const dotenv = require("dotenv");

const MongoDataBaseConn = require("./Config/mongodb.config");
const IndexRoutes = require("./Routes/index.routes");

const app = express();

dotenv.config();
MongoDataBaseConn();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("views", "./views");
app.set("view engine", "ejs");

app.use("/", IndexRoutes);

// if no routes findout
app.use("*", (req, res) => {
  res.status(500).json({
    success: false,
    statusCode: 500,
    url: req.baseUrl,
    type: req.method,
    message: "API not found",
  });
});

// response for error message
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    statusCode: err.status || 500,
    message: err.message || "internal server error",
    stack: err.stack || "not present",
  });
});

const port = process.env.PORT || 8001;
app.listen(port, () => {
  console.log("Server Mode : ", process.env.DEVELOPMENT_MODE);
  console.log(`server is running on http://localhost:${port}`);
});
