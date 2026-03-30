/* =================================================================
   MyPlanning App
   File: js/app.js
   What it does: All behaviour — saving tasks, displaying them,
                 deleting, completing, and drag-to-reorder
   Author: Diana (built with Claude)
   Version: 1.0 — Base Camp 1
   ================================================================= */


/* ── DATA ─────────────────────────────────────────────────────────
   tasks: the array (list) that holds all task objects in memory.
   We load it from localStorage when the app starts, so tasks
   survive closing the browser.                                     */

let tasks = loadTasks();


/* ── STARTUP ──────────────────────────────────────────────────────
   When the page finishes loading, render the task list and
   set up the Enter key shortcut on the input field.               */

document.addEventListener('DOMContentLoaded', function () {

  renderTasks();

  /* Allow pressing Enter to add a task (not just clicking +) */
  const input = document.getElementById('taskInput');
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      saveTask();
    }
  });

});


/* ── SAVE TASK ────────────────────────────────────────────────────
   Called when the user clicks + or presses Enter.
   Creates a task object, adds it to the list, saves, re-renders. */

function saveTask() {

  /* Read what the user typed */
  const input = document.getElementById('taskInput');
  const text = input.value.trim();  /* .trim() removes accidental spaces */

  /* Do nothing if the input is empty */
  if (text === '') return;

  /* Build a task object — this is the data model for one task.
     In Base Camp 2 we will add: project, importance, urgency, date. */
  const task = {
    id:        generateId(),          /* unique identifier           */
    text:      text,                  /* the task description        */
    done:      false,                 /* not completed yet           */
    createdAt: new Date().toISOString() /* timestamp for sorting later */
  };

  /* Add the new task to the BEGINNING of the array (newest on top) */
  tasks.unshift(task);

  /* Save the updated array to localStorage */
  persistTasks();

  /* Clear the input field and put focus back for fast re-entry */
  input.value = '';
  input.focus();

  /* Redraw the task list on screen */
  renderTasks();

}


/* ── RENDER TASKS ─────────────────────────────────────────────────
   Redraws the entire task list from the tasks array.
   Called after every change (add, delete, complete, reorder).     */

function renderTasks() {

  const list      = document.getElementById('taskList');
  const empty     = document.getElementById('emptyState');
  const countEl   = document.getElementById('taskCount');

  /* Clear what's currently displayed */
  list.innerHTML = '';

  /* Show or hide the empty state message */
  if (tasks.length === 0) {
    empty.style.display = 'flex';
    countEl.textContent = '0 tasks';
    return;  /* nothing more to do */
  }

  empty.style.display = 'none';

  /* Update the task counter in the header */
  const remaining = tasks.filter(t => !t.done).length;
  countEl.textContent = remaining + (remaining === 1 ? ' task' : ' tasks');

  /* Build one card per task and add it to the list */
  tasks.forEach(function (task, index) {
    const card = buildTaskCard(task, index);
    list.appendChild(card);
  });

  /* Activate drag-to-reorder on the freshly rendered list */
  setupDragAndDrop();

}


/* ── BUILD TASK CARD ──────────────────────────────────────────────
   Creates the HTML element for one task card.
   Returns a <li> element ready to be added to the list.          */

function buildTaskCard(task, index) {

  /* Create the list item */
  const li = document.createElement('li');
  li.className = 'task-card' + (task.done ? ' done' : '');
  li.dataset.index = index;     /* store position for drag-and-drop */
  li.draggable = true;          /* makes the element draggable      */

  /* ── Drag handle ── */
  const handle = document.createElement('span');
  handle.className = 'drag-handle';
  handle.textContent = '⠿';
  handle.title = 'Drag to reorder';

  /* ── Checkbox ── */
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-check';
  checkbox.checked = task.done;
  checkbox.addEventListener('change', function () {
    toggleDone(task.id);
  });

  /* ── Task text ── */
  const span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = task.text;

  /* ── Delete button ── */
  const del = document.createElement('button');
  del.className = 'delete-btn';
  del.textContent = '✕';
  del.title = 'Delete task';
  del.addEventListener('click', function () {
    deleteTask(task.id);
  });

  /* Assemble the card */
  li.appendChild(handle);
  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(del);

  return li;

}


/* ── TOGGLE DONE ──────────────────────────────────────────────────
   Marks a task as done or not done when the checkbox is clicked.  */

function toggleDone(id) {

  /* Find the task by its id and flip its done value */
  tasks = tasks.map(function (task) {
    if (task.id === id) {
      return { ...task, done: !task.done };
    }
    return task;
  });

  persistTasks();
  renderTasks();

}


