// Select elements
const taskList = document.querySelector("#task-list");
const taskForm = document.querySelector("#task-form");
const titleInput = document.querySelector("#title-input");
const statusSelect = document.querySelector("#status-select");
const prioritySelect = document.querySelector("#priority-select");

const searchInput = document.querySelector("#search-input");
const filterSelect = document.querySelector("#filter-select");

// Shared data
let allTasks = [];

// Rendering
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

function displayTasks() {
  taskList.innerHTML = "";

  const searchText = searchInput.value.toLowerCase();
  const selectedStatus = filterSelect.value;

  const filteredTasks = allTasks.filter(function (task) {
    const matchesSearch = task.title.toLowerCase().includes(searchText);

    const matchesStatus =
      selectedStatus === "all" || task.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  for (let task of filteredTasks) {
    renderTask(task);
  }
}

// Server functions
function fetchTasks() {
  fetch("/api/tasks")
    .then(function (response) {
      return response.json();
    })
    .then(function (tasks) {
      allTasks = tasks;

      displayTasks();
    });
}

function toggleStatus(task) {
  let newStatus;

  if (task.status === "completed") {
    newStatus = "open";
  } else {
    newStatus = "completed";
  }

  const updatedTask = {
    title: task.title,
    status: newStatus,
    priority: task.priority,
  };

  fetch("/api/tasks/" + task.id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedTask),
  }).then(function () {
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

  const updatedTask = {
    title: newTitle,
    status: task.status,
    priority: newPriority,
  };

  fetch("/api/tasks/" + task.id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedTask),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function () {
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
      fetchTasks();
    });
}

// Event listeners
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
    .then(function () {
      taskForm.reset();
      fetchTasks();
    });
});

searchInput.addEventListener("input", function () {
  displayTasks();
});

filterSelect.addEventListener("change", function () {
  displayTasks();
});

// Initial
fetchTasks();
