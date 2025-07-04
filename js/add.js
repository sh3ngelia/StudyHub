document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-subject-form");
  const messageEl = document.getElementById("form-message");
  const resetBtn = document.getElementById("reset-form");

  const DataManager = {
    // მონაცემების მიღება
    getSubjects() {
      try {
        const stored = localStorage.getItem("studyHubSubjects");
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error("მონაცემების წაკითხვის ხარვეზი:", error);
        return [];
      }
    },

    updateSubject(subjectId, updatedData) {
      const subjects = this.getSubjects();
      const index = subjects.findIndex(s => s.id === subjectId);

      if (index !== -1) {
        subjects[index] = {
          ...subjects[index],
          ...updatedData,
          updatedAt: new Date().toISOString()
        };

        if (this.saveSubjects(subjects)) {
          this.triggerSync('update', { subject: subjects[index] });
          return subjects[index];
        }
      }

      throw new Error("განახლების ხარვეზი");
    },

    deleteSubject(subjectId) {
      const subjects = this.getSubjects();
      const filtered = subjects.filter(s => s.id !== subjectId);

      if (this.saveSubjects(filtered)) {
        this.triggerSync('delete', { subjectId });
        return true;
      }

      throw new Error("წაშლის ხარვეზი");
    },

    getSubjectById(subjectId) {
      const subjects = this.getSubjects();
      return subjects.find(s => s.id === parseInt(subjectId));
    },

    saveSubjects(subjects) {
      try {
        localStorage.setItem("studyHubSubjects", JSON.stringify(subjects));

        // სინქრონიზაციის event-ის გაგზავნა
        this.triggerSync('save', { subjects });

        return true;
      } catch (error) {
        console.error("მონაცემების შენახვის ხარვეზი:", error);
        return false;
      }
    },

    addSubject(subjectData) {
      const subjects = this.getSubjects();

      const newSubject = {
        id: Date.now(),
        name: subjectData.name,
        description: subjectData.description,
        category: subjectData.category,
        priority: subjectData.priority,
        studyHours: subjectData.studyHours,
        tags: subjectData.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dateAdded: new Date().toISOString(), // subjects.js-სთვის
        progress: 0,
        completedHours: 0,
        isActive: true,
        status: "active",
      };

      subjects.push(newSubject);

      if (this.saveSubjects(subjects)) {
        this.triggerSync('add', { subject: newSubject });
        return newSubject;
      }

      throw new Error("შენახვის ხარვეზი");
    },

    // სინქრონიზაციის event-ის გაგზავნა
    triggerSync(action, data = {}) {
      // LocalStorage event-ის გაგზავნა სხვა tabs-ისთვის
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'studyHubSubjects',
        newValue: JSON.stringify(this.getSubjects()),
        url: window.location.href
      }));

      // Custom event-ის გაგზავნა მიმდინარე გვერდისთვის
      window.dispatchEvent(new CustomEvent("subjectsUpdated", {
        detail: { action, ...data, timestamp: Date.now() }
      }));
    },

    subjectExists(name) {
      const subjects = this.getSubjects();
      return subjects.some(s => s.name.toLowerCase() === name.toLowerCase());
    }
  };

  updateSubjectStats();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    setLoadingState(true);

    const formData = getFormData();

    const validationResult = validateForm(formData);
    if (!validationResult.isValid) {
      showMessage(validationResult.message, "error");
      setLoadingState(false);
      return;
    }

    try {
      await DataManager.addSubject(formData);
      showMessage("საგანი წარმატებით დაემატა! 🎉", "success");

      form.reset();
      form.subjectName.focus();

      updateSubjectStats();

      removeDraft();

      // სწრაფი მოქმედებების ჩვენება
      showQuickActions();

      // წყვილი წამის შემდეგ message-ის გაქრობა
      setTimeout(() => {
        hideMessage();
      }, 4000);
    } catch (error) {
      showMessage("შეცდომა მონაცემების შენახვისას!", "error");
      console.error("Save error:", error);
    }

    setLoadingState(false);
  });

  // Reset ღილაკის ივენთი
  resetBtn.addEventListener("click", () => {
    form.reset();
    hideMessage();
    form.subjectName.focus();
    hideQuickActions();
    removeDraft();
  });

  // ფორმიდან მონაცემების მიღება
  function getFormData() {
    const tagsArray = form.tags.value.trim()
      ? form.tags.value.trim()
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
      : [];

    return {
      name: form.subjectName.value.trim(),
      description: form.subjectDesc.value.trim(),
      category: form.subjectCategory.value,
      priority: form.priority.value,
      studyHours: parseInt(form.studyHours.value) || 0,
      tags: tagsArray,
    };
  }

  // ფორმის ვალიდაცია
  function validateForm(data) {
    if (!data.name || !data.category || !data.priority) {
      return {
        isValid: false,
        message: "გთხოვთ შეავსოთ აუცილებელი ველები! 📝",
      };
    }

    if (data.name.length < 2) {
      return {
        isValid: false,
        message: "საგნის სახელი უნდა იყოს მინიმუმ 2 სიმბოლო! ✏️",
      };
    }

    if (data.name.length > 50) {
      return {
        isValid: false,
        message: "საგნის სახელი ძალიან გრძელია! (მაქს. 50 სიმბოლო) 📏",
      };
    }

    // არსებული საგნის შემოწმება DataManager-ის გამოყენებით
    if (DataManager.subjectExists(data.name)) {
      return {
        isValid: false,
        message: "ასეთი საგანი უკვე არსებობს! 🔄",
      };
    }

    return { isValid: true };
  }

  // სტატისტიკის განახლება
  function updateSubjectStats() {
    const subjects = DataManager.getSubjects();

    // ძირითადი სტატისტიკა
    const totalSubjects = subjects.length;
    const totalHours = subjects.reduce(
      (sum, subject) => sum + (subject.studyHours || 0),
      0
    );

    // კატეგორიების დათვლა
    const categoryCount = {};
    subjects.forEach((subject) => {
      categoryCount[subject.category] =
        (categoryCount[subject.category] || 0) + 1;
    });

    // ყველაზე პოპულარული კატეგორია
    const mostPopularCategory =
      Object.keys(categoryCount).length > 0
        ? Object.keys(categoryCount).reduce((a, b) =>
          categoryCount[a] > categoryCount[b] ? a : b
        )
        : "-";

    // მაღალი პრიორიტეტის საგნები
    const highPriorityCount = subjects.filter(
      (s) => s.priority === "მაღალი"
    ).length;

    // DOM elements-ის განახლება
    updateStatElement("total-subjects", totalSubjects);
    updateStatElement("total-hours", totalHours);
    updateStatElement("most-category", mostPopularCategory);
    updateStatElement("high-priority-count", highPriorityCount);

    animateNumbers();
  }

  // სტატისტიკის ელემენტის განახლება
  function updateStatElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      if (id === "most-category") {
        element.textContent =
          value === "-" ? "-" : getCategoryDisplayName(value);
      } else {
        element.textContent = value;
      }
    }
  }

  // კატეგორიის სახელის გარდაქმნა
  function getCategoryDisplayName(category) {
    const categoryNames = {
      მთავარი: "მთავარი",
      სკოლა: "სკოლა",
      უნივერსიტეტი: "უნივერსიტეტი",
      ენები: "ენები",
      IT: "IT",
      ხელოვნება: "ხელოვნება",
      სპორტი: "სპორტი",
      ბიზნესი: "ბიზნესი",
      სხვა: "სხვა",
    };
    return categoryNames[category] || category;
  }

  // რიცხვების ანიმაცია
  function animateNumbers() {
    const numbers = document.querySelectorAll(".stat-number");
    numbers.forEach((num) => {
      if (num.id === "most-category") return;

      const finalValue = parseInt(num.textContent) || 0;
      let currentValue = 0;
      const increment = Math.max(1, Math.ceil(finalValue / 20));

      const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
          currentValue = finalValue;
          clearInterval(timer);
        }
        num.textContent = currentValue;
      }, 50);
    });
  }

  // შეტყობინების ჩვენება
  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `message ${type} show`;
  }

  // შეტყობინების დამალვა
  function hideMessage() {
    messageEl.textContent = "";
    messageEl.className = "message";
  }

  // Loading state-ის კონტროლი
  function setLoadingState(isLoading) {
    const submitBtn = form.querySelector(".submit-btn");
    const formContainer = document.querySelector(".form-container");

    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="btn-icon">⏳</span> დამატება...';
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-icon">✨</span> საგნის დამატება';
    }
  }

  // სწრაფი მოქმედებების ჩვენება
  function showQuickActions() {
    const quickActions = document.getElementById("quick-actions");
    if (quickActions) {
      quickActions.style.display = "block";
      quickActions.classList.add("fade-in");
    }
  }

  // სწრაფი მოქმედებების დამალვა
  function hideQuickActions() {
    const quickActions = document.getElementById("quick-actions");
    if (quickActions) {
      quickActions.style.display = "none";
      quickActions.classList.remove("fade-in");
    }
  }

  // Input ველების ინტერაქტიული ეფექტები
  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {

    // Real-time validation feedback
    input.addEventListener("input", () => {
      clearTimeout(input.validationTimeout);
      input.validationTimeout = setTimeout(() => {
        validateField(input);
      }, 500);
    });
  });

  // ველის ვალიდაცია
  function validateField(input) {
    const value = input.value.trim();
    let isValid = true;
    let message = "";

    switch (input.name) {
      case "subjectName":
        if (value && value.length < 2) {
          isValid = false;
          message = "მინიმუმ 2 სიმბოლო";
        } else if (value && value.length > 50) {
          isValid = false;
          message = "მაქსიმუმ 50 სიმბოლო";
        } else if (value && DataManager.subjectExists(value)) {
          isValid = false;
          message = "საგანი უკვე არსებობს";
        }
        break;
      case "studyHours":
        if (value && (parseInt(value) < 1 || parseInt(value) > 50)) {
          isValid = false;
          message = "1-დან 50-მდე საათი";
        }
        break;
    }

    // ვიზუალური ფიდბეკი
    if (value) {
      if (isValid) {
        input.style.borderColor = "#10b981";
      } else {
        input.style.borderColor = "#ef4444";
      }
    } else {
      input.style.borderColor = "";
    }

    // Error message display
    let errorElement = input.parentElement.querySelector(".error-hint");
    if (!isValid && message) {
      if (!errorElement) {
        errorElement = document.createElement("div");
        errorElement.className = "error-hint";
        errorElement.style.fontSize = "0.8rem";
        errorElement.style.color = "#ef4444";
        errorElement.style.marginTop = "0.25rem";
        input.parentElement.appendChild(errorElement);
      }
      errorElement.textContent = message;
    } else if (errorElement) {
      errorElement.remove();
    }
  }

  // Draft მენეჯმენტი
  let draftTimer;

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(saveDraft, 2000);
    });
  });

  function saveDraft() {
    const formData = getFormData();
    if (formData.name || formData.description) {
      try {
        localStorage.setItem("studyHubDraft", JSON.stringify(formData));
      } catch (error) {
        console.error("Draft შენახვის ხარვეზი:", error);
      }
    }
  }

  function removeDraft() {
    try {
      localStorage.removeItem("studyHubDraft");
    } catch (error) {
      console.error("Draft წაშლის ხარვეზი:", error);
    }
  }

  // Load draft on page load
  function loadDraft() {
    try {
      const draftStr = localStorage.getItem("studyHubDraft");
      if (draftStr) {
        const draftData = JSON.parse(draftStr);
        if (confirm("გსურს შენახული მონაცემების აღდგენა?")) {
          form.subjectName.value = draftData.name || "";
          form.subjectDesc.value = draftData.description || "";
          form.subjectCategory.value = draftData.category || "";
          form.priority.value = draftData.priority || "";
          form.studyHours.value = draftData.studyHours || "";
          form.tags.value = draftData.tags || "";

          removeDraft();
        }
      }
    } catch (error) {
      console.error("Draft ჩატვირთვის ხარვეზი:", error);
    }
  }

  // სინქრონიზაციის event listeners
  window.addEventListener("subjectsUpdated", (e) => {
    console.log("სინქრონიზაცია - საგნები განახლდა:", e.detail);
    updateSubjectStats();
  });

  // localStorage სინქრონიზაცია სხვა tabs-თან
  window.addEventListener("storage", (e) => {
    if (e.key === "studyHubSubjects") {
      console.log("სტორიჯი განახლდა სხვა tab-იდან");
      updateSubjectStats();
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + Enter - ფორმის submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      form.dispatchEvent(new Event("submit"));
    }

    // Esc - ფორმის reset
    if (e.key === "Escape") {
      resetBtn.click();
    }
  });

  // Load draft after DOM is ready
  setTimeout(loadDraft, 1000);

  // DataManager-ის გლობალური წვდომა
  window.StudyHubDataManager = DataManager;
});

// Global functions for quick actions
function addAnother() {
  const form = document.getElementById("add-subject-form");
  const messageEl = document.getElementById("form-message");

  form.reset();
  messageEl.textContent = "";
  messageEl.className = "message";
  form.subjectName.focus();

  // Hide quick actions
  const quickActions = document.getElementById("quick-actions");
  if (quickActions) {
    quickActions.style.display = "none";
  }

  // Draft-ის გასუფთავება
  try {
    localStorage.removeItem("studyHubDraft");
  } catch (error) {
    console.error("Draft წაშლის ხარვეზი:", error);
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}