const express = require('express');
let books = require("./booksdb.js"); // Assuming booksdb.js contains book data
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    const userExists = users.find(user => user.username === username);

    if (userExists) {
        return res.status(400).json({ message: "Username already exists." });
    }

    users.push({ username, password });
    return res.status(200).json({ message: "User registered successfully!" });
});

public_users.get('/', async (req, res) => {
  try {
      const response = await new Promise((resolve) => setTimeout(() => resolve(books), 500));
      res.status(200).json(response);
  } catch (error) {
      res.status(500).json({ message: "Error fetching books." });
  }
});



public_users.get('/isbn/:isbn', async (req, res) => {
  const { isbn } = req.params;

  try {
      const book = await new Promise((resolve, reject) => {
          const result = books[isbn];
          result ? resolve(result) : reject(new Error("Book not found with the given ISBN."));
      });
      res.status(200).json(book);
  } catch (error) {
      res.status(404).json({ message: error.message });
  }
});


public_users.get('/author/:author', async (req, res) => {
  const { author } = req.params;

  try {
      const filteredBooks = await new Promise((resolve) => {
          const result = Object.values(books).filter(book => book.author === author);
          resolve(result);
      });

      if (filteredBooks.length > 0) {
          res.status(200).json(filteredBooks);
      } else {
          throw new Error("No books found by the given author.");
      }
  } catch (error) {
      res.status(404).json({ message: error.message });
  }
});



public_users.get('/title/:title', async (req, res) => {
  const { title } = req.params;

  try {
      const filteredBooks = await new Promise((resolve) => {
          const result = Object.values(books).filter(book => book.title === title);
          resolve(result);
      });

      if (filteredBooks.length > 0) {
          res.status(200).json(filteredBooks);
      } else {
          throw new Error("No books found with the given title.");
      }
  } catch (error) {
      res.status(404).json({ message: error.message });
  }
});



public_users.get('/review/:isbn', function (req, res) {
    const { isbn } = req.params;

    const book = books[isbn];
    if (book && book.reviews) {
        return res.status(200).json(book.reviews);
    } else {
        return res.status(404).json({ message: "No reviews found for the given ISBN." });
    }
});

module.exports.general = public_users;
