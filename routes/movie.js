const express = require("express");
const movieController = require("../controllers/movie");
const auth = require("../auth");
const { verify, verifyAdmin, isLoggedIn } = auth;

const router = express.Router();



router.post("/addMovie", verify, verifyAdmin, isLoggedIn, movieController.uploadMiddleware, movieController.addMovie);

router.get("/getMovies", movieController.getAllMovies);

router.get("/getMovie/:movieId", verify, isLoggedIn, movieController.getMovieById);


router.patch("/updateMovie/:movieId", verify, verifyAdmin, isLoggedIn, movieController.updateMovie);

router.delete("/deleteMovie/:movieId", verify, verifyAdmin, isLoggedIn, movieController.deleteMovie);

router.patch("/addComment/:movieId", verify, isLoggedIn, movieController.addComment);

router.get("/getComments/:movieId", verify, isLoggedIn, movieController.getComments);


module.exports = router;