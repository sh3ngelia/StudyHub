document.addEventListener("DOMContentLoaded", () => {
  const subjectsList = document.getElementById("subjects-list");
  const subjectList = document.getElementById("subject-list"); 
  const searchInput = document.getElementById("search-subjects");
  const searchButton = document.getElementById("search-button");
  const clearSearchButton = document.getElementById("clear-search");
  const sortSelect = document.getElementById("sort-subjects");
  const filterSelect = document.getElementById("filter-category");
  const gridViewBtn = document.getElementById("grid-view");
  const listViewBtn = document.getElementById("list-view");
  const totalSubjectsSpan = document.getElementById("total-subjects");
  const activeSubjectsSpan = document.getElementById("active-subjects");
  const noSubjectsMessage = document.getElementById("no-subjects");
  const modal = document.getElementById("subject-modal");
  const closeModalBtn = document.querySelector(".close-modal");
  const editSubjectBtn = document.getElementById("edit-subject");
  const deleteSubjectBtn = document.getElementById("delete-subject");

  let currentView = 'grid';
  let currentFilter = '';
  let currentSort = 'name-asc';
  let selectedSubject = null;
  let currentSearchTerm = '';

  // ცენტრალური მონაცემთა მენეჯერი - add.js-ის ანალოგიური
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

    // მონაცემების შენახვა
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

    // საგნის განახლება
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

    // საგნის წაშლა
    deleteSubject(subjectId) {
      const subjects = this.getSubjects();
      const filtered = subjects.filter(s => s.id !== subjectId);
      
      if (this.saveSubjects(filtered)) {
        this.triggerSync('delete', { subjectId });
        return true;
      }
      
      throw new Error("წაშლის ხარვეზი");
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

      // BroadcastChannel API-ის გამოყენება (თუ მხარდაჭერილია)
      if (window.BroadcastChannel) {
        try {
          const channel = new BroadcastChannel('studyHub');
          channel.postMessage({
            type: 'dataSync',
            action,
            data,
            timestamp: Date.now()
          });
        } catch (error) {
          console.log("BroadcastChannel ხარვეზი:", error);
        }
      }
    }
  };

  // დებაგინგ ფუნქცია
  function debugLog(message, data = null) {
    console.log(`[SUBJECTS DEBUG] ${message}`, data || '');
  }

  // ფილტრირებული საგნების მიღება
  function getFilteredSubjects(searchTerm = currentSearchTerm) {
    const subjects = DataManager.getSubjects();
    let filtered = subjects;

    debugLog('ფილტრაციამდე საგნები:', subjects.length);
    debugLog('ძებნის ტერმინი:', searchTerm);
    debugLog('კატეგორიის ფილტრი:', currentFilter);

    // ძებნა
    if (searchTerm) {
      filtered = filtered.filter(subj =>
        subj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subj.description && subj.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (subj.tags && subj.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
      debugLog('ძებნის შემდეგ:', filtered.length);
    }

    // კატეგორიით ფილტრაცია
    if (currentFilter && currentFilter !== 'all') {
      filtered = filtered.filter(subj => subj.category === currentFilter);
      debugLog('კატეგორიის ფილტრის შემდეგ:', filtered.length);
    }

    // დალაგება
    const sorted = sortSubjects(filtered, currentSort);
    debugLog('საბოლოო ფილტრირებული საგნები:', sorted.length);
    
    return sorted;
  }

  // ინიციალიზაცია
  function init() {
    debugLog('საგნების მოდულის ინიციალიზაცია...');
    
    // ელემენტების შემოწმება
    debugLog('totalSubjectsSpan ელემენტი:', totalSubjectsSpan ? 'მოიძებნა' : 'ვერ მოიძებნა');
    debugLog('activeSubjectsSpan ელემენტი:', activeSubjectsSpan ? 'მოიძებნა' : 'ვერ მოიძებნა');
    
    populateCategories();
    updateStats();
    renderSubjects();
    renderSubjectCards();
    setupEventListeners();
    checkEditMode();
    
    // Global DataManager-ის ხელმისაწვდომობა
    window.StudyHubDataManager = DataManager;
  }

  // რედაქტირების რეჟიმის შემოწმება
  function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId && window.location.pathname.includes('add.html')) {
      debugLog('რედაქტირების რეჟიმი აღმოჩენილია, ID:', editId);
      
      const subjects = DataManager.getSubjects();
      const subjectToEdit = subjects.find(s => s.id === parseInt(editId));
      
      if (subjectToEdit) {
        localStorage.setItem('editingSubject', JSON.stringify(subjectToEdit));
        debugLog('საგანი რედაქტირებისთვის მომზადებულია:', subjectToEdit.name);
      } else {
        debugLog('რედაქტირებისთვის საგანი ვერ მოიძებნა');
        showNotification('რედაქტირებისთვის საგანი ვერ მოიძებნა', 'error');
      }
    }
  }

  // კატეგორიების შევსება
  function populateCategories() {
    const subjects = DataManager.getSubjects();
    const categories = [...new Set(subjects.map(s => s.category))].filter(Boolean);
    debugLog('კატეგორიები:', categories);
    
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="all">ყველა კატეგორია</option>';
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = getCategoryDisplayName(category);
        filterSelect.appendChild(option);
      });
    }
  }

  // ანიმაციის ტაიმერების შენახვა
  let totalCountTimer = null;
  let activeCountTimer = null;

  // სტატისტიკის განახლება
  function updateStats() {
    debugLog('სტატისტიკის განახლება...');
    
    const filteredSubjects = getFilteredSubjects();
    const totalCount = filteredSubjects.length;
    const activeCount = filteredSubjects.filter(s => s.isActive !== false).length;
    
    debugLog('მთლიანი რაოდენობა:', totalCount);
    debugLog('აქტიური რაოდენობა:', activeCount);
    
    if (totalSubjectsSpan) {
      debugLog('მთლიანი ელემენტის განახლება:', totalCount);
      animateNumber(totalSubjectsSpan, totalCount, 'total');
    } else {
      debugLog('totalSubjectsSpan ელემენტი ვერ მოიძებნა!');
    }
    
    if (activeSubjectsSpan) {
      debugLog('აქტიური ელემენტის განახლება:', activeCount);
      animateNumber(activeSubjectsSpan, activeCount, 'active');
    } else {
      debugLog('activeSubjectsSpan ელემენტი ვერ მოიძებნა!');
    }
  }

  // რიცხვის ანიმაცია
  function animateNumber(element, target, type) {
    debugLog(`რიცხვის ანიმაცია ${type}:`, `${element.textContent} -> ${target}`);
    
    // ძველი ტაიმერის გაუქმება
    if (type === 'total' && totalCountTimer) {
      clearInterval(totalCountTimer);
      totalCountTimer = null;
    }
    if (type === 'active' && activeCountTimer) {
      clearInterval(activeCountTimer);
      activeCountTimer = null;
    }
    
    const current = parseInt(element.textContent) || 0;
    
    // თუ ციფრები იგივეა, ანიმაცია არ გაუშვი
    if (current === target) {
      debugLog(`ანიმაცია არ საჭიროა ${type} - მნიშვნელობა უკვე სწორია:`, target);
      return;
    }
    
    const increment = target > current ? 1 : -1;
    const duration = Math.abs(target - current) * 30;
    const steps = Math.abs(target - current);
    const stepDuration = Math.max(15, Math.min(80, duration / steps));
    
    const timer = setInterval(() => {
      const value = parseInt(element.textContent) || 0;
      if (value === target) {
        clearInterval(timer);
        if (type === 'total') totalCountTimer = null;
        if (type === 'active') activeCountTimer = null;
        debugLog(`ანიმაცია დასრულდა ${type}:`, target);
      } else {
        element.textContent = value + increment;
      }
    }, stepDuration);
    
    // ტაიმერის შენახვა
    if (type === 'total') totalCountTimer = timer;
    if (type === 'active') activeCountTimer = timer;
  }

  // subjects1.js-დან რენდერის ფუნქცია
  function renderSubjectCards() {
    if (!subjectList) {
      debugLog('subjectList ელემენტი ვერ მოიძებნა');
      return;
    }
    
    const subjects = getFilteredSubjects();
    debugLog('renderSubjectCards - საგნები:', subjects.length);
    
    subjectList.innerHTML = "";
    
    if (subjects.length === 0) {
      subjectList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>საგნები არ მოიძებნა</h3>
          <p>დაამატეთ ახალი საგანი ან შეცვალეთ ფილტრი</p>
        </div>
      `;
      return;
    }

    subjects.forEach(subject => {
      const item = document.createElement("div");
      item.className = "subject-card";
      item.setAttribute('data-subject-id', subject.id);
      
      // თეგების ფორმატირება
      const tagsHtml = subject.tags && subject.tags.length > 0 
        ? `<div class="subject-tags">${subject.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` 
        : '';

      // პროგრესის ბარი
      const progress = subject.progress || 0;
      const progressHtml = `
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <span class="progress-text">${progress}%</span>
        </div>
      `;

      // სტატუსის ბეჯი
      const statusBadge = subject.isActive !== false 
        ? '<span class="status-badge active">აქტიური</span>' 
        : '<span class="status-badge inactive">ინაქტიური</span>';

      item.innerHTML = `
        <div class="subject-header">
          <h3 class="subject-title">${subject.name}</h3>
          ${statusBadge}
        </div>
        <p class="subject-description">${subject.description || "აღწერა არ არის მითითებული"}</p>
        <div class="subject-meta">
          <div class="meta-item">
            <span class="meta-label">კატეგორია:</span>
            <span class="meta-value category-${subject.category}">${getCategoryDisplayName(subject.category)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">პრიორიტეტი:</span>
            <span class="meta-value priority-${subject.priority}">${subject.priority || 'მითითებული არ არის'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">სასწავლო საათები:</span>
            <span class="meta-value">${subject.studyHours || 0} სთ</span>
          </div>
          ${subject.completedHours ? `
          <div class="meta-item">
            <span class="meta-label">შესრულებული:</span>
            <span class="meta-value">${subject.completedHours} სთ</span>
          </div>` : ''}
        </div>
        ${progressHtml}
        ${tagsHtml}
        <div class="subject-actions">
          <button class="action-btn edit-btn" onclick="editSubject(${subject.id})">
            <span class="btn-icon">✏️</span> რედაქტირება
          </button>
          <button class="action-btn delete-btn" onclick="deleteSubjectConfirm(${subject.id})">
            <span class="btn-icon">🗑️</span> წაშლა
          </button>
        </div>
      `;

      // ინაქტიური საგნების ვიზუალური მაჩვენებელი
      if (subject.isActive === false) {
        item.classList.add('inactive');
      }

      // ანიმაცია
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      
      subjectList.appendChild(item);
    });

    // ანიმაციის გაშვება
    setTimeout(() => {
      const cards = subjectList.querySelectorAll('.subject-card');
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.style.transition = 'all 0.3s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 50);
      });
    }, 10);
  }

  // ღონისძიებების მოსმენა
  function setupEventListeners() {
    if (searchButton) {
      searchButton.addEventListener("click", handleSearch);
    }
    
    if (searchInput) {
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSearch();
      });
      
      // რეალურ დროში ძებნა
      let searchTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          currentSearchTerm = searchInput.value.trim();
          renderSubjects(currentSearchTerm);
          renderSubjectCards();
          updateStats();
        }, 300);
      });
    }
    
    if (clearSearchButton) {
      clearSearchButton.addEventListener("click", () => {
        searchInput.value = '';
        currentSearchTerm = '';
        renderSubjects();
        renderSubjectCards();
        updateStats();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        currentSort = e.target.value;
        renderSubjects();
        renderSubjectCards();
        updateStats();
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener("change", (e) => {
        currentFilter = e.target.value;
        debugLog('ფილტრი შეიცვალა:', currentFilter);
        renderSubjects();
        renderSubjectCards();
        updateStats();
      });
    }

    if (gridViewBtn) gridViewBtn.addEventListener("click", () => setView('grid'));
    if (listViewBtn) listViewBtn.addEventListener("click", () => setView('list'));

    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    }

    if (editSubjectBtn) editSubjectBtn.addEventListener("click", handleEditSubject);
    if (deleteSubjectBtn) deleteSubjectBtn.addEventListener("click", handleDeleteSubject);

    // ESC ღილაკით მოდალის დახურვა
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && modal.style.display !== "none") {
        closeModal();
      }
    });

    // სინქრონიზაციის მოსმენა - add.js-თან სინქრონიზაცია
    let updateTimeout;
    window.addEventListener("subjectsUpdated", (e) => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      updateTimeout = setTimeout(() => {
        debugLog('საგნების სინქრონიზაცია...', e.detail);
        populateCategories();
        updateStats();
        renderSubjects();
        renderSubjectCards();
        
        // შეტყობინება სინქრონიზაციის შესახებ
        if (e.detail && e.detail.action) {
          const actions = {
            'add': 'ახალი საგანი დაემატა',
            'update': 'საგანი განახლდა',
            'delete': 'საგანი წაიშალა',
            'save': 'მონაცემები შენახულია'
          };
          
          const message = actions[e.detail.action] || 'მონაცემები განახლდა';
          showNotification(message, 'info');
        }
      }, 100);
    });

    // localStorage სინქრონიზაცია სხვა tabs-თან
    window.addEventListener("storage", (e) => {
      if (e.key === "studyHubSubjects") {
        debugLog("სტორიჯი განახლდა სხვა tab-იდან");
        setTimeout(() => {
          populateCategories();
          updateStats();
          renderSubjects();
          renderSubjectCards();
        }, 50);
      }
    });

    // BroadcastChannel სინქრონიზაცია
    if (window.BroadcastChannel) {
      try {
        const channel = new BroadcastChannel('studyHub');
        channel.addEventListener('message', (e) => {
          if (e.data.type === 'dataSync') {
            debugLog("BroadcastChannel სინქრონიზაცია:", e.data);
            setTimeout(() => {
              populateCategories();
              updateStats();
              renderSubjects();
              renderSubjectCards();
            }, 50);
          }
        });
      } catch (error) {
        console.log("BroadcastChannel მხარდაჭერა არ არის:", error);
      }
    }
  }

  // ძებნის დამუშავება
  function handleSearch() {
    if (searchInput) {
      currentSearchTerm = searchInput.value.trim();
      debugLog('ძებნა:', currentSearchTerm);
      renderSubjects(currentSearchTerm);
      renderSubjectCards();
      updateStats();
    }
  }

  // ხედის შეცვლა
  function setView(viewType) {
    currentView = viewType;
    
    if (gridViewBtn && listViewBtn && subjectsList) {
      if (viewType === 'grid') {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        subjectsList.className = 'grid-view';
      } else {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        subjectsList.className = 'list-view';
      }
    }
    
    renderSubjects();
  }

  // საგნების რენდერი
  function renderSubjects(searchTerm = currentSearchTerm) {
    if (!subjectsList) return;
    
    currentSearchTerm = searchTerm;
    const filtered = getFilteredSubjects(searchTerm);

    subjectsList.innerHTML = "";
    
    if (filtered.length === 0) {
      if (noSubjectsMessage) noSubjectsMessage.style.display = 'block';
      return;
    }

    if (noSubjectsMessage) noSubjectsMessage.style.display = 'none';

    filtered.forEach(subject => {
      const li = document.createElement("li");
      li.onclick = () => openSubjectModal(subject);
      li.setAttribute('data-subject-id', subject.id);
      
      if (currentView === 'grid') {
        li.innerHTML = `
          <div class="subject-item">
            <div class="subject-name">${subject.name}</div>
            <div class="subject-meta">
              <div class="subject-category">${getCategoryDisplayName(subject.category)}</div>
              <div class="subject-date">დამატებულია: ${formatDate(subject.dateAdded || subject.createdAt)}</div>
              ${subject.priority ? `<div class="subject-priority">პრიორიტეტი: ${subject.priority}</div>` : ''}
              ${subject.studyHours ? `<div class="subject-hours">საათები: ${subject.studyHours}</div>` : ''}
              ${subject.tags && subject.tags.length > 0 ? `<div class="subject-tags-preview">${subject.tags.slice(0, 2).join(', ')}${subject.tags.length > 2 ? '...' : ''}</div>` : ''}
            </div>
            ${subject.progress ? `<div class="subject-progress"><div class="progress-mini" style="width: ${subject.progress}%"></div></div>` : ''}
          </div>
        `;
      } else {
        li.innerHTML = `
          <div class="subject-item">
            <div class="subject-name">${subject.name}</div>
            <div class="subject-category">${getCategoryDisplayName(subject.category)}</div>
            ${subject.priority ? `<div class="subject-priority">${subject.priority}</div>` : ''}
            ${subject.isActive === false ? '<div class="subject-status inactive">ინაქტიური</div>' : ''}
          </div>
        `;
      }

      // ინაქტიური საგნების ვიზუალური მაჩვენებელი
      if (subject.isActive === false) {
        li.style.opacity = '0.6';
        li.style.filter = 'grayscale(50%)';
        li.classList.add('inactive');
      }

      subjectsList.appendChild(li);
    });

    // ანიმაცია
    setTimeout(() => {
      subjectsList.querySelectorAll('li').forEach((li, index) => {
        li.style.animation = `slideInUp 0.3s ease forwards ${index * 0.05}s`;
      });
    }, 10);
  }

  // საგნების დალაგება
  function sortSubjects(subjects, sortType) {
    const sorted = [...subjects];
    
    switch (sortType) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ka'));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name, 'ka'));
      case 'date-new':
        return sorted.sort((a, b) => new Date(b.dateAdded || b.createdAt) - new Date(a.dateAdded || a.createdAt));
      case 'date-old':
        return sorted.sort((a, b) => new Date(a.dateAdded || a.createdAt) - new Date(b.dateAdded || b.createdAt));
      case 'priority':
        const priorityOrder = { 'მაღალი': 3, 'საშუალო': 2, 'დაბალი': 1 };
        return sorted.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
      case 'hours':
        return sorted.sort((a, b) => (b.studyHours || 0) - (a.studyHours || 0));
      case 'progress':
        return sorted.sort((a, b) => (b.progress || 0) - (a.progress || 0));
      default:
        return sorted;
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

  // თარიღის ფორმატირება
  function formatDate(dateString) {
    if (!dateString) return 'თარიღი არ არის მითითებული';
    const date = new Date(dateString);
    return date.toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // საგნის მოდალის გახსნა
  function openSubjectModal(subject) {
    if (!modal) return;
    
    selectedSubject = subject;
    
    const modalSubjectName = document.getElementById('modal-subject-name');
    const modalCategory = document.getElementById('modal-category');
    const modalDate = document.getElementById('modal-date');
    const modalDescription = document.getElementById('modal-description');
    const modalPriority = document.getElementById('modal-priority');
    const modalHours = document.getElementById('modal-hours');
    const modalProgress = document.getElementById('modal-progress');
    const modalTags = document.getElementById('modal-tags');
    
    if (modalSubjectName) modalSubjectName.textContent = subject.name;
    if (modalCategory) modalCategory.textContent = getCategoryDisplayName(subject.category);
    if (modalDate) modalDate.textContent = formatDate(subject.dateAdded || subject.createdAt);
    if (modalDescription) modalDescription.textContent = subject.description || 'აღწერა არ არის მითითებული';
    if (modalPriority) modalPriority.textContent = subject.priority || 'მითითებული არ არის';
    if (modalHours) modalHours.textContent = `${subject.studyHours || 0} სთ`;
    if (modalProgress) modalProgress.textContent = `${subject.progress || 0}%`;
    if (modalTags) {
      if (subject.tags && subject.tags.length > 0) {
        modalTags.innerHTML = subject.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
      } else {
        modalTags.textContent = 'თეგები არ არის მითითებული';
      }
    }
    // addsubject.js-ში დასამატებელი კოდი (ფაილის ბოლოში)

    // Modal-ის progress bar-ის განახლება
    const modalProgressBar = document.querySelector('#subject-modal .progress-fill');
    if (modalProgressBar) {
      modalProgressBar.style.width = `${subject.progress || 0}%`;
    }

    // Modal-ის გამოჩენა
    modal.style.display = 'block';
    modal.classList.add('show');
    
    // Body scroll-ის გათიშვა
    document.body.style.overflow = 'hidden';
    
    // Focus მენეჯმენტი
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }
  }

  // მოდალის დახურვა
  function closeModal() {
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
      document.body.style.overflow = '';
      selectedSubject = null;
    }
  }

  // საგნის რედაქტირების დამუშავება
  function handleEditSubject() {
    if (selectedSubject) {
      closeModal();
      // რედაქტირების გვერდზე გადასვლა
      const editUrl = `add.html?edit=${selectedSubject.id}`;
      window.location.href = editUrl;
    }
  }

  // საგნის წაშლის დამუშავება
  function handleDeleteSubject() {
    if (selectedSubject && confirm(`დარწმუნებული ხართ, რომ გსურთ "${selectedSubject.name}" საგნის წაშლა?`)) {
      try {
        DataManager.deleteSubject(selectedSubject.id);
        closeModal();
        showNotification('საგანი წარმატებით წაიშალა!', 'success');
        
        // UI-ის განახლება
        populateCategories();
        updateStats();
        renderSubjects();
        renderSubjectCards();
      } catch (error) {
        console.error('წაშლის ხარვეზი:', error);
        showNotification('წაშლისას მოხდა ხარვეზი!', 'error');
      }
    }
  }

  // შეტყობინების ჩვენება
  function showNotification(message, type = 'info') {
    // არსებული notification-ის მოძებნა ან შექმნა
    let notification = document.querySelector('.notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification';
      document.body.appendChild(notification);
    }

    notification.className = `notification ${type} show`;
    notification.textContent = message;

    // Auto hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // ინიციალიზაცია
  init();
});

// Global Functions - window object-ზე დამატება
window.editSubject = function(subjectId) {
  console.log('რედაქტირება:', subjectId);
  const editUrl = `add.html?edit=${subjectId}`;
  window.location.href = editUrl;
};

window.deleteSubjectConfirm = function(subjectId) {
  const subjects = window.StudyHubDataManager ? window.StudyHubDataManager.getSubjects() : JSON.parse(localStorage.getItem("studyHubSubjects") || "[]");
  const subject = subjects.find(s => s.id === subjectId);
  
  if (!subject) {
    alert('საგანი ვერ მოიძებნა!');
    return;
  }

  if (confirm(`დარწმუნებული ხართ, რომ გსურთ "${subject.name}" საგნის წაშლა?`)) {
    try {
      if (window.StudyHubDataManager) {
        window.StudyHubDataManager.deleteSubject(subjectId);
      } else {
        // Fallback თუ DataManager არ არის ხელმისაწვდომი
        const filtered = subjects.filter(s => s.id !== subjectId);
        localStorage.setItem("studyHubSubjects", JSON.stringify(filtered));
        
        // Manual sync event
        window.dispatchEvent(new CustomEvent("subjectsUpdated", {
          detail: { action: 'delete', subjectId, timestamp: Date.now() }
        }));
      }
      
      // Success notification
      showGlobalNotification('საგანი წარმატებით წაიშალა!', 'success');
      
      // Refresh page თუ საჭიროა
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('წაშლის ხარვეზი:', error);
      showGlobalNotification('წაშლისას მოხდა ხარვეზი!', 'error');
    }
  }
};

// Global notification function
window.showGlobalNotification = function(message, type = 'info') {
  let notification = document.querySelector('.global-notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'global-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(notification);
  }

  // Type-based styling
  const styles = {
    success: 'background: linear-gradient(135deg, #10b981, #059669);',
    error: 'background: linear-gradient(135deg, #ef4444, #dc2626);',
    info: 'background: linear-gradient(135deg, #3b82f6, #2563eb);',
    warning: 'background: linear-gradient(135deg, #f59e0b, #d97706);'
  };

  notification.style.cssText += styles[type] || styles.info;
  notification.textContent = message;
  notification.classList.add('show');

  // Show animation
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);

  // Auto hide
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
};

// Utility function for debugging
window.debugSubjects = function() {
  const dataManager = window.StudyHubDataManager;
  if (dataManager) {
    console.log('საგნების რაოდენობა:', dataManager.getSubjects().length);
    console.log('საგნები:', dataManager.getSubjects());
  } else {
    console.log('DataManager ხელმისაწვდომი არ არის');
  }
};

// Enhanced storage event listener for better cross-tab sync
window.addEventListener('storage', (e) => {
  if (e.key === 'studyHubSubjects') {
    console.log('Storage sync event დაფიქსირდა');
    
    // Debounced update to prevent rapid fire updates
    clearTimeout(window.syncTimeout);
    window.syncTimeout = setTimeout(() => {
      // Force refresh of current page data
      if (typeof updateStats === 'function') updateStats();
      if (typeof renderSubjects === 'function') renderSubjects();
      if (typeof renderSubjectCards === 'function') renderSubjectCards();
      if (typeof populateCategories === 'function') populateCategories();
      
      console.log('Cross-tab სინქრონიზაცია დასრულდა');
    }, 200);
  }
});

// Page visibility change handler for sync
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page became visible - check for updates
    console.log('Page visibility changed - syncing data');
    
    setTimeout(() => {
      if (typeof updateStats === 'function') updateStats();
      if (typeof renderSubjects === 'function') renderSubjects();
      if (typeof renderSubjectCards === 'function') renderSubjectCards();  
      if (typeof populateCategories === 'function') populateCategories();
    }, 100);
  }
});

// Enhanced error handling for localStorage operations
window.safeLocalStorage = {
  getItem: function(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`localStorage getItem error for key "${key}":`, error);
      return null;
    }
  },
  
  setItem: function(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`localStorage setItem error for key "${key}":`, error);
      
      // თუ quota exceeded error-ია, ვცდილობთ cleanup-ს
      if (error.name === 'QuotaExceededError') {
        this.cleanup();
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error('Retry after cleanup failed:', retryError);
        }
      }
      return false;
    }
  },
  
  removeItem: function(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`localStorage removeItem error for key "${key}":`, error);
      return false;
    }
  },
  
  cleanup: function() {
    try {
      // Remove old drafts and temporary data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('temp_') || key.includes('draft_old'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Cleanup error for key "${key}":`, e);
        }
      });
      
      console.log(`LocalStorage cleanup completed. Removed ${keysToRemove.length} items.`);
    } catch (error) {
      console.error('LocalStorage cleanup failed:', error);
    }
  }
};

console.log('🎓 StudyHub Subjects Module მზადაა!');