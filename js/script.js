document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  initializeMobileMenu();
  initializeDashboard();
  initializeStudyTimer();
  initializeGoals();
});

function initializeApp() {
  console.log("StudyHub initialized successfully!");
  updateStats();
}

function initializeMobileMenu() {
  const burger = document.getElementById("burger");
  const menuOverlay = document.getElementById("menu-overlay");
  const closeOverlayBtn = menuOverlay?.querySelector(".close-overlay");

  if (!burger || !menuOverlay) return;

  burger.addEventListener("click", () => {
    burger.classList.toggle("active");
    menuOverlay.classList.add("show");
    menuOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });

  closeOverlayBtn?.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOverlay.classList.contains("show")) {
      closeMenu();
    }
  });

  menuOverlay.addEventListener("click", (e) => {
    if (e.target === menuOverlay) {
      closeMenu();
    }
  });

  function closeMenu() {
    burger.classList.remove("active");
    menuOverlay.classList.remove("show");
    menuOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    burger.focus();
  }
}

function initializeDashboard() {
  loadDailyGoals();
  updateProgress();
  loadDailyQuote();
}

function loadDailyGoals() {
  const goalsList = document.getElementById("daily-goals-list");
  if (!goalsList) return;

  const customGoals = getCustomGoals();
  goalsList.innerHTML = "";

  customGoals.forEach((goal) => {
    const li = document.createElement("li");
    li.textContent = goal.text;
    li.setAttribute("data-goal-id", goal.id);

    li.addEventListener("click", () => {
      li.classList.toggle("completed");
      updateProgress();
      saveCompletedGoals(goal.id, li.classList.contains("completed"));
    });

    const completedGoals = getCompletedGoals();
    if (completedGoals.has(goal.id)) {
      li.classList.add("completed");
    }

    goalsList.appendChild(li);
  });
}

function updateProgress() {
  const totalGoals = document.querySelectorAll("#daily-goals-list li").length;
  const completedGoals = document.querySelectorAll("#daily-goals-list li.completed").length;
  const progressPercent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const completedCount = document.getElementById("completed-count");
  const totalCount = document.getElementById("total-count");

  if (progressBar) progressBar.style.width = progressPercent + "%";
  if (progressText) progressText.textContent = `თქვენი პროგრესი: ${progressPercent}%`;
  if (completedCount) completedCount.textContent = completedGoals;
  if (totalCount) totalCount.textContent = totalGoals;
}

function loadDailyQuote() {
  const quotes = [
    {
      text: "განათლება არის ყველაზე ძლიერი იარაღი, რომლითაც შეგიძლია შეცვალო მსოფლიო.",
      author: "ნელსონ მანდელა",
    },
    {
      text: "ყველა დიდი მიღწევა თავდაპირველად იყო შეუძლებლად მიჩნეული.",
      author: "ნაპოლეონ ჰილი",
    },
    {
      text: "ცოდნა არის ძალა, მაგრამ ცოდნის გამოყენება არის ძალაუფლება.",
      author: "ფრენსის ბეკონი",
    },
    {
      text: "წარმატება არის სამუშაოს შედეგი, არა ნიჭის.",
      author: "თომას ედისონი",
    },
    {
      text: "ერთადერთი შეცდომა რაც შეგიძლია ჩაიდინო არის ის, რომ არაფერი არ სცადო.",
      author: "ალბერტ აინშტაინი",
    },
    {
      text: "წარმოსახვა ცოდნაზე მნიშვნელოვანია.",
      author: "ალბერტ აინშტაინი",
    }
  ];

  const today = new Date().getDate();
  const todayQuote = quotes[today % quotes.length];

  const quoteElement = document.querySelector("#daily-quote p");
  const authorElement = document.querySelector("#daily-quote cite");

  if (quoteElement && authorElement) {
    quoteElement.textContent = `"${todayQuote.text}"`;
    authorElement.textContent = `- ${todayQuote.author}`;
  }
}

function initializeStudyTimer() {
  const timerBtn = document.getElementById("study-timer-btn");
  const modal = document.getElementById("study-timer-modal");
  const closeBtn = modal?.querySelector(".modal-close");

  if (!timerBtn || !modal) return;

  let timerInterval;
  let timeLeft = 25 * 60;
  let isRunning = false;

  const minutesDisplay = document.getElementById("timer-minutes");
  const secondsDisplay = document.getElementById("timer-seconds");
  const startBtn = document.getElementById("timer-start");
  const pauseBtn = document.getElementById("timer-pause");
  const resetBtn = document.getElementById("timer-reset");
  const durationInput = document.getElementById("timer-duration");

  timerBtn.addEventListener("click", () => {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    updateTimerDisplay();
  });

  closeBtn?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) {
      closeModal();
    }
  });

  function closeModal() {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  startBtn?.addEventListener("click", startTimer);
  pauseBtn?.addEventListener("click", pauseTimer);
  resetBtn?.addEventListener("click", resetTimer);
  durationInput?.addEventListener("change", updateDuration);

  function startTimer() {
    if (!isRunning) {
      isRunning = true;
      startBtn.disabled = true;
      pauseBtn.disabled = false;

      timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
          completeTimer();
        }
      }, 1000);
    }
  }

  function pauseTimer() {
    if (isRunning) {
      isRunning = false;
      clearInterval(timerInterval);
      startBtn.disabled = false;
      pauseBtn.disabled = true;
    }
  }

  function resetTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    timeLeft = parseInt(durationInput?.value || 25) * 60;
    updateTimerDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function updateDuration() {
    if (!isRunning) {
      timeLeft = parseInt(durationInput?.value || 25) * 60;
      updateTimerDisplay();
    }
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    if (minutesDisplay) {
      minutesDisplay.textContent = minutes.toString().padStart(2, "0");
    }
    if (secondsDisplay) {
      secondsDisplay.textContent = seconds.toString().padStart(2, "0");
    }
  }

  function completeTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    alert("სესია დასრულდა! შესვენების დროა.");
    
    setTimeout(() => {
      resetTimer();
    }, 1000);
  }
}

