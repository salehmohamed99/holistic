const express = require('express');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const User = require('./models/userModel');
const Message = require('./models/messageModel');
const Setting = require('./models/settingModel');
const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
// const morgan = require('morgan');
const cors = require('cors');
const body_parser = require('body-parser');
const app = express().use(body_parser.json());
const token = process.env.WHATSAPP_TOKEN;
const http = require('http');
const server = http.createServer(app);
const axiosHelper = require('./helpers/axiosHelper');
const { Server } = require('socket.io');
const pm2 = require('pm2');

const DEMO_OMAN_TOKEN = process.env.DEMO_OMAN_TOKEN;
// Register and set up the middleware
app.use(fileupload());
app.use(express.urlencoded({ extended: true }));

const path = require('path');
app.use('/attachments', express.static(path.join(__dirname, 'attachments')));

const io = new Server(server, {
  transports: ['websocket'],
  secure: true,
  cors: {
    origin: [
      'https://whatsclient.alsharashoping.com',
      'http://localhost:8080',
      'http://192.168.1.15:8080',
      'http://127.0.0.1:8010',
      'https://whatsapptest.muscatappstest.com',
      'https://whatsapp.alwifaaq.com',
    ],
  },
});

const { auth } = require('./routes/middleware/auth');
io.on('connection', function (socket) {
  // socket.client
  // socket.join("chat_room");
  // console.log({ socket: io.sockets.in("chat_room") });
  // io.sockets.emit("chat", { msg: "Hey12000" })
  // io.listeners.in("chat_room").emit("chat", { msg: "Hey12" })
  // socket.emit("chat", { msg: "Hey" });
});

app.use(
  cors({
    origin: [
      'https://whatsclient.alsharashoping.com',
      'http://localhost:8080',
      'http://192.168.1.15:8080',
      'http://127.0.0.1:8010',
      'https://whatsapptest.muscatappstest.com',
      'https://whatsapp.alwifaaq.com',
    ],
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
    exposedHeaders: ['set-cookie'],
  })
);

const socketIoObject = io;

// if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// add middleware for parse request body data
app.use(express.json());
app.use(cookieParser());

const messageRouter = require('./routes/messageRoutes');
const userRouter = require('./routes/userRoutes');
const webhookRouter = require('./routes/webhookRouters');
const settingRouter = require('./routes/settingRoutes');
const authRouter = require('./routes/authRoutes');
const dashboardRouter = require('./routes/dashboardRoutes');
const thawaniRouter = require('./routes/thawaniRoutes');
const whatsappRouter = require('./routes/whatsappRouters');

app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  next();
});

// endpoint to flush pm2 logs for a specific server
app.get('/flush/:serverName', (req, res) => {
  const serverName = req.params.serverName;

  pm2.describe(serverName, (err, processDescription) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error retrieving process information from PM2');
      return;
    }

    if (processDescription.length === 0) {
      res.status(404).send('Server not found in PM2');
      return;
    }

    pm2.flush(processDescription[0].pm_id, err => {
      if (err) {
        console.error(err);
        res.status(500).send('Error flushing logs');
        return;
      }

      res.status(200).send('Logs flushed');
    });
  });
});

// Endpoint to fetch PM2 logs for a specific server
app.get('/logs/:serverName', (req, res) => {
  const serverName = req.params.serverName;

  pm2.describe(serverName, (err, processDescription) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error retrieving process information from PM2');
      return;
    }

    if (processDescription.length === 0) {
      res.status(404).send('Server not found in PM2');
      return;
    }

    const logFile = processDescription[0].pm2_env.pm_out_log_path;

    // Check if log file exists
    if (!fs.existsSync(logFile)) {
      res.status(404).send('Log file not found');
      return;
    }

    // Stream the log file
    res.setHeader('Content-Type', 'text/plain');
    fs.createReadStream(logFile).pipe(res);
  });
});

// health endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: 'Server is running',
  });
});

