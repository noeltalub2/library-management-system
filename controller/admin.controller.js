const bcrypt = require("bcrypt");
const fs = require("fs");
const { createTokenAdmin } = require("../utils/token");
const { date_time } = require("../utils/date");

const db = require("../database/db");

const queryParam = async (sql, data) => {
	try {
		return (await db.promise().query(sql, [data]))[0];
	} catch (err) {
		throw err;
	}
};

const zeroParam = async (sql) => {
	try {
		return (await db.promise().query(sql))[0];
	} catch (err) {
		throw err;
	}
};

const getLogin = (req, res) => {
	res.render("Admin/signin");
};
const postLogin = (req, res) => {
	try {
		const { username, password } = req.body;
		const findUser = "SELECT * from admin WHERE username = ?";

		db.query(findUser, [username], async (err, result) => {
			if (err) {
				req.flash("error_msg", "Authentication failed.");
				res.redirect("/signin");
			} else {
				if (result.length > 0) {
					const match_password = await bcrypt.compare(
						password,
						result[0].password
					);
					if (match_password) {
						const generateToken = createTokenAdmin(
							result[0].username
						);
						res.cookie("token", generateToken, { httpOnly: true });
						res.redirect("/admin/dashboard");
					} else {
						req.flash(
							"error_msg",
							"Incorrect username or password"
						);
						res.redirect("/admin/signin");
					}
				} else {
					req.flash("error_msg", "Could'nt find your account");
					res.redirect("/admin/signin");
				}
			}
		});
	} catch {
		throw err;
	}
};
const getRegister = (req, res) => {
	res.render("Admin/signup");
};
const postRegister = async (req, res) => {
	//Data from the form ../register
	const { username, name, phonenumber, email, password, gender } =
		req.body;
	let errors = [];
	//Sql statement if there is duplciate in database
	var admin_exist =
		"Select count(*) as `count` from faculty where facultynumber = ?";
	var email_exist = "Select count(*) as `count` from faculty where email = ?";
	var phone_exist =
		"Select count(*) as `count` from faculty where phonenumber = ?";
	//Query statement
	const admin_count = (await queryParam(admin_exist, [username]))[0]
		.count;
	const email_count = (await queryParam(email_exist, [email]))[0].count;
	const phone_count = (await queryParam(phone_exist, [phonenumber]))[0].count;

	//Check if there is duplicate

	if (email_count > 0) {
		errors.push({ msg: "Email is already registered" });
	}
	if (phone_count > 0) {
		errors.push({ msg: "Phonenumber is already registered" });
	}
	if (admin_count > 0) {
		errors.push({ msg: "Username is already registered" });
	}

	//To encrypt the password using hash
	const salt = bcrypt.genSaltSync(15);
	const hash = bcrypt.hashSync(password, salt);
	//Data to insert in sql
	var data = {
		username: username,
		name: name,
		phonenumber: phonenumber,
		email: email,
		password: hash,
		gender: gender,
		join_date: date_time(),
	};
	//Add account to database
	var sql = "INSERT INTO admin SET ?";
	db.query(sql, data, (err, rset) => {
		if (err) {
			res.render("Admin/signup", {
				errors,
			});
		} else {
			req.flash("success_msg", "Account created successfully");
			res.redirect("/admin/signup");
		}
	});
};
const getDashboard = async (req, res) => {
	const borrowed_books = (
		await queryParam(
			"SELECT count(*) as 'count' FROM issued_books WHERE issue_date IS NOT NULL AND returned_date IS NULL"
		)
	)[0].count;
	const total_books = (
		await queryParam("SELECT count(*) as 'count' FROM books")
	)[0].count;

	const recent_books = await queryParam(
		"SELECT * FROM books ORDER BY books.id DESC LIMIT 5;"
	);
	const total_student = (
		await queryParam("SELECT count(*) as 'count' FROM student")
	)[0].count;

	const total_faculty = (
		await queryParam("SELECT count(*) as 'count' FROM faculty")
	)[0].count;

	const recent_users_student = await queryParam(
		"SELECT * FROM student ORDER BY student.id DESC LIMIT 5;"
	);

	const recent_users_faculty = await queryParam(
		"SELECT * FROM faculty ORDER BY faculty.id DESC LIMIT 5;"
	);
	const recommendations = await queryParam(
		"SELECT * from recommendations ORDER BY id DESC LIMIT 5",
		[res.locals.id]
	);

	const total_users = total_student + total_faculty;
	res.render("Admin/dashboard", {
		title: "Dashboard",
		recommendations,
		total_users,
		total_books,
		borrowed_books,
		recent_users_student,
		recent_users_faculty,
		recent_books,
	});
};

