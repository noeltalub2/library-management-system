const express = require("express");
const router = express.Router();

const studentController = require("../controller/student.controller");
const { requireAuth, forwardAuth } = require("../middleware/student.auth");

router.get("/signin", forwardAuth, studentController.getLogin);
router.post("/signin", forwardAuth, studentController.postLogin);

router.get("/signup", forwardAuth, studentController.getRegister);
router.post("/signup", forwardAuth, studentController.postRegister);

router.get("/dashboard", requireAuth, studentController.getDashboard);
router.get("/all_books", requireAuth, studentController.getAllBooks);
router.post("/issue/:bookId", requireAuth, studentController.postIssuedBooks);
router.get("/borrowed_books", requireAuth, studentController.getBorrowedBooks);
router.get("/issued_books", requireAuth, studentController.getIssuedBooks);
router.post("/renew/", requireAuth, studentController.postRenewBooks);
router.post("/return/", requireAuth, studentController.postReturnBooks);
router.get("/attendance", requireAuth, studentController.getAttendance)
router.get("/messages", requireAuth, studentController.getMessages);
router.get(
	"/recommendations",
	requireAuth,
	studentController.getRecommendation
);

router.post(
	"/recommendations",
	requireAuth,
	studentController.postRecommendation
);

router.get("/logout", requireAuth, studentController.getLogout);

module.exports = router;
