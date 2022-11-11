/* Replace with your SQL commands */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE dashboard
(
    id          uuid DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY,
    name        varchar(255) NOT NULL,
    description varchar(255),
    owner_id    uuid         NOT NULL
);