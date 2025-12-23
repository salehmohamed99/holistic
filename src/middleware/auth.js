const jwt = require("jsonwebtoken");
const Rooms = require("../models/rooms_model");

const authMiddlewareStudent = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const room = await Rooms.findOne({
      _id: decoded._id,
      "tokens.token": token,
    }).populate({
      path: "subjects",
      select: "_id subjectId name hours -rooms",
    });

    if (!room) {
      throw new Error();
    }
    req.token = token;
    req.room = room;
    next();
  } catch (e) {
    console.error(e);
    res.status(401).send({ error: true, data: "Please authenticate." });
  }
};

module.exports = {
  authMiddlewareStudent,
};