const getStudent = async (req, res) => {
	res.render("Admin/student", { title: "Manage Students" });
};
const studentData = async (req, res) => {
	const student_record = await zeroParam(
		"SELECT * FROM student ORDER BY student.id DESC"
	);
	var resultData = [];

	student_record.forEach((data, index) => {
		resultData.push({
			no_id: index + 1,
			studentnumber: data.studentnumber,
			name: data.name,
			course: data.course,
			year_section: data.year_section,
			email: data.email,
		});
	});

	res.json({ data: resultData });
};

const getStudentView = async (req, res) => {
	const studentnumber = req.params.studentnumber;
	const student = (
		await queryParam("SELECT * FROM student WHERE studentnumber = ?", [
			studentnumber,
		])
	)[0];
	const books = await queryParam(
		"SELECT * FROM issued_books WHERE user_id= ? ORDER BY issued_books.id DESC",
		[studentnumber]
	);
	res.render("Admin/student_view", {
		student,
		books,
		title: "View Student",
	});
};

const getStudentEdit = async (req, res) => {
	const studentnumber = req.params.studentnumber;
	var student = (
		await queryParam("SELECT * FROM student WHERE studentnumber = ?", [
			studentnumber,
		])
	)[0];
	res.render("Admin/student_edit", { student, title: "Edit Student" });
};

const postStudentEdit = async (req, res) => {
	const {
		studentnumber,
		name,
		course,
		email,
		phonenumber,
		password,
		gender,
		year_section,
		is_verified,
	} = req.body;

	// Create an empty data object with other fields
	var data = {
		studentnumber,
		name,
		gender,
		year_section,
		course,
		email,
		phonenumber,
		is_verified,
	};

	// Conditionally update the password only if it's provided in the form
	if (password) {
		//To encrypt the password using hash
		const salt = bcrypt.genSaltSync(15);
		const hash = bcrypt.hashSync(password, salt);
		data.password = hash; // Update the password field
	}

	var sql = "UPDATE student SET ? WHERE studentnumber = ?";

	// Add account to database
	try {
		db.query(sql, [data, studentnumber], (err, rset) => {
			if (err) {
				console.log(err);
				req.flash("error_msg", "Error updating student");
				res.redirect("/admin/students");
			} else {
				req.flash("success_msg", "Successfully edited student");
				res.redirect("/admin/students");
			}
		});
	} catch (err) {
		console.log("Error: " + err);
		req.flash("error_msg", "Error occur");
		res.redirect("/admin/students");
	}
};

const deleteStudent = async (req, res) => {
	const studentnumber = req.body.data;
	try {
		const messages = (
			await queryParam("DELETE FROM messages WHERE recipient_id = ?", [
				studentnumber,
			])
		)[0];

		const issued_books = (
			await queryParam("DELETE FROM issued_books WHERE user_id = ?", [
				studentnumber,
			])
		)[0];
		const student_record = (
			await queryParam("DELETE FROM student WHERE studentnumber = ?", [
				studentnumber,
			])
		)[0];
		res.status(200).json({ status: "success" });
	} catch (err) {
		console.log("Error: " + err);
		req.flash("error_msg", "Error occur");
		res.redirect("/admin/students");
	}
};

