--
-- simple schema for graph storing address and txn between addrs. 
--

-- addr properties shall contain taintedSinceBlock
CREATE TABLE IF NOT EXISTS addresses (
    properties TEXT,
    id   TEXT GENERATED ALWAYS AS (json_extract(properties, '$.id')) VIRTUAL NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS id_idx ON addresses(id);

-- txn properties shall contain its block
CREATE TABLE IF NOT EXISTS transactions (
    src    TEXT,
    dst    TEXT,
    properties TEXT,
    id     TEXT GENERATED ALWAYS AS (json_extract(properties, '$.hash')) VIRTUAL NOT NULL UNIQUE,
    -- UNIQUE(src, dst, properties) ON CONFLICT REPLACE,

    FOREIGN KEY(src) REFERENCES addresses(id),
    FOREIGN KEY(dst) REFERENCES addresses(id)
);

CREATE INDEX IF NOT EXISTS src_idx ON transactions(src);
CREATE INDEX IF NOT EXISTS dst_idx ON transactions(dst);

