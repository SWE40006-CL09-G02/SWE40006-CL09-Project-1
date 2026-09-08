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
        <strong>Status: ${task.status}</strong>
      </div>
    `).join('');

  } catch (error) {
    taskList.innerHTML = '<p>Unable to load tasks.</p>';
  }
}

loadTasks();
