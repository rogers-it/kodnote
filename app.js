// Data Storage
let notes = JSON.parse(localStorage.getItem("notes")) || []
let todos = JSON.parse(localStorage.getItem("todos")) || []
let settings = JSON.parse(localStorage.getItem("settings")) || {
  darkMode: true,
  fontSize: "medium",
  appLock: false,
  pin: "1234",
  notifications: true,
}

let currentNoteId = null
let selectedColor = "transparent"
let currentImageData = null

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

function initializeApp() {
  // Apply saved settings
  if (settings.darkMode) {
    document.documentElement.setAttribute("data-theme", "dark")
    document.getElementById("darkModeToggle").checked = true
  }

  document.body.className = `font-${settings.fontSize}`
  document.getElementById("fontSizeSelect").value = settings.fontSize
  document.getElementById("appLockToggle").checked = settings.appLock
  document.getElementById("notificationsToggle").checked = settings.notifications

  // Check app lock
  if (settings.appLock) {
    showLockScreen()
  }

  // Load notes and todos
  renderNotes()
  renderTodos()

  // Setup color picker
  setupColorPicker()

  // Setup PIN input
  setupPinInput()

  // Request notification permission
  if (settings.notifications && "Notification" in window) {
    Notification.requestPermission()
  }

  // Check for todo reminders
  checkTodoReminders()
  setInterval(checkTodoReminders, 60000) // Check every minute
}

// Lock Screen Functions
function showLockScreen() {
  document.getElementById("lockScreen").classList.add("active")
}

function unlockApp() {
  const pin1 = document.getElementById("pin1").value
  const pin2 = document.getElementById("pin2").value
  const pin3 = document.getElementById("pin3").value
  const pin4 = document.getElementById("pin4").value
  const enteredPin = pin1 + pin2 + pin3 + pin4

  if (enteredPin === settings.pin) {
    document.getElementById("lockScreen").classList.remove("active")
    // Clear PIN inputs
    document.getElementById("pin1").value = ""
    document.getElementById("pin2").value = ""
    document.getElementById("pin3").value = ""
    document.getElementById("pin4").value = ""
  } else {
    showToast("Incorrect PIN")
    // Clear PIN inputs
    document.getElementById("pin1").value = ""
    document.getElementById("pin2").value = ""
    document.getElementById("pin3").value = ""
    document.getElementById("pin4").value = ""
    document.getElementById("pin1").focus()
  }
}

function setupPinInput() {
  const pinInputs = document.querySelectorAll(".pin-digit")
  pinInputs.forEach((input, index) => {
    input.addEventListener("input", function () {
      if (this.value.length === 1 && index < pinInputs.length - 1) {
        pinInputs[index + 1].focus()
      }
    })

    input.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && this.value === "" && index > 0) {
        pinInputs[index - 1].focus()
      }
    })
  })
}

// Sidebar Functions
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar")
  const overlay = document.getElementById("overlay")
  sidebar.classList.toggle("active")
  overlay.classList.toggle("active")
}

function closeAll() {
  document.getElementById("sidebar").classList.remove("active")
  document.getElementById("overlay").classList.remove("active")
}

// Tab Functions
function showTab(tabName) {
  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

  // Update tab content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.style.display = "none"
  })

  if (tabName === "notes") {
    document.getElementById("notesTab").style.display = "block"
    document.getElementById("fabBtn").onclick = openCreateModal
    document.getElementById("fabBtn").innerHTML = '<i class="bi bi-plus-lg"></i>'
  } else if (tabName === "todos") {
    document.getElementById("todosTab").style.display = "block"
    document.getElementById("fabBtn").onclick = openTodoModal
    document.getElementById("fabBtn").innerHTML = '<i class="bi bi-plus-lg"></i>'
  } else if (tabName === "settings") {
    document.getElementById("settingsTab").style.display = "block"
    document.getElementById("fabBtn").style.display = "none"
    setTimeout(() => {
      document.getElementById("fabBtn").style.display = "flex"
    }, 100)
  }

  closeAll()
}

