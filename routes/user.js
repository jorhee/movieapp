//user routes
//[dependencies and modules]
const express = require("express");
const userController = require("../controllers/user");
const { verify, isLoggedIn } = require("../auth");


//[routing component]
const router = express.Router();


//[Route for user registration]

router.post("/register", userController.registerUser);

router.post("/login", userController.loginUser);

router.get("/details", verify, userController.getProfile);




//[export route system]
module.exports = router;