const User = require("../models/userModel");
const Message = require("../models/messageModel");
const DoneJobs = require("../models/doneJobsModel");
const JobsLog = require("../models/jobsLogModel");
const axiosHelper = require("../helpers/axiosHelper");
const BlackList = require("../models/blackListModel");
const WhatsappLogController = require("../controllers/whatsappLogController");
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const Agenda = require("agenda");
const app = require("../app");

const pLimit = require("p-limit");

// const DATABASE =
//   "mongodb+srv://egila:<PASSWORD>@cluster0.n2tpdmf.mongodb.net/agenda?retryWrites=true&w=majority";

const DATABASE = process.env.DB_URI;
console.log({ DATABASE });
const DB = DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
// const DB = DATABASE;

// const agenda = new Agenda({
//   db: { address: DB },
//   processEvery: "30 seconds",
//   defaultConcurrency: 10, // Per job type
//   maxConcurrency: 50, // Across all job types
//   defaultLockLifetime: 15 * 60 * 1000, // 10 minutes
//   lockLifetime: 15 * 60 * 1000, // 10 minutes
//   timezone: "UTC",
// });

const agenda = new Agenda({
  db: {
    address: DB,
    options: {
      useUnifiedTopology: true,
      maxPoolSize: 20, // keep Mongo load light
    },
  },

  processEvery: "20 seconds", // slightly faster polling
  defaultConcurrency: 8, // per job type (≈1–2 per CPU)
  maxConcurrency: 36, // total running jobs
  defaultLockLifetime: 15 * 60 * 1000, // 10 minutes
  lockLifetime: 15 * 60 * 1000,
  timezone: "UTC",
});

console.log("################################");
console.log("#########[ Agenda - test ]##########");

console.log("################################");

// await agenda.start(); // This connects and initializes Agenda internally

// agenda.on("ready", async () => {
//   console.log("✅ Agenda connected to MongoDB!");

//   // Now _collection is guaranteed to exist
//   const collection = agenda._collection;
//   const result = await collection.updateMany(
//     {  },
//     { $unset: { lastFinishedAt: 1 } }
//   );

//   console.log(`🧹 Cleared stuck jobs: ${result.modifiedCount}`);

//   await agenda.start();
//   console.log("🚀 Agenda started successfully and ready to process jobs");
// });

agenda.on("ready", async () => {
  console.log("✅ Agenda connected to MongoDB!");

  // Now _collection is guaranteed to exist
  const collection = agenda._collection;
  const result = await collection.updateMany(
    {
      name: "sendTemplateMessage",
      lockedAt: { $exists: true },
      lastFinishedAt: { $exists: false },
    },
    { $unset: { lockedAt: 1 } }
  );

  console.log(`🧹 Cleared stuck jobs: ${result.modifiedCount}`);

  await agenda.start();
  console.log("🚀 Agenda started successfully and ready to process jobs");
});

// agenda.on("ready", async () => {
//   console.log("✅ Agenda connected to MongoDB!");

//   try {
//     // ✅ Access the internal collection safely
//     const collection = agenda._collection;

//     // 🧹 Unlock all unfinished jobs (not yet completed)
//     const result = await collection.updateMany(
//       {
//         name: "sendTemplateMessage",
//         lastFinishedAt: { $exists: false },
//       },
//       {
//         $unset: { lockedAt: 1 },
//         $set: { nextRunAt: new Date() },
//       }
//     );

//     console.log(`🧹 Refreshed stuck jobs: ${result.modifiedCount}`);

//     // 🚀 Start Agenda after cleanup
//     await agenda.start();
//     console.log("🚀 Agenda started successfully and ready to process jobs");
//   } catch (err) {
//     console.error("❌ Error during Agenda initialization:", err);
//   }
// });

agenda.on("error", (err) => {
  console.error("❌ Agenda connection error:", err);
});

agenda.on("success:sendTemplateMessage", (job) => {
  console.log(`✅ Job ${job.attrs._id} completed`);
});
agenda.on("fail:sendTemplateMessage", (err, job) => {
  console.error(`❌ Job ${job.attrs._id} failed:`, err);
});

// new logic

// Helper function to split array into chunks
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Helper function to add delay between batches
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

