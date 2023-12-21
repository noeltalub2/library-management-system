const { time, date } = require("../utils/timestamp");
const db = require("../database/db");

const zeroParam = async (sql) => {
	try {
		return (await db.promise().query(sql))[0];
	} catch (err) {
		console.log(err);
		throw err;
	}
};

const postAttendance = async (req, res) => {
	const user_id = req.body.user_id;
	const attendance_type = req.body.attendance_type;

	try {
		// Check if the user exists in the student table
		const student = (
			await zeroParam(
				`SELECT count(*) as 'count', name FROM student WHERE studentnumber = '${user_id}'`
			)
		)[0];

		// Check if the user exists in the faculty table
		const faculty = (
			await zeroParam(
				`SELECT count(*) as 'count', name FROM faculty WHERE facultynumber = '${user_id}'`
			)
		)[0];
		
		if ((student && student.count > 0) || (faculty && faculty.count > 0)) {
			// Check for any existing incomplete attendance
			const existingIncompleteAttendance = (
				await zeroParam(
					`SELECT count(*) as 'count' FROM attendance WHERE user_id = '${user_id}' AND log_date = '${date()}' AND status = '1' AND time_out IS NULL`
				)
			)[0];

			if (attendance_type === "1") {
				// Time In Logic
				if (
					existingIncompleteAttendance &&
					existingIncompleteAttendance.count > 0
				) {
					// Incomplete attendance exists, prevent time in
					res.status(200).json({
						status: "error",
						msg: "User has been timed in already",
					});
				} else {
					// Insert time in record
					await zeroParam(
						`INSERT INTO attendance SET user_id='${user_id}', time_in='${time()}', log_date='${date()}', status='1', logs='${time()}'`
					);

					const userName = student.count
						? student.name
						: faculty.count
						? faculty.name
						: "";

					res.status(200).json({
						status: "success",
						user_id: user_id,
						name: userName,
					});
				}
			} else if (attendance_type === "2") {
				// Time Out Logic
				if (
					existingIncompleteAttendance &&
					existingIncompleteAttendance.count > 0
				) {
					// Update time out record
					await zeroParam(
						`UPDATE attendance SET time_out='${time()}', status='2', logs='${time()}' WHERE user_id = '${user_id}' AND log_date = '${date()}' AND status = '1' AND time_out IS NULL`
					);

					// Retrieve the user's name
					const userName = student.count
						? student.name
						: faculty.count
						? faculty.name
						: "";

					res.status(200).json({
						status: "success",
						user_id: user_id,
						name: userName,
					});
				} else {
					// No incomplete attendance found, prevent time out
					res.status(200).json({
						status: "error",
						msg: "You need to complete time in first",
					});
				}
			} else {
				// Invalid attendance type
				res.status(200).json({
					status: "error",
					msg: "Select Attendance Type Below",
				});
			}
		} else {
			// User not found
			res.status(200).json({
				status: "error",
				msg: "User does not exist in database",
			});
		}
	} catch (err) {
		console.log(err);
		// Invalid Barcode or other error
		res.status(200).json({
			status: "error",
			msg: "Invalid Barcode",
		});
	}
};

module.exports = {
	postAttendance,
};
