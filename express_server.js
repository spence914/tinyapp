/////////////////////////////////////////////////////////////////////////////////
// Configuration
/////////////////////////////////////////////////////////////////////////////////

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
app.set("view engine", "ejs");


/////////////////////////////////////////////////////////////////////////////////
// Middleware
/////////////////////////////////////////////////////////////////////////////////

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));



/////////////////////////////////////////////////////////////////////////////////
// Helper functions
/////////////////////////////////////////////////////////////////////////////////

const generateRandomString = function () {
  let result = "";
  const characters = "ABCDEFHIJKLMNOPQRSTUVWXYSabcdefghijklmnopqrstuvwxyz1234567890";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  } return result;
};

const getUserByEmail = function (email) {
  const userInfo = Object.values(users);
  const specificUser = userInfo.find(user => user.email === email);

  if (specificUser) {
    return specificUser;
  } return null;
};


/////////////////////////////////////////////////////////////////////////////////
// Databases
/////////////////////////////////////////////////////////////////////////////////

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  spencer: {
    id: "spencer",
    email: "spencer@spenny.net",
    password: "yirgacheffev60",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

/////////////////////////////////////////////////////////////////////////////////
// Listener
/////////////////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


/////////////////////////////////////////////////////////////////////////////////
// Routes
/////////////////////////////////////////////////////////////////////////////////

app.get("/", (req, res) => {
  res.redirect("/urls/");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id] // Lookup user in users database object by user_id cookie
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };

  if (!req.cookies.user_id) {
    res.redirect("/login/");
  } else
    res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id, longURL: `${urlDatabase[req.params.id]}`,
    user: users[req.cookies.user_id]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(401).send({
      Error: 'You must be logged in to shorten URLS'
    });
  }

  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL; // save key(randomly generated string) value(longURL) pair to urlDatabase
  res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => { // Takes user to desired website using shortened URL
  const longURL = urlDatabase[req.params.id];
  if (!longURL) {
    res.status(404).send({
      Error: "This shortened URL does not exist"
    });
  } else
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
  res.redirect("/urls/");
});

app.post("/login/", (req, res) => {
  let submittedEmail = req.body.email;
  let submittedPassword = req.body.password;

  // If user tries to login with an email not in the database return 403 error
  if (!getUserByEmail(submittedEmail)) {
    return res.status(403).send({
      Error: `Email: ${submittedEmail} not found`
    });
  }

  // If user enters the wrong password return 403 error
  if (getUserByEmail(submittedEmail) && getUserByEmail(submittedEmail).password !== submittedPassword) {
    return res.status(403).send({
      Error: `Password is incorrect`
    });
  }

  // If correct email and password are submitted set user_id cookie to the id value from that users user object in database
  if (getUserByEmail(submittedEmail) && getUserByEmail(submittedEmail).password === submittedPassword) {
    res.cookie("user_id", getUserByEmail(submittedEmail).id);
    res.redirect("/urls/");
  }
});

app.post("/logout/", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/login/");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id]
  };

  if (req.cookies.user_id) {
    res.redirect("/urls/");
  } else
    res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;


  // If user submits either email or password field as blank return a 400 error
  if (email === "" || password === "") {
    return res.status(400).send({
      Error: 'Email and Password cannot be blank'
    });
  }

  // If user tries to register with an email that is already in the database return a 400 error
  if (getUserByEmail(email)) {
    return res.status(400).send({
      Error: `Email: ${email} has already been registered`
    });
  } else


    // Create new user object in users database keyed to the newly generated ID value, set user_id cookie to this value as well
    users[id] = {
      id,
      email,
      password
    };

  res.cookie("user_id", id);

  res.redirect("/urls/");
});

app.get("/login/", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id]
  };

  if (req.cookies.user_id) {
    res.redirect("/urls/");
  } else
    res.render("urls_login", templateVars);
});