// Notes Functions
function renderNotes() {
  const notesGrid = document.getElementById("notesGrid")
  const emptyState = document.getElementById("emptyNotes")

  if (notes.length === 0) {
    notesGrid.innerHTML = ""
    emptyState.style.display = "block"
    return
  }

  emptyState.style.display = "none"
  notesGrid.innerHTML = notes
    .map(
      (note) => `
        <div class="note-card ${note.locked ? "locked" : ""}" 
             style="background-color: ${note.color || "var(--bg-secondary)"};"
             onclick="viewNote('${note.id}')">
            <div class="note-header">
                <h3 class="note-title">${escapeHtml(note.title)}</h3>
                <div class="note-actions">
                    ${note.locked ? '<i class="bi bi-lock-fill note-lock-icon"></i>' : ""}
                    <button class="note-action-btn" onclick="event.stopPropagation(); shareNote('${note.id}')" title="Share">
                        <i class="bi bi-share"></i>
                    </button>
                    <button class="note-action-btn" onclick="event.stopPropagation(); editNote('${note.id}')" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="note-action-btn" onclick="event.stopPropagation(); deleteNote('${note.id}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            ${note.image ? `<img src="${note.image}" class="note-image" alt="Note image">` : ""}
            <div class="note-content">${escapeHtml(note.content.substring(0, 150))}${note.content.length > 150 ? "..." : ""}</div>
            <div class="note-footer">
                <span class="note-date">
                    <i class="bi bi-clock"></i>
                    ${formatDate(note.date)}
                </span>
            </div>
        </div>
    `,
    )
    .join("")
}

function openCreateModal() {
  currentNoteId = null
  selectedColor = "transparent"
  currentImageData = null

  document.getElementById("noteModalTitle").textContent = "New Note"
  document.getElementById("noteForm").reset()
  document.getElementById("imagePreview").style.display = "none"
  document.getElementById("noteModal").classList.add("active")

  // Reset color selection
  document.querySelectorAll(".color-option").forEach((opt) => {
    opt.classList.remove("selected")
    if (opt.dataset.color === "transparent") {
      opt.classList.add("selected")
    }
  })
}

function closeNoteModal() {
  document.getElementById("noteModal").classList.remove("active")
}

function setupColorPicker() {
  document.querySelectorAll(".color-option").forEach((option) => {
    option.addEventListener("click", function () {
      document.querySelectorAll(".color-option").forEach((opt) => {
        opt.classList.remove("selected")
      })
      this.classList.add("selected")
      selectedColor = this.dataset.color
    })
  })
}

function previewImage() {
  const file = document.getElementById("noteImage").files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      currentImageData = e.target.result
      document.getElementById("imagePreview").src = currentImageData
      document.getElementById("imagePreview").style.display = "block"
    }
    reader.readAsDataURL(file)
  }
}

function saveNote() {
  const title = document.getElementById("noteTitle").value.trim()
  const content = document.getElementById("noteContent").value.trim()
  const locked = document.getElementById("noteLock").checked

  if (!title || !content) {
    showToast("Please fill in all fields")
    return
  }

  if (currentNoteId) {
    // Edit existing note
    const noteIndex = notes.findIndex((n) => n.id === currentNoteId)
    if (noteIndex !== -1) {
      notes[noteIndex] = {
        ...notes[noteIndex],
        title,
        content,
        color: selectedColor,
        image: currentImageData || notes[noteIndex].image,
        locked,
        date: new Date().toISOString(),
      }
    }
    showToast("Note updated successfully")
  } else {
    // Create new note
    const note = {
      id: Date.now().toString(),
      title,
      content,
      color: selectedColor,
      image: currentImageData,
      locked,
      date: new Date().toISOString(),
    }
    notes.unshift(note)
    showToast("Note created successfully")
  }

  localStorage.setItem("notes", JSON.stringify(notes))
  renderNotes()
  closeNoteModal()
}