// script.js ფაილში initializeGoals ფუნქციის ნაცვლად:

function initializeGoals() {
  const addGoalBtn = document.getElementById("add-goal-btn");
  const clearAllBtn = document.getElementById("clear-all-goals-btn");

  addGoalBtn?.addEventListener("click", () => {
    const goalText = prompt("შეიყვანეთ ახალი მიზანი:");
    if (goalText && goalText.trim()) {
      addNewGoal(goalText.trim());
    }
  });

  clearAllBtn?.addEventListener("click", () => {
    if (confirm("დარწმუნებული ხართ, რომ გსურთ ყველა მიზნის წაშლა?")) {
      clearAllGoals();
    }
  });
}

// ამ ფუნქციის დამატება script.js ფაილის ბოლოში:
function clearAllGoals() {
  const goalsList = document.getElementById("daily-goals-list");
  if (goalsList) {
    goalsList.innerHTML = "";
  }
  
  // localStorage-დან წაშლა
  if (isStorageAvailable()) {
    localStorage.removeItem("customGoals");
    localStorage.removeItem("completedGoals");
  }
  
  updateProgress();
}

function addNewGoal(goalText) {
  const goalsList = document.getElementById("daily-goals-list");
  if (!goalsList) return;

  const li = document.createElement("li");
  li.textContent = goalText;

  const goalId = Date.now();
  li.setAttribute("data-goal-id", goalId);

  li.addEventListener("click", () => {
    li.classList.toggle("completed");
    updateProgress();
    saveCompletedGoals(goalId, li.classList.contains("completed"));
  });

  goalsList.appendChild(li);
  updateProgress();
  saveCustomGoal({ id: goalId, text: goalText });
}

function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

function getCompletedGoals() {
  if (isStorageAvailable()) {
    const saved = localStorage.getItem("completedGoals");
    return new Set(JSON.parse(saved || "[]"));
  }
  return new Set();
}

function saveCompletedGoals(goalId, isCompleted) {
  if (isStorageAvailable()) {
    const completedGoals = getCompletedGoals();
    if (isCompleted) {
      completedGoals.add(goalId);
    } else {
      completedGoals.delete(goalId);
    }
    localStorage.setItem("completedGoals", JSON.stringify([...completedGoals]));
  }
}

function getCustomGoals() {
  if (isStorageAvailable()) {
    const saved = localStorage.getItem("customGoals");
    return JSON.parse(saved || "[]");
  }
  return [];
}

function saveCustomGoal(goal) {
  if (isStorageAvailable()) {
    const customGoals = getCustomGoals();
    customGoals.push(goal);
    localStorage.setItem("customGoals", JSON.stringify(customGoals));
  }
}

function updateStats() {
  const subjectsFromStorage = isStorageAvailable() ? 
    JSON.parse(localStorage.getItem('studyHubSubjects') || '[]') : [];
  
  const totalSubjectsCount = subjectsFromStorage.length;

  const totalSubjects = document.getElementById("total-subjects");
  const completedTasks = document.getElementById("completed-tasks");
  const pendingTasks = document.getElementById("pending-tasks");

  if (totalSubjects) totalSubjects.textContent = totalSubjectsCount;
  if (completedTasks) completedTasks.textContent = "0";
  if (pendingTasks) pendingTasks.textContent = "0";
}

document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contactForm");
  const formMsg = document.getElementById("form-msg");

  contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const message = contactForm.message.value.trim();
    const agree = contactForm.agree.checked;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email || !message || !agree) {
      formMsg.textContent = "გთხოვთ შეავსოთ ყველა ველი და დაეთანხმოთ წესებს.";
      formMsg.style.color = "red";
      return;
    }

    if (!emailRegex.test(email)) {
      formMsg.textContent = "გთხოვთ ჩაწეროთ სწორი ელ.ფოსტა.";
      formMsg.style.color = "red";
      return;
    }

    formMsg.textContent = "შეტყობინება წარმატებით გაიგზავნა!";
    formMsg.style.color = "green";
    contactForm.reset();
  });
});

const slides = document.getElementById('slideContainer');
const totalSlides = slides.children.length;
let index = 0;

function updateSlide() {
    slides.style.transform = `translateX(-${index * 100}%)`;
}

function nextSlide() {
    index = (index + 1) % totalSlides;
    updateSlide();
}

function prevSlide() {
    index = (index - 1 + totalSlides) % totalSlides;
    updateSlide();
}

setInterval(() => {
    nextSlide();
}, 5000);
