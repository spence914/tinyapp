const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
app.use(cookieParser());


app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

const generateRandomString = function () {
  let result = "";
  const characters = "ABCDEFHIJKLMNOPQRSTUVWXYSabcdefghijklmnopqrstuvwxyz1234567890";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  } return result;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id, longURL: `${urlDatabase[req.params.id]}`,
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let id = generateRandomString();

  console.log(req.body); // Log the POST request body to the console

  urlDatabase[id] = req.body.longURL; // save key(randomly generated string) value(longURL) pair to urlDatabase
  res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => {
  console.log(urlDatabase);
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  let id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls/");
});

app.post("/urls/:id/", (req, res) => {
  let id = req.params.id;
  urlDatabase[id] = req.body.newLongURL;
  console.log(urlDatabase);
  res.redirect("/urls/");
});

app.post("/login/", (req, res) => {
  res.cookie('username', `${req.body.username}`);
  res.redirect("/urls/");
});

app.post("/logout/", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls/");
});

app.get("/register", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_register", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});