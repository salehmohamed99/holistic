const User = require("../models/userModel");
const Message = require("../models/messageModel");
const axios = require("axios").default;
const axiosHelper = require("../helpers/axiosHelper");
const bcrypt = require("bcryptjs");
const BlackList = require("../models/blackListModel");
const schedule = require("../jobs/scheduleJobs");
const OrderID = require("../models/OrderIDModel");

exports.index = async (req, res) => {
  let response = {
    statusCode: 200,
    body: null,
  };

  try {
    const indexes = await User.collection.indexes();
    console.log("=====> Current indexes : ", indexes);

    const hasNameIndex = indexes.some(index => index.key.name);
    const hasPhoneNumberIndex = indexes.some(index => index.key.phone_number);
    const hasPlatformIndex = indexes.some(index => index.key.platform);


    if (!hasNameIndex) {
      // await User.createIndex({ name: 1 });
      console.log("Index on 'name' created.");
    } else {
      console.log("Index on 'name' already exists.");
    }

    if (!hasPhoneNumberIndex) {
      // await User.createIndex({ phone_number: 1 });
      console.log("Index on 'phone_number' created.");
    } else {
      console.log("Index on 'phone_number' already exists.");
    }

    if (!hasPlatformIndex) {
      await User.createIndex({ platform: 1 });
      console.log("Index on 'platform' created.");
    } else {
      console.log("Index on 'platform' already exists.");
    }
    // const whatsappPlatform = await User.find({ platform: 'whatsapp'}).populate({path: 'messages',  model: Message, options: { sort: [{"createdAt": -1}],limit: 1}}).exec();
    const page = parseInt(req.query.page) || 1; // Current page, default to 1
    const limit = parseInt(req.query.limit) || 10; // Number of items per page, default to 10
    const search = req.query.search || "";

    const { users, totalCount, totalPages } = await this.getUsersWithPagination(
      page,
      limit,
      search
    );
    // const users = await this.getUsers();
    response.statusCode = 200;
    response.body = {
      reqAt: req.reqTime,
      status: "success",
      results: users.length,
      data: {
        users,
        totalCount,
        totalPages,
      },
    };
  } catch (err) {
    response.statusCode = 404;
    response.body = {
      status: "fail",
      message: err,
    };
  } finally {
    res.status(response.statusCode).json(response.body);
  }
};


exports.getUsers_t = async (search) => {
  const matchStageWhatsapp = search
    ? {
        platform: "whatsapp",
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
      }
    : { platform: "whatsapp" };

  // const matchStageInstagram = search
  //   ? {
  //       platform: "instagram",
  //       $or: [
  //         { name: { $regex: search, $options: "i" } },
  //         { phone_number: { $regex: search, $options: "i" } },
  //       ],
  //     }
  //   : { platform: "instagram" };

  const performAggregation = async (matchStage) => {
    return await User.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$from", "$$userId"] },
                    { $eq: ["$to", "$$userId"] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "messages",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          phone_number: 1,
          added_from: 1,
          messages: 1,
        },
      },
    ]);
  };

  const whatsappPlatform = await performAggregation(matchStageWhatsapp);
  // const instagramPlatform = await performAggregation(matchStageInstagram);

  const mapResults = (items) => {
    return items.map((item) => ({
      id: item._id,
      name: item.name,
      phone_number: item.phone_number,
      added_from: item.added_from,
      messages: item.messages || [],
    }));
  };

  const users = {
    whatsapp: mapResults(whatsappPlatform),
    instagram: [],
  };

  return users;
};

exports.getUsers = async (search, options = { limit: 100, useDenormalized: false }) => {
  const { limit, useDenormalized } = options;

  // Match stage for search
  const matchStage = search
    ? {
        platform: "whatsapp",
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
      }
    : { platform: "whatsapp" };

  if (useDenormalized) {
    // ✅ Fast query using lastMessage field
    const users = await User.find(matchStage)
      .select("name phone_number added_from lastMessage")
      .sort({ "lastMessage.createdAt": -1 })
      .limit(limit)
      .lean();

    return {
      whatsapp: users.map((u) => ({
        id: u._id,
        name: u.name,
        phone_number: u.phone_number,
        added_from: u.added_from,
        messages: u.lastMessage ? [u.lastMessage] : [],
      })),
      instagram: [],
    };
  } else {
    // 🔹 Current method with $lookup but limited for performance
    const performAggregation = async (matchStage) => {
      return await User.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } }, // ensure index on createdAt
        { $limit: limit },            // only top N users
        {
          $lookup: {
            from: "messages",
            let: { userId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$from", "$$userId"] },
                      { $eq: ["$to", "$$userId"] },
                    ],
                  },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: "messages",
          },
        },
        { $unwind: { path: "$messages", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            name: 1,
            phone_number: 1,
            added_from: 1,
            messages: 1,
          },
        },
      ]);
    };

    const whatsappPlatform = await performAggregation(matchStage);

    return {
      whatsapp: whatsappPlatform.map((item) => ({
        id: item._id,
        name: item.name,
        phone_number: item.phone_number,
        added_from: item.added_from,
        messages: item.messages ? [item.messages] : [],
      })),
      instagram: [],
    };
  }
};


exports.getUsers_old = async (search) => {

  let matchStage = {};
    if (search == "") {
      matchStage = {
        platform: "whatsapp",
      };
    } else {
      matchStage = {
        platform: "whatsapp",
        $or: [
          { name: { $regex: search, $options: "i" } }, // Case-insensitive search on name
          { phone_number: { $regex: search, $options: "i" } }, // Case-insensitive search on phone_number
        ],
      };
    }

  const whatsappPlatform = await User.aggregate([
    { $match: matchStage },
      {
        $lookup: {
          from: "messages", //must be collection name for posts
          localField: "_id",
          foreignField: "from",

          as: "messages",
        },
      },
      {
        $lookup: {
          from: "messages", //must be collection name for posts
          localField: "_id",

          foreignField: "to",

          as: "messages_",
        },
      },
    ]);
    // whatsappPlatform = whatsappPlatform.map(user => user
    // const instagramPlatform = await User.find({ platform: 'instagram'}).populate({path: 'messages',options: { sort: [{"createdAt": -1}],limit: 1}}).exec();

    // const instagramPlatform = await User.aggregate([
    //   {
    //     $match: {
    //       platform: "instagram",
    //       $or: [
    //         { name: { $regex: search, $options: "i" } }, // Case-insensitive search on name
    //         { phone_number: { $regex: search, $options: "i" } }, // Case-insensitive search on phone_number
    //       ],
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "messages", //must be collection name for posts
    //       localField: "_id",
    //       foreignField: "from",

    //       as: "messages",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "messages", //must be collection name for posts
    //       localField: "_id",

    //       foreignField: "to",

    //       as: "messages_",
    //     },
    //   },
    // ]);

    const users = {
      whatsapp: whatsappPlatform.map((item) => {
        return {
          id: item._id,
          name: item.name,
          phone_number: item.phone_number,
          added_from: item.added_from,
          messages: item.messages.concat(item.messages_).sort(sortObj)[0]
            ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
            : [],
        };
      }),
      // instagram: instagramPlatform.map((item) => {
      //   return {
      //     id: item._id,
      //     name: item.name,
      //     phone_number: item.phone_number,
      //     messages: item.messages.concat(item.messages_).sort(sortObj)[0]
      //       ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
      //       : [],
      //   };
      // }),
      instagram: []
    };
  return users;
}

exports.getUsersFrom = async (from) => {
  const whatsappPlatform = await User.aggregate([
    {
      $match: {
        platform: "whatsapp",
        added_from: from,
      },
    },
    {
      $lookup: {
        from: "messages", //must be collection name for posts
        localField: "_id",
        foreignField: "from",

        as: "messages",
      },
    },
    {
      $lookup: {
        from: "messages", //must be collection name for posts
        localField: "_id",

        foreignField: "to",

        as: "messages_",
      },
    },
  ]);
  // whatsappPlatform = whatsappPlatform.map(user => user
  // const instagramPlatform = await User.find({ platform: 'instagram'}).populate({path: 'messages',options: { sort: [{"createdAt": -1}],limit: 1}}).exec();

  const users = {
    whatsapp: whatsappPlatform.map((item) => {
      return {
        id: item._id,
        name: item.name,
        phone_number: item.phone_number,
        added_from: item.added_from,
        messages: item.messages.concat(item.messages_).sort(sortObj)[0]
          ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
          : [],
      };
    }),
  };
  return users;
};


