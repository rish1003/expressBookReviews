const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = []; // Store users in this array

const isValid = (username) => {
    // Check if the username exists in the users array
    return users.some(user => user.username === username);
};

const authenticatedUser = (username, password) => {
    // Check if the username and password match
    return users.some(user => user.username === username && user.password === password);
};

// Only registered users can log in
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    if (!isValid(username)) {
        return res.status(404).json({ message: "Username not found." });
    }

    if (!authenticatedUser(username, password)) {
        return res.status(403).json({ message: "Incorrect password." });
    }

    // Create a JWT token with username stored in the payload
    const token = jwt.sign({ username }, 'fingerprint_customer', { expiresIn: '1h' });
    req.session.accessToken = token; 
    // Send the token to the client
    return res.status(200).json({ message: "Login successful", token });
});

// Middleware to authenticate the JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

    console.log(req.header);
    if (!token) {
        return res.status(403).json({ message: "Access denied. No token provided." });
    }
    console.log(token)
    jwt.verify(token, 'fingerprint_customer', (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token." });
        }
        req.user = user;
        next();
    });
};

// Add or modify a book review
regd_users.put("/auth/review/:isbn", authenticateToken, (req, res) => {
  const { isbn } = req.params;
  const { review } = req.body;
  const { username } = req.user;

  if (!review) {
      return res.status(400).json({ message: "Review text is required." });
  }

  // Check if the book exists in the database
  const book = books[isbn];
  if (!book) {
      return res.status(404).json({ message: "Book not found." });
  }

  // If the book has reviews, check if the user already reviewed it
  if (book.reviews) {
      // Check if the review object already has an entry for the current username
      if (book.reviews[username]) {
          // Modify the existing review
          book.reviews[username] = review;
      } else {
          // Add a new review
          book.reviews[username] = review;
      }
  } else {
      // If the book doesn't have reviews yet, create a new object for reviews
      book.reviews = { [username]: review };
  }

  return res.status(200).json({ message: "Review added/modified successfully.", reviews: book.reviews });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", authenticateToken, (req, res) => {
  const { isbn } = req.params;
  const { username } = req.user;

  // Check if the book exists in the database
  const book = books[isbn];
  if (!book) {
      return res.status(404).json({ message: "Book not found." });
  }

  // Check if the review exists for the logged-in user
  if (book.reviews && book.reviews[username]) {
      // Delete the review
      delete book.reviews[username];
      return res.status(200).json({ message: "Review deleted successfully." });
  } else {
      return res.status(404).json({ message: "Review not found." });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