function viewNote(id) {
  const note = notes.find((n) => n.id === id)
  if (!note) return

  if (note.locked) {
    const pin = prompt("This note is locked. Enter PIN:")
    if (pin !== settings.pin) {
      showToast("Incorrect PIN")
      return
    }
  }

  currentNoteId = id

  const detailContent = document.getElementById("noteDetailContent")
  detailContent.innerHTML = `
        <div class="note-detail-header">
            <h2 class="note-detail-title">${escapeHtml(note.title)}</h2>
            <div class="note-detail-meta">
                <i class="bi bi-clock"></i> ${formatDate(note.date)}
                ${note.locked ? '<i class="bi bi-lock-fill" style="margin-left: 0.5rem;"></i>' : ""}
            </div>
        </div>
        ${note.image ? `<img src="${note.image}" class="note-detail-image" alt="Note image">` : ""}
        <div class="note-detail-content">${escapeHtml(note.content)}</div>
    `

  document.getElementById("noteDetailModal").classList.add("active")
}

function closeNoteDetailModal() {
  document.getElementById("noteDetailModal").classList.remove("active")
  currentNoteId = null
}

function editNoteFromDetail() {
  closeNoteDetailModal()
  editNote(currentNoteId)
}

function shareNoteFromDetail() {
  shareNote(currentNoteId)
}

function editNote(id) {
  const note = notes.find((n) => n.id === id)
  if (!note) return

  if (note.locked) {
    const pin = prompt("This note is locked. Enter PIN:")
    if (pin !== settings.pin) {
      showToast("Incorrect PIN")
      return
    }
  }

  currentNoteId = id
  selectedColor = note.color || "transparent"
  currentImageData = note.image

  document.getElementById("noteModalTitle").textContent = "Edit Note"
  document.getElementById("noteTitle").value = note.title
  document.getElementById("noteContent").value = note.content
  document.getElementById("noteLock").checked = note.locked

  if (note.image) {
    document.getElementById("imagePreview").src = note.image
    document.getElementById("imagePreview").style.display = "block"
  } else {
    document.getElementById("imagePreview").style.display = "none"
  }

  // Set color selection
  document.querySelectorAll(".color-option").forEach((opt) => {
    opt.classList.remove("selected")
    if (opt.dataset.color === selectedColor) {
      opt.classList.add("selected")
    }
  })

  document.getElementById("noteModal").classList.add("active")
}

function deleteNote(id) {
  const note = notes.find((n) => n.id === id)
  if (!note) return

  if (note.locked) {
    const pin = prompt("This note is locked. Enter PIN:")
    if (pin !== settings.pin) {
      showToast("Incorrect PIN")
      return
    }
  }

  if (confirm("Are you sure you want to delete this note?")) {
    notes = notes.filter((n) => n.id !== id)
    localStorage.setItem("notes", JSON.stringify(notes))
    renderNotes()
    showToast("Note deleted")
  }
}

function shareNote(id) {
  const note = notes.find((n) => n.id === id)
  if (!note) return

  if (note.locked) {
    const pin = prompt("This note is locked. Enter PIN:")
    if (pin !== settings.pin) {
      showToast("Incorrect PIN")
      return
    }
  }

  const shareText = `${note.title}\n\n${note.content}`

  if (navigator.share) {
    navigator
      .share({
        title: note.title,
        text: shareText,
      })
      .then(() => {
        showToast("Note shared successfully")
      })
      .catch(() => {
        copyToClipboard(shareText)
      })
  } else {
    copyToClipboard(shareText)
  }
}

function copyToClipboard(text) {
  const textarea = document.createElement("textarea")
  textarea.value = text
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  document.body.removeChild(textarea)
  showToast("Note copied to clipboard")
}

