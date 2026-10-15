const express = require("express");
const path = require("path");
const { Client } = require("pg");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const app = express();

const PORT = 3000;

const SECRET = "task-manager-secret";
const sessions = {};

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "my-pwd-1234",
  database: "taskmanager",
});

client
  .connect()
  .then(function () {
    console.log("Connected to PostgreSQL");

    return client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      );
    `);
  })
  .then(function () {
    console.log("Users table is ready");

    return client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      priority VARCHAR(50) NOT NULL
      );
    `);
  })
  .then(function () {
    console.log("Tasks table is ready");

    return client.query(`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
    `);
  })
  .then(function () {
    console.log("Task-user relationship is ready");

    return client.query(
      `
      INSERT INTO users (username, password, role)
      VALUES ('admin', $1, 'admin')
      ON CONFLICT (username) DO NOTHING;
    `,
      [hashPassword("admin123")],
    );
  })
  .then(function () {
    console.log("Test user is ready");
  })
  .catch(function (error) {
    console.error("Database setup error:", error);
  });

app.use(express.json());
app.use(cookieParser(SECRET));
app.use(express.static(path.join(__dirname, "public")));

// Login
app.post("/api/login", function (req, res) {
  const username = req.body.username;
  const password = hashPassword(req.body.password);

  client
    .query(
      `
        SELECT * FROM users
        WHERE username = $1 AND password = $2;
      `,
      [username, password],
    )
    .then(function (result) {
      if (result.rows.length === 0) {
        return res.status(401).json({
          message: "Invalid username or password",
        });
      }

      const user = result.rows[0];

      const token = crypto.randomBytes(64).toString("hex");

      sessions[token] = {
        id: user.id,
        username: user.username,
        role: user.role,
      };

      res.cookie("authToken", token, {
        signed: true,
        httpOnly: true,
      });

      res.json({
        message: "Login successful",
        username: user.username,
        role: user.role,
      });
    })
    .catch(function (error) {
      console.error("Login error:", error);

      res.status(500).json({
        message: "Could not log in",
      });
    });
});

// Logout
app.post("/api/logout", function (req, res) {
  const token = req.signedCookies.authToken;

  if (token) {
    delete sessions[token];
  }

  res.clearCookie("authToken");

  res.json({
    message: "Logout successful",
  });
});

function requireLogin(req, res, next) {
  const token = req.signedCookies.authToken;

  if (!token || !sessions[token]) {
    return res.status(401).json({
      message: "You must be logged in",
    });
  }

  req.user = sessions[token];

  next();
}

app.get("/api/session", function (req, res) {
  const token = req.signedCookies.authToken;

  if (!token || !sessions[token]) {
    return res.json({
      loggedIn: false,
    });
  }

  res.json({
    loggedIn: true,
    username: sessions[token].username,
    role: sessions[token].role,
  });
});

app.get("/api/users", requireLogin, function (req, res) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  client
    .query(
      `
      SELECT id, username, role
      FROM users
      ORDER BY username;
    `,
    )
    .then(function (result) {
      res.json(result.rows);
    })
    .catch(function (error) {
      console.error("Error fetching users:", error);

      res.status(500).json({
        message: "Could not load users",
      });
    });
});

// CRUD operations
app.post("/api/tasks", requireLogin, function (req, res) {
  const title = req.body.title;
  const status = req.body.status;
  const priority = req.body.priority;

  let userId = req.user.id;

  if (req.user.role === "admin" && req.body.userId) {
    userId = Number(req.body.userId);
  }

  client
    .query(
      `
        INSERT INTO tasks (title, status, priority, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `,
      [title, status, priority, userId],
    )
    .then(function (result) {
      res.json(result.rows[0]);
    })
    .catch(function (error) {
      console.error("Error adding task:", error);

      res.status(500).json({
        message: "Could not add task",
      });
    });
});

app.get("/api/tasks", requireLogin, function (req, res) {
  const userId = req.user.id;
  const role = req.user.role;

  if (role === "admin") {
    client
      .query(
        `
          SELECT tasks.*, users.username
          FROM tasks
          JOIN users ON tasks.user_id = users.id
          ORDER BY tasks.id;
        `,
      )
      .then(function (result) {
        res.json(result.rows);
      })
      .catch(function (error) {
        console.error("Error fetching tasks:", error);

        res.status(500).json({
          message: "Could not load tasks",
        });
      });
  } else {
    client
      .query(
        `
          SELECT * FROM tasks
          WHERE user_id = $1
          ORDER BY id;
        `,
        [userId],
      )
      .then(function (result) {
        res.json(result.rows);
      })
      .catch(function (error) {
        console.error("Error fetching tasks:", error);

        res.status(500).json({
          message: "Could not load tasks",
        });
      });
  }
});

app.put("/api/tasks/:id", requireLogin, function (req, res) {
  const id = Number(req.params.id);
  const userId = req.user.id;
  const role = req.user.role;

  const title = req.body.title;
  const status = req.body.status;
  const priority = req.body.priority;

  let query;
  let values;

  if (role === "admin") {
    query = `
        UPDATE tasks
        SET title = $1, status = $2, priority = $3
        WHERE id = $4
        RETURNING *;
      `;

    values = [title, status, priority, id];
  } else {
    query = `
        UPDATE tasks
        SET title = $1, status = $2, priority = $3
        WHERE id = $4 AND user_id = $5
        RETURNING *;
      `;

    values = [title, status, priority, id, userId];
  }

  client
    .query(query, values)
    .then(function (result) {
      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      res.json(result.rows[0]);
    })
    .catch(function (error) {
      console.error("Error updating task", error);

      res.status(500).json({
        message: "Could not update task",
      });
    });
});

app.delete("/api/tasks/:id", requireLogin, function (req, res) {
  const id = Number(req.params.id);
  const userId = req.user.id;
  const role = req.user.role;

  let query;
  let values;

  if (role === "admin") {
    query = `
        DELETE FROM tasks
        WHERE id = $1
        RETURNING *;
      `;

    values = [id];
  } else {
    query = `
        DELETE FROM tasks
        WHERE id = $1 AND user_id = $2
        RETURNING *;
      `;

    values = [id, userId];
  }

  client
    .query(query, values)
    .then(function (result) {
      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      res.json({
        message: "Task deleted",
      });
    })
    .catch(function (error) {
      console.error("Error deleting task:", error);

      res.status(500).json({
        message: "Could not delete task",
      });
    });
});

app.listen(PORT, function () {
  console.log("Server is running on http://localhost:" + PORT);
});
