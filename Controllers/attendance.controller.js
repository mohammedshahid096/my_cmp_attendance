const httpErrors = require("http-errors");
const path = require("path");
const userModel = require("../Models/user.model");
const moment = require("moment");
const attendacneModel = require("../Models/attendance.model");

module.exports.TestController = (req, res, next) => {
  try {
    res.render("index", {});
  } catch (error) {
    next(httpErrors.InternalServerError(error));
  }
};

module.exports.MenuController = (req, res, next) => {
  try {
    res.render("menu", {});
  } catch (error) {
    next(httpErrors.InternalServerError(error));
  }
};

module.exports.AddMorningTime = async (req, res, next) => {
  try {
    const { email, password, addendanceType } = req.body;
    if (email === "" || password === "" || !addendanceType === "") {
      return next(httpErrors.BadRequest("enter all the fields"));
    }
    const isExist = await userModel.findOne({ email, password });
    if (!isExist) {
      return next(httpErrors.NotFound("email or password not match"));
    }

    const today = new Date();
    const startDate = new Date(today.setHours(0, 0, 0, 0));
    const endDate = new Date(today.setHours(23, 59, 59, 999));

    const isExistToday = await attendacneModel.findOne({
      attendanceDate: {
        $gte: startDate,
        $lt: endDate,
      },
      user: isExist._id,
    });

    if (
      (isExistToday && addendanceType === "Absent") ||
      (isExistToday && addendanceType === "Morning")
    ) {
      return next(httpErrors.BadRequest("Already Today's Attendacne is added"));
    }

    if (!isExistToday && addendanceType === "Absent") {
      let data = new attendacneModel({
        user: isExist._id,
        attendanceDate: moment().format(),
        isPresent: false,
      });

      return res.status(200).json({
        successs: true,
        message: "successfully attendacne is marked as absent",
        data,
      });
    }

    if (!isExistToday && addendanceType === "Morning") {
      let data = new attendacneModel({
        user: isExist._id,
        attendanceDate: moment().format(),
        inTime: moment().format(),
      });
      await data.save();
      return res.status(201).json({
        success: true,
        message: "Morning Attedance is Added Successfully",
        data,
      });
    }

    if (!isExistToday && addendanceType === "Evening") {
      return next(httpErrors.BadRequest("Please add 1st Morning attendance"));
    }

    if (isExistToday && addendanceType === "Evening") {
      let data = await attendacneModel.findByIdAndUpdate(
        isExistToday._id,
        { outTime: moment().format() },
        { new: true }
      );

      return res.status(201).json({
        success: true,
        message: "Evening Attedance is Added Successfully",
        data,
      });
    }

    res.status(201).json({
      success: true,
      message: addendanceType + " attendacne is added successfully",
      data: isExistToday,
    });
  } catch (error) {
    next(httpErrors.InternalServerError(error));
  }
};

module.exports.GetAllAttendance = async (req, res, next) => {
  try {
    const { email } = req.body;
    const [year, month] = req.body.month.split("-");
    // console.log(year, Number(month));
    if (email === "") {
      return next(httpErrors.BadRequest("enter all the email"));
    }

    const isUserExist = await userModel.findOne({ email });
    if (!isUserExist) {
      return next(httpErrors.NotFound("user not found with the given email"));
    }

    // const today = new Date();
    const startDate = new Date(Number(year), Number(month) - 1, Number("2"));
    // console.log(startDate);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    // console.log(endDate);

    const data = await attendacneModel
      .find({
        user: isUserExist._id,
        createdAt: { $gte: startDate, $lt: endDate },
      })
      .sort({ attendanceDate: -1 });

    const updateData = data.map((item, index) => {
      let startTime = moment(item.inTime);
      let endTime = item.outTime ? moment(item.outTime) : startTime;
      let difference =
        item.isPresent === false ? 0 : endTime?.diff(startTime, "hours", true);
      return {
        index: index + 1,
        id: item._id,
        Date: moment(item.attendanceDate).format("DD/MM/YYYY"),
        Day: moment(item.attendanceDate).format("dddd"),
        InTime: item.inTime ? moment(item.inTime).format("LTS") : null,
        outTime: item.outTime ? moment(item.outTime).format("LTS") : null,
        difference: difference.toFixed(1),
        isPresent: item.isPresent,
      };
    });

    let workedHours = updateData.reduce(
      (accumulator, current) => accumulator + Number(current.difference),
      0
    );
    workedHours = Number(workedHours.toFixed(1));
    const totalAbsents = updateData.filter((item) => item.isPresent === false);

    const analytics = {
      totalHours: updateData.length * 9,
      totalDays: updateData.length,
      workedHours,
      monthName: moment().format("MMMM"),
      totalAbsentsDays: totalAbsents.length,
    };
    const deficitHours = analytics.totalHours - analytics.workedHours;
    const overWorkedHours = deficitHours < 0 ? Math.abs(deficitHours) : 0;

    analytics.deficitHours =
      deficitHours > 0 ? Number(deficitHours.toFixed(1)) : 0;
    analytics.overWorkedHours = Number(overWorkedHours.toFixed(1));

    const response = {
      data: updateData,
      analytics,
    };

    res.render("attendancetable", response);
  } catch (error) {
    next(httpErrors.InternalServerError(error.message));
  }
};

module.exports.UpdateAttendanceController = async (req, res, next) => {
  try {
    const { email, password, _id, isPresent, inTime, outTime } = req.body;
    if (email === "" || password === "" || _id === "") {
      return next(httpErrors.BadRequest("enter the fields"));
    }
    const isUserExist = await userModel.findOne({ email, password });
    if (!isUserExist) {
      return next(httpErrors.NotFound("email or password not match"));
    }
    let updateAttendance = null;
    if (isPresent === "true") {
      const query = { isPresent: true };
      if (inTime) {
        query.inTime = moment(inTime, "HH:mm").format();
      }
      if (outTime) {
        query.outTime = moment(outTime, "HH:mm").format();
      }
      updateAttendance = await attendacneModel.findByIdAndUpdate(_id, query, {
        new: true,
      });
    } else {
      updateAttendance = await attendacneModel.findByIdAndUpdate(
        _id,
        { $set: { isPresent: false }, $unset: { inTime: "", outTime: "" } },
        { new: true }
      );
    }

    if (!updateAttendance) {
      return next(
        httpErrors.NotFound("with given attendance id doucment is not found")
      );
    }
    res.status(200).json({
      success: true,
      message: "successfully updated the ",
      data: updateAttendance,
    });
  } catch (error) {
    next(httpErrors.InternalServerError(error.message));
  }
};

module.exports.AnalyticsController = async (req, res, next) => {
  try {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    const aggregation = [
      {
        $match: {
          attendanceDate: {
            $gte: startDate,
            $lte: endDate,
          },
          isPresent: true,
        },
      },
      // {
      //   $project: {
      //     _id: 0,
      //     timeDifference: {
      //       $divide: [
      //         {
      //           $subtract: ["$outTime", "$inTime"],
      //         },
      //         3600000,
      //       ],
      //     },
      //   },
      // },
    ];
    const data = await attendacneModel.aggregate(aggregation);
    // res.status(200).json({
    //   success: true,
    //   data,
    // });
    res.render("analysis", { analytics_data: data });
  } catch (error) {
    next(httpErrors.InternalServerError(error.message));
  }
};
