CREATE DATABASE IF NOT EXISTS test_db2;
USE test_db2;

CREATE TABLE IF NOT EXISTS users (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    isAdmin char(1) NOT NULL
);



CREATE TABLE IF NOT EXISTS books (
    bookID INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    language VARCHAR(50),
    price DECIMAL(10, 2),
    isHardcover BOOLEAN,
    isBestseller BOOLEAN
);

create table if not exists payment_method (
    methodID INT AUTO_INCREMENT PRIMARY KEY,
    userID int,
    name VARCHAR(100), 
    card_number INT(20),
    expiration_date VARCHAR(5),
    csv int(4),
    FOREIGN KEY (userID) REFERENCES users(userID)
);

create table if not exists cart(
    userID int,
    bookID int,
    Foreign Key (userID) REFERENCES users(userID),
    Foreign Key (bookID) REFERENCES books(bookID)
);

create table if not exists orders (
    orderID int AUTO_INCREMENT PRIMARY KEY,
    userID int,
    bookID int,
    total_price DECIMAL(10,2),
    Foreign Key (userID) REFERENCES users(userID),
    Foreign Key (bookID) REFERENCES books(bookID)
);