function searchNotes() {
  const query = prompt("Search notes:")
  if (!query) return

  const filtered = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase()),
  )

  if (filtered.length === 0) {
    showToast("No notes found")
    return
  }

  const notesGrid = document.getElementById("notesGrid")
  notesGrid.innerHTML = filtered
    .map(
      (note) => `
        <div class="note-card ${note.locked ? "locked" : ""}" 
             style="background-color: ${note.color || "var(--bg-secondary)"};"
             onclick="viewNote('${note.id}')">
            <div class="note-header">
                <h3 class="note-title">${escapeHtml(note.title)}</h3>
                <div class="note-actions">
                    ${note.locked ? '<i class="bi bi-lock-fill note-lock-icon"></i>' : ""}
                    <button class="note-action-btn" onclick="event.stopPropagation(); shareNote('${note.id}')" title="Share">
                        <i class="bi bi-share"></i>
                    </button>
                    <button class="note-action-btn" onclick="event.stopPropagation(); editNote('${note.id}')" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="note-action-btn" onclick="event.stopPropagation(); deleteNote('${note.id}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            ${note.image ? `<img src="${note.image}" class="note-image" alt="Note image">` : ""}
            <div class="note-content">${escapeHtml(note.content.substring(0, 150))}${note.content.length > 150 ? "..." : ""}</div>
            <div class="note-footer">
                <span class="note-date">
                    <i class="bi bi-clock"></i>
                    ${formatDate(note.date)}
                </span>
            </div>
        </div>
    `,
    )
    .join("")

  showToast(`Found ${filtered.length} note(s)`)
}

// Todo Functions
function renderTodos() {
  const todoList = document.getElementById("todoList")
  const emptyState = document.getElementById("emptyTodos")

  if (todos.length === 0) {
    todoList.innerHTML = ""
    emptyState.style.display = "block"
    return
  }

  emptyState.style.display = "none"
  todoList.innerHTML = todos
    .map(
      (todo) => `
        <li class="todo-item ${todo.completed ? "completed" : ""}">
            <input type="checkbox" class="todo-checkbox" 
                   ${todo.completed ? "checked" : ""} 
                   onchange="toggleTodo('${todo.id}')">
            <div class="todo-content">
                <div class="todo-text">${escapeHtml(todo.text)}</div>
                ${
                  todo.time
                    ? `
                    <div class="todo-time">
                        <i class="bi bi-alarm"></i>
                        ${formatDateTime(todo.time)}
                    </div>
                `
                    : ""
                }
            </div>
            <div class="todo-actions">
                <button class="note-action-btn" onclick="editTodo('${todo.id}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="note-action-btn" onclick="deleteTodo('${todo.id}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </li>
    `,
    )
    .join("")
}

function openTodoModal() {
  document.getElementById("todoId").value = ""
  document.getElementById("todoForm").reset()
  document.getElementById("todoModal").classList.add("active")
}

function closeTodoModal() {
  document.getElementById("todoModal").classList.remove("active")
}

function saveTodo() {
  const text = document.getElementById("todoText").value.trim()
  const time = document.getElementById("todoTime").value
  const todoId = document.getElementById("todoId").value

  if (!text) {
    showToast("Please enter a task")
    return
  }

  if (todoId) {
    // Edit existing todo
    const todoIndex = todos.findIndex((t) => t.id === todoId)
    if (todoIndex !== -1) {
      todos[todoIndex] = {
        ...todos[todoIndex],
        text,
        time,
      }
    }
    showToast("Task updated successfully")
  } else {
    // Create new todo
    const todo = {
      id: Date.now().toString(),
      text,
      time,
      completed: false,
      notified: false,
    }
    todos.push(todo)
    showToast("Task created successfully")
  }

  localStorage.setItem("todos", JSON.stringify(todos))
  renderTodos()
  closeTodoModal()
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
    localStorage.setItem("todos", JSON.stringify(todos))
    renderTodos()
  }
}

function editTodo(id) {
  const todo = todos.find((t) => t.id === id)
  if (!todo) return

  document.getElementById("todoId").value = todo.id
  document.getElementById("todoText").value = todo.text
  document.getElementById("todoTime").value = todo.time || ""
  document.getElementById("todoModal").classList.add("active")
}

function deleteTodo(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    todos = todos.filter((t) => t.id !== id)
    localStorage.setItem("todos", JSON.stringify(todos))
    renderTodos()
    showToast("Task deleted")
  }
}

function checkTodoReminders() {
  if (!settings.notifications) return

  const now = new Date()
  todos.forEach((todo) => {
    if (todo.time && !todo.completed && !todo.notified) {
      const todoTime = new Date(todo.time)
      if (now >= todoTime) {
        showNotification("Task Reminder", todo.text)
        todo.notified = true
        localStorage.setItem("todos", JSON.stringify(todos))
      }
    }
  })
}

function showNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    })
  }

  // Also play a sound (you can add an audio file)
  showToast(body)
}

// Settings Functions
function toggleDarkMode() {
  settings.darkMode = document.getElementById("darkModeToggle").checked

  if (settings.darkMode) {
    document.documentElement.setAttribute("data-theme", "dark")
  } else {
    document.documentElement.removeAttribute("data-theme")
  }

  localStorage.setItem("settings", JSON.stringify(settings))
}

function changeFontSize() {
  settings.fontSize = document.getElementById("fontSizeSelect").value
  document.body.className = `font-${settings.fontSize}`
  localStorage.setItem("settings", JSON.stringify(settings))
}

function toggleAppLock() {
  settings.appLock = document.getElementById("appLockToggle").checked
  localStorage.setItem("settings", JSON.stringify(settings))

  if (settings.appLock) {
    showToast("App lock enabled")
  } else {
    showToast("App lock disabled")
  }
}

function changePIN() {
  const currentPin = prompt("Enter current PIN:")
  if (currentPin !== settings.pin) {
    showToast("Incorrect PIN")
    return
  }

  const newPin = prompt("Enter new PIN (4 digits):")
  if (!newPin || newPin.length !== 4 || !/^\d+$/.test(newPin)) {
    showToast("PIN must be 4 digits")
    return
  }

  const confirmPin = prompt("Confirm new PIN:")
  if (newPin !== confirmPin) {
    showToast("PINs do not match")
    return
  }

  settings.pin = newPin
  localStorage.setItem("settings", JSON.stringify(settings))
  showToast("PIN changed successfully")
}

function toggleNotifications() {
  settings.notifications = document.getElementById("notificationsToggle").checked
  localStorage.setItem("settings", JSON.stringify(settings))

  if (settings.notifications && "Notification" in window) {
    Notification.requestPermission()
  }
}

function clearAllData() {
  if (confirm("Are you sure you want to delete all data? This cannot be undone.")) {
    const confirmText = prompt('Type "DELETE" to confirm:')
    if (confirmText === "DELETE") {
      localStorage.clear()
      notes = []
      todos = []
      settings = {
        darkMode: true,
        fontSize: "medium",
        appLock: false,
        pin: "1234",
        notifications: true,
      }
      renderNotes()
      renderTodos()
      showToast("All data cleared")
    }
  }
}

// Data Import/Export
function exportData() {
  const data = {
    notes,
    todos,
    settings,
    exportDate: new Date().toISOString(),
  }

  const dataStr = JSON.stringify(data, null, 2)
  const dataBlob = new Blob([dataStr], { type: "application/json" })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement("a")
  link.href = url
  link.download = `notepad-backup-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)

  showToast("Data exported successfully")
  closeAll()
}

function importData() {
  document.getElementById("importFile").click()
  closeAll()
}

function handleImport() {
  const file = document.getElementById("importFile").files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)

      if (data.notes) notes = data.notes
      if (data.todos) todos = data.todos
      if (data.settings) settings = { ...settings, ...data.settings }

      localStorage.setItem("notes", JSON.stringify(notes))
      localStorage.setItem("todos", JSON.stringify(todos))
      localStorage.setItem("settings", JSON.stringify(settings))

      renderNotes()
      renderTodos()
      initializeApp()

      showToast("Data imported successfully")
    } catch (error) {
      showToast("Error importing data")
    }
  }
  reader.readAsText(file)
}

// Utility Functions
function showToast(message) {
  const toast = document.getElementById("toast")
  toast.textContent = message
  toast.classList.add("active")

  setTimeout(() => {
    toast.classList.remove("active")
  }, 3000)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return "Today"
  } else if (days === 1) {
    return "Yesterday"
  } else if (days < 7) {
    return `${days} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

function formatDateTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString()
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function showAbout() {
  alert("NotePad Pro v1.0\n\nA comprehensive note-taking app with todos, reminders, and more.\n\nPowered By Kodlama")
  closeAll()
}
