const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Token = require("../models/tokenModel");

exports.login = async (req, res) => {
  const jwtSecret = process.env.JWT_SECRET;
  let token = null;
  console.log({
    jwtSecret,
  });
  let response = {
    statusCode: 200,
    message: "User successfully Logged in",
    data: [],
  };
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  console.log({ username, password });

  if (user) {
    if (user.isAdmin) {
      const result = await bcrypt.compare(password, user.password);
      if (result) {
        console.log({
          result,
        });
        const maxAge = 3 * 60 * 60;
        token = jwt.sign(
          {
            id: user._id,
            username,
            isAdmin: user.isAdmin,
            role: user.isAdmin ? "admin" : "user",
          },
          jwtSecret,
          {
            expiresIn: maxAge, // 3hrs in sec
          }
        );

        let tokenData = {
          token,
          userId: user._id,
        };

        // const target = await Token.findOne({ userId: user._id });
        // let tokenRes = null;
        // if (target) {
        //   tokenRes = await Token.findOneAndUpdate({ userId: user._id },{token}, {
        //     new: true,
        //     runValidators: true,
        //   });
        // } else {
        //   tokenRes = await Token.create(tokenData);
        // }

        // Allow up to 3 active tokens per admin
        let tokens = await Token.find({ userId: user._id }).sort({ createdAt: 1 });
        console.log({ tokens });

        if (tokens.length >= 5) {
          // Remove the oldest token to make space for a new one
          await Token.findByIdAndDelete(tokens[0]._id);
        }

        const tokenRes = await Token.create({
          token,
          userId: user._id,
        });

        console.log({ tokenRes });
        res.cookie("jwt", token, {
          // httpOnly: true,
          maxAge: maxAge * 1000, // 3hrs in ms
        });

        response = {
          statusCode: 200,
          status: "success",

          data: user,
        };
      } else {
        response = {
          statusCode: 400,
          status: "error",
          message: "invalid credentials",
          data: [],
        };
      }
    } else {
      response = {
        statusCode: 403,
        status: "error",
        message: "you don't have permission to access",
        data: [],
      };
    }
  } else {
    response = {
      statusCode: 400,
      status: "error",
      message: "invalid credentials",
      data: [],
    };
  }

  res.status(response.statusCode).json({
    status: response.status,
    message: response.message,
    data: {
      id: response.data.id,
      name: response.data.name,
      username: response.data.username,
      token,
    },
  });
};

exports.logout = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.decode(token);

  const { id } = decoded;
  // const userRes = await  Token.deleteOne({"userId": id});
  const userRes = await Token.deleteOne({ token });

  console.log({ decoded, userRes });
  let response = {
    statusCode: 200,
    message: "User successfully Logged out",
  };

  res.status(response.statusCode).json({
    status: response.status,
    message: response.message,
  });
};


exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Get user from token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ status: "error", message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: "error", message: "Old password is incorrect" });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Something went wrong" });
  }
};

