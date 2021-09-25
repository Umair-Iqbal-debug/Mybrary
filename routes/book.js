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
  renderFormPage(res, new Book(), "new");
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
    res.redirect("/books");
  } catch {
    renderFormPage(res, book, "new", true);
  }
});

router.param("id", async (req, res, next, id) => {
  try {
    const book = await Book.findById(id).populate("author").exec();
    req.book = book;
    next();
  } catch {
    res.redirect("/books");
  }
});

router.get("/:id", (req, res) => {
  res.render("books/show", { book: req.book });
});

router.get("/:id/edit", (req, res) => {
  renderFormPage(res, req.book, "edit");
});

router.delete("/:id", async (req, res) => {
  try {
    await req.book.remove();
    res.redirect("/books");
  } catch {
    res.send("failure");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, author, publishDate, pageCount, description } = req.body;
    updateLocalBook(
      title,
      author,
      publishDate,
      pageCount,
      description,
      req.book
    );
    saveCover(req.book, req.body.cover);
    await req.book.save();
    res.redirect(`/books/${req.book._id}`);
  } catch (error) {
    res.render("books/show", {
      book: req.book,
      errorMessage: "Could not remove book",
    });
  }
});

async function renderFormPage(res, book, form, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = { authors: authors, book: book };
    if (hasError) params.errorMessage = "Error Creating Book";
    res.render(`books/${form}`, params);
  } catch {
    res.redirect("/books");
  }
}

function saveCover(book, coverEncoded) {
  if (!coverEncoded) return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, "base64");
    book.coverImageType = cover.type;
  }
}

function updateLocalBook(
  title,
  author,
  publishDate,
  pageCount,
  description,
  book
) {
  if (title) book.title = title;
  if (author) book.author = author;
  if (publishDate) book.publishDate = new Date(publishDate);
  if (pageCount) book.pageCount = pageCount;
  if (description) book.description = description;
}

module.exports = router;
