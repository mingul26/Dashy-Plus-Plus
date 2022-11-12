-- Schema for the Users table
CREATE TABLE users
(
    id       uuid         DEFAULT uuid_generate_v4 () UNIQUE PRIMARY KEY,
    name     VARCHAR(64)  NOT NULL,
    email    VARCHAR(128) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Schema for the Dashboard table
CREATE TABLE dashboard
(
    id          uuid DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY,
    name        varchar(255) NOT NULL,
    description varchar(255),
    owner_id    uuid         NOT NULL REFERENCES users(id)
);