/* ── DELETE TASK ──────────────────────────────────────────────────
   Removes a task permanently from the list.                       */

function deleteTask(id) {

  /* Keep every task EXCEPT the one with this id */
  tasks = tasks.filter(function (task) {
    return task.id !== id;
  });

  persistTasks();
  renderTasks();

}


/* ── DRAG AND DROP ────────────────────────────────────────────────
   Allows the user to reorder tasks by dragging them.
   Works on both desktop (mouse) and mobile (touch).

   How it works:
   - draggedIndex: remembers WHICH card is being dragged
   - dragover: highlights where it would land
   - drop: swaps the two tasks in the array and re-renders        */

let draggedIndex = null;   /* tracks which card is being dragged */

function setupDragAndDrop() {

  const cards = document.querySelectorAll('.task-card');

  cards.forEach(function (card) {

    /* ── Desktop drag events ── */

    card.addEventListener('dragstart', function () {
      draggedIndex = parseInt(card.dataset.index);
      /* Small delay so the card renders before it goes semi-transparent */
      setTimeout(() => card.classList.add('dragging'), 0);
    });

    card.addEventListener('dragend', function () {
      card.classList.remove('dragging');
      /* Remove all drag-over highlights */
      document.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
      draggedIndex = null;
    });

    card.addEventListener('dragover', function (event) {
      event.preventDefault();   /* required to allow dropping */
      if (draggedIndex === null) return;
      const targetIndex = parseInt(card.dataset.index);
      if (targetIndex !== draggedIndex) {
        card.classList.add('drag-over');
      }
    });

    card.addEventListener('dragleave', function () {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', function (event) {
      event.preventDefault();
      const targetIndex = parseInt(card.dataset.index);
      if (draggedIndex === null || targetIndex === draggedIndex) return;
      reorderTasks(draggedIndex, targetIndex);
    });

    /* ── Mobile touch drag events ── */
    setupTouchDrag(card);

  });

}


/* ── TOUCH DRAG ───────────────────────────────────────────────────
   Mobile devices don't fire drag events — they use touch events.
   This replicates drag-and-drop behaviour for touch screens.      */

function setupTouchDrag(card) {

  let touchStartY = 0;
  let isDragging  = false;

  card.addEventListener('touchstart', function (e) {
    touchStartY  = e.touches[0].clientY;
    draggedIndex = parseInt(card.dataset.index);
    isDragging   = false;
  }, { passive: true });

  card.addEventListener('touchmove', function (e) {
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
    if (deltaY > 8) {
      isDragging = true;
      card.classList.add('dragging');
    }

    if (!isDragging) return;

    /* Find which card we're hovering over */
    const touch  = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetCard = target ? target.closest('.task-card') : null;

    /* Clear all highlights, then highlight only the current target */
    document.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
    if (targetCard && targetCard !== card) {
      targetCard.classList.add('drag-over');
    }

  }, { passive: true });

  card.addEventListener('touchend', function (e) {

    card.classList.remove('dragging');
    document.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));

    if (!isDragging) {
      draggedIndex = null;
      return;
    }

    /* Find the drop target at the finger's final position */
    const touch      = e.changedTouches[0];
    const target     = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetCard = target ? target.closest('.task-card') : null;

    if (targetCard) {
      const targetIndex = parseInt(targetCard.dataset.index);
      if (targetIndex !== draggedIndex) {
        reorderTasks(draggedIndex, targetIndex);
      }
    }

    draggedIndex = null;
    isDragging   = false;

  });

}


/* ── REORDER TASKS ────────────────────────────────────────────────
   Moves a task from one position to another in the array.        */

function reorderTasks(fromIndex, toIndex) {

  /* Remove the dragged task from its original position */
  const moved = tasks.splice(fromIndex, 1)[0];

  /* Insert it at the new position */
  tasks.splice(toIndex, 0, moved);

  persistTasks();
  renderTasks();

}


/* ── LOCAL STORAGE ────────────────────────────────────────────────
   localStorage is the browser's built-in key-value store.
   It survives page refresh and closing the browser.
   Data is stored as text (JSON), so we convert to/from objects.  */

/* Save the tasks array to localStorage */
function persistTasks() {
  localStorage.setItem('myplanning-tasks', JSON.stringify(tasks));
}

/* Load tasks from localStorage (returns empty array if none yet) */
function loadTasks() {
  const stored = localStorage.getItem('myplanning-tasks');
  /* If nothing stored yet, return an empty array */
  return stored ? JSON.parse(stored) : [];
}


/* ── GENERATE ID ──────────────────────────────────────────────────
   Creates a unique ID for each task using the current timestamp
   plus a random number. This prevents duplicate IDs.             */

function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 7);
}
