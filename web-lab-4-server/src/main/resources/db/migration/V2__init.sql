CREATE TABLE users (
    id               BIGSERIAL PRIMARY KEY,
    login            VARCHAR(64)  NOT NULL UNIQUE,
    password_hash    VARCHAR(128) NOT NULL,
    token            VARCHAR(64) UNIQUE,
    token_issued_at  TIMESTAMP
);

CREATE TABLE hit_results (
    id        BIGSERIAL PRIMARY KEY,
    user_id  BIGINT NOT NULL,
    x         DOUBLE PRECISION NOT NULL,
    y         DOUBLE PRECISION NOT NULL,
    r         INTEGER NOT NULL,
    hit       BOOLEAN NOT NULL,
    ts        TIMESTAMP NOT NULL,

    CONSTRAINT fk_hit_results_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_hit_results_user_ts
    ON hit_results (user_id, ts DESC);