agenda.define(
  "sendTemplateMessage",
  { lockLifetime: 15 * 60 * 1000 },
  async function (job) {
    const jobData = job.attrs.data || {};
    const jobId = job.attrs._id;
    console.log("sendTemplateMessage job started", { jobId });

    // Prevent re-processing
    try {
      const isJobExist = await DoneJobs.exists({ job_id: jobId });
      if (isJobExist) {
        console.log("Job already processed:", jobId);
        // return;
      }
      await DoneJobs.create({ job_id: jobId });
    } catch (err) {
      console.error("DoneJobs check/create error", err);
      // if DoneJobs create failed, we continue but be mindful of duplicates
    }

    // Validate users list
    const usersList = Array.isArray(jobData.users) ? jobData.users : [];
    if (usersList.length === 0) {
      console.log("No users provided, exiting");
      return;
    }

    // Build array of ids (string form)
    const userIds = usersList
      .map((u) => (u && u.id ? u.id.toString() : (u || "").toString()))
      .filter(Boolean);

    console.log(`📦 Total users to process: ${userIds.length}`);

    // ============ BATCH PROCESSING LOGIC ============
    // Split users into manageable chunks to prevent memory overload
    const BATCH_SIZE = 500; // Process 500 users at a time
    const BATCH_DELAY_MS = 2000; // Wait 2 seconds between batches

    const userIdChunks = chunkArray(userIds, BATCH_SIZE);
    console.log(`📦 Split into ${userIdChunks.length} batches of ${BATCH_SIZE} users each`);

    let totalResults = [];

    // Process each batch sequentially with delays
    for (let batchIndex = 0; batchIndex < userIdChunks.length; batchIndex++) {
      const batchUserIds = userIdChunks[batchIndex];
      console.log(`\n🔄 Processing batch ${batchIndex + 1}/${userIdChunks.length} (${batchUserIds.length} users)`);

      // Batch fetch users for this chunk only
      let users;
      try {
        users = await User.find({ _id: { $in: batchUserIds } })
          .select("_id phone_number user_name") // only needed fields
          .lean();
      } catch (err) {
        console.error(`Error fetching users for batch ${batchIndex + 1}`, err);
        continue; // Skip this batch but continue with others
      }

      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      // Limit concurrency per batch (smaller batches can handle more concurrency)
      const concurrencyLimit = 8; // 8 concurrent operations per batch
      const limit = pLimit(concurrencyLimit);

      const tasks = batchUserIds.map((id) =>
        limit(async () => {
          try {
            const userTo = userMap.get(id);
            if (!userTo) {
              // user not found
              return { id, status: "not_found" };
            }

            // Check blacklist quickly
            const isUserInBlackList = await BlackList.exists({
              phoneNumber: userTo.phone_number,
            });
            if (isUserInBlackList) {
              return { id, status: "blacklisted" };
            }

            // Avoid duplicate sends for this job + phone_number
            const alreadySent = await JobsLog.exists({
              job_id: jobId,
              phone_number: userTo.phone_number,
            });
            if (alreadySent) {
              return { id, status: "already_sent" };
            }

            // Create log entry *before* sending to avoid race conditions
            try {
              await JobsLog.create({
                job_id: jobId,
                phone_number: userTo.phone_number,
              });
            } catch (err) {
              // if duplicate insertion occurs due to race, ignore
              if (
                err.code &&
                (err.code === 11000 || err.codeName === "DuplicateKey")
              ) {
                // already logged by another worker
              } else {
                console.error("JobsLog create error", err);
              }
            }

            // Prepare message payload (don't mutate shared jobData)
            const reqData = {
              content: jobData.content,
              type: jobData.type,
              seen: jobData.seen,
              from: jobData.from,
              to: id,
              is_scheduled: jobData.is_scheduled,
              platform: jobData.platform,
            };

            // Save message to DB (this returns new message)
            const resDataUser = await saveMessage(reqData);
            const newMsg = resDataUser?.newMsg;

            if (jobData.platform === "whatsapp") {
              // Create a copy of jobData to avoid mutation issues
              const whatsappData = {
                ...jobData,
                to: userTo.phone_number,
                username: userTo.user_name,
                msg_id: newMsg._id,
              };
              await sendToWhatsapp(whatsappData);
            } else {
              // If other platforms exist, handle similarly (or create other agenda jobs)
            }

            return { id, status: "queued" };
          } catch (err) {
            console.error("Error processing user", id, err);
            return { id, status: "error", err: err.message || err };
          }
        })
      );

      // Wait for all tasks in this batch (settled)
      const batchResults = await Promise.allSettled(tasks);
      totalResults = totalResults.concat(batchResults);

      console.log(`✅ Batch ${batchIndex + 1} completed: ${batchResults.length} messages processed`);

      // Add delay before next batch (except for the last batch)
      if (batchIndex < userIdChunks.length - 1) {
        console.log(`⏳ Waiting ${BATCH_DELAY_MS}ms before next batch...`);
        await delay(BATCH_DELAY_MS);
      }
    }
    // ============ END BATCH PROCESSING ============

    console.log("✅ sendTemplateMessage finished", {
      jobId,
      totalUsers: userIds.length,
      totalBatches: userIdChunks.length,
      totalProcessed: totalResults.length,
    });
    return true;
  }
);

