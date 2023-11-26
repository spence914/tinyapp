/////////////////////////////////////////////////////////////////////////////////
// Configuration
/////////////////////////////////////////////////////////////////////////////////

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
app.set("view engine", "ejs");
const bcrypt = require("bcryptjs");



/////////////////////////////////////////////////////////////////////////////////
// Middleware
/////////////////////////////////////////////////////////////////////////////////

app.use(cookieSession({
  name: 'session',
  keys: ["lighthouse"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

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

const urlsForUser = function (id) {
  let usersURLS = {};

  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      usersURLS[url] = urlDatabase[url];
    }
  } return usersURLS;
};


/////////////////////////////////////////////////////////////////////////////////
// Databases
/////////////////////////////////////////////////////////////////////////////////

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "spencer"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "spencer"
  }
};

const users = {
  spencer: {
    id: "spencer",
    email: "spencer@spenny.net",
    password: bcrypt.hashSync("yirgacheffev60", 10),
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
  let usersURLs = urlsForUser(req.session.user_id);

  const templateVars = {
    urls: usersURLs,
    user: users[req.session.user_id] // Lookup user in users database object by user_id cookie
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };

  if (!req.session.user_id) {
    res.redirect("/login/");
  } else
    res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  if (urlDatabase[id]) {

    const templateVars = {
      id: id,
      longURL: `${urlDatabase[id].longURL}`,
      user: users[req.session.user_id],
      urlDatabase: urlDatabase
    };

    res.render("urls_show", templateVars);
  } else {
    return res.status(404).send({
      Error: "This shortened URL does not exist"
    });
  }
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      Error: 'You must be logged in to shorten URLS'
    });
  }

  let id = generateRandomString();

  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  }; // save key(randomly generated string) value(longURL) pair to urlDatabase
  res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => { // Takes user to desired website using shortened URL
  const id = req.params.id;

  if (urlDatabase[id]) {
    const longURL = urlDatabase[id].longURL;
    res.redirect(longURL);

  } else {
    return res.status(404).send({
      Error: "This shortened URL does not exist"
    });
  }
});

app.post("/urls/:id/delete", (req, res) => {
  let id = req.params.id;
  let currentUser = req.session.user_id;

  if (!urlDatabase[id]) {
    return res.status(404).send({
      Error: "Cannot delete URL that is not in database"
    });
  }

  if (urlDatabase[id] && currentUser === "") {
    return res.status(403).send({
      Error: "Must be logged in to edit URLs"
    });
  }

  if (urlDatabase[id] && urlDatabase[id].userID !== currentUser) {
    return res.status(403).send({
      Error: "Cannot edit URL that does not belong to you"
    });

  } else if (urlDatabase[id].userID === currentUser)

    delete urlDatabase[id];
  res.redirect("/urls/");
});

app.post("/urls/:id/", (req, res) => {
  let id = req.params.id;
  let currentUser = req.session.user_id;

  if (!urlDatabase[id]) {
    return res.status(404).send({
      Error: "Cannot edit URL that is not in database"
    });
  }

  if (urlDatabase[id] && currentUser === "") {
    return res.status(403).send({
      Error: "Must be logged in to edit URLs"
    });
  }

  if (urlDatabase[id] && urlDatabase[id].userID !== currentUser) {
    return res.status(403).send({
      Error: "Cannot edit URL that does not belong to you"
    });
  } else if (urlDatabase[id].userID === currentUser)
    urlDatabase[id].longURL = req.body.newLongURL;
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
  if (getUserByEmail(submittedEmail) && !bcrypt.compareSync(submittedPassword, getUserByEmail(submittedEmail).password)) {
    return res.status(403).send({
      Error: `Password is incorrect`
    });
  }

  // If correct email and password are submitted set user_id cookie to the id value from that users user object in database
  if (getUserByEmail(submittedEmail) && bcrypt.compareSync(submittedPassword, getUserByEmail(submittedEmail).password)) {
    req.session.user_id = getUserByEmail(submittedEmail).id;
    res.redirect("/urls/");
  }
});

app.post("/logout/", (req, res) => {
  res.clearCookie('session');
  res.clearCookie("session.sig");
  res.redirect("/login/");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };

  if (req.session.user_id) {
    res.redirect("/urls/");
  } else
    res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);


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
      password: hashedPassword
    };

  req.session.user_id = id;

  res.redirect("/urls/");
});

app.get("/login/", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };

  if (req.session.user_id) {
    res.redirect("/urls/");
  } else
    res.render("urls_login", templateVars);
});

