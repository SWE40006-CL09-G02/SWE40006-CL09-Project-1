function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadTasks() {
  const taskList = document.getElementById('task-list');

  const url = currentFilter === 'all'
    ? '/api/tasks'
    : `/api/tasks?status=${encodeURIComponent(currentFilter)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to load tasks');
    }

    const tasks = await response.json();

    if (tasks.length === 0) {
      taskList.innerHTML = currentFilter === 'all'
        ? '<p>No tasks found.</p>'
        : '<p>No tasks found for this filter.</p>';
      return;
    }

    taskList.innerHTML = tasks.map(task => `
      <div class="task" data-id="${task.id}">

        <div class="task-view">
          <h3>${escapeHtml(task.title)}</h3>
          <p>${escapeHtml(task.description || '')}</p>
        </div>

        <div class="task-edit">
          <input
            type="text"
            class="edit-title"
            value="${escapeHtml(task.title)}"
            placeholder="Task title"
          >

          <textarea
            class="edit-description"
            placeholder="Description (optional)"
          >${escapeHtml(task.description || '')}</textarea>

          <div class="edit-actions">
            <button
              class="save-button"
              onclick="saveTask(${task.id})"
            >
              Save
            </button>

            <button
              class="cancel-button"
              onclick="cancelEdit(${task.id})"
            >
              Cancel
            </button>
          </div>
        </div>

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
            class="edit-button"
            onclick="startEdit(${task.id})"
          >
            Edit
          </button>

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

let currentFilter = 'all';

function setFilter(status) {
  currentFilter = status;

  document
    .querySelectorAll('.filter-button')
    .forEach(button => {
      button.classList.toggle(
        'active',
        button.dataset.status === status
      );
    });

  loadTasks();
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

function getTaskElement(id) {
  return document.querySelector(
    `.task[data-id="${id}"]`
  );
}

function startEdit(id) {
  const task = getTaskElement(id);

  if (!task) {
    return;
  }

  document
    .querySelectorAll('.task.editing')
    .forEach(openTask => {
      openTask.classList.remove('editing');
    });

  task.classList.add('editing');

  const titleInput =
    task.querySelector('.edit-title');

  titleInput.focus();

  titleInput.setSelectionRange(
    titleInput.value.length,
    titleInput.value.length
  );
}

function cancelEdit(id) {
  const task = getTaskElement(id);

  if (!task) {
    return;
  }

  task.classList.remove('editing');

  loadTasks();
}

async function saveTask(id) {
  const task = getTaskElement(id);

  if (!task) {
    return;
  }

  const title =
    task.querySelector('.edit-title').value;

  const description =
    task.querySelector('.edit-description').value;

  if (!title || title.trim() === '') {
    alert('Title is required.');
    return;
  }

  try {
    const response = await fetch(
      `/api/tasks/${id}`,
      {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          title,
          description
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update task');
    }

    await loadTasks();

  } catch (error) {
    console.error(error);

    alert('Unable to update task.');
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
