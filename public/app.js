async function loadTasks() {
  const taskList = document.getElementById('task-list');

  try {
    const response = await fetch('/api/tasks');

    if (!response.ok) {
      throw new Error('Failed to load tasks');
    }

    const tasks = await response.json();

    if (tasks.length === 0) {
      taskList.innerHTML = '<p>No tasks found.</p>';
      return;
    }

    taskList.innerHTML = tasks.map(task => `
      <div class="task">
        <h3>${task.title}</h3>
        <p>${task.description || ''}</p>

        <div class="task-actions">
          <label>
            Status:
            <select onchange="updateTaskStatus(${task.id}, this.value)">
              <option
                value="pending"
                ${task.status === 'pending' ? 'selected' : ''}
              >
                Pending
              </option>

              <option
                value="in_progress"
                ${task.status === 'in_progress' ? 'selected' : ''}
              >
                In Progress
              </option>

              <option
                value="completed"
                ${task.status === 'completed' ? 'selected' : ''}
              >
                Completed
              </option>
            </select>
          </label>

          <button
            class="delete-button"
            onclick="deleteTask(${task.id})"
          >
            Delete
          </button>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error(error);

    taskList.innerHTML =
      '<p>Unable to load tasks.</p>';
  }
}

async function createTask(event) {
  event.preventDefault();

  const title =
    document.getElementById('title').value;

  const description =
    document.getElementById('description').value;

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        title,
        description
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create task');
    }

    document
      .getElementById('task-form')
      .reset();

    await loadTasks();

  } catch (error) {
    console.error(error);

    alert('Unable to create task.');
  }
}

async function updateTaskStatus(id, status) {
  try {
    const response = await fetch(
      `/api/tasks/${id}/status`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          status
        })
      }
    );

    if (!response.ok) {
      throw new Error(
        'Failed to update task status'
      );
    }

    await loadTasks();

  } catch (error) {
    console.error(error);

    alert('Unable to update task status.');

    await loadTasks();
  }
}

async function deleteTask(id) {
  const confirmed = confirm(
    'Are you sure you want to delete this task?'
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      `/api/tasks/${id}`,
      {
        method: 'DELETE'
      }
    );

    if (!response.ok) {
      throw new Error(
        'Failed to delete task'
      );
    }

    await loadTasks();

  } catch (error) {
    console.error(error);

    alert('Unable to delete task.');
  }
}

document
  .getElementById('task-form')
  .addEventListener('submit', createTask);

loadTasks();