const express = require("express");
const router = express.Router();
const Book = require("../models/book");
const Author = require("../models/author");
const multer = require("multer");
const path = require("path");
const uploadPath = path.join("public", Book.coverImageBasePath);
const imageMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const fs = require("fs");
const { query } = require("express");
const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  },
});

//All books route
router.get("/", async (req, res) => {
  let query = Book.find();
  const { title, publishBefore, publishAfter } = req.query;
  if (title != null && title != "") {
    query = query.regex("title", new RegExp(title, "i"));
  }
  if (publishBefore != null && publishBefore != "") {
    query = query.lte("publishDate", publishBefore);
  }
  if (publishAfter != null && publishAfter != "") {
    query = query.gte("publishDate", publishAfter);
  }
  try {
    const books = await query.exec();
    res.render("books/index", {
      books: books,
      searchOptions: req.query,
    });
  } catch {
    res.redirect("/");
  }
});

//New book route
router.get("/new", async (req, res) => {
  renderNewPage(res, new Book());
});

//create new author route
router.post("/", upload.single("cover"), async (req, res) => {
  const fileName = req.file != null ? req.file.filename : null;
  const { title, author, publishDate, pageCount, description } = req.body;
  const book = new Book({
    title: title,
    author: author,
    publishDate: new Date(publishDate),
    pageCount: pageCount,
    description: description,
    coverImageName: fileName,
  });

  try {
    const newBook = await book.save();
    //res.redirect(`books/${book.id}`)
    res.redirect("books");
  } catch {
    if (book.coverImageName != null) {
      removeCoverImage(book.coverImageName);
    }
    renderNewPage(res, book, true);
  }
});

async function renderNewPage(res, book, hasError = false) {
  try {
    const authors = await Author.find({});
    const book = new Book();
    const params = { authors: authors, book: book };
    if (hasError) params.errorMessage = "Error Creating Book";
    res.render("books/new", params);
  } catch {
    res.redirect("/books");
  }
}

function removeBookCover(fileName) {
  fs.unlink(path.join(upload, fileName), (err) => {
    if (err) console.log(err);
  });
}

module.exports = router;
