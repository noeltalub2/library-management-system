const express = require("express");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const cookieSession = require("cookie-session");
const dotenv = require("dotenv");
dotenv.config();
const db = require("./database/db.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to the database
db.getConnection((err, connection) => {
	if (err) throw err;
	console.log("Database connected successfully");
	connection.release();
});

// Middleware
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

// Session configuration
app.use(
	cookieSession({
		name: "session",
		keys: [process.env.SESSION_SECRET],
		cookie: {
			secure: true,
			httpOnly: true,
		},
	})
);

app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
	res.locals.success_msg = req.flash("success_msg");
	res.locals.error_msg = req.flash("error_msg");
	res.locals.error = req.flash("error");
	next();
});

// Routes
const facultyRouter = require("./routes/faculty.router.js");
const studentRouter = require("./routes/student.router.js");
const barcodeRouter = require("./routes/barcode.router.js");
const adminRouter = require("./routes/admin.router.js");
const indexRouter = require("./routes/index.router.js");

app.use("/admin", adminRouter);
app.use("/faculty", facultyRouter);
app.use("/barcode", barcodeRouter);
app.use("/", studentRouter); // Assuming this is for student-related routes
app.use("/", indexRouter);

app.use(indexRouter);

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running at PORT ${PORT}`);
});
