const taskList = document.querySelector("#task-list");
const taskForm = document.querySelector("#task-form");
const titleInput = document.querySelector("#title-input");
const statusSelect = document.querySelector("#status-select");
const prioritySelect = document.querySelector("#priority-select");

function renderTask(task) {
  const li = document.createElement("li");

  li.textContent =
    task.title + " | Status: " + task.status + " | Priority: " + task.priority;

  const deleteButton = document.createElement("button");

  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", function () {
    deleteTask(task.id);
  });

  li.appendChild(deleteButton);

  taskList.appendChild(li);
}

function deleteTask(id) {
  fetch("/api/tasks/" + id, {
    method: "DELETE",
  })
    .then(function (response) {
      return response.json();
    })
    .then(function () {
      taskList.innerHTML = "";
      fetchTasks();
    });
}

function fetchTasks() {
  fetch("/api/tasks")
    .then(function (response) {
      return response.json();
    })
    .then(function (tasks) {
      console.log(tasks);

      taskList.innerHTML = "";

      for (let task of tasks) {
        renderTask(task);
      }
    });
}

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const newTask = {
    title: titleInput.value,
    status: statusSelect.value,
    priority: prioritySelect.value,
  };

  fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newTask),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (task) {
      renderTask(task);

      taskForm.reset();
    });
});

fetchTasks();