const getFaculty = async (req, res) => {
	res.render("Admin/faculty", { title: "Manage Faculty" });
};
const facultyData = async (req, res) => {
	const faculty_record = await zeroParam(
		"SELECT * FROM faculty ORDER BY faculty.id DESC"
	);
	var resultData = [];

	faculty_record.forEach((data, index) => {
		resultData.push({
			no_id: index + 1,
			facultynumber: data.facultynumber,
			name: data.name,
			email: data.email,
		});
	});

	res.json({ data: resultData });
};
const getFacultyView = async (req, res) => {
	const facultynumber = req.params.facultynumber;
	const faculty = (
		await queryParam("SELECT * FROM faculty WHERE facultynumber = ?", [
			facultynumber,
		])
	)[0];
	const books = await queryParam(
		"SELECT * FROM issued_books WHERE user_id= ? ORDER BY issued_books.id DESC",
		[facultynumber]
	);
	res.render("Admin/faculty_view", {
		faculty,
		books,
		title: "View Faculty",
	});
};

const getFacultyEdit = async (req, res) => {
	const facultynumber = req.params.facultynumber;
	var faculty = (
		await queryParam("SELECT * FROM faculty WHERE facultynumber = ?", [
			facultynumber,
		])
	)[0];

	console.log(facultynumber);
	res.render("Admin/faculty_edit", { faculty, title: "Edit Faculty" });
};

const postFacultyEdit = async (req, res) => {
	const {
		facultynumber,
		name,
		email,
		phonenumber,
		password,
		gender,
		is_verified,
	} = req.body;

	// Create an empty data object with other fields
	var data = {
		facultynumber,
		name,
		gender,
		email,
		phonenumber,
		is_verified,
	};

	// Conditionally update the password only if it's provided in the form
	if (password) {
		//To encrypt the password using hash
		const salt = bcrypt.genSaltSync(15);
		const hash = bcrypt.hashSync(password, salt);
		data.password = hash; // Update the password field
	}

	var sql = "UPDATE faculty SET ? WHERE facultynumber = ?";

	// Add account to database
	try {
		db.query(sql, [data, facultynumber], (err, rset) => {
			if (err) {
				console.log(err);
				req.flash("error_msg", "Error updating faculty");
				res.redirect("/admin/faculty");
			} else {
				req.flash("success_msg", "Successfully edited faculty");
				res.redirect("/admin/faculty");
			}
		});
	} catch (err) {
		console.log("Error: " + err);
		req.flash("error_msg", "Error occur");
		res.redirect("/admin/faculty");
	}
};

const deleteFaculty = async (req, res) => {
	const facultynumber = req.body.data;
	try {
		const messages = (
			await queryParam("DELETE FROM messages WHERE recipient_id = ?", [
				facultynumber,
			])
		)[0];

		const issued_books = (
			await queryParam("DELETE FROM issued_books WHERE user_id = ?", [
				facultynumber,
			])
		)[0];
		const student_record = (
			await queryParam("DELETE FROM faculty WHERE facultynumber = ?", [
				facultynumber,
			])
		)[0];
		res.status(200).json({ status: "success" });
	} catch (err) {
		console.log("Error: " + err);
		req.flash("error_msg", "Error occur");
		res.redirect("/admin/faculty");
	}
};