agenda.define(
  "sendWhatsappMessage",
  { lockLifetime: 15 * 60 * 1000 },
  async function (job) {
    const data = job.attrs.data || {};

    if (!data.to) {
      console.warn("sendWhatsappMessage missing phone", job.attrs._id);
      return;
    }

    try {
      // call your existing helper that talks with WhatsApp API
      await sendToWhatsapp(data);
      // optionally emit event or update log
    } catch (err) {
      console.error("WhatsApp send failed for", toPhone, err);
      // Optionally: create a retry job with backoff
      // await agenda.schedule('in 1 minute', 'sendWhatsappMessage', data);
    }
  }
);

// new logic

agenda.define(
  "sendTemplateMessageOld",
  { lockLifetime: 10 * 60 * 1000 },
  async function (job) {
    const jobData = job.attrs.data;
    const jobId = job.attrs._id;
    let newItem = [];
    let newMsg = [];

    console.log({
      jobData,
    });
    const isJobExist = await DoneJobs.findOne({ job_id: jobId });
    if (isJobExist) {
      console.log("#########################################################");
      console.log(
        "--------------------------[job Exists ]-----------------------"
      );
      console.log("#########################################################");
    } else {
      await DoneJobs.create({ job_id: jobId });
      console.log("#########################################################");
      console.log(
        "--------------------------[job Not Exists ]-----------------------"
      );
      console.log("#########################################################");
    }

    let isJobExistFlag = true;
    if (isJobExistFlag) {
      for (let idx = 0; idx < jobData.users.length; idx++) {
        let id = jobData.users[idx]["id"]
          ? jobData.users[idx]["id"]
          : jobData.users[idx];
        console.log({
          idx,
          id,
        });

        let userTo = await User.findOne({ _id: id });

        let isUserInBlackList = await BlackList.findOne({
          phoneNumber: userTo.phone_number,
        });
        console.log({
          isUserInBlackList,
          userTo,
          messageType: jobData.type,
          phoneNumber: userTo.phone_number,
          u: jobData.users[idx],
        });
        if (isUserInBlackList) {
        } else {
          let reqData = {
            content: jobData.content,
            type: jobData.type,
            seen: jobData.seen,
            from: jobData.from,
            to: id,
            is_scheduled: jobData.is_scheduled,
          };

          console.log({
            reqData,
            body: jobData,
          });
          const isSentBefore = await JobsLog.findOne({
            job_id: jobId,
            phone_number: userTo.phone_number,
          });
          if (isSentBefore) {
            console.log(
              "#########################################################"
            );
            console.log(
              "--------------------------[ this message sent to user before ]-----------------------"
            );
            console.log(
              "#########################################################"
            );
          } else {
            let resDataUser;
            try {
              await JobsLog.create({
                job_id: jobId,
                phone_number: userTo.phone_number,
              });
              resDataUser = await saveMessage(reqData);
              console.log({
                resDataUser,
              });
            } catch (err) {
              console.log({
                err,
              });
            }

            newItem = resDataUser["to"];
            newMsg = resDataUser["newMsg"];
            if (jobData.platform === "whatsapp") {
              console.log({
                newItem,
              });
              jobData.to = newItem.phone_number;
              jobData.username = newItem.user_name;
              jobData.msg_id = newMsg._id;
              console.log("sendToWhatsapp");
              try {
                await sendToWhatsapp(jobData);
              } catch (err) {
                console.log({ err });
              }
            }
          }
        }
      }
    }
  }
);
agenda.define("importURL", async function (job) {
  console.log("Job started at", new Date());
  const jobData = job.attrs.data;
  let filteredDta = [];
  jobData.forEach(async (item) => {
    if (
      item.name &&
      item.phone_number &&
      item.name != "null" &&
      item.phone_number != "null"
    ) {
      // 🔹 Remove leading "+" if present
      const cleanPhone = item.phone_number.startsWith("+")
        ? item.phone_number.slice(1)
        : item.phone_number;

      filteredDta.push([item.name, cleanPhone]);
    }
  });

  console.log(filteredDta);

  const response = await insertUsers(filteredDta, "url");
  response.totalNumbers = jobData.length;
  app.ioObject.sockets.emit("importURL", { response });

  console.log("Job completed at", new Date());
});
agenda.define("sendMessage", async function (job) {
  console.log("Job started at", new Date());
  const jobData = job.attrs.data;
  let newItem = [];
  let newMsg = [];
  let resDataUser = await saveMessage(jobData);
  console.log({
    resDataUser,
  });
  newItem = resDataUser["to"];

  newMsg = resDataUser["newMsg"];

  if (jobData.platform === "whatsapp") {
    jobData.username = newItem.user_name;
    jobData.to = newItem.phone_number;

    jobData.msg_id = newMsg._id;

    console.log("sendToWhatsapp");
    try {
      await sendToWhatsapp(jobData);
    } catch (err) {
      console.log({ err });
    }
  }

  console.log("Job completed at", new Date());

  // else if (req.body.platform === "instagram") {
  //   jobData.to = newItem.phone_number;
  //   console.log("sendToInstagram");

  //   await sendTo(InstagramjobData);

  // }
});

