const monthNames = [
  "იანვარი",
  "თებერვალი",
  "მარტი",
  "აპრილი",
  "მაისი",
  "ივნისი",
  "ივლისი",
  "აგვისტო",
  "სექტემბერი",
  "ოქტომბერი",
  "ნოემბერი",
  "დეკემბერი",
];

let currentYear, currentMonth;
let holidays = {};

const monthYear = document.getElementById("monthYear");
const daysContainer = document.getElementById("daysContainer");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const yearSelector = document.getElementById("yearSelector");

// Holidays API
async function fetchHolidays(year) {
  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/GE`);
    const data = await response.json();
    
    // Create object for quick lookup
    holidays = {};
    data.forEach(holiday => {
      const date = new Date(holiday.date);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      holidays[key] = {
        name: holiday.name,
        localName: holiday.localName
      };
    });
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    holidays = {};
  }
}

function buildCalendar(year, month) {
  daysContainer.innerHTML = "";
  monthYear.textContent = `${monthNames[month]} ${year}`;

  // Set current year in year selector
  yearSelector.value = year;

  const today = new Date();
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay();

  // Adjust for Monday start (ქართველური კალენდრისთვის)
  if (startDay === 0) {
    startDay = 6;
  } else {
    startDay--;
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Empty cells for previous month
  for (let i = 0; i < startDay; i++) {
    const emptyCell = document.createElement("div");
    daysContainer.appendChild(emptyCell);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    dayCell.textContent = day;

    const currentDate = new Date(year, month, day);
    const dateKey = `${year}-${month}-${day}`;

    // Highlight today
    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      dayCell.classList.add("today");
    }

    // Add holidays
    if (holidays[dateKey]) {
      dayCell.classList.add("holiday");
      dayCell.title = holidays[dateKey].localName || holidays[dateKey].name;
      
      // Add small holiday icon
      const holidayIcon = document.createElement("span");
      holidayIcon.innerHTML = "🎉";
      holidayIcon.style.fontSize = "10px";
      holidayIcon.style.position = "absolute";
      holidayIcon.style.top = "2px";
      holidayIcon.style.right = "2px";
      dayCell.style.position = "relative";
      dayCell.appendChild(holidayIcon);
    }

    // Add click event for day details
    dayCell.addEventListener('click', () => {
      showDayDetails(year, month, day);
    });

    daysContainer.appendChild(dayCell);
  }
}

function showDayDetails(year, month, day) {
  const dateKey = `${year}-${month}-${day}`;
  
  let details = `📅 ${day} ${monthNames[month]}, ${year}\n\n`;
  
  // Add holiday info
  if (holidays[dateKey]) {
    details += `🎉 დღესასწაული: ${holidays[dateKey].localName || holidays[dateKey].name}\n\n`;
  }
  
  // Add motivational quote
  details += `💡 დღის ციტატა:\n"განათლება ყველაზე მძლავრი იარაღია, რომლითაც შეგიძლიათ შეცვალოთ მსოფლიო"`;

  alert(details);
}

function populateYearSelector(startYear, endYear) {
  yearSelector.innerHTML = "";
  for (let y = startYear; y <= endYear; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    yearSelector.appendChild(option);
  }
}

async function initCalendar() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();

  // Fetch holidays for current year
  await fetchHolidays(currentYear);

  // Populate year selector (1950-2050)
  populateYearSelector(1950, 2050);

  buildCalendar(currentYear, currentMonth);

  // Event listeners
  prevMonthBtn.addEventListener("click", async () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
      yearSelector.value = currentYear;
      // Fetch holidays for new year
      await fetchHolidays(currentYear);
    }
    buildCalendar(currentYear, currentMonth);
  });

  nextMonthBtn.addEventListener("click", async () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
      yearSelector.value = currentYear;
      // Fetch holidays for new year
      await fetchHolidays(currentYear);
    }
    buildCalendar(currentYear, currentMonth);
  });

  yearSelector.addEventListener("change", async (e) => {
    currentYear = parseInt(e.target.value);
    await fetchHolidays(currentYear);
    buildCalendar(currentYear, currentMonth);
  });
}

// Initialize calendar when DOM is loaded
document.addEventListener("DOMContentLoaded", initCalendar);