const getAttendance = async (req, res) => {
	const attendances = await queryParam(
		"SELECT attendance.*, student.name AS student_name, student.gender AS student_gender, student.year_section, faculty.name AS faculty_name, faculty.gender AS faculty_gender FROM attendance LEFT JOIN student ON student.studentnumber = attendance.user_id LEFT JOIN faculty ON faculty.facultynumber = attendance.user_id ORDER BY attendance.attendance_id DESC;"
	);
	res.render("Admin/attendance", { title: "Attendance", attendances });
};
const getAllBooks = async (req, res) => {
	res.render("Admin/all_books", { title: "All Books" });
};
const booksData = async (req, res) => {
	const books_data = await zeroParam(
		"SELECT * FROM books ORDER BY books.id DESC"
	);
	var resultData = [];

	books_data.forEach((data, index) => {
		resultData.push({
			no_id: index + 1,
			id: data.id,
			title: data.title,
			author: data.author,
			publication_year: data.publication_year,
			isbn: data.isbn,
			genre: data.genre,
		});
	});

	res.json({ data: resultData });
};
const getBooksView = async (req, res) => {
	const book_id = req.params.book_id;
	const book = (
		await queryParam("SELECT * FROM books WHERE id = ?", [book_id])
	)[0];

	res.render("Admin/book_view", {
		book,
		title: "View Book",
	});
};
const getAddBooks = (req, res) => {
	res.render("Admin/book_add", { title: "Add New Books" });
};
const postAddBooks = (req, res) => {
	const {
		title,
		author,
		isbn,
		genre,
		description,
		copies_available,
		publication_year,
	} = req.body;
	const book_image = req.file.filename;
	var data = {
		title,
		author,
		isbn,
		genre,
		description,
		copies_available,
		publication_year,
		cover_image_url: book_image,
	};

	var sql = "INSERT INTO books SET ?";

	// Insert book into the database
	try {
		db.query(sql, data, (err, rset) => {
			if (err) {
				console.log(err);
				req.flash("error_msg", "Error inserting book");
				res.redirect("/admin/all_books");
			} else {
				req.flash("success_msg", "Successfully inserted book");
				res.redirect("/admin/all_books");
			}
		});
	} catch (err) {
		console.log("Error: " + err);
		req.flash("error_msg", "Error occurred");
		res.redirect("/admin/all_books");
	}
};
const getBooksEdit = async (req, res) => {
	const book_id = req.params.book_id;
	var book = (
		await queryParam("SELECT * FROM books WHERE id = ?", [book_id])
	)[0];
	res.render("Admin/book_edit", { book, title: "Edit Book" });
};
const postBooksEdit = (req, res) => {
	const {
		id,
		title,
		author,
		isbn,
		genre,
		description,
		publication_year,
		copies_available,
	} = req.body;

	let data = {
		id,
		title,
		author,
		isbn,
		genre,
		description,
		publication_year,
		copies_available,
	};

	if (req.file) {
		// If there is an image file, include cover_image_url in the data object
		data.cover_image_url = req.file.filename;
	}

	const sql = "UPDATE books SET ? WHERE id = ?";

	try {
		db.query(sql, [data, id], (err, rset) => {
			if (err) {
				console.log(err);
				req.flash("error_msg", "Error updating book");
				res.redirect("/admin/all_books");
			} else {
				req.flash("success_msg", "Successfully edited book");
				res.redirect("/admin/all_books");
			}
		});
	} catch (err) {
		console.log("Error: " + err);
		req.flash("error_msg", "Error occur");
		res.redirect("/admin/all_books");
	}
};
const deleteBooks = async (req, res) => {
	const bookId = req.body.data;
	try {
		const issued_books = (
			await queryParam("DELETE FROM issued_books WHERE book_id = ?", [
				bookId,
			])
		)[0];

		const books = (
			await queryParam("DELETE FROM books WHERE id = ?", [bookId])
		)[0];

		res.status(200).json({ status: "success" });
	} catch (err) {
		console.log("Error: " + err);
		req.flash("error_msg", "Error occur");
		res.redirect("/admin/all_books");
	}
};
const getIssuedBooks = async (req, res) => {
	const issued_books = await queryParam(`
	SELECT issued_books.*, books.title FROM issued_books INNER JOIN books ON issued_books.book_id = books.id WHERE issued_books.status = 'ISSUED_APPROVED' OR issued_books.status = 'RETURN_PENDING' OR issued_books.status = 'RENEW_PENDING' OR issued_books.status = 'RENEW_APPROVED' ORDER BY issued_books.id DESC
	`);

	res.render("Admin/issued_books", { title: "Issued Books", issued_books });
};
const getIssueReq = async (req, res) => {
	const issued_books_req = await queryParam(`
	SELECT 
    issued_books.*, 
    books.title, 
    books.copies_available,
    faculty.facultynumber, 
    student.studentnumber
FROM 
    issued_books
INNER JOIN 
    books ON issued_books.book_id = books.id
LEFT JOIN 
    faculty ON issued_books.user_id = faculty.facultynumber
LEFT JOIN 
    student ON issued_books.user_id = student.studentnumber
WHERE 
    issued_books.status = 'ISSUED_PENDING'
ORDER BY 
    issued_books.id DESC;

	`);

	res.render("Admin/issued_request", {
		title: "Issued Request",
		issued_books: issued_books_req,
	});
};

