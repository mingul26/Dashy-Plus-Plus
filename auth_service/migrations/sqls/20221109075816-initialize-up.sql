/* Replace with your SQL commands */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users
(
    id       uuid         DEFAULT uuid_generate_v4 () UNIQUE PRIMARY KEY,
    name     VARCHAR(64)  NOT NULL,
    email    VARCHAR(128) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);