exports.getUsersWithPagination = async (
  page = 1,
  limit = 10,
  search = "",
  options = { useDenormalized: false }
) => {
  const skip = (page - 1) * limit;
  const { useDenormalized } = options;

  // Build match stage for filtering users by platform and search
  const matchStage = search
    ? {
        platform: "whatsapp",
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
      }
    : { platform: "whatsapp" };

  if (useDenormalized) {
    // Fast path using denormalized lastMessage field if available
    const totalCount = await User.countDocuments(matchStage);
    const totalPages = Math.ceil(totalCount / limit);

    const usersData = await User.find(matchStage)
      .select("name phone_number added_from lastMessage")
      .sort({ "lastMessage.createdAt": -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const users = {
      whatsapp: usersData.map((u) => ({
        id: u._id,
        name: u.name,
        phone_number: u.phone_number,
        added_from: u.added_from,
        lastMessage: u.lastMessage || null,
      })),
    };

    return { users, totalCount, totalPages };
  } else {
    // Count total users for pagination
    const countPipeline = [{ $match: matchStage }, { $count: "totalCount" }];
    const [{ totalCount } = { totalCount: 0 }] = await User.aggregate(countPipeline);
    const totalPages = Math.ceil(totalCount / limit);

    // Aggregation pipeline to get users with last message (sent or received), sorted by last message date desc
    const whatsappPipeline = [
      { $match: matchStage },

      // Last sent message lookup
      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$from", "$$userId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { content: 1, createdAt: 1, from: 1, to: 1, status: 1 } },
          ],
          as: "lastSentMessage",
        },
      },

      // Last received message lookup
      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$to", "$$userId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { content: 1, createdAt: 1, from: 1, to: 1, status: 1 } },
          ],
          as: "lastReceivedMessage",
        },
      },

      // Flatten arrays to single objects
      {
        $addFields: {
          lastSentMessage: { $arrayElemAt: ["$lastSentMessage", 0] },
          lastReceivedMessage: { $arrayElemAt: ["$lastReceivedMessage", 0] },
        },
      },

      // Determine lastMessage as the newer of sent or received
      {
        $addFields: {
          lastMessage: {
            $cond: [
              {
                $gt: [
                  { $ifNull: ["$lastSentMessage.createdAt", new Date(0)] },
                  { $ifNull: ["$lastReceivedMessage.createdAt", new Date(0)] },
                ],
              },
              "$lastSentMessage",
              "$lastReceivedMessage",
            ],
          },
        },
      },

      // Remove temp fields and sensitive info
      {
        $project: {
          lastSentMessage: 0,
          lastReceivedMessage: 0,
          password: 0,
          messages: 0,
          __v: 0,
        },
      },

      // Sort by lastMessage date descending (users with no messages go last)
      {
        $sort: { "lastMessage.createdAt": -1, _id: 1 },
      },

      // Pagination
      { $skip: skip },
      { $limit: limit },
    ];

    const usersData = await User.aggregate(whatsappPipeline);

    const users = {
      whatsapp: usersData.map((user) => ({
        id: user._id,
        name: user.name,
        phone_number: user.phone_number,
        added_from: user.added_from,
        messages: user.lastMessage ? [user.lastMessage] : [],
      })),
    };

    return { users, totalCount, totalPages };
  }
};



exports.getUsersWithPagination_olddd = async (
  page = 1,
  limit = 10,
  search = "",
  options = { useDenormalized: false }
) => {
  const skip = (page - 1) * limit;
  const { useDenormalized } = options;

  const matchStage = search
    ? {
        platform: "whatsapp",
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone_number: { $regex: search, $options: "i" } },
        ],
      }
    : { platform: "whatsapp" };

  if (useDenormalized) {
    // ✅ Fast query using lastMessage
    const totalCount = await User.countDocuments(matchStage);
    const totalPages = Math.ceil(totalCount / limit);

    const usersData = await User.find(matchStage)
      .select("name phone_number added_from lastMessage")
      .sort({ "lastMessage.createdAt": -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const users = {
      whatsapp: usersData.map((u) => ({
        id: u._id,
        name: u.name,
        phone_number: u.phone_number,
        added_from: u.added_from,
        messages: u.lastMessage ? [u.lastMessage] : [],
      })),
    };

    return { users, totalCount, totalPages };
  } else {
    // 🔹 Lookup-based aggregation with limit
    const countPipeline = [{ $match: matchStage }, { $count: "totalCount" }];
    const [{ totalCount } = { totalCount: 0 }] = await User.aggregate(countPipeline);
    const totalPages = Math.ceil(totalCount / limit);

    const whatsappPipeline = [
      { $match: matchStage },
      // { $sort: { createdAt: -1 } }, // sort users by creation time
    
      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$from", "$$userId"] },
                    { $eq: ["$to", "$$userId"] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "recentMessage",
        },
      },
      { $unwind: { path: "$recentMessage", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          phone_number: 1,
          added_from: 1,
          messages: "$recentMessage",
        },
      },

        { $skip: skip },
      { $limit: limit },
    ];

    const whatsappPlatform = await User.aggregate(whatsappPipeline);

    const users = {
      whatsapp: whatsappPlatform.map((item) => ({
        id: item._id,
        name: item.name,
        phone_number: item.phone_number,
        added_from: item.added_from,
        messages: item.messages ? [item.messages] : [],
      })),
    };

    return { users, totalCount, totalPages };
  }
};


exports.getUsersWithPagination_n = async (page = 1, limit = 10, search = "") => {
  const skip = (page - 1) * limit;

  try {
    const matchStage = search
      ? {
          platform: "whatsapp",
          $or: [
            { name: { $regex: search, $options: "i" } },
            { phone_number: { $regex: search, $options: "i" } },
          ],
        }
      : { platform: "whatsapp" };

    // Count total users first
    const [{ totalCount } = { totalCount: 0 }] = await User.aggregate([
      { $match: matchStage },
      { $count: "totalCount" },
    ]);
    const totalPages = Math.ceil(totalCount / limit);

    // Apply skip/limit BEFORE lookup
    const whatsappPipeline = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } }, // sort by user creation time (fast with index)
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$from", "$$userId"] },
                    { $eq: ["$to", "$$userId"] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "recentMessage",
        },
      },
      { $unwind: { path: "$recentMessage", preserveNullAndEmptyArrays: true } },
    ];

    const whatsappPlatform = await User.aggregate(whatsappPipeline);

    const users = {
      whatsapp: whatsappPlatform.map((item) => ({
        id: item._id,
        name: item.name,
        phone_number: item.phone_number,
        added_from: item.added_from,
        messages: item.recentMessage ? [item.recentMessage] : [],
      })),
    };

    return { users, totalCount, totalPages };
  } catch (error) {
    console.error("Error fetching users with pagination:", error);
    throw new Error("Error fetching users with pagination: " + error.message);
  }
};


