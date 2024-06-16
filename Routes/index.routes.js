const express = require("express");
const {
  TestController,
  AddMorningTime,
  GetAllAttendance,
  MenuController,
  UpdateAttendanceController,
  AnalyticsController,
} = require("../Controllers/test.controller");

const IndexRoutes = express.Router();

IndexRoutes.route("/").get(TestController);
IndexRoutes.route("/menu").get(MenuController);
IndexRoutes.route("/addAttendance/morning").post(AddMorningTime);
IndexRoutes.route("/getAttendance/all").post(GetAllAttendance);
IndexRoutes.route("/update-attendance").post(UpdateAttendanceController);
IndexRoutes.route("/analytics").get(AnalyticsController);

module.exports = IndexRoutes;
