const express = require("express");
const path = require("path");

const app = express();

const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let tasks = [
  {
    id: 1,
    title: "Finish Web Development lab",
    status: "open",
    priority: "high",
  },
  {
    id: 2,
    title: "Review JavaScript",
    status: "completed",
    priority: "medium",
  },
];

app.get("/api/tasks", function (req, res) {
  res.json(tasks);
});

let nextId = 3;

app.post("/api/tasks", function (req, res) {
  const newTask = {
    id: nextId,
    title: req.body.title,
    status: req.body.status,
    priority: req.body.priority,
  };

  nextId++;

  tasks.push(newTask);

  res.json(newTask);
});

app.delete("/api/tasks/:id", function (req, res) {
  const id = Number(req.params.id);

  const index = tasks.findIndex(function (task) {
    return task.id === id;
  });

  if (index === -1) {
    return res.status(404).json({
      message: "Task not found",
    });
  }

  tasks.splice(index, 1);

  res.json({
    message: "Task deleted",
  });
});

app.put("/api/tasks/:id", function (req, res) {
  const id = Number(req.params.id);

  const task = tasks.find(function (task) {
    return task.id === id;
  });

  if (!task) {
    return res.status(404).json({
      message: "Task not found",
    });
  }

  task.title = req.body.title;
  task.status = req.body.status;
  task.priority = req.body.priority;

  res.json(task);
});

app.listen(PORT, function () {
  console.log("Server is running on http://localhost:" + PORT);
});
