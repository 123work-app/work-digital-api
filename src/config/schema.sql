-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- User Table
CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cpf TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Hashed password
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    phone TEXT,
    birthdate DATE NOT NULL
);

-- Freelancer Table
CREATE TABLE freelancer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Role Table
CREATE TABLE role (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- FreelancerRole Table
CREATE TABLE freelancer_role (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    freelancer_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    FOREIGN KEY (freelancer_id) REFERENCES freelancer(id),
    FOREIGN KEY (role_id) REFERENCES role(id)
);

-- Highlight Table
CREATE TABLE highlight (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    freelancer_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    FOREIGN KEY (freelancer_id) REFERENCES freelancer(id),
    FOREIGN KEY (role_id) REFERENCES role(id)
);

-- HighlightImage Table
CREATE TABLE highlight_image (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    highlight_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    FOREIGN KEY (highlight_id) REFERENCES highlight(id),
    UNIQUE (highlight_id, image_url)
);

-- Indexes for better performance
CREATE INDEX idx_user_cpf ON user(cpf);
CREATE INDEX idx_user_email ON user(email);
CREATE INDEX idx_freelancer_user_id ON freelancer(user_id);
CREATE INDEX idx_freelancer_role ON freelancer_role(freelancer_id, role_id);
CREATE INDEX idx_highlight ON highlight(freelancer_id, role_id);
CREATE INDEX idx_highlight_image ON highlight_image(highlight_id);

-- Constraint to ensure no more than 10 images per highlight
CREATE TRIGGER limit_highlight_images
AFTER INSERT ON highlight_image
WHEN (SELECT COUNT(*) FROM highlight_image WHERE highlight_id = NEW.highlight_id) > 10
BEGIN
    DELETE FROM highlight_image WHERE id = NEW.id;
    -- Raise an error
    SELECT RAISE(FAIL, 'Cannot have more than 10 images per highlight');
END;