const acceptBookReq = async (req, res) => {
	const bookId = req.body.data;

	const book_name = (
		await queryParam(
			"SELECT books.title FROM issued_books INNER JOIN books ON issued_books.book_id = books.id WHERE issued_books.id = ?;",
			[bookId]
		)
	)[0].title;

	try {
		const now = new Date();
		const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

		const data = {
			issue_date: now.toISOString().slice(0, 19).replace("T", " "),
			due_date: dueDate.toISOString().slice(0, 19).replace("T", " "),
			status: "ISSUED_APPROVED",
		};

		// Decrease the available stock of the book in the "books" table
		db.query(
			"UPDATE books SET copies_available = copies_available - 1 WHERE id = (SELECT book_id FROM issued_books WHERE id = ?)",
			[bookId],
			(err, result) => {
				if (err) {
					res.status(200).json({ status: "error" });
				} else {
					// Update the "issued_books" table
					db.query(
						"UPDATE issued_books SET ? WHERE id = ?",
						[data, bookId],
						(err, result) => {
							if (err) {
								res.status(200).json({ status: "error" });
							} else {
								// Add a message to notify the user about the approved book request
								const message_content = `Your request for book title "${book_name}" has been approved. Enjoy your reading!`;

								const msgQuery = `
					INSERT INTO messages (recipient_id, content) 
					VALUES ((SELECT user_id FROM issued_books WHERE id = ?), ?)
				  `;

								db.query(
									msgQuery,
									[bookId, message_content],
									(err) => {
										res.status(200).json({
											status: err ? "error" : "success",
										});
									}
								);
							}
						}
					);
				}
			}
		);
	} catch (err) {
		res.status(200).json({ status: "error" });
	}
};
const rejectBookReq = async (req, res) => {
	const bookId = req.body.data;
	const book_name = (
		await queryParam(
			"SELECT books.title FROM issued_books INNER JOIN books ON issued_books.book_id = books.id WHERE issued_books.id = ?;",
			[bookId]
		)
	)[0].title;
	try {
		// Update the status in the "issued_books" table to "ISSUED_REJECTED"
		db.query(
			"UPDATE issued_books SET status = ? WHERE id = ?",
			["ISSUED_REJECTED", bookId],
			(err, result) => {
				if (err) {
					res.status(200).json({ status: "error" });
				} else {
					// Add a message to notify the user about the rejected book request
					const message_content = `Your request for book title "${book_name}" has been rejected.`;

					const msgQuery = `
			  INSERT INTO messages (recipient_id, content) 
			  VALUES ((SELECT user_id FROM issued_books WHERE id = ?), ?)
			`;

					db.query(msgQuery, [bookId, message_content], (err) => {
						res.status(200).json({
							status: err ? "error" : "success",
						});
					});
				}
			}
		);
	} catch (err) {
		res.status(200).json({ status: "error" });
	}
};
const getRenewReq = async (req, res) => {
	const renew_books = await queryParam(`
	  SELECT issued_books.*, books.title
	  FROM issued_books
	  INNER JOIN books ON issued_books.book_id = books.id
	  WHERE issued_books.status = 'RENEW_PENDING' ORDER BY issued_books.id DESC
	`);
	res.render("Admin/renew_books", { title: "Renew Request", renew_books });
};
const acceptBookRenew = async (req, res) => {
	const bookId = req.body.bookId;
	const userId = req.body.studentId; // Assuming you have a user ID in the session
	const book_name = (
		await queryParam(
			"SELECT books.title FROM issued_books INNER JOIN books ON books.id = issued_books.book_id WHERE issued_books.id = ?",
			[bookId]
		)
	)[0].title;
	// Check if the book is issued to the user
	const checkIssuedQuery =
		"SELECT * FROM issued_books WHERE id = ? AND user_id = ? AND returned_date IS NULL AND status = 'RENEW_PENDING'";
	db.query(checkIssuedQuery, [bookId, userId], (checkErr, checkResult) => {
		if (checkErr) {
			console.error("Error checking book issuance:", checkErr);
			return res.status(500).json({
				status: "error",
				message: "Error checking book issuance",
			});
		}

		if (checkResult.length === 0) {
			return res.status(400).json({
				status: "error",
				message:
					"User cannot renew this book because it is not issued or it is already returned.",
			});
		}

		// Check if the book is eligible for renewal (e.g., not already renewed, not overdue, and not exceeding the renewal limit)
		const issuedBook = checkResult[0];
		const dueDate = new Date(issuedBook.due_date);
		const now = new Date();

		if (now > dueDate) {
			return res.status(400).json({
				status: "error",
				message: "Book is overdue and cannot be renewed.",
			});
		}

		if (issuedBook.renewal_count >= 2) {
			return res.status(400).json({
				status: "error",
				message:
					"User has already reached the maximum renewal limit for this book.",
			});
		}

		// Update the due date for book renewal and increment the renewal count
		const newDueDate = new Date(dueDate);
		newDueDate.setDate(newDueDate.getDate() + 7); // Renew for 7 days (adjust as needed)

		const updateQuery =
			"UPDATE issued_books SET due_date = ?, status = ?, renewal_count = renewal_count + 1 WHERE id = ?";
		db.query(
			updateQuery,
			[newDueDate, "RENEW_APPROVED", issuedBook.id],
			(updateErr) => {
				if (updateErr) {
					console.error("Error renewing the book:", updateErr);
					return res.status(500).json({
						status: "error",
						message: "Error renewing the book",
					});
				}

				// Add a message to notify the user about the approved renewal
				const message_content = `Your renewal request for book title "${book_name}" has been approved. Enjoy your extended reading!`;

				const msgQuery = `
			INSERT INTO messages (recipient_id, content) 
			VALUES (?, ?)
		  `;

				db.query(msgQuery, [userId, message_content], (msgErr) => {
					if (msgErr) {
						return res.status(500).json({
							status: "error",
							message: "Error sending renewal approval message",
						});
					}

					return res.status(200).json({
						status: "success",
						message: "Book renewed successfully",
					});
				});
			}
		);
	});
};
const rejectBookRenew = async (req, res) => {
	const bookId = req.body.bookId;
	const userId = req.body.studentId; // Assuming you have a user ID in the session
	const book_name = (
		await queryParam(
			"SELECT books.title FROM issued_books INNER JOIN books ON books.id = issued_books.book_id WHERE issued_books.id = ?",
			[bookId]
		)
	)[0].title;
	// Check if the book is issued to the user and pending for renewal
	const checkIssuedQuery =
		"SELECT * FROM issued_books WHERE id = ? AND user_id = ? AND returned_date IS NULL AND status = 'RENEW_PENDING'";
	db.query(checkIssuedQuery, [bookId, userId], (checkErr, checkResult) => {
		if (checkErr) {
			console.error("Error checking book issuance:", checkErr);
			return res.status(500).json({
				status: "error",
				message: "Error checking book issuance",
			});
		}

		if (checkResult.length === 0) {
			return res.status(400).json({
				status: "error",
				message:
					"User cannot reject the renewal request for this book because it is not issued or it is already returned.",
			});
		}

		// Check if the book is eligible for rejection (e.g., not already renewed, not overdue)
		const issuedBook = checkResult[0];
		const dueDate = new Date(issuedBook.due_date);
		const now = new Date();

		if (now > dueDate) {
			return res.status(400).json({
				status: "error",
				message: "Book is overdue and cannot be rejected for renewal.",
			});
		}

		// Update the book's status to 'Requested' (reject the renewal request)
		const updateQuery =
			"UPDATE issued_books SET status = 'RENEW_REJECTED' WHERE id = ?";
		db.query(updateQuery, [issuedBook.id], (updateErr) => {
			if (updateErr) {
				console.error(
					"Error rejecting the book renewal request:",
					updateErr
				);
				return res.status(500).json({
					status: "error",
					message: "Error rejecting the book renewal request",
				});
			}

			// Add a message to notify the user about the rejected renewal
			const message_content = `Your renewal request for book title "${book_name}" has been rejected.`;

			const msgQuery = `
		  INSERT INTO messages (recipient_id, content) 
		  VALUES (?, ?)
		`;

			db.query(msgQuery, [userId, message_content], (msgErr) => {
				if (msgErr) {
					return res.status(500).json({
						status: "error",
						message: "Error sending renewal rejection message",
					});
				}

				return res.status(200).json({
					status: "success",
					message: "Renewal request rejected successfully",
				});
			});
		});
	});
};