agenda.define("campaigns", async function (job) {
  console.log("Job started at", new Date());
  const jobData = job.attrs.data;
  console.log({
    jobData,
  });
  let filteredDta = [];
  jobData["data"].forEach(async (item) => {
    if (
      item.full_name &&
      item.mobile &&
      item.full_name != "null" &&
      item.mobile != "null"
    ) {
      filteredDta.push([item.full_name, item.mobile]);
    }
  });

  console.log(filteredDta);

  const response = await insertUsers(filteredDta, jobData["campaign"]);

  console.log("Job completed at", new Date());
});

async function saveMessage(message) {
  console.log("saveMessage", {
    message,
  });
  const newItem = await Message.create(message);

  if (message.parentMsg) {
    const parentMsg = await Message.findOne({ wa_msg_id: message.parentMsg });
    newItem.parent = parentMsg;
  }
  newItem.to = message.to;
  newItem.from = message.from;

  await newItem.save();

  const userFrom = await User.findById(message.from)
    .select("_id phone_number user_name  added_from platform messages")
    .lean();
  const userTo = await User.findById(message.to)
    .select("_id phone_number user_name added_from platform  messages")
    .lean();

  await User.updateOne(
    { _id: message.to },
    { $push: { messages: newItem._id } }
  );
  await User.updateOne(
    { _id: message.from },
    { $push: { messages: newItem._id } }
  );

  return {
    newMsg: newItem,
    to: userTo,
    from: userFrom,
  };
}
async function sendToWhatsapp(inputData) {
  console.log("inside send to whatsapp");
  console.log(
    {
      inputData,
    },
    "Icoooooming Dataaa"
  );
  const userData = await User.findOne({ phone_number: inputData.to });
  inputData.userName = inputData.name;
  const url =
    "https://graph.facebook.com/v12.0/" +
    WHATSAPP_PHONE_NUMBER_ID +
    "/messages?access_token=" +
    WHATSAPP_TOKEN;
  let data = {};
  data.messaging_product = "whatsapp";
  if (inputData.msgType === "media") {
    data.to = inputData.to;
    data.type = inputData.type;
    data[inputData.type] = {
      id: inputData.mediaId,
      filename: inputData.filename,
    };
    const wa_res = await axiosHelper.post(url, data);
    const message = await Message.findByIdAndUpdate(
      inputData.msg_id,
      { wa_msg_id: wa_res.data.messages[0].id },
      {
        new: true,
        runValidators: true,
      }
    );
    console.log({
      wa_res_contacts: wa_res.data.contacts,
      wa_res_messages: wa_res.data.messages,
      message,
    });
  } else if (inputData.type === "text") {
    data.to = inputData.to.toString();
    data.recipient_type = "individual";
    data.type = "text";
    data.text = {
      preview_url: false,
      body: inputData.content,
    };
    if (inputData.parentMsg) {
      data.context = {
        message_id: inputData.parentMsg,
      };
    }
    console.log({ data }, "teeeeeeeeeeeeeeest");
    const wa_res = await axiosHelper.post(url, data);
    const message = await Message.findByIdAndUpdate(
      inputData.msg_id,
      { wa_msg_id: wa_res.data.messages[0].id },
      {
        new: true,
        runValidators: true,
      }
    );
    console.log({
      wa_res_contacts: wa_res.data.contacts,
      wa_res_messages: wa_res.data.messages,
      message,
    });
  } else if (inputData.type === "sample_test") {
    let components = [];
    data.type = "template";
    // inputData.users.forEach(async (user) => {
    data.to = inputData.to;
    inputData.products.forEach(async (product) => {
      components = [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: product.thumb,
                // id: 1336178280655809
              },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: inputData.username,
            },
            {
              type: "text",
              text: product.name,
            },
            {
              type: "text",
              text: product.price,
            },
            {
              type: "text",
              text: "ريال",
            },
          ],
        },
      ];
      data.template = {
        name: "sample_test",
        language: {
          code: "ar",
        },
        components,
      };
      console.log({
        data,
      });
      try {
        const wa_res = await axiosHelper.post(url, data);
        console.log("000000", {
          wa_res: wa_res.data.messages[0],
        });
        const message = await Message.findByIdAndUpdate(
          inputData.msg_id,
          { wa_msg_id: wa_res.data.messages[0].id },
          {
            new: true,
            runValidators: true,
          }
        );
      } catch (err) {
        console.log({ err });
      }
    });
    // });
  } else if (inputData.type === "confirm_order") {
    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (inputData.parentMsg) {
      data.context = {
        message_id: inputData.parentMsg,
      };
    }
    data.interactive = {
      type: "button",
      body: {
        text: inputData.content,
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: inputData.parentMsg,
              title: "نعم استمر في الشراء",
            },
          },
          {
            type: "reply",
            reply: {
              id: inputData.orderId,
              title: "لا",
            },
          },
        ],
      },
    };
    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
      const message = await Message.findByIdAndUpdate(
        inputData.msg_id,
        { wa_msg_id: wa_res.data.messages[0].id },
        {
          new: true,
          runValidators: true,
        }
      );
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "products_catalog") {
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;
    data.template = {
      name: "products_catalog",
      language: {
        code: "ar",
      },
      components: [
        {
          type: "button",
          sub_type: "CATALOG",
          index: 0,
          parameters: [
            {
              type: "action",
              action: {
                thumbnail_product_retailer_id: "",
              },
            },
          ],
        },
      ],
    };
    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
      const message = await Message.findByIdAndUpdate(
        inputData.msg_id,
        { wa_msg_id: wa_res.data.messages[0].id },
        {
          new: true,
          runValidators: true,
        }
      );
    } catch (err) {
      console.log({ err });
    }
    // });
  } else {
    let components = [];
    data.type = "template";
    data.to = inputData.to;
    let parameters = [];
    console.log({
      variables: inputData.variables,
      header: inputData.header,
    });
    if (inputData.header.length > 0) {
      let headerData = {
        type: "header",
        parameters: inputData.header,
      };
      components.push(headerData);
    }
    if (inputData.variables.length > 0) {
      inputData.variables.forEach((variable) => {
        parameters.push({
          type: "text",
          text: variable,
        });
      });
      components.push({
        type: "body",
        parameters,
      });
    }
    // mponents = [
    //   {
    //     type: "body",
    //     parameters,
    //   },
    // ];
    data.template = {
      name: inputData.type,
      language: {
        code: inputData.language,
      },
      components,
    };
    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      const dataLog = await WhatsappLogController.create(
        JSON.stringify(data, null, 2)
      );
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
      const message = await Message.findByIdAndUpdate(
        inputData.msg_id,
        { wa_msg_id: wa_res.data.messages[0].id },
        {
          new: true,
          runValidators: true,
        }
      );
    } catch (err) {
      console.log({ err });
      const dataLog = await WhatsappLogController.createError(
        JSON.stringify(err, null, 2)
      );
    }
  }
  return true;
}
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
        added_from: addedFrom,
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
module.exports = agenda;
