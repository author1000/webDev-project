const taskList = document.querySelector("#task-list");
const taskForm = document.querySelector("#task-form");
const titleInput = document.querySelector("#title-input");
const statusSelect = document.querySelector("#status-select");
const prioritySelect = document.querySelector("#priority-select");

function renderTask(task) {
  const li = document.createElement("li");

  li.textContent =
    task.title + " | Status: " + task.status + " | Priority: " + task.priority;

  const editButton = document.createElement("button");
  editButton.textContent = "Edit";

  editButton.addEventListener("click", function () {
    editTask(task);
  });

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", function () {
    deleteTask(task.id);
  });

  const completeButton = document.createElement("button");

  if (task.status === "completed") {
    completeButton.textContent = "Mark Open";
  } else {
    completeButton.textContent = "Complete";
  }

  completeButton.addEventListener("click", function () {
    toggleStatus(task);
  });

  li.appendChild(editButton);
  li.appendChild(deleteButton);
  li.appendChild(completeButton);

  taskList.appendChild(li);
}

function toggleStatus(task) {
  let newStatus;

  if (task.status === "completed") {
    newStatus = "open";
  } else {
    newStatus = "completed";
  }

  const updatedtask = {
    title: task.title,
    status: newStatus,
    priority: task.priority,
  };

  fetch("/api/tasks/" + task.id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedtask),
  }).then(function () {
    taskList.innerHTML = "";
    fetchTasks();
  });
}

function editTask(task) {
  const newTitle = prompt("Enter new title:", task.title);

  if (newTitle === null || newTitle === "") {
    return;
  }

  const newPriority = prompt(
    "Enter new priority (low/medium/high):",
    task.priority,
  );

  if (newPriority === null || newPriority === "") {
    return;
  }

  const updatedtask = {
    title: newTitle,
    status: newStatus,
    priority: newPriority,
  };

  fetch("/api/tasks/" + task.id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedtask),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function () {
      taskList.innerHTML = "";
      fetchTasks();
    });
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