exports.getUsersWithPagination_tt = async (page = 1, limit = 10, search = "") => {
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  try {
    // Define the match stage based on the search parameter
    const matchStage = search
      ? {
          platform: "whatsapp",
          $or: [
            { name: { $regex: search, $options: "i" } },
            { phone_number: { $regex: search, $options: "i" } },
          ],
        }
      : { platform: "whatsapp" };

    // Define the aggregation pipeline for counting documents
    const countPipeline = [
      { $match: matchStage },
      { $count: "totalCount" }
    ];

    // Execute the aggregation pipeline to get the total count
    const [{ totalCount } = { totalCount: 0 }] = await User.aggregate(countPipeline);

    // Calculate total pages based on the pagination limit
    const totalPages = Math.ceil(totalCount / limit);

    // Define the aggregation pipeline for fetching users with pagination
    // const whatsappPipeline = [
    //   { $match: matchStage },
    //   // {
    //   //   $lookup: {
    //   //     from: "messages",
    //   //     let: { userId: "$_id" },
    //   //     pipeline: [
    //   //       { $match: { $expr: { $or: [{ $eq: ["$from", "$$userId"] }, { $eq: ["$to", "$$userId"] }] } } },
    //   //     ],
    //   //     as: "messages",
    //   //   },
    //   // },
    //   {
    //     $addFields: {
    //       totalMessages: { $size: "$messages" },
    //     },
    //   },
    //   { $sort: { totalMessages: -1 } }, // Sort by total message count
    //   { $skip: skip },
    //   { $limit: limit },
    //   // {
    //   //   $project: {
    //   //     name: 1,
    //   //     phone_number: 1,
    //   //     added_from: 1,
    //   //     totalMessages: 1,
    //   //     messages: "$messages",
    //   //   },
    //   // },
    // ];

    const whatsappPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$from", "$$userId"] },
                    { $eq: ["$to", "$$userId"] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: "recentMessage"
        }
      },
      {
        $unwind: {
          path: "$recentMessage",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: {
          "recentMessage.createdAt": -1
        }
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name: 1,
          phone_number: 1,
          added_from: 1,
          recentMessage: 1,
          messages: "$recentMessage",
        },
      },
    ];
    // const whatsappPipeline = [
    //   { $match: matchStage },
    //   { $skip: skip },
    //   { $limit: limit },
    //   {
    //     $lookup: {
    //       from: "messages",
    //       let: { userId: "$_id" },
    //       pipeline: [
    //         { $match: { $expr: { $or: [{ $eq: ["$from", "$$userId"] }, { $eq: ["$to", "$$userId"] }] } } },
    //         { $sort: { createdAt: -1 } },
    //         { $limit: 1 }
    //       ],
    //       as: "recentMessage"
    //     }
    //   },
    //   {
    //     $addFields: {
    //       recentMessage: { $arrayElemAt: ["$recentMessage", 0] }
    //     }
    //   },
    //   { $sort: { "recentMessage.createdAt": -1 } }, // Sort by the creation date of the most recent message
    //   {
    //     $project: {
    //       name: 1,
    //       phone_number: 1,
    //       added_from: 1,
    //       recentMessage: 1,
    //       messages: "$recentMessage",
    //     },
    //   },
    // ];

    // const whatsappPipeline = [
    //   { $match: matchStage },
    //   {
    //     $lookup: {
    //       from: "messages",
    //       let: { userId: "$_id" },
    //       pipeline: [
    //         { $match: { $expr: { $or: [{ $eq: ["$from", "$$userId"] }, { $eq: ["$to", "$$userId"] }] } } },
    //         { $sort: { createdAt: -1 } },
    //         { $limit: 1 }
    //       ],
    //       as: "recentMessage"
    //     }
    //   },
    //   {
    //     $addFields: {
    //       recentMessage: { $arrayElemAt: ["$recentMessage", 0] },
    //     }
    //   },
    //   {
    //     $sort: { "recentMessage.createdAt": -1 } // Sort by the creation date of the most recent message
    //   },
    //   { $skip: skip },
    //   { $limit: limit },
    //   {
    //     $project: {
    //       name: 1,
    //       phone_number: 1,
    //       added_from: 1,
    //       totalMessages: { $size: "$recentMessage" },
    //       recentMessage: 1,
    //     },
    //   },
    // ];

    // Execute the aggregation pipeline with pagination
    const whatsappPlatform = await User.aggregate(whatsappPipeline);
    // const userRecentMessagesPipeline = [
    //   { $match: matchStage },
    //   {
    //     $lookup: {
    //       from: "userRecentMessages",
    //       localField: "_id",
    //       foreignField: "_id",
    //       as: "recentMessageData"
    //     }
    //   },
    //   {
    //     $addFields: {
    //       recentMessage: { $arrayElemAt: ["$recentMessageData.recentMessage", 0] }
    //     }
    //   },
    //   { $sort: { "recentMessage.createdAt": -1 } }, // Sort by the creation date of the most recent message
    //   { $skip: skip },
    //   { $limit: limit },
    //   {
    //     $project: {
    //       name: 1,
    //       phone_number: 1,
    //       added_from: 1,
    //       recentMessage: 1,
    //     },
    //   },
    // ];

    // Execute the aggregation pipeline with pagination
    // const whatsappPlatform = await User.aggregate(userRecentMessagesPipeline);

    const users = {
      whatsapp: whatsappPlatform.map((item) => ({
        id: item._id,
        name: item.name,
        phone_number: item.phone_number,
        added_from: item.added_from,
        // totalMessages: item.totalMessages,
        messages: item.recentMessage ? [item.recentMessage] : [],

          // messages: item.messages.sort(sortObj)[0]
          // ? [item.messages.sort(sortObj)[0]]
          // : [],
      })),
    };

    return { users, totalCount, totalPages };
  } catch (error) {
    console.error("Error fetching users with pagination:", error);
    throw new Error("Error fetching users with pagination: " + error.message);
  }
};
exports.getUsersWithPagination_t = async (page = 1, limit = 10, search = "") => {
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  try {
    // Define the match stage for whatsapp platform
    const matchStage = search
      ? {
          platform: "whatsapp",
          $or: [
            { name: { $regex: search, $options: "i" } },
            { phone_number: { $regex: search, $options: "i" } },
          ],
        }
      : { platform: "whatsapp" };

    // Define the aggregation pipeline for counting documents
    const countPipeline = [
      { $match: matchStage },
      { $count: "totalCount" }
    ];

    // Execute the aggregation pipeline to get the total count
    const countResult = await User.aggregate(countPipeline);
    const totalCount = countResult[0] ? countResult[0].totalCount : 0;

    // Calculate total pages based on the pagination limit
    const totalPages = Math.ceil(totalCount / limit);

    // Define the aggregation pipeline for whatsapp platform
    const whatsappPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "from",
          as: "messages",
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "to",
          as: "messages_",
        },
      },
      {
        $addFields: {
          totalMessages: {
            $size: { $concatArrays: ["$messages", "$messages_"] },
          },
        },
      },
      { $sort: { totalMessages: -1 } }, // Sort by total message count
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name: 1,
          phone_number: 1,
          added_from: 1,
          totalMessages: 1,
          messages: { $concatArrays: ["$messages", "$messages_"] },
        },
      },
    ];

    // Execute the aggregation pipeline with pagination
    const whatsappPlatform = await User.aggregate(whatsappPipeline);

    // Map the results and format them as needed
    const users = {
      whatsapp: whatsappPlatform.map((item) => ({
        id: item._id,
        name: item.name,
        phone_number: item.phone_number,
        added_from: item.added_from,
        totalMessages: item.totalMessages,
        messages: item.messages.sort(sortObj)[0]
          ? [item.messages.sort(sortObj)[0]]
          : [],
      })),
    };

    return { users, totalCount, totalPages };
  } catch (error) {
    console.error("Error fetching users with pagination:", error);
    throw new Error("Error fetching users with pagination: " + error.message);
  }
};
exports.getUsersWithPagination_o = async (page = 1, limit = 10, search = "") => {
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  try {
    // Define the match stage for whatsapp platform
    const matchStage = search
      ? {
          platform: "whatsapp",
          $or: [
            { name: { $regex: search, $options: "i" } },
            { phone_number: { $regex: search, $options: "i" } },
          ],
        }
      : { platform: "whatsapp" };

    // Query to get total count of documents in the collection for whatsapp platform
    const totalCount = await User.countDocuments(matchStage);

    // Calculate total pages based on the pagination limit
    const totalPages = Math.ceil(totalCount / limit);

    // Define the aggregation pipeline for whatsapp platform
    const whatsappPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "from",
          as: "messages",
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "to",
          as: "messages_",
        },
      },
      {
        $addFields: {
          totalMessages: {
            $size: { $concatArrays: ["$messages", "$messages_"] },
          },
        },
      },
      { $sort: { totalMessages: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    // Execute the aggregation pipeline with pagination
    const whatsappPlatform = await User.aggregate(whatsappPipeline);

    // Map the results and format them as needed
    const users = {
      whatsapp: whatsappPlatform.map((item) => ({
        id: item._id,
        name: item.name,
        phone_number: item.phone_number,
        added_from: item.added_from,
        totalMessages: item.totalMessages,
        messages: item.messages.concat(item.messages_).sort(sortObj)[0]
          ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
          : [],
      })),
    };

    return { users, totalCount, totalPages };
  } catch (error) {
    throw new Error("Error fetching users with pagination: " + error.message);
  }
};

