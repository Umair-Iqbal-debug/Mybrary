const { resolveInclude, render } = require("ejs");
const express = require("express");
const router = express.Router();
const Author = require("../models/author");
const Book = require("../models/book");

//All author routes
router.get("/", async (req, res) => {
  const { name } = req.query;
  const searchOption = {};
  if (name != null && name !== "") {
    searchOption.name = new RegExp(name, "i");
  }
  try {
    const authors = await Author.find(searchOption);
    res.render("authors/index", {
      authors: authors,
      searchOption: req.query,
    });
  } catch {
    res.redirect("/", { errorMessage: "unable to load authors" });
  }
});

//New author route
router.get("/new", (req, res) => {
  res.render("authors/new", { author: new Author() });
});

//create new author route
router.post("/", async (req, res) => {
  const author = new Author({
    name: req.body.name,
  });

  try {
    const newAuthor = await author.save();
    res.redirect(`authors/${newAuthor.id}`);
    //res.redirect("authors");
  } catch {
    res.render("authors/new", {
      author: author.name,
      errorMessage: "error creating author",
    });
  }
});

router.param("id", async (req, res, next, id) => {
  try {
    const author = await Author.findById(id);
    req.author = author;
    next();
  } catch {
    res.redirect("/authors");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const books = await Book.find({ author: req.author._id });
    res.render("authors/show", { books: books, author: req.author });
  } catch (err) {
    console.log(err);
    res.redirect("/authors");
  }
});

router.get("/:id/edit", (req, res) => {
  res.render("authors/edit", { author: req.author });
});

router.delete("/:id", async (req, res) => {
  let author;
  try {
    author = await Author.findById(req.params.id);
    await author.remove();
    res.redirect("/authors");
  } catch {
    if (author == null) {
      res.redirect("/");
    } else {
      res.redirect(`/authors/${author.id}`);
    }
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedAuthor = await Author.updateOne(
      { _id: req.author._id },
      { name: req.body.name }
    );
    res.redirect("/authors");
  } catch {
    res.send("error");
  }
});

module.exports = router;