const getReturnReq = async (req, res) => {
	const return_books = await queryParam(`
	SELECT issued_books.*, books.title
	FROM issued_books
	INNER JOIN books ON issued_books.book_id = books.id
	WHERE issued_books.status = 'RETURN_PENDING' ORDER BY issued_books.id DESC
  `);
	res.render("Admin/return_books", { title: "Return Request", return_books });
};
const acceptBookReturn = async (req, res) => {
	const bookId = req.body.bookId;
	const userId = req.body.studentId; // Assuming you have a user ID in the session
	const book_name = (
		await queryParam(
			"SELECT books.title FROM issued_books INNER JOIN books ON books.id = issued_books.book_id WHERE issued_books.id = ?",
			[bookId]
		)
	)[0].title;
	// Check if the book is issued to the user and not returned
	const checkIssuedQuery =
		"SELECT * FROM issued_books WHERE id = ? AND user_id = ? AND returned_date IS NULL";

	db.query(checkIssuedQuery, [bookId, userId], (checkErr, checkResult) => {
		if (checkErr) {
			console.error("Error checking book issuance:", checkErr);
			return res.status(500).json({
				status: "error",
				message: "Error checking book issuance",
			});
		}

		if (checkResult.length === 0) {
			return res.status(400).json({
				status: "error",
				message:
					"User cannot return this book because it is not issued or it is already returned.",
			});
		}

		// Update the book's returned_date to mark it as returned
		const returnDate = new Date();

		const updateQuery =
			"UPDATE issued_books SET returned_date = ?, status = ? WHERE id = ?";

		db.query(
			updateQuery,
			[returnDate, "RETURN_APPROVED", checkResult[0].id],
			(updateErr) => {
				if (updateErr) {
					console.error("Error returning the book:", updateErr);
					return res.status(500).json({
						status: "error",
						message: "Error returning the book",
					});
				}

				// Increment copies_available in the books table
				const incrementCopiesQuery =
					"UPDATE books SET copies_available = copies_available + 1 WHERE id = ?";

				db.query(
					incrementCopiesQuery,
					[checkResult[0].book_id],
					(incrementErr) => {
						if (incrementErr) {
							console.error(
								"Error incrementing copies_available:",
								incrementErr
							);
							return res.status(500).json({
								status: "error",
								message: "Error updating copies_available",
							});
						}

						// Add a message to notify the user about the successful return
						const message_content = `Your return for book title "${book_name}" has been approved. Thank you for returning the book!`;

						const msgQuery = `
                            INSERT INTO messages (recipient_id, content) 
                            VALUES (?, ?)
                        `;

						db.query(
							msgQuery,
							[userId, message_content],
							(msgErr) => {
								if (msgErr) {
									return res.status(500).json({
										status: "error",
										message:
											"Error sending return approval message",
									});
								}

								return res.status(200).json({
									status: "success",
									message: "Book returned successfully",
								});
							}
						);
					}
				);
			}
		);
	});
};
const rejectBookReturn = async (req, res) => {
	const bookId = req.body.bookId;
	const userId = req.body.studentId; // Assuming you have a user ID in the session
	const book_name = (
		await queryParam(
			"SELECT books.title FROM issued_books INNER JOIN books ON books.id = issued_books.book_id WHERE issued_books.id = ?",
			[bookId]
		)
	)[0].title;
	// Check if the book is issued to the user and not returned
	const checkIssuedQuery =
		"SELECT * FROM issued_books WHERE id = ? AND user_id = ? AND returned_date IS NULL";
	db.query(checkIssuedQuery, [bookId, userId], (checkErr, checkResult) => {
		if (checkErr) {
			console.error("Error checking book issuance:", checkErr);
			return res.status(500).json({
				status: "error",
				message: "Error checking book issuance",
			});
		}

		if (checkResult.length === 0) {
			return res.status(400).json({
				status: "error",
				message:
					"User cannot reject this book return because it is not issued or it is already returned.",
			});
		}

		// Update the book's status to indicate rejection
		const updateQuery = "UPDATE issued_books SET status = ? WHERE id = ?";
		db.query(
			updateQuery,
			["RETURN_REJECTED", checkResult[0].id],
			(updateErr) => {
				if (updateErr) {
					console.error(
						"Error rejecting the book return:",
						updateErr
					);
					return res.status(500).json({
						status: "error",
						message: "Error rejecting the book return",
					});
				}

				// Add a message to notify the user about the rejected return
				const message_content = `Your return for book title "${book_name}" has been rejected.`;

				const msgQuery = `
		  INSERT INTO messages (recipient_id, content) 
		  VALUES (?, ?)
		`;

				db.query(msgQuery, [userId, message_content], (msgErr) => {
					if (msgErr) {
						return res.status(500).json({
							status: "error",
							message: "Error sending return rejection message",
						});
					}

					return res.status(200).json({
						status: "success",
						message: "Book return has been rejected",
					});
				});
			}
		);
	});
};

