const bcrypt = require("bcrypt");
const fs = require("fs");
const { createTokenStudent } = require("../utils/token");
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
	res.render("Student/signin");
};
const postLogin = (req, res) => {
	try {
		const { studentnumber, password } = req.body;
		const findUser = "SELECT * from student WHERE studentnumber = ?";

		db.query(findUser, [studentnumber], async (err, result) => {
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
						const generateToken = createTokenStudent(
							result[0].studentnumber
						);
						res.cookie("token", generateToken, { httpOnly: true });
						res.redirect("/dashboard");
					} else {
						req.flash(
							"error_msg",
							"Incorrect student number or password"
						);
						res.redirect("/signin");
					}
				} else {
					req.flash("error_msg", "Could'nt find your account");
					res.redirect("/signin");
				}
			}
		});
	} catch {
		throw err;
	}
};
const getRegister = (req, res) => {
	res.render("Student/signup");
};
const postRegister = async (req, res) => {
	//Data from the form ../register
	const {
		studentnumber,
		name,
		course,
		phonenumber,
		email,
		password,
		gender,
		year_section,
	} = req.body;
	let errors = [];
	//Sql statement if there is duplciate in database
	var student_exist =
		"Select count(*) as `count` from student where studentnumber = ?";
	var email_exist = "Select count(*) as `count` from student where email = ?";
	var phone_exist =
		"Select count(*) as `count` from student where phonenumber = ?";
	//Query statement
	const student_count = (await queryParam(student_exist, [studentnumber]))[0]
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
	if (student_count > 0) {
		errors.push({ msg: "Student number is already registered" });
	}

	//To encrypt the password using hash
	const salt = bcrypt.genSaltSync(15);
	const hash = bcrypt.hashSync(password, salt);
	//Data to insert in sql
	var data = {
		studentnumber: studentnumber,
		name: name,
		course: course,
		year_section: year_section,
		phonenumber: phonenumber,
		email: email,
		password: hash,
		gender: gender,
		join_date: date_time(),
	};
	//Add account to database
	var sql = "INSERT INTO student SET ?";
	db.query(sql, data, (err, rset) => {
		if (err) {
			res.render("Student/signup", {
				errors,
			});
		} else {
			req.flash("success_msg", "Account created successfully");
			res.redirect("/signup");
		}
	});
};
const getDashboard = async (req, res) => {
	const student = (
		await queryParam(
			"SELECT studentnumber, name, email, course, phonenumber, join_date,gender,year_section from student WHERE studentnumber = ?",
			[res.locals.id]
		)
	)[0];
	const messages = await queryParam(
		"SELECT * from messages WHERE recipient_id = ? ORDER BY messages.id DESC LIMIT 5",
		[res.locals.id]
	);

	const return_book = (
		await queryParam(
			"SELECT count(*) as 'count' FROM issued_books WHERE status = 'RETURN_APPROVED' AND user_id = ?",
			[res.locals.id]
		)
	)[0].count;
	const borrowed_book = (
		await queryParam(
			"SELECT count(*) as 'count' FROM issued_books WHERE issue_date IS NOT NULL AND returned_date IS NULL AND user_id = ?",
			[res.locals.id]
		)
	)[0].count;
	res.render("Student/dashboard", {
		title: "Dashboard",
		student,
		messages,
		return_book,
		borrowed_book,
	});
};
const getAllBooks = async (req, res) => {
	const booksData = await zeroParam(
		"SELECT * FROM `books` ORDER BY `books`.`id` DESC"
	);
	res.render("Student/all_books", { title: "All Books", booksData });
};
const postIssuedBooks = async (req, res) => {
	const bookId = req.params.bookId;
	const userId = res.locals.id;
	const book_name = (
		await queryParam("SELECT title FROM books WHERE id = ?", [bookId])
	)[0].title;

	const duplicateQuery = `
	  SELECT * FROM issued_books
	  WHERE book_id = ? AND user_id = ? 
	  AND status IN ('ISSUED_PENDING', 'ISSUED_APPROVED', 'RETURN_PENDING', 'RETURN_REJECTED', 'RENEW_PENDING', 'RENEW_APPROVED', 'RETURN_REJECTED')
	  AND returned_date IS NULL AND (issue_date IS NOT NULL OR issue_date IS NULL);
	`;

	db.query(
		duplicateQuery,
		[bookId, userId],
		(duplicateErr, duplicateResult) => {
			if (duplicateErr) {
				console.error(
					"Error checking for duplicate borrow:",
					duplicateErr
				);
				req.flash("error", "Error checking for duplicate borrow");
				return res.redirect("/all_books");
			}

			if (duplicateResult.length > 0) {
				req.flash(
					"error",
					`You have already issued this book title "${book_name}"`
				);
				return res.redirect("/all_books");
			}

			const issueQuery = `
		INSERT INTO issued_books (book_id, user_id, status) 
		VALUES (?, ?, ?)
	  `;

			db.query(issueQuery, [bookId, userId, "ISSUED_PENDING"], (err) => {
				if (err) {
					console.error("Error issuing the book:", err);
					req.flash("error", "Error issuing the book");
					return res.redirect("/all_books");
				}

				const message_content = `You have successfully issued book title "${book_name}"`;
				const msgQuery = `
		  INSERT INTO messages (recipient_id, content) 
		  VALUES (?, ?)
		`;

				db.query(msgQuery, [userId, message_content], (err) => {
					if (err) {
						req.flash("error", "Error issuing the book");
						return res.redirect("/all_books");
					}

					req.flash(
						"success_msg",
						`Book ${book_name} issued successfully`
					);
					res.redirect("/all_books");
				});
			});
		}
	);
};
const getBorrowedBooks = (req, res) => {
	const userId = res.locals.id; // Assuming you have a user ID in the session

	// Fetch previously borrowed books for the user
	const query = `
    SELECT books.title, books.author, issued_books.issue_date, issued_books.returned_date, issued_books.status
    FROM issued_books
    INNER JOIN books ON issued_books.book_id = books.id
    WHERE issued_books.user_id = ? AND (issued_books.status = "RETURN_APPROVED" OR issued_books.status = "ISSUED_REJECTED")
    ORDER BY issued_books.returned_date DESC`;

	db.query(query, [userId], (err, results) => {
		if (err) {
			console.error("Error fetching previously borrowed books:", err);
			req.flash("error", "Error fetching previously borrowed books");
			return res.redirect("/all_books");
		}

		// Render the 'previouslyBorrowedBooks.ejs' view with the list of previously borrowed books
		res.render("Student/borrowed_books", {
			title: "Previously Borrowed Books",
			previouslyBorrowedBooks: results,
		});
	});
};
const getIssuedBooks = (req, res) => {
	const query =
		"SELECT issued_books.id, books.id AS book_id, books.title, books.author, issued_books.issue_date, issued_books.due_date, issued_books.status, issued_books.user_id FROM books JOIN issued_books ON books.id = issued_books.book_id WHERE issued_books.returned_date IS NULL AND issued_books.user_id = ? ORDER BY issued_books.id DESC;";

	db.query(query, [res.locals.id], (err, results) => {
		if (err) {
			console.error("Error fetching currently issued books:", err);
		}

		// Render the currentlyIssuedBooks.ejs view with the list of currently issued books
		res.render("Student/issued_books", {
			title: "Issued Books",
			issuedBooks: results,
		});
	});
};
const postRenewBooks = async (req, res) => {
	const bookId = req.body.bookId;
	const userId = req.body.studentId; // Assuming you have a user ID in the session
	const book_name = (
		await queryParam(
			"SELECT books.title FROM issued_books INNER JOIN books ON books.id = issued_books.book_id WHERE issued_books.id = ?",
			[bookId]
		)
	)[0].title;

	// Check if the book is already issued to the user
	const checkIssuedQuery =
		"SELECT * FROM issued_books WHERE id = ? AND user_id = ? AND issue_date IS NOT NULL";
	db.query(checkIssuedQuery, [bookId, userId], (checkErr, checkResult) => {
		if (checkErr) {
			console.error("Error checking book issuance:", checkErr);
			res.status(500).json({
				status: "error",
				message: "Error checking book issuance",
			});
		}

		if (checkResult.length === 0) {
			res.status(400).json({
				status: "error",
				message: "You have not borrowed this book.",
			});
		} else {
			// Check if the book is eligible for renewal (e.g., not already renewed, not overdue, and not exceeding the renewal limit)
			const issuedBook = checkResult[0];

			const dueDate = new Date(issuedBook.due_date);
			const now = new Date();

			if (now > dueDate) {
				res.status(400).json({
					status: "error",
					message:
						"Book is overdue and cannot be renewed. Please return the book",
				});
			} else if (issuedBook.renewal_count >= 2) {
				res.status(400).json({
					status: "error",
					message:
						"You have already reached the maximum renewal limit for this book.",
				});
			} else {
				// Set the status to "renewal_requested" and inform the student with a success response
				const updateStatusQuery =
					"UPDATE issued_books SET status = 'RENEW_PENDING' WHERE id = ?";
				db.query(
					updateStatusQuery,
					[issuedBook.id],
					(updateStatusErr) => {
						if (updateStatusErr) {
							console.error(
								"Error updating the renewal status:",
								updateStatusErr
							);
							res.status(500).json({
								status: "error",
								message:
									"Error processing the renewal request.",
							});
						} else {
							// Add a message to notify the user about the renewal request
							const message_content = `Your renewal request for book title "${book_name}" has been submitted for approval.`;

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
												"Error sending renewal request message",
										});
									}

									res.status(200).json({
										status: "success",
										message:
											"Renewal request sent for approval.",
									});
								}
							);
						}
					}
				);
			}
		}
	});
};
const postReturnBooks = async (req, res) => {
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
		"SELECT * FROM issued_books WHERE id = ? AND user_id = ? AND issue_date IS NOT NULL AND returned_date IS NULL;";
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
					"You cannot return this book because it is not issued to you or it is already returned.",
			});
		}

		// Update the "status" to mark the book as "Return"
		const issuedBook = checkResult[0];

		const updateStatusQuery =
			"UPDATE issued_books SET status = ? WHERE id = ?";
		db.query(
			updateStatusQuery,
			["RETURN_PENDING", issuedBook.id],
			(updateErr) => {
				if (updateErr) {
					console.error(updateErr);
					return res.status(500).json({
						status: "error",
						message: "Error processing the return request.",
					});
				}

				// Add a message to notify the user about the return request
				const message_content = `Your return request for book title "${book_name}" has been submitted for approval.`;

				const msgQuery = `
		  INSERT INTO messages (recipient_id, content) 
		  VALUES (?, ?)
		`;

				db.query(msgQuery, [userId, message_content], (msgErr) => {
					if (msgErr) {
						return res.status(500).json({
							status: "error",
							message: "Error sending return request message",
						});
					}

					return res.status(200).json({
						status: "success",
						message: "Return request sent for approval.",
					});
				});
			}
		);
	});
};
const getAttendance = async (req, res) => {
	const attendances = await queryParam(
		"SELECT * FROM attendance WHERE user_id = ? ORDER BY attendance.attendance_id DESC",
		[res.locals.id]
	);
	res.render("Student/attendance", { title: "Attendance", attendances });
};
const getMessages = async (req, res) => {
	const messages = await queryParam(
		"SELECT * FROM messages WHERE recipient_id = ? ORDER BY id DESC",
		[res.locals.id]
	);

	res.render("Student/messages", { title: "Messages", messages });
};
const getRecommendation = (req, res) => {
	res.render("Student/recommendations", { title: "Recommendations" });
};
const postRecommendation = (req, res) => {
	const { book_name, description, author } = req.body;
	const studentnumber = res.locals.id;
	const data = {
		book_name,
		description,
		author,
		user_id: studentnumber,
	};

	db.query("INSERT INTO recommendations SET ?", data, (err, result) => {
		if (err) {
			console.error("Error inserting recommendation:", err);
			req.flash("error", "Error inserting recommendations");
			res.redirect("/recommendations");
		} else {
			req.flash("success_msg", "Successfully posted recommendation");
			res.redirect("/recommendations");
		}
	});
};
const getLogout = (req, res) => {
	res.clearCookie("token");
	res.redirect("/signin");
};

module.exports = {
	getLogin,
	postLogin,
	getRegister,
	postRegister,
	getDashboard,
	getAllBooks,
	postIssuedBooks,
	getBorrowedBooks,
	getIssuedBooks,
	postRenewBooks,
	postReturnBooks,
	getAttendance,
	getMessages,
	getRecommendation,
	postRecommendation,
	getLogout,
};
