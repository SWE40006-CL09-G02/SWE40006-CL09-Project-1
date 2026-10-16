// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * End-to-end acceptance tests for the DevOps Task Manager.
 *
 * These drive a real browser against the deployed application (Staging by
 * default - see playwright.config.js) and verify the complete user-facing
 * Create / View / Update / Delete journeys, exactly as a user would perform
 * them. They are the acceptance-test layer required by the assignment on top
 * of the Jest unit and integration suites.
 *
 * Each test uses a unique task title and cleans up after itself, so the suite
 * is safe to run repeatedly against a shared Staging database.
 */

// A unique title per test run avoids collisions on a shared Staging database.
function uniqueTitle(prefix) {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

// Locate the task card that contains the given (unique) title.
function taskCard(page, title) {
  return page.locator('.task').filter({ hasText: title });
}

/** Create a task through the UI and wait until it appears in the list. */
async function createTask(page, title, description = '') {
  await page.locator('#title').fill(title);

  if (description) {
    await page.locator('#description').fill(description);
  }

  await page.getByRole('button', { name: 'Add Task' }).click();

  const card = taskCard(page, title);
  await expect(card).toBeVisible();
  return card;
}

/** Delete a task through the UI (auto-accepting the confirm dialog). */
async function deleteTask(page, title) {
  const card = taskCard(page, title);

  if ((await card.count()) === 0) {
    return;
  }

  await card.locator('.delete-button').click();
  await expect(taskCard(page, title)).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  // The delete flow asks for confirmation via window.confirm; accept it.
  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DevOps Task Manager' })).toBeVisible();
});

test('the application loads and reaches the backend', async ({ page }) => {
  // The task list must resolve to real content (not stuck on "Loading tasks...").
  await expect(page.locator('#task-list')).not.toHaveText(/Loading tasks/, {
    timeout: 10000
  });
});

test('Create: a new task is created and shown in the list (View)', async ({ page }) => {
  const title = uniqueTitle('E2E create');

  try {
    const card = await createTask(page, title, 'Created by the E2E suite');

    await expect(card.locator('.task-view h3')).toHaveText(title);
    await expect(card.locator('.task-view p')).toHaveText('Created by the E2E suite');
    // A new task starts in the pending state.
    await expect(card.locator('select')).toHaveValue('pending');
  } finally {
    await deleteTask(page, title);
  }
});

test('Update: a task title and description can be edited', async ({ page }) => {
  const title = uniqueTitle('E2E edit');
  const newTitle = uniqueTitle('E2E edited');

  try {
    const card = await createTask(page, title, 'Before edit');

    await card.locator('.edit-button').click();
    await expect(card).toHaveClass(/editing/);

    await card.locator('.edit-title').fill(newTitle);
    await card.locator('.edit-description').fill('After edit');
    await card.locator('.save-button').click();

    const edited = taskCard(page, newTitle);
    await expect(edited.locator('.task-view h3')).toHaveText(newTitle);
    await expect(edited.locator('.task-view p')).toHaveText('After edit');
  } finally {
    await deleteTask(page, newTitle);
    await deleteTask(page, title);
  }
});

test('Update: a task status can be changed and is reflected by the filters (View)', async ({ page }) => {
  const title = uniqueTitle('E2E status');

  try {
    const card = await createTask(page, title);

    // Move the task to "completed".
    await card.locator('select').selectOption('completed');
    await expect(taskCard(page, title).locator('select')).toHaveValue('completed');

    // It should appear under the Completed filter...
    await page.getByRole('button', { name: 'Completed' }).click();
    await expect(taskCard(page, title)).toBeVisible();

    // ...and disappear from the Pending filter.
    await page.getByRole('button', { name: 'Pending', exact: true }).click();
    await expect(taskCard(page, title)).toHaveCount(0);

    // Return to the All view for cleanup.
    await page.getByRole('button', { name: 'All', exact: true }).click();
  } finally {
    await deleteTask(page, title);
  }
});

test('Delete: a task can be deleted and is removed from the list', async ({ page }) => {
  const title = uniqueTitle('E2E delete');

  const card = await createTask(page, title);
  await expect(card).toBeVisible();

  await card.locator('.delete-button').click();

  await expect(taskCard(page, title)).toHaveCount(0);
});
