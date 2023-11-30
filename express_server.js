/////////////////////////////////////////////////////////////////////////////////
// Configuration
/////////////////////////////////////////////////////////////////////////////////

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
app.set("view engine", "ejs");

const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

const methodOverride = require('method-override');


const {
  generateRandomString,
  getUserByEmail,
  urlsForUser
} = require('./helpers');

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

app.use(methodOverride('_method'));





/////////////////////////////////////////////////////////////////////////////////
// Databases
/////////////////////////////////////////////////////////////////////////////////

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "spencer",
    views: { "count": 0, "uniques": [], "times": [] }

  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "spencer",
    views: { "count": 0, "uniques": [], "times": [] }
  }
};

const users = {
  spencer: {
    id: "spencer",
    email: "spencer@spencer.org",
    password: bcrypt.hashSync("hunter2", salt),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("1234", salt),
  },
};

/////////////////////////////////////////////////////////////////////////////////
// Listener
/////////////////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(` tinyapp listening on port ${PORT}!`);
});


/////////////////////////////////////////////////////////////////////////////////
// Routes
/////////////////////////////////////////////////////////////////////////////////

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls/");
  } else res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {
  let usersURLs = urlsForUser(req.session.user_id, urlDatabase);
  let visID = generateRandomString();

  if (!req.session.user_id) {
    return res.status(403).send({
      Error: "Must be logged in to view URLS"
    });
  } else

    if (!req.session.visitorID) {
      req.session.visitorID = visID;
    }


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

  if (!req.session.user_id) {
    return res.status(403).send({
      Error: "You must be signed in to view URL information"
    });
  } else if (urlDatabase[id].userID !== req.session.user_id) {
    return res.status(403).send({
      Error: "You can only view URL information you have created"
    });
  } else if (urlDatabase[id]) {
    let uniques = urlDatabase[id].views.uniques;
    let numofUniques = ([...new Set(uniques)].length || 0);

    const templateVars = {
      id: id,
      longURL: `${urlDatabase[id].longURL}`,
      user: users[req.session.user_id],
      urlDatabase: urlDatabase,
      views: (urlDatabase[id].views || {}).count,
      numofUniques: numofUniques
    };

    res.render("urls_show", templateVars);
  } else if (!urlDatabase[id]) {
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
    userID: req.session.user_id,
    views: { "count": 0, "uniques": [], "times": [] }
  }; // save key(randomly generated string) value(longURL) pair to urlDatabase
  res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => { // Takes user to desired website using shortened URL
  const id = req.params.id;

  if (urlDatabase[id]) {
    const longURL = urlDatabase[id].longURL;
    urlDatabase[id].views = urlDatabase[id].views || {};
    urlDatabase[id].views.count = (urlDatabase[id].views.count || 0) + 1;
    urlDatabase[id].views.uniques.push(req.session.visitorID);
    urlDatabase[id].views.times.push(new Date(Date.now()).toUTCString());
    res.redirect(longURL);

  } else {
    return res.status(404).send({
      Error: "This shortened URL does not exist"
    });
  }
});

app.delete("/urls/:id/delete", (req, res) => {
  let id = req.params.id;
  let currentUser = req.session.user_id;

  if (!urlDatabase[id]) {
    return res.status(404).send({
      Error: "Cannot delete URL that is not in database"
    });
  }

  if (urlDatabase[id] && currentUser === "") {
    return res.status(403).send({
      Error: "Must be logged in to delete URLs"
    });
  }

  if (urlDatabase[id] && urlDatabase[id].userID !== currentUser) {
    return res.status(403).send({
      Error: "Cannot delete URL that does not belong to you"
    });

  } else if (urlDatabase[id].userID === currentUser)

    delete urlDatabase[id];
  res.redirect("/urls/");
});

app.put("/urls/:id/", (req, res) => {
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
  if (!getUserByEmail(submittedEmail, users)) {
    return res.status(403).send({
      Error: `EEmail or Password is incorrect`
    });
  }

  // If user enters the wrong password return 403 error
  if (getUserByEmail(submittedEmail, users) && !bcrypt.compareSync(submittedPassword, getUserByEmail(submittedEmail, users).password)) {
    return res.status(403).send({
      Error: `Email or Password is incorrect`
    });
  }

  // If correct email and password are submitted set user_id cookie to the id value from that users user object in database
  if (getUserByEmail(submittedEmail, users) && bcrypt.compareSync(submittedPassword, getUserByEmail(submittedEmail, users).password)) {
    req.session.user_id = getUserByEmail(submittedEmail, users).id;
    res.redirect("/urls/");
  }
});

app.post("/logout/", (req, res) => {
  req.session = null;
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
  const hashedPassword = bcrypt.hashSync(password, salt);


  // If user submits either email or password field as blank return a 400 error
  if (email === "" || password === "") {
    return res.status(400).send({
      Error: 'Email and Password cannot be blank'
    });
  }

  // If user tries to register with an email that is already in the database return a 400 error
  if (getUserByEmail(email, users)) {
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