const getRecommendation = async (req, res) => {
	const recommendations = await zeroParam(
		"SELECT * FROM recommendations ORDER BY recommendations.id DESC"
	);

	res.render("Admin/recommendations", {
		title: "Recommendation",
		recommendations,
	});
};

const getMessages = async (req, res) => {
	res.render("Admin/messages", { title: "Messages" });
};

const postMessages = async (req, res) => {
	try {
		const { user_id, message } = req.body;
		const data = {
			recipient_id: user_id,
			content: `This is message from Admin: ${message}`,
		};

		const isStudent = (
			await queryParam(
				"SELECT count(*) as 'count' FROM student WHERE studentnumber = ?",
				[user_id]
			)
		)[0].count;
		const isFaculty = (
			await queryParam(
				"SELECT count(*) as 'count' FROM faculty WHERE facultynumber = ?",
				[user_id]
			)
		)[0].count;

		if (isStudent || isFaculty) {
			const sql = "INSERT INTO messages SET ?";
			db.query(sql, data, (err, rset) => {
				if (err) {
					console.error(err);
					req.flash("error_msg", "Error inserting messages");
				} else {
					req.flash("success_msg", "Message successfully sent!");
				}
				res.redirect("/admin/messages");
			});
		} else {
			req.flash("error_msg", "User not found");
			res.redirect("/admin/messages");
		}
	} catch (err) {
		console.error(err);
		req.flash("error_msg", "Error inserting messages");
		res.redirect("/admin/messages");
	}
};

const getLogout = (req, res) => {
	res.clearCookie("token");
	res.redirect("/admin/signin");
};
module.exports = {
	getLogin,
	postLogin,
	getRegister,
	postRegister,
	getDashboard,
	getStudent,
	studentData,
	getStudentView,
	getStudentEdit,
	postStudentEdit,
	deleteStudent,
	getFaculty,
	facultyData,
	getFacultyView,
	getFacultyEdit,
	postFacultyEdit,
	deleteFaculty,
	getAttendance,
	getAllBooks,
	getAddBooks,
	postAddBooks,
	booksData,
	getBooksView,
	getBooksEdit,
	postBooksEdit,
	deleteBooks,
	getIssuedBooks,
	getIssueReq,
	acceptBookReq,
	rejectBookReq,
	getRenewReq,
	acceptBookRenew,
	rejectBookRenew,
	getReturnReq,
	acceptBookReturn,
	rejectBookReturn,
	getRecommendation,
	getMessages,
	postMessages,
	getLogout,
};
