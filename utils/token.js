const { sign } = require("jsonwebtoken");

const createTokenStudent = (user) => {
	const accessToken = sign(
		{ studentnumber: user },
		process.env.JWT_SECRET_KEY,
		{ expiresIn: process.env.JWT_EXPIRE }
	);
	return accessToken;
};

const createTokenFaculty = (user) => {
	const accessToken = sign(
		{ facultynumber: user },
		process.env.JWT_SECRET_KEY,
		{ expiresIn: process.env.JWT_EXPIRE }
	);
	return accessToken;
};

const createTokenAdmin = (user) => {
	const accessToken = sign({ username: user }, process.env.JWT_SECRET_KEY, {
		expiresIn: process.env.JWT_EXPIRE,
	});
	return accessToken;
};
module.exports = { createTokenStudent, createTokenAdmin,createTokenFaculty };
