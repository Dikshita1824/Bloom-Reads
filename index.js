// ===============================
// LOAD PACKAGES
// ===============================

const express = require("express");
const app = express();
const port = 3000;

const mongoose = require("mongoose");
const multer = require("multer");
const nodemailer = require("nodemailer");
const session = require("express-session");


// ===============================
// ADMIN LOGIN
// ===============================

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "1234";


// ===============================
// MULTER - IMAGE UPLOAD
// ===============================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/");
    },

    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });


// ===============================
// EMAIL CONFIGURATION
// ===============================

// Apna Gmail address aur naya Gmail App Password yahan daalo.
const transport = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: "dikshitamittal620@gmail.com",
        pass: "pkot zfyy wrtt wvne"
    }
});


// ===============================
// BOOK SCHEMA
// ===============================

const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    price: Number,
    category: String,
    image: String
});

// Tumhari MongoDB collection ka naam: books
const Book = mongoose.model(
    "Book",
    bookSchema,
    "books"
);


// ===============================
// EJS
// ===============================

app.set("view engine", "ejs");


// ===============================
// MIDDLEWARE
// ===============================

app.use(express.static("public"));

app.use(express.urlencoded({
    extended: true
}));


// ===============================
// SESSION
// ===============================

app.use(session({
    secret: "bookstoresecret",
    resave: false,
    saveUninitialized: false
}));


// Make isAdmin available to every EJS page

app.use((req, res, next) => {
    res.locals.isAdmin = req.session.isAdmin || false;
    next();
});


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.render("home.ejs");
});


// ===============================
// ABOUT
// ===============================

app.get("/about", (req, res) => {
    res.render("about.ejs");
});

// CART PAGE
app.get("/cart", (req, res) => {
    res.render("cart.ejs");
});

// ===============================
// BOOKS
// ===============================

app.get("/books", async (req, res) => {
    try {
        const books = await Book.find();

        res.render("books.ejs", {
            books
        });

    } catch (err) {
        console.log("Error loading books:", err.message);
        res.status(500).send("Unable to load books.");
    }
});


// ===============================
// ADMIN MIDDLEWARE
// ===============================

function isAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect("/admin/login");
    }
}


// ===============================
// ADD BOOK PAGE
// ===============================

app.get("/books/new", isAdmin, (req, res) => {
    res.render("newbook.ejs");
});


// ===============================
// ADD BOOK
// ===============================

app.post(
    "/books",
    isAdmin,
    upload.single("img"),
    async (req, res) => {
        try {
            const book = new Book({
                title: req.body.title,
                author: req.body.author,
                price: req.body.price,
                category: req.body.category,

                image: req.file
                    ? "/uploads/" + req.file.filename
                    : ""
            });

            await book.save();

            res.redirect("/books");

        } catch (err) {
            console.log("Error adding book:", err.message);
            res.status(500).send("Unable to add book.");
        }
    }
);


// ===============================
// EDIT BOOK PAGE
// ===============================

app.get(
    "/books/edit/:id",
    isAdmin,
    async (req, res) => {
        try {
            const book = await Book.findById(req.params.id);

            if (!book) {
                return res.status(404).send("Book not found.");
            }

            res.render("editbook.ejs", {
                book
            });

        } catch (err) {
            console.log("Error opening edit page:", err.message);
            res.status(500).send("Unable to edit book.");
        }
    }
);


// ===============================
// UPDATE BOOK
// ===============================

app.post(
    "/books/edit/:id",
    isAdmin,
    upload.single("img"),
    async (req, res) => {
        try {
            const book = await Book.findById(req.params.id);

            if (!book) {
                return res.status(404).send("Book not found.");
            }

            book.title = req.body.title;
            book.author = req.body.author;
            book.price = req.body.price;
            book.category = req.body.category;

            if (req.file) {
                book.image = "/uploads/" + req.file.filename;
            }

            await book.save();

            res.redirect("/books");

        } catch (err) {
            console.log("Error updating book:", err.message);
            res.status(500).send("Unable to update book.");
        }
    }
);