app.use('/api/v1/messages', auth, messageRouter);
app.use('/api/v1/users', auth, userRouter);
app.use('/', webhookRouter);
app.use('/api/v1/setting', auth, settingRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/thawani', thawaniRouter);
app.use('/api/v1/whatsapp', whatsappRouter);

app.use('/test', async (req, res) => {
  //   const userId  = req.query.user_id;
  //   const adminId =  await User.findOne({ platform: "admin" });

  //   const msg = await Message.findOne({ from: adminId, to: userId  },null,{
  //       sort: { createdAt: -1 },
  //     });

  //   // To set two dates to two variables
  //     let today = new Date();
  //     let msgDate = new Date(msg.createdAt);

  //     // To calculate the time difference of two dates
  //     let Difference_In_Time = today.getTime() - msgDate.getTime();

  //     // To calculate the no. of days between two dates
  //     let Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

  // res.status(200).json({
  //   status: 'success',
  //   data: Difference_In_Days,
  // });
  fs.readFile('attachments/testEg.jpg', function (err, data) {
    if (err) throw err;
    res.send(data);
  });
});

app.use('/api/v1/products', auth, async (req, res) => {
  const url = `https://smarterp.top/api/v1.0/products/index?token=${DEMO_OMAN_TOKEN}&company=demo_oman`;
  const data = {
    limit: 1000000000000,
  };

  const result = await axiosHelper.post(url, data);

  console.log({
    result,
  });

  // return result;

  res.send(result.data);
});

app.use('/api/v1/templates', auth, async (req, res) => {
  const whatsAppID = process.env.WHATS_APP_ID;
  const productsUrl = `https://smarterp.top/api/v1.0/products/index?token=${DEMO_OMAN_TOKEN}&company=demo_oman`;
  const productsFilter = {
    limit: 1000000000000,
  };

  const productsResult = await axiosHelper.get(
    'https://dummyjson.com/products'
  );

  const templatesUrl = `https://graph.facebook.com/v17.0/${whatsAppID}/message_templates?access_token=${token}`;
  let templatesData = {};

  const templatesResult = await axiosHelper.get(templatesUrl);
  const templates = [
    'humaid_template',
    'election_template',
    'custom_template',
    'custom_product',
    'image_template',
    'sample_test',
    'products_catalog',
    'video_offer',
  ];

  const assetsType = ['IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO', 'LOCATION'];

  const templateData = templatesResult.data.data;

  console.log({
    testtemplateData: templateData,
  });

  for (let idx = 0; idx < templateData.length; idx++) {
    if (
      !templateData[idx].name.startsWith("flow_") &&
      templateData[idx].status === 'APPROVED' &&
      (templateData[idx].category === 'MARKETING' ||
        templateData[idx].category === 'UTILITY')
    ) {
      templateData[idx].isAssetsNedded = false;
      if (templateData[idx].components[0]['type'] === 'HEADER') {
        if (assetsType.includes(templateData[idx].components[0]['format'])) {
          const type = templateData[idx].components[0]['format'];
          templateData[idx].isAssetsNedded = true;
          let key = `${templateData[idx].name}_${templateData[idx].language}`;
          console.log({
            key,
          });
          const setting = await Setting.findOne({ key, expires_at: { $gt: new Date() } });
          console.log({
            setting,
          });
          if (setting) {
            console.log({
              setting,
            });
            if (type === 'LOCATION') {
              templateData[idx].assets = setting.location;
            } else {
              templateData[idx].assets = {
                id: setting.value,
                path: setting.path,
              };
            }
          } else {
            templateData[idx].assets = {};
          }
        }
      }

      templatesData[`${templateData[idx].name}_${templateData[idx].language}`] =
        templateData[idx];
    }
  }

  console.log({
    templatesData,
    // productsResult,
    // productsResult: productsResult.data.products
  });

  const response = {
    products: productsResult.data.products,
    templates: templatesData,
  };

  res.send(response);
});

module.exports.app = app;
module.exports.ioObject = io;
module.exports.server = server;
