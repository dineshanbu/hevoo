const express = require('express');
const http = require('http');
const cors = require('cors'); // Import cors module
const app = express();
const dotenv = require("dotenv");
const errorHandler = require("./utils/errorResponse")
const routes = require("./routes/index.route")
const path = require("path");
const connectDB = require("../config/db")
const bodyparser = require('body-parser')
const socketIO = require('socket.io');
const server = http.createServer(app);

const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Middleware
  app.use(cors());


// dot env
dotenv.config({
    path: "./config/config.env"
})
// connectDB();
connectDB()



app.use((req, res, next) => {
    req.io = io;
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

// Define paths for Express config
const publicDirPath = path.join(__dirname, "../public");

app.enable("trust proxy");
console.log(publicDirPath)
//EJS
app.set("view engine", "ejs");
app.set("view options", {
    layout: false,
});

// Set Public folder
app.use(express.static(publicDirPath));

//Set Request Size Limit
app.use(
    express.json({
        limit: "50mb",
    })
);
app.use(
    express.urlencoded({
        extended: true,
        limit: "50mb",
    })
);

// app.use('/v1', routes)
app.use("/", routes);
app.use(errorHandler);


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



