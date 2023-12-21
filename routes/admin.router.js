const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin.controller");
const { requireAuth, forwardAuth } = require("../middleware/admin.auth");
const { imageUpload } = require("../middleware/imageUpload");

router.get("/signin", forwardAuth, adminController.getLogin);
router.post("/signin", forwardAuth, adminController.postLogin);

router.get("/signup", forwardAuth, adminController.getRegister);
router.post("/signup", forwardAuth, adminController.postRegister);

router.get("/dashboard", requireAuth, adminController.getDashboard);

router.get("/students", requireAuth, adminController.getStudent);
router.post("/student_data", requireAuth, adminController.studentData);
router.get(
	"/student/view/:studentnumber",
	requireAuth,
	adminController.getStudentView
);
router.get(
	"/student/edit/:studentnumber",
	requireAuth,
	adminController.getStudentEdit
);
router.post("/student/edit/", requireAuth, adminController.postStudentEdit);
router.delete("/student/delete/", requireAuth, adminController.deleteStudent);

router.get("/faculty", requireAuth, adminController.getFaculty);
router.post("/faculty_data", requireAuth, adminController.facultyData);
router.get(
	"/faculty/view/:facultynumber",
	requireAuth,
	adminController.getFacultyView
);
router.get(
	"/faculty/edit/:facultynumber",
	requireAuth,
	adminController.getFacultyEdit
);
router.post("/faculty/edit/", requireAuth, adminController.postFacultyEdit);
router.delete("/faculty/delete/", requireAuth, adminController.deleteFaculty);

router.get("/attendance", requireAuth, adminController.getAttendance);

router.get("/all_books", requireAuth, adminController.getAllBooks);
router.get("/add_books", requireAuth, adminController.getAddBooks);
router.post(
	"/add_books",
	imageUpload.single("book_image"),
	requireAuth,
	adminController.postAddBooks
);

router.post("/book_data", requireAuth, adminController.booksData);
router.get("/books/view/:book_id", requireAuth, adminController.getBooksView);
router.get("/books/edit/:book_id", requireAuth, adminController.getBooksEdit);
router.post(
	"/books/edit",
	imageUpload.single("book_image"),
	requireAuth,
	adminController.postBooksEdit
);
router.delete("/books/delete", requireAuth, adminController.deleteBooks);

router.get("/issued_books", requireAuth, adminController.getIssuedBooks);

router.get("/issue_request", requireAuth, adminController.getIssueReq);
router.post("/issue/accept", requireAuth, adminController.acceptBookReq);
router.post("/issue/reject", requireAuth, adminController.rejectBookReq);

router.get("/renew_request", requireAuth, adminController.getRenewReq);
router.post("/renew/accept", requireAuth, adminController.acceptBookRenew);
router.post("/renew/reject", requireAuth, adminController.rejectBookRenew);

router.get("/return_request", requireAuth, adminController.getReturnReq);
router.post("/return/accept", requireAuth, adminController.acceptBookReturn);
router.post("/return/reject", requireAuth, adminController.rejectBookReturn);

router.get("/messages", requireAuth, adminController.getMessages);
router.post("/messages", requireAuth, adminController.postMessages);

router.get("/recommendations", requireAuth, adminController.getRecommendation);
router.get("/logout", requireAuth, adminController.getLogout);

module.exports = router;
