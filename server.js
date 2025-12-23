const mongoose = require("mongoose");
// const dotenv = require('dotenv');
const { app, server, ioObject } = require("./app");

// dotenv.config({ path: './.env' });
// mongodb://root:Default%40123@92.205.31.103:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.1.1&authMechanism=DEFAULT
// const DATABASE = process.env.DB_URI;
// console.log({ DATABASE });
const DB = process.env.DB_URI.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

// const DB = process.env.DB_URI;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 60000, // 60 seconds
    socketTimeoutMS: 60000, // 60 seconds
  })
  .then(() => console.log("DB connection successful"));

  // async function connectToDatabase() {
  //   try {
  //     await mongoose.connect(DB, {
  //       useNewUrlParser: true,
  //       useUnifiedTopology: true,
  //     });
  //     console.log('Connected to the database');
  //   } catch (err) {
  //     console.error('Error connecting to the database:', err);
  //     process.exit(1); // Exit process with failure
  //   }
  // }
  
  // Define a function to create indexes
  // async function createIndexes() {
  //   try {
  //     await User.createIndexes();
  //     console.log('Indexes created successfully');
  //   } catch (err) {
  //     console.error('Error creating indexes:', err);
  //   } finally {
  //     await mongoose.disconnect();
  //     console.log('Disconnected from the database');
  //   }
  // }
  
  // Execute the functions
  // (async () => {
  //   await connectToDatabase();
  //   await createIndexes();
  // })();


const PORT = process.env.PORT || 1337;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

server.timeout = 3600000;
server.keepAliveTimeout = 3600000;
server.headersTimeout = 3610000;
