/* Replace with your SQL commands */
CREATE TABLE users (
    ID SERIAL PRIMARY KEY,
    name VARCHAR(64),
    email VARCHAR(128) UNIQUE NOT NULL,
    password VARCHAR(128)
);