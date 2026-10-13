const express = require("express");
const path = require("path");
const { Client } = require("pg");

const app = express();

const PORT = 3000;

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
  })
  .catch(function (error) {
    console.error("Database connection error:", error);
  });

client
  .query(
    `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      priority VARCHAR(50) NOT NULL
    );
  `,
  )
  .then(function () {
    console.log("Tasks table is ready");
  })
  .catch(function (error) {
    console.error("Error creating tasks table:", error);
  });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// CRUD operations
app.post("/api/tasks", function (req, res) {
  const title = req.body.title;
  const status = req.body.status;
  const priority = req.body.priority;

  client
    .query(
      `
        INSERT INTO tasks (title, status, priority)
        VALUES ($1, $2, $3)
        RETURNING *;
      `,
      [title, status, priority],
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

app.get("/api/tasks", function (req, res) {
  client
    .query("SELECT * FROM tasks ORDER BY id;")
    .then(function (result) {
      res.json(result.rows);
    })
    .catch(function (error) {
      console.error("Error fetching tasks:", error);

      res.status(500).json({
        message: "Could not load tasks",
      });
    });
});

app.put("/api/tasks/:id", function (req, res) {
  const id = Number(req.params.id);

  const title = req.body.title;
  const status = req.body.status;
  const priority = req.body.priority;

  client
    .query(
      `
        UPDATE tasks
        SET title = $1, status = $2, priority = $3
        WHERE id = $4
        RETURNING *;
      `,
      [title, status, priority, id],
    )
    .then(function (result) {
      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      res.json(result.rows[0]);
    })
    .catch(function (error) {
      console.error("Error updating task:", error);

      res.status(500).json({
        message: "Could not update task",
      });
    });
});

app.delete("/api/tasks/:id", function (req, res) {
  const id = Number(req.params.id);

  client
    .query(
      `
        DELETE FROM tasks
        WHERE id = $1
        RETURNING *;
      `,
      [id],
    )
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