// ===============================
// DELETE BOOK
// ===============================

app.post(
    "/books/delete/:id",
    isAdmin,
    async (req, res) => {
        try {
            await Book.findByIdAndDelete(req.params.id);

            res.redirect("/books");

        } catch (err) {
            console.log("Error deleting book:", err.message);
            res.status(500).send("Unable to delete book.");
        }
    }
);


// ===============================
// CATEGORIES
// ===============================

// All Categories
app.get("/categories", async (req, res) => {
    try {
        const books = await Book.find();

        res.render("categories.ejs", {
            books,
            currentCategory: ""
        });

    } catch (err) {
        console.log("Error loading categories:", err.message);
        res.status(500).send("Unable to load categories.");
    }
});


// Selected Category
app.get("/categories/:category", async (req, res) => {
    try {
        const category = req.params.category;

        const books = await Book.find({
            category: {
                $regex: new RegExp(
                    "^" + category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
                    "i"
                )
            }
        });

        res.render("categories.ejs", {
            books,
            currentCategory: category
        });

    } catch (err) {
        console.log("Error loading category:", err.message);
        res.status(500).send("Unable to load category.");
    }
});

// ===============================
// CONTACT PAGE
// ===============================

app.get("/contact", (req, res) => {
    res.render("contact.ejs");
});


// ===============================
// CONTACT FORM
// ===============================

app.post("/contact", async (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const mobile = req.body.mobile;
        const message = req.body.message;

        await transport.sendMail({
            to: "mittalpriyanka098@gmail.com",
            replyTo: email,
            subject: "New message from Bloom Reads Book Store",

            text: `
Name: ${name}
Email: ${email}
Mobile: ${mobile}

Message:
${message}
`
        });

        console.log("Email sent successfully!");

        res.redirect("/contact");

    } catch (err) {
        console.log("Email error:", err.message);
        res.status(500).send("Unable to send email. Please try again.");
    }
});


// ===============================
// ADMIN LOGIN PAGE
// ===============================

app.get("/admin/login", (req, res) => {
    res.render("adminlogin.ejs");
});


// ===============================
// ADMIN LOGIN
// ===============================

app.post("/admin/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
    ) {
        req.session.isAdmin = true;
        res.redirect("/books");

    } else {
        res.status(401).send("Invalid username or password.");
    }
});


// ===============================
// ADMIN LOGOUT
// ===============================

app.get("/admin/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Logout error:", err.message);
        }

        res.redirect("/");
    });
});


// ===============================
// MONGODB CONNECTION
// ===============================

async function main() {
    // Apni updated MongoDB connection string yahan paste karo.
    // Is string mein naya password hona chahiye.

    const MONGODB_URI =
        "mongodb://dikshitamittal620_db_user:5641gh1urk9Oi5TO@ac-f2wzdxa-shard-00-00.87zwlv1.mongodb.net:27017,ac-f2wzdxa-shard-00-01.87zwlv1.mongodb.net:27017,ac-f2wzdxa-shard-00-02.87zwlv1.mongodb.net:27017/?ssl=true&replicaSet=atlas-z8o1y2-shard-0&authSource=admin&appName=Cluster0";

    await mongoose.connect(MONGODB_URI, {
        dbName: "bookstore",
        serverSelectionTimeoutMS: 10000
    });

    console.log("Connected to MongoDB!");
    console.log("Database:", mongoose.connection.name);

    const count = await Book.countDocuments();

    console.log("Total books in database:", count);
}


// ===============================
// START APPLICATION
// ===============================

async function startServer() {
    try {
        await main();

        app.listen(port, () => {
            console.log(`Running on port ${port}`);
        });

    } catch (err) {
        console.log("Application startup error:", err.message);
        process.exitCode = 1;
    }
}

startServer();