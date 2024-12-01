const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    comment: { 
        type: String, 
        required: true, 
    },
});

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is Required']
    },
    director: {
        type: String,
        required: [true, 'Director is Required']
    },
    year: {
        type: String,
        required: [true, 'Year is Required']
    },
    description: {
        type: String,
        required: [true, 'Description is Required'],
    },
    genre: {
        type: String,
        required: [true, 'Genre is Required'],
    },
    picture: {
    type: String, // A single string to store the path or filename of the image
    default: null
    },
    comments: [commentSchema], // Embed the comment schema here
});

module.exports = mongoose.model('Movie', movieSchema);
