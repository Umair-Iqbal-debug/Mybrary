const { resolveInclude } = require("ejs");
const express = require("express");
const router = express.Router();
const Author = require("../models/author");

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
    //res.redirect(`author/${newAuthor.id}`)
    res.redirect("authors");
  } catch {
    res.render("authors/new", {
      author: author.name,
      errorMessage: "error creating author",
    });
  }
});

module.exports = router;