exports.getUsersWithPagination_old = async (page = 1, limit = 10, search = "") => {
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  try {
    let matchStage = {};
    if (search == "") {
      matchStage = {
        platform: "whatsapp",
      };
    } else {
      matchStage = {
        platform: "whatsapp",
        $or: [
          { name: { $regex: search, $options: "i" } }, // Case-insensitive search on name
          { phone_number: { $regex: search, $options: "i" } }, // Case-insensitive search on phone_number
        ],
      };
    }

    // Query to get total count of documents in the collection
    const totalCount = await User.countDocuments(matchStage);

    // Calculate total pages based on the pagination limit
    const totalPages = Math.ceil(totalCount / limit);

    // Define the aggregation pipeline for whatsapp platform
    const whatsappPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "from",
          as: "messages",
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "to",
          as: "messages_",
        },
      },
      {
        $addFields: {
          totalMessages: {
            $size: { $concatArrays: ["$messages", "$messages_"] },
          },
        },
      },
      {
        $sort: { totalMessages: -1 }, // Sort by total message count in descending order
      },
      {
        $skip: skip, // Skip documents based on pagination
      },
      {
        $limit: limit, // Limit the number of documents per page
      },
    ];

    // Define the aggregation pipeline for instagram platform
    const instagramPipeline = [
      {
        $match: {
          platform: "instagram",
          $or: [
            { name: { $regex: search, $options: "i" } }, // Case-insensitive search on name
            { phone_number: { $regex: search, $options: "i" } }, // Case-insensitive search on phone_number
          ],
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "from",
          as: "messages",
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "to",
          as: "messages_",
        },
      },
      {
        $addFields: {
          totalMessages: {
            $size: { $concatArrays: ["$messages", "$messages_"] },
          },
        },
      },
      {
        $sort: { totalMessages: -1 }, // Sort by total message count in descending order
      },
      {
        $skip: skip, // Skip documents based on pagination
      },
      {
        $limit: limit, // Limit the number of documents per page
      },
    ];

    // Execute the aggregation pipelines with pagination
    // const [whatsappPlatform, instagramPlatform] = await Promise.all([
    //   User.aggregate(whatsappPipeline),
    //   User.aggregate(instagramPipeline),
    // ]);
    const [whatsappPlatform] = await User.aggregate(whatsappPipeline);
      

    // Map the results and format them as needed
    const users = {
      whatsapp: whatsappPlatform.map((item) => {
        return {
          id: item._id,
          name: item.name,
          phone_number: item.phone_number,
          added_from: item.added_from,
          totalMessages: item.totalMessages,
          messages: item.messages.concat(item.messages_).sort(sortObj)[0]
            ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
            : [],
        };
      }),
      // instagram: instagramPlatform.map((item) => {
      //   return {
      //     id: item._id,
      //     name: item.name,
      //     phone_number: item.phone_number,
      //     totalMessages: item.totalMessages,

      //     messages: item.messages.concat(item.messages_).sort(sortObj)[0]
      //       ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
      //       : [],
      //   };
      // }),

      instagram: []
    };

    return { users, totalCount, totalPages };
  } catch (error) {
    throw new Error("Error fetching users with pagination");
  }
};
exports.create_admin = async (req, res) => {
  const {
    name,
    platform,
    phone_number,
    username,
    password,
    super_admin_key,
    added_from,
  } = req.body;

  let response = {
    statusCode: 200,
    status: "success",
    message: "",
    data: [],
  };
  if (super_admin_key === process.env.SUPER_ADMIN_KEY) {
    console.log({
      name,
      platform,
      pass: await bcrypt.hash(password, 10),
      phone_number,
      username,
      password,
      super_admin_key,
    });
    const isAdmin = await User.findOne({ isAdmin: true });

    if (isAdmin) {
      response.message = "user is exist";
    } else {
      const user = await User.create({
        name,
        platform,
        password: await bcrypt.hash(password, 10),
        phone_number,
        username,
        isAdmin: true,
        added_from,
      });
      response.data = {
        name: user.name,
        username: user.username,
      };
    }
  } else {
    response = {
      statusCode: 403,
      status: "error",
      message: "",
      data: [],
    };
  }

  res.status(response.statusCode).json({
    status: response.status,
    data: response.data,
  });
};

