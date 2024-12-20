const Movie = require("../models/Movie");
const {errorHandler} = require("../auth");
const User = require("../models/User");
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Folder where images will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Ensure unique filenames
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Images only!'));
    }
  }
});


module.exports.addMovie = async (req, res) => {
    try {
        // Extract userId from the authenticated user
        const userId = req.user.id;

        // Fetch user details to validate admin status
        const user = await User.findById(userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                message: 'Access denied. Admin privileges are required.',
            });
        }

        // Extract movie details from the request body
        const { title, director, year, description, genre } = req.body;

        // Validate required fields (excluding picture)
        if (!title || !director || !year || !description || !genre) {
            return res.status(400).json({
                message: 'All fields except picture are required.',
            });
        }

        // Initialize picture path (default to null if not provided)
        let picturePath = null;
        if (req.file) {
            // If a picture file is uploaded, save its path
            picturePath = path.join('uploads', req.file.filename);
        }

        // Create a new movie instance
        const newMovie = new Movie({
            title,
            director,
            year,
            description,
            genre,
            picture: picturePath, // Save picture path if available
        });

        // Save the movie to the database
        const savedMovie = await newMovie.save();

        // Respond with the saved movie
        res.status(201).json(savedMovie);
    } catch (error) {
        console.error(error); // Log the error for debugging
        errorHandler(error, req, res);
    }
};


// Middleware to handle file upload (use this in your route)
module.exports.uploadMiddleware = upload.single('picture');


module.exports.getAllMovies = async (req, res) => {
    try {
        // Fetch all movies from the database
        const movies = await Movie.find();

        // Check if no movies were found
        if (movies.length === 0) {
            return res.status(200).json({
                message: 'No movies found.',
                movies: [],
            });
        }

        // Respond with the list of movies
        res.status(200).json({
            message: 'Movies retrieved successfully.',
            movies: movies,
        });
    } catch (error) {
        // Handle server errors
        console.error("Error retrieving movies:", error);
        res.status(500).json({
            message: 'Error retrieving movies.',
            error: error.message,
        });
    }
};


module.exports.getMovieById = async (req, res) => {
    try {
        // Ensure the user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'Access denied. Please log in.',
            });
        }

        // Extract the movie ID from the request parameters
        const { movieId } = req.params;

        // Find the movie by ID
        const movie = await Movie.findById(movieId);

        // Check if the movie exists
        if (!movie) {
            return res.status(404).json({
                message: 'Movie not found.',
            });
        }

        // Respond with the movie details
        res.status(200).json({
            movie: movie,
        });
    } catch (error) {
        // Handle server errors
        console.error("Error retrieving movie:", error);
        res.status(500).json({
            message: 'Error retrieving movie.',
            error: error.message,
        });
    }
};



module.exports.updateMovie = async (req, res) => {
    try {
        // Check if the user has admin privileges
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                message: 'Access denied. Admin privileges are required.',
            });
        }

        // Extract movie ID from the request parameters
        const { movieId } = req.params;

        // Extract updated movie details from the request body
        const { title, director, year, description, genre } = req.body;

        // Validate required fields (optional)
        if (!title && !director && !year && !description && !genre) {
            return res.status(400).json({
                message: 'At least one field is required to update the movie.',
            });
        }

        // Find and update the movie
        const updatedMovie = await Movie.findByIdAndUpdate(
            movieId, // Movie ID to update
            { title, director, year, description, genre }, // Updated fields
            { new: true } // Options: return the updated document and run validators
        );

        // Check if the movie exists
        if (!updatedMovie) {
            return res.status(404).json({
                message: 'Movie not found.',
            });
        }

        // Respond with the updated movie
        res.status(200).json({
            message: 'Movie updated successfully.',
            updatedMovie: updatedMovie,
        });
    } catch (error) {
        // Log the error and send a server error response
        console.error("Error updating movie:", error);
        res.status(500).json({
            message: 'Error updating movie.',
            error: error.message,
        });
    }
};


module.exports.deleteMovie = async (req, res) => {
    try {
        // Check if the user has admin privileges
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                message: 'Access denied. Admin privileges are required.',
            });
        }

        // Extract movie ID from the request parameters
        const { movieId } = req.params;

        // Find and delete the movie
        const deletedMovie = await Movie.findByIdAndDelete(movieId);

        // Check if the movie exists
        if (!deletedMovie) {
            return res.status(404).json({
                message: 'Movie not found.',
            });
        }

        // Respond with a success message
        res.status(200).json({
            message: 'Movie deleted successfully.',
        });
    } catch (error) {
        // Log the error and send a server error response
        console.error("Error deleting movie:", error);
        res.status(500).json({
            message: 'Error deleting movie.',
            error: error.message,
        });
    }
};

module.exports.addComment = async (req, res) => {
    try {
        // Get the authenticated user's ID
        const userId = req.user.id;

        // Extract movie ID from the request parameters
        const { movieId } = req.params;

        // Extract comment text from the request body
        const { comment } = req.body;

        // Validate comment text
        if (!comment) {
            return res.status(400).json({
                message: 'Comment text is required.',
            });
        }

        // Find the movie to ensure it exists
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                message: 'Movie not found.',
            });
        }

        // Create the comment object
        const comments = {
            userId,
            comment
        };

        // Add the comment to the movie's comments array
        movie.comments.push(comments);

        // Save the updated movie
        const updatedMovie = await movie.save();

        // Respond with the updated movie and the added comment
        res.status(200).json({
            message: 'comment added successfully.',
            updatedMovie: updatedMovie
        });
    } catch (error) {
        // Log the error and send a server error response
        console.error("Error adding comment:", error);
        res.status(500).json({
            message: 'Error adding comment.',
            error: error.message,
        });
    }
};


module.exports.getComments = async (req, res) => {
    try {
        // Extract movie ID from the request parameters
        const { movieId } = req.params;

        // Find the movie and populate user details in the comments (optional)
        const movie = await Movie.findById(movieId)//.populate('comments.userId', 'email');

        // Check if the movie exists
        if (!movie) {
            return res.status(404).json({
                message: 'Movie not found.',
            });
        }

        // Respond with the comments
        res.status(200).json({
            comments: movie.comments,
        });
    } catch (error) {
        // Log the error and send a server error response
        console.error("Error retrieving comments:", error);
        res.status(500).json({
            message: 'Error retrieving comments.',
            error: error.message,
        });
    }
};
