// Select elements
const taskList = document.querySelector("#task-list");
const taskForm = document.querySelector("#task-form");
const titleInput = document.querySelector("#title-input");
const statusSelect = document.querySelector("#status-select");
const prioritySelect = document.querySelector("#priority-select");
const searchInput = document.querySelector("#search-input");
const filterSelect = document.querySelector("#filter-select");
const message = document.querySelector("#message");
const loginForm = document.querySelector("#login-form");
const usernameInput = document.querySelector("#username-input");
const passwordInput = document.querySelector("#password-input");
const loginMessage = document.querySelector("#login-message");
const taskSection = document.querySelector("#task-section");
const logoutButton = document.querySelector("#logout-button");
const userSelect = document.querySelector("#user-select");
const userField = document.querySelector("#user-field");

// Shared data
let allTasks = [];

// Rendering
function renderTask(task) {
  const li = document.createElement("li");

  li.textContent =
    task.title + " | Status: " + task.status + " | Priority: " + task.priority;

  if (task.username) {
    li.textContent += " | User: " + task.username;
  }

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

  if (filteredTasks.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No tasks found.";
    taskList.appendChild(li);
    return;
  }

  for (let task of filteredTasks) {
    renderTask(task);
  }
}

// Server functions
function fetchTasks() {
  message.textContent = "Loading tasks...";

  fetch("/api/tasks")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Could not load tasks.");
      }

      return response.json();
    })
    .then(function (tasks) {
      allTasks = tasks;
      message.textContent = "";

      displayTasks();
    })
    .catch(function (error) {
      message.textContent = error.message;
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
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Could not update task status.");
      }

      return response.json();
    })
    .then(function () {
      message.textContent = "Task status updated successfully.";
      fetchTasks();
    })
    .catch(function (error) {
      message.textContent = error.message;
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
      if (!response.ok) {
        throw new Error("Could not update task.");
      }

      return response.json();
    })
    .then(function () {
      message.textContent = "Task updated successfully.";
      fetchTasks();
    })
    .catch(function (error) {
      message.textContent = error.message;
    });
}

function deleteTask(id) {
  fetch("/api/tasks/" + id, {
    method: "DELETE",
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Could not delete task.");
      }

      return response.json();
    })
    .then(function () {
      message.textContent = "Task deleted successfully.";
      fetchTasks();
    })
    .catch(function (error) {
      message.textContent = error.message;
    });
}

function fetchUsers() {
  fetch("/api/users")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Could not load users.");
      }

      return response.json();
    })
    .then(function (users) {
      userSelect.innerHTML = "";

      for (let user of users) {
        const option = document.createElement("option");

        option.value = user.id;
        option.textContent = user.username;

        userSelect.appendChild(option);
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}

// Check session
function checkSession() {
  fetch("/api/session")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.loggedIn) {
        loginForm.style.display = "none";
        logoutButton.style.display = "inline";
        taskSection.style.display = "block";

        loginMessage.textContent = "Logged in as " + data.username;

        if (data.role === "admin") {
          userField.style.display = "inline";
          fetchUsers();
        } else {
          userField.style.display = "none";
          userSelect.innerHTML = "";
        }

        fetchTasks();
      } else {
        loginForm.style.display = "block";
        logoutButton.style.display = "none";
        taskSection.style.display = "none";

        userField.style.display = "none";
        userSelect.innerHTML = "";

        loginMessage.textContent = "Please log in.";
      }
    });
}

// Event listeners
taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (titleInput.value.trim() === "") {
    message.textContent = "Title is required.";
    return;
  }

  const newTask = {
    title: titleInput.value.trim(),
    status: statusSelect.value,
    priority: prioritySelect.value,
    userId: userSelect.value,
  };

  fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newTask),
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Could not add task.");
      }

      return response.json();
    })
    .then(function () {
      message.textContent = "Task added successfully.";
      taskForm.reset();
      fetchTasks();
    })
    .catch(function (error) {
      message.textContent = error.message;
    });
});

searchInput.addEventListener("input", function () {
  displayTasks();
});

filterSelect.addEventListener("change", function () {
  displayTasks();
});

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const loginData = {
    username: usernameInput.value,
    password: passwordInput.value,
  };

  fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      return response.json();
    })
    .then(function (data) {
      loginMessage.textContent = "Logged in as " + data.username;

      loginForm.reset();

      loginForm.style.display = "none";
      logoutButton.style.display = "inline";
      taskSection.style.display = "block";

      if (data.role === "admin") {
        userField.style.display = "inline";
        fetchUsers();
      } else {
        userField.style.display = "none";
        userSelect.innerHTML = "";
      }

      fetchTasks();
    })
    .catch(function (error) {
      loginMessage.textContent = error.message;
    });
});

logoutButton.addEventListener("click", function () {
  fetch("/api/logout", {
    method: "POST",
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      loginMessage.textContent = data.message;

      allTasks = [];

      checkSession();
    })
    .catch(function (error) {
      loginMessage.textContent = error.message;
    });
});

// Initial
checkSession();