exports.get_admin = async (req, res) => {
  const data = await this.getAdmin();
  let response = {
    statusCode: 200,
    status: "success",
    data,
  };
  res.status(response.statusCode).json({
    status: response.status,
    data: response.data,
  });
};

exports.getAdmin = async () => {
  const user = await User.find({ platform: "admin" });
  const data = user.map((item) => {
    return {
      id: item._id,
      name: item.name,
      phone_number: item.phone_number,
    };
  });

  return data;
};

exports.show_old = async (req, res) => {
  const admin = await User.findOne({ platform: "admin" });
  const message = await Message.updateMany(
    { from: req.params.id, to: admin._id },
    { seen: true },
    {
      new: true,
      runValidators: true,
    }
  );

  let { page, limit } = req.query;

  limit = limit ? limit : 10;
  page = page ? (page - 1) * limit : 0;

  const user = await User.find({ _id: req.params.id }).populate({
    path: "messages",
    options: {
      sort: { createdAt: -1 },
      skip: page,
      limit,
    },
    populate: {
      path: "parent",
      model: "Message",
    },
  });
  console.log({ user});

  let shara = await OrderID.findOne({ from: { $regex: user[0].phone_number, $options: "i" } });
  console.log({ shara});
  let response = {
    statusCode: 200,
    status: "success",
    data: user.map((item) => {
      return {
        id: item._id,
        name: item.name,
        phone_number: item.phone_number,
        chatMode: shara ? shara.chat : 'off',
        messages: item.messages,
      };
    }),
  };
  res.status(response.statusCode).json({
    status: response.status,
    data: response.data,
  });
};


