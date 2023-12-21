const express = require("express");
const router = express.Router();

const facultyController = require("../controller/faculty.controller");
const { requireAuth, forwardAuth } = require("../middleware/faculty.auth");

router.get("/signin", forwardAuth, facultyController.getLogin);
router.post("/signin", forwardAuth, facultyController.postLogin);

router.get("/signup", forwardAuth, facultyController.getRegister);
router.post("/signup", forwardAuth, facultyController.postRegister);

router.get("/dashboard", requireAuth, facultyController.getDashboard);
router.get("/all_books", requireAuth, facultyController.getAllBooks);
router.post("/issue/:bookId", requireAuth, facultyController.postIssuedBooks);
router.get("/borrowed_books", requireAuth, facultyController.getBorrowedBooks);
router.get("/issued_books", requireAuth, facultyController.getIssuedBooks);
router.post("/renew/", requireAuth, facultyController.postRenewBooks);
router.post("/return/", requireAuth, facultyController.postReturnBooks);
router.get("/attendance", requireAuth, facultyController.getAttendance)
router.get("/messages", requireAuth, facultyController.getMessages);
router.get(
	"/recommendations",
	requireAuth,
	facultyController.getRecommendation
);

router.post(
	"/recommendations",
	requireAuth,
	facultyController.postRecommendation
);

router.get("/logout", requireAuth, facultyController.getLogout);

module.exports = router;
