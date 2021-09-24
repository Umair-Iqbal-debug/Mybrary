const express = require("express");
const router = express.Router();
const Book = require("../models/book");
const Author = require("../models/author");
const imageMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const { query } = require("express");

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

//create new book route
router.post("/", async (req, res) => {
  const { title, author, publishDate, pageCount, description } = req.body;
  const book = new Book({
    title: title,
    author: author,
    publishDate: new Date(publishDate),
    pageCount: pageCount,
    description: description,
  });

  try {
    saveCover(book, req.body.cover);
    const newBook = await book.save();
    //res.redirect(`books/${book.id}`)
    res.redirect("books", { book: newBook });
  } catch {
    renderNewPage(res, book, true);
  }
});

async function renderNewPage(res, book, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = { authors: authors, book: book };
    if (hasError) params.errorMessage = "Error Creating Book";
    res.render("books/new", params);
  } catch {
    res.redirect("/books");
  }
}

function saveCover(book, coverEncoded) {
  if (coverEncoded == null) return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, "base64");
    book.coverImageType = cover.type;
  }
}

module.exports = router;