exports.show = async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    // 1️⃣ Fetch the user first (we need phone number)
    const user = await User.findById(userId)
      .select("name phone_number messages")
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, skip, limit },
        select: "_id type content createdAt from to parent status is_scheduled",
        populate: { path: "parent", model: "Message", select: "content createdAt" },
      });

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    // 2️⃣ Now run the rest in parallel (admin + update seen + shara lookup)
    const [admin, shara] = await Promise.all([
      User.findOne({ platform: "admin" }).select("_id name"),

      OrderID.findOne({
        from: { $regex: user.phone_number, $options: "i" }
      })
    ]);

    // 3️⃣ Mark unseen messages as seen now that we have admin ID
    await Message.updateMany(
      { from: userId, to: admin._id, seen: false },
      { $set: { seen: true } }
    );

    // 4️⃣ Prepare response
    const response = {
      statusCode: 200,
      status: "success",
      data: [
        {
          id: user._id,
          name: user.name,
          phone_number: user.phone_number,
          chatMode: shara ? shara.chat : "off",
          messages: user.messages,
        },
      ],
    };

    return res.status(200).json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};


exports.store = async (req, res) => {
  try {
    console.log({ body: req.body });
    const newItem = await User.create(req.body);
    res.status(201).json({
      status: "success",

      data: {
        message: newItem,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.update = async (req, res) => {
  let response = {
    statusCode: 200,
    body: null,
  };

  try {
    const userUdated = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    const user = await User.find({ _id: req.params.id }).populate("messages");

    let data = user.map((item) => {
      return {
        id: item._id,
        name: item.name,
      };
    });
    response.body = {
      status: "success",
      data,
    };
  } catch (err) {
    response.statusCode = 404;
    response.status = "fail";
    response.message = err;

    response.body = {
      status: "fail",
      message: err,
    };
  } finally {
    res.status(response.statusCode).json(response.body);
  }
};

exports.delete = (req, res) => {
  let response = {
    statusCode: 200,
    status: "success",
    data: "deleted",
  };
  res.status(response.statusCode).json({
    status: response.status,
    data: response.data,
  });
};

exports.reset = async (req, res) => {
  let response = {
    statusCode: 200,
    status: "success",
    data: "reset",
  };

  const { added_from } = req.body;
  let responseData = null;
  if (added_from) {
    //  responseData = await User.deleteMany({ added_from });
    let usersToRemove = [];
    if (added_from === "all") {
      usersToRemove = await User.find({ isAdmin: false });
      responseData = await User.deleteMany({ isAdmin: false });
    } else {
      usersToRemove = await User.find({ added_from });
      responseData = await User.deleteMany({ added_from });
    }
    const messageIdsToRemove = usersToRemove.flatMap((user) => user.messages);
    await Message.deleteMany({ _id: { $in: messageIdsToRemove } });
    response.data = `${added_from} users reset successfully`;
  } else {
    response.statusCode = 400;
    (response.status = "failed"),
      (response.data = "Please add added from variable");
  }
  console.log({
    added_from,
    // responseData
  });

  res.status(response.statusCode).json({
    status: response.status,
    data: response.data,
  });
};

exports.import = async (req, res) => {
  try {
    const { data } = req.body;

    let response = [];

    console.log({ data });
    // data.forEach(async (item) => {
    response = await insertUsers(data, "excel_sheet");

    //
    // })

    res.status(201).json({
      status: "success",

      data: response,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.import_url = async (req, res) => {
  try {
    const { url } = req.body;

    let response = [];
    const resData = await axiosHelper.get(url);
    let filteredDta = [];

    let isSuccess = resData["data"]["success"];
    let data = resData["data"]["data"];

    if(isSuccess)
      schedule.importURL(data);
    //     data.forEach(async (item) => {
    //       if (
    //         item.name &&
    //         item.mobile &&
    //         item.name != "null" &&
    //         item.mobile != "null"
    //       ) {
    //         filteredDta.push([item.name, item.mobile]);
    //       }
    //     });

    //     console.log(filteredDta);

    //     response = await insertUsers(filteredDta, 'url');

    //
    // })

    if(isSuccess)
    res.status(201).json({
      status: "success",
      messages: ["users imported in backend"],
    });
    else
      res.status(400).json({
      status: "falied",
      messages: ["error in url"],
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

async function insertUsers(data, addedFrom) {
  let response = {
    messages: [],
    existedCount: 0,
    createdCount: 0,
  };
  let preparedData = {
    name: "",
    username: "",
    phone_number: "",
    platform: "whatsapp",
    isAdmin: false,
    added_from: addedFrom,
  };

  for (let idx = 0; idx < data.length; idx++) {
    console.log({ data: data[idx][0] });

    if (data[idx][0] && data[idx][0] !== undefined) {
      preparedData = {
        name: data[idx][0],
        user_name: data[idx][0],
        phone_number: data[idx][1],
        platform: "whatsapp",
        isAdmin: false,
        added_from: addedFrom,
      };
      console.log({ preparedData });

      const isExist = await User.findOne({
        phone_number: data[idx][1],
        platform: "whatsapp",
      });

      console.log({
        isExist,
      });

      if (isExist) {
        response.messages.push(`${data[idx][0]}: exists before`);
        response.existedCount += 1;
      } else {
        try {
          const newItem = await User.create(preparedData);
          response.messages.push(`${data[idx][0]}: created successfully`);
          response.createdCount += 1;
        } catch (err) {
          response.messages.push(`${data[idx][0]}: error in create`);
        }
      }
    }
  }

  return response;
}

function sortObj(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1;
  }
  if (a.createdAt < b.createdAt) {
    return 1;
  }
  return 0;
}

exports.listBlackListUsers = async (req, res) => {
  try {
    let { page, limit } = req.query;
    limit = limit ? +limit : 10;
    // page = page ? (+page - 1) * limit : 0;
    const skip = (+page - 1) * limit;

    let response = [];
    const list = await BlackList.find().limit(limit).skip(skip);

    const total_documents = await BlackList.countDocuments();

    const previous_pages = page - 1;
    const next_pages = Math.ceil(total_documents / limit);

    console.log({ page, limit });

    res.status(200).json({
      status: "success",
      page: +page,
      size: limit,
      data: list,
      previous: previous_pages,
      next: next_pages,
    });
  } catch (err) {
    console.log({ err });
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
exports.addedFrom = async (req, res) => {
  try {
    let { from } = req.params;
    let users = [];

    let response = [];
    if (from == "all") users = await User.find();
    else
      users = await User.find({
        added_from: from,
      });

    let data = users.map((item) => {
      return {
        id: item._id,
        name: item.name,
        added_from: item.added_from
      };
    });

    console.log({
      from,
      data,
    });

    res.status(200).json({
      status: "success",
      data,
    });
  } catch (err) {
    console.log({ err });
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.addedFromCampaigns = async (req, res) => {
  try {
    console.log({ body: req.body });
    let campaigns = req.body;
    let users = [];

    //     let response = [];
    users = await User.find({ added_from: { $in: campaigns } });

    let data = users.map((item) => {
      return {
        id: item._id,
        name: item.name,
      };
    });

    console.log({
      campaigns,
      data,
    });

    res.status(200).json({
      status: "success",
      data,
      // data
    });
  } catch (err) {
    console.log({ err });
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.campaigns = async (req, res) => {
  try {
    let { campaign } = req.params;
    let url = "";
    let response = [];

    switch (campaign) {
      case "30-days-without-orders":
        url = "https://pos.delipizza.online/contacts/without-transactions";
        break;
    }

    const users = await User.find({ added_from: campaign });

    if (users.length > 0) {
      await User.deleteMany({ added_from: campaign });
      console.log(`${users.length} user(s) deleted.`);
    }

    const resData = await axiosHelper.get(url);
    let data = {
      data: resData["data"],
      campaign,
    };
    schedule.campaigns(data);

    res.status(200).json({
      status: "success",
      messages: ["importing users in backend"],
      usersCount: resData["data"].length,
    });
  } catch (err) {
    console.log({ err });
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteBlackListUser = async (req, res) => {
  try {
    let { id } = req.params;

    const list = await BlackList.deleteOne({ _id: id });

    console.log({
      id,
      list,
    });

    res.status(200).json({
      success: true,
      status: "success",
      message: "Phone number removed from black list",
    });
  } catch (err) {
    console.log({ err });
    res.status(400).json({
      success: false,
      status: "fail",
      message: err,
    });
  }
};
