const express = require('express');
const mysql = require('mysql2');
const app = express();
const PORT = 3000;

const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;


const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080']
}));

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'example';

app.use(express.json());

// mysql database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'db_SCS390', 
    user: 'root',        
    password: 'example', 
    database: 'test_db2', 
    port: 3306 
});
    

function connectWithRetry() {
    db.connect((err) => {
        if(err) {
            console.error('Error connecting to the database: ', err);
            console.log('Retrying in 5 seconds...');
            setTimeout(connectWithRetry, 5000);
        } else {
            console.log('Connected to the database.');
            
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    userID INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100),
                    email VARCHAR(100) NOT NULL,
                    password VARCHAR(100) NOT NULL,
                    isAdmin char(1) NOT NULL DEFAULT 'N'
                );
            `;
            
            const createBooksTable = `
                CREATE TABLE IF NOT EXISTS books (
                    bookID INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    genre VARCHAR(255),
                    author VARCHAR(255),
                    language VARCHAR(50),
                    price DECIMAL(10, 2),
                    isHardcover BOOLEAN,
                    isBestseller BOOLEAN,
                    is_deleted BOOLEAN DEFAULT FALSE
                );
            `;
            
            const createPaymentMethodTable = `
            CREATE TABLE IF NOT EXISTS payment_method (
                methodID INT AUTO_INCREMENT PRIMARY KEY,
                userID INT,
                name VARCHAR(100), 
                card_number VARCHAR(60),  
                expiration_date VARCHAR(5),
                csv VARCHAR(60),  
                FOREIGN KEY (userID) REFERENCES users(userID)
            );
            `;
        
            
            const createCartTable = `
                create table if not exists cart(
                    userID int,
                    bookID int,
                    Foreign Key (userID) REFERENCES users(userID),
                    Foreign Key (bookID) REFERENCES books(bookID)
                );
            `;
            
            const createOrdersTable = `
                CREATE TABLE IF NOT EXISTS orders (
                    rowID INT AUTO_INCREMENT PRIMARY KEY,  
                    orderID INT,                         
                    userID INT,
                    bookID INT,
                    total_price DECIMAL(10, 2),
                    FOREIGN KEY (userID) REFERENCES users(userID),
                    FOREIGN KEY (bookID) REFERENCES books(bookID)
                );
            `;

            const books = [
                { bookID: 1, title: 'The Silent Sea', genre: 'Science Fiction', author: 'John Doe', language: 'English', price: 19.99, isHardcover: true, isBestseller: true },
                { bookID: 2, title: 'A Walk in the Park', genre: 'Romance', author: 'Jane Smith', language: 'English', price: 12.99, isHardcover: false, isBestseller: false },
                { bookID: 3, title: 'Tech Giants', genre: 'Non-Fiction', author: 'Mary Johnson', language: 'English', price: 29.99, isHardcover: true, isBestseller: true },
                { bookID: 4, title: 'The Lost Kingdom', genre: 'Fantasy', author: 'Lucas Brown', language: 'English', price: 25.50, isHardcover: true, isBestseller: false },
                { bookID: 5, title: 'Gastronomy 101', genre: 'Cookbook', author: 'Emily Davis', language: 'English', price: 22.00, isHardcover: false, isBestseller: false },
                { bookID: 6, title: 'Hidden Truths', genre: 'Thriller', author: 'David White', language: 'English', price: 18.75, isHardcover: true, isBestseller: true },
                { bookID: 7, title: 'Digital Horizons', genre: 'Technology', author: 'Linda Green', language: 'English', price: 35.00, isHardcover: false, isBestseller: true },
                { bookID: 8, title: 'Deep Dive', genre: 'Mystery', author: 'Mark Lee', language: 'English', price: 15.20, isHardcover: true, isBestseller: false },
                { bookID: 9, title: 'Ancient Civilizations', genre: 'History', author: 'Barbara Wilson', language: 'English', price: 14.99, isHardcover: false, isBestseller: true },
                { bookID: 10, title: 'Journey to Mars', genre: 'Adventure', author: 'Richard Clark', language: 'English', price: 20.00, isHardcover: true, isBestseller: true }
            ];
            
            const addBooks = async () => {
                for (const book of books) {
                    const checkQuery = 'SELECT * FROM books WHERE title = ? AND author = ?';
                    const checkValues = [book.title, book.author];
            
                    db.query(checkQuery, checkValues, (err, results) => {
                        if (err) {
                            console.error('Error checking book existence:', err);
                            return;
                        }
            
                        if (results.length > 0) {
                            console.log(`Book "${book.title}" by ${book.author} already exists.`);
                        } else {
                            const insertQuery = `
                                INSERT INTO books (bookID, title, genre, author, language, price, isHardcover, isBestseller)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                            `;
                            const insertValues = [book.bookID, book.title, book.genre, book.author, book.language, book.price, book.isHardcover, book.isBestseller];
            
                            db.query(insertQuery, insertValues, (insertErr, insertResults) => {
                                if (insertErr) {
                                    console.error('Error inserting book:', insertErr);
                                    return;
                                }
                                console.log(`Book "${book.title}" added.`);
                            });
                        }
                    });
                }
            };
            
            addBooks();            


            const createAddressTable = `
                create table if not exists address (
                    addressID int auto_increment primary key,
                    userID int,
                    line_1 varchar(255),
                    line_2 varchar(255),
                    zip int(10),
                    state char(2),
                    country char(3),
                    Foreign key (userID) references users(userID)
                );
            `

            //  create admin user
            const createAdmin = async () => {
                try {
                    const email = 'admin@1.com';
                    const password = 'admin123456';
                    const hashedPassword = await bcrypt.hash(password, 10);
            
                    const checkQuery = 'SELECT * FROM users WHERE email = ? AND isAdmin = ?';
                    const checkValues = [email, 'Y'];
            
                    db.query(checkQuery, checkValues, (err, results) => {
                        if (err) {
                            throw err;
                        } else if (results.length > 0) {
                            console.log('Admin user already exists.');
                        } else {
                            const insertQuery = `
                                INSERT INTO users (email, password, isAdmin)
                                VALUES (?, ?, ?);
                            `;
                            const insertValues = [email, hashedPassword, 'Y'];
            
                            db.query(insertQuery, insertValues, (insertErr, insertResults) => {
                                if (insertErr) {
                                    throw insertErr;
                                } else {
                                    console.log('Admin added.');
                                }
                            });
                        }
                    });
                } catch (error) {
                    console.error('Failed to create admin:', error);
                }
            };
            
            createAdmin();




            db.query(createUsersTable, (err, results) => {
                if (err) throw err;
                console.log('Users table created or already exists');
            });


            db.query(createBooksTable, (err, results) => {
                if (err) throw err;
                console.log('Books table created or already exists');
            });

            db.query(createPaymentMethodTable, (err, results) => {
                if (err) throw err;
                console.log('Payment Method table created or already exists');
            });

            db.query(createCartTable, (err, results) => {
                if (err) throw err;
                console.log('Cart table created or already exists');
            });

            db.query(createOrdersTable, (err, results) => {
                if (err) throw err;
                console.log('Orders table created or already exists');
            });

            db.query(createAddressTable, (err, results) => {
                if (err) throw err;
                console.log('Address table created or already exists');
            });

        }
    });
}

connectWithRetry();



// login 
app.post('/login',  async (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (error, results) => {

        try{

            if (error) {
                console.error('Error retrieving user:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = results[0];

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }


            const token = jwt.sign(
                { id: user.id, email: user.email, isAdmin: user.isAdmin },
                SECRET_KEY,
                { expiresIn: '1h' }
            );

            res.status(200).json({
                token,
                user: {
                    userID: user.userID,  
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                },
            });
        } catch(hashErr){
            console.log('Error comparing password.', hashErr);
            return res.status(500).send('Error comparing password', hashErr);
        }
    });
});



// GET - retrieve a specific user by ID
app.get('/users', (req, res) => {
    const { userID } = req.query;
    const query = 'SELECT * from users where userID = ?'
    db.query(query, [userID], (error, results) => {
        if(error){
            console.error('Error retrieving users:', error);
            res.status(500).send('Error retrieving users');
        } else {
            res.status(200).json(results);
        }
    })
});


// POST /users - Create a new user
app.post('/users', async (req, res) => {
    const { name, email, password, isAdmin } = req.body;

    const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';

    db.query(checkEmailQuery, [email], async (err, results) => {
        if (err) {
            console.error('Error checking email:', err);
            return res.status(500).send('Error checking email');
        }

        if (results.length > 0) {
            return res.status(400).send('Email already exists');
        }

        try {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const query = 'INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)';
            db.query(query, [name, email, hashedPassword, isAdmin], (err, results) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    return res.status(500).send('User creation failed');
                } else {
                    return res.status(201).send('User created');
                }
            });
        } catch (hashErr) {
            console.error('Error hashing password:', hashErr);
            return res.status(500).send('Error hashing password');
        }
    });
});



// PUT /users update specic user
app.put('/users', (req, res) => {
    const { userID, name, email, password } = req.body; 
    
    const query = 'UPDATE users SET name = ?, email = ?, password = ? WHERE userID = ?';  
    
    db.query(query, [name, email, password, userID], (error, results) => {
        if (error) {
            console.error('Error updating user:', error);
            res.status(500).send('Error updating user');
        } else if (results.affectedRows === 0) {
            res.status(404).send('User not found');
        } else {
            res.json({ name, email, password, userID }); 
        }
    });
});

// DELETE /users delete user
app.delete('/users', (req, res) => {
    const { userID } = req.body;
    const query = 'DELETE FROM address WHERE userID = ?';
    db.query(query, [userID], (error, results) => {
        if (error) {
            console.error('Error removing user:', error);
            res.status(500).send('Error removing from users.');
        } else if (results.affectedRows === 0) {
            res.status(404).send('User not found.');
        } else {
            res.status(200).send('User removed successfully');
        }
    });
});

// GET - retrieve all books
app.get('/books', (req, res) => {
    const query = 'SELECT * FROM books WHERE is_deleted = FALSE;';
    db.query(query, (error,results)=>{
        if(error){
            console.error('Error retrieving books: ', error);
            res.status(500).send('Error retrieving books');
        } else{
            res.json(results);
        }
    });
});




// POST /books - Create a new book
app.post('/books', (req,res) =>{
    const { title, genre, author, language, price, isHardcover, isBestseller } = req.body;
    const query = 'INSERT INTO books (title, genre, author, language, price, isHardcover, isBestseller) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [title, genre, author, language, price, isHardcover, isBestseller], (error, results) =>{
        if(error) {
            console.error('Error creating book:', error);
            res.status(500).send('Error creating book');
        } else {
            res.status(201).json(results);
        }
    });
});



//PUT /books-edit - update a book by ID
app.put('/books-edit', (req, res) => {
    const { bookID, title, genre, author, language, price, isHardcover, isBestseller } = req.body;
    const query = 'UPDATE books SET title = ?, genre = ?, author = ?, language = ?, price = ?, isHardcover = ?, isBestseller = ? WHERE bookID = ?';
    db.query(query, [title, genre, author, language, price, isHardcover, isBestseller, bookID], (error, results) =>{
        if(error) {
            console.error('Error updating book:', error);
            res.status(500).send('Error updating book');
        } else if (results.affectedRows === 0){
            res.status(404).send('Book not found');
        } else {
            res.json({ title, genre, author, language, price, isHardcover, isBestseller, bookID });
        }
    });
});

// PUT /books - makeshift delete, cannot truly delete because of foreign key restraint in orders table
app.put('/books', (req,res) =>{
    const { bookID } = req.body;
    const query = 'UPDATE books SET is_deleted = TRUE WHERE bookID = ?';
    db.query(query, [bookID], (error, results) => {
        if(error){
            console.error('Error deleting book', error);
            res.status(500).send('Error deleting book.');
        } else if(results.affectedRows === 0){
            res.status(404).send('Book not found');
        } else{
            res.status(200).send();
        }
    }); 
});

// GET /payment - retrieve a payment method
app.get('/payment', (req, res) => {
    const { userID } = req.query;
    const query = 'SELECT * from payment_method where userID = ?'
    db.query(query, [userID], (error, results) => {
        if(error){
            console.error('Error retrieving payment methods:', error);
            res.status(500).send('Error retrieving payment methods');
        } else {
            res.status(200).json(results);
        }
    })
});

// POST /payment - Create a new payment method
app.post('/payment', async (req, res) => {
    const { userID, name, card_number, expiration_date, csv } = req.body;

    try {
        const hashedCardNumber = await bcrypt.hash(card_number, SALT_ROUNDS);
        const hashedCsv = await bcrypt.hash(csv, SALT_ROUNDS);

        const query = 'INSERT INTO payment_method (userID, name, card_number, expiration_date, csv) VALUES (?, ?, ?, ?, ?)';
        
        db.query(query, [userID, name, hashedCardNumber, expiration_date, hashedCsv], (error, results) => {
            if (error) {
                console.error('Error creating payment method:', error);
                res.status(500).send('Error creating payment method');
            } else {
                res.status(201).json({ userID, name, card_number: '[Encrypted]', expiration_date, csv: '[Encrypted]' });
            }
        });
    } catch (error) {
        console.error('Error hashing payment details:', error);
        res.status(500).send('Error processing payment details');
    }
});

// PUT /payment
app.put('/payment', (req, res) => {
    const { methodID, name, card_number, expiration_date, csv } = req.body; 

    const query = 'UPDATE payment_method SET name = ?, card_number = ?, expiration_date = ?, `csv` = ? WHERE methodID = ?';  
    
    db.query(query, [name, card_number, expiration_date, csv, methodID], (error, results) => {
        if (error) {
            console.error('Error updating payment method:', error);
            res.status(500).send('Error updating payment method');
        } else if (results.affectedRows === 0) {
            res.status(404).send('Payment method not found');
        } else {
            res.json({ name, card_number, expiration_date, csv, methodID }); 
        }
    });
});

app.delete('/payment', (req, res) => {
    const { methodID } = req.body;
    const query = 'DELETE FROM payment_method WHERE methodID = ?';
    db.query(query, [methodID], (error, results) => {
        if (error) {
            console.error('Error removing payment method:', error);
            res.status(500).send('Error removing from payment method.');
        } else if (results.affectedRows === 0) {
            res.status(404).send('Payment method not found.');
        } else {
            res.status(200).send('Payment method removed successfully');
        }
    });
});

// GET /cart - retreive all items in cart for user
app.get('/cart', (req, res) => {
    const { userID } = req.query;  

    const query = 'SELECT * FROM cart JOIN books ON cart.bookID = books.bookID WHERE cart.userID = ?';
    db.query(query, [userID], (error, results) => {
        if (error) {
            console.error('Error retrieving cart:', error);
            res.status(500).send('Error retrieving cart');
        } else {
            res.json(results);
        }
    });
});

// POST /cart - insert items to cart
app.post('/cart', (req, res) => {
    const { userID, bookID } = req.body;
    const query = 'INSERT INTO cart (userID, bookID) VALUES (?, ?)';
    db.query(query, [userID, bookID], (error, results) => {
        if(error){
            console.error('Error adding to cart: ', error);
            res.status(500).send('Error adding to cart');
        } else{
            res.status(201).json({ userID, bookID });
        }
    });
});

app.delete('/cart', (req, res) => {
    const { userID, bookID } = req.body;
    const query = 'DELETE FROM cart WHERE userID = ? and bookID = ?';
    db.query(query, [userID, bookID], (error, results) =>{
        if(error){
            console.error('Error removing from cart: ', error);
            res.status(500).send('Error removing from cart');
        } else{
            res.status(201).json({ userID, bookID});
        }
    });
});

// GET order-history - get order history for users
app.get('/order-history', (req, res) => {
    const { userID } = req.query;

    const query = `SELECT orderID, title, total_price
                    FROM orders
                    JOIN books on orders.bookID = books.bookID
                    WHERE userID = ?`
    
    db.query(query, [userID], (error, results) => {
        if(error){
            console.error('Error retrieving order history: ', error); 
            res.status(500).send('Error retrieving order history.');
        } else{
            res.json(results);
        }
    });
});


// POST /placeOrder - insert items from cart to order
app.post('/placeOrder', (req, res) => {
    const { userID, total_price } = req.body; 

    const getNextOrderIDQuery = `
        SELECT IFNULL(MAX(orderID), 0) + 1 AS nextOrderID
        FROM orders;
    `;

    db.query(getNextOrderIDQuery, (error, results) => {
        if (error) {
            console.error('Error fetching next orderID: ', error);
            return res.status(500).send('Error fetching next orderID');
        }

        const nextOrderID = results[0].nextOrderID;

        const insertOrderQuery = `
            INSERT INTO orders (orderID, bookID, userID, total_price)
            SELECT ?, bookID, userID, ?
            FROM cart
            WHERE userID = ?;
        `;

        db.query(insertOrderQuery, [nextOrderID, total_price, userID], (insertError, insertResults) => {
            if (insertError) {
                console.error('Error placing order: ', insertError);
                return res.status(500).send('Error placing order');
            }

            if (insertResults.affectedRows === 0) {
                return res.status(404).send('No items found in cart for the user');
            }

            const deleteCartQuery = `DELETE FROM cart WHERE userID = ?`;
            db.query(deleteCartQuery, [userID], (deleteError) => {
                if (deleteError) {
                    console.error('Error clearing the cart: ', deleteError);
                    return res.status(500).send('Error clearing cart');
                }

                res.status(201).send('Order placed and cart cleared');
            });
        });
    });
});


// GET addresses where userID = ?
app.get('/address', (req, res) => {
    const { userID } = req.query;
    const query = 'SELECT * from address where userID = ?'
    db.query(query, [userID], (error, results) => {
        if(error){
            console.error('Error retrieving address:', error);
            res.status(500).send('Error retrieving address');
        } else {
            res.status(200).json(results);
        }
    })
});

// POST address where userID = ?
app.post('/address', (req,res) =>{
    const { userID, line_1, line_2, zip, state, country } = req.body;
    const query = 'INSERT INTO address (userID, line_1, line_2, zip, state, country) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [userID, line_1, line_2, zip, state, country], (error, results) =>{
        if(error) {
            console.error('Error creating address:', error);
            res.status(500).send('Error creating address');
        } else {
            res.status(201).json({userID, line_1, line_2, zip, state, country});
        }
    });
});


// PUT /address update address
app.put('/address', (req, res) => {
    const { addressID, line_1, line_2, zip, state, country } = req.body; 
    
    const query = 'UPDATE address SET line_1 = ?, line_2 = ?, zip = ?, state = ?, country = ? WHERE addressID = ?'; 
    
    db.query(query, [line_1, line_2, zip, state, country, addressID], (error, results) => {
        if (error) {
            console.error('Error updating address:', error);
            res.status(500).send('Error updating address');
        } else if (results.affectedRows === 0) {
            res.status(404).send('Address not found');
        } else {
            res.json({ line_1, line_2, zip, state, country, addressID });
        }
    });
});

app.delete('/address', (req, res) => {
    const { addressID } = req.body;
    const query = 'DELETE FROM address WHERE addressID = ?';
    db.query(query, [addressID], (error, results) => {
        if (error) {
            console.error('Error removing address:', error);
            res.status(500).send('Error removing from addresses.');
        } else if (results.affectedRows === 0) {
            res.status(404).send('Address not found.');
        } else {
            res.status(200).send('Address removed successfully');
        }
    });
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 