const locations = [
  { city: "New York", country: "United States", zone: "America/New_York" },
  { city: "Los Angeles", country: "United States", zone: "America/Los_Angeles" },
  { city: "Chicago", country: "United States", zone: "America/Chicago" },
  { city: "Denver", country: "United States", zone: "America/Denver" },
  { city: "London", country: "United Kingdom", zone: "Europe/London" },
  { city: "Paris", country: "France", zone: "Europe/Paris" },
  { city: "Berlin", country: "Germany", zone: "Europe/Berlin" },
  { city: "Dubai", country: "United Arab Emirates", zone: "Asia/Dubai" },
  { city: "Mumbai", country: "India", zone: "Asia/Kolkata" },
  { city: "Singapore", country: "Singapore", zone: "Asia/Singapore" },
  { city: "Hong Kong", country: "Hong Kong", zone: "Asia/Hong_Kong" },
  { city: "Tokyo", country: "Japan", zone: "Asia/Tokyo" },
  { city: "Seoul", country: "South Korea", zone: "Asia/Seoul" },
  { city: "Sydney", country: "Australia", zone: "Australia/Sydney" },
  { city: "São Paulo", country: "Brazil", zone: "America/Sao_Paulo" }
];

const zoneLookup = new Map(locations.map((location) => [normalizeString(location.city), location.zone]));
const zoneLookupByCountry = new Map(locations.map((location) => [normalizeString(`${location.city}, ${location.country}`), location.zone]));
const zoneLookupByZone = new Map(locations.map((location) => [normalizeString(location.zone), location.zone]));

const zoneList = document.getElementById("timezone-list");
const baseLocation = document.getElementById("baseLocation");
const baseDateTime = document.getElementById("baseDateTime");
const nowButton = document.getElementById("nowButton");
const resetButton = document.getElementById("resetBtn");
const convertButton = document.getElementById("convertBtn");
const statusLine = document.getElementById("statusLine");
const todayTag = document.getElementById("todayTag");

const compareTimeEls = [
  document.getElementById("compareTime1"),
  document.getElementById("compareTime2"),
  document.getElementById("compareTime3"),
  document.getElementById("compareTime4")
];

const compareDateEls = [
  document.getElementById("compareDate1"),
  document.getElementById("compareDate2"),
  document.getElementById("compareDate3"),
  document.getElementById("compareDate4")
];

const compareLocationEls = [
  document.getElementById("locationName1"),
  document.getElementById("locationName2"),
  document.getElementById("locationName3"),
  document.getElementById("locationName4")
];

const compareZoneEls = [
  document.getElementById("compareZone1"),
  document.getElementById("compareZone2"),
  document.getElementById("compareZone3"),
  document.getElementById("compareZone4")
];

function normalizeString(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s,\/]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fillLocations() {
  locations.forEach((location) => {
    const option = document.createElement("option");
    option.value = `${location.city}, ${location.country}`;
    option.label = `${location.city}, ${location.country}`;
    zoneList.appendChild(option);
  });
}

function getDateTimeValueForNow() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10);
  const timePart = now.toISOString().slice(11, 16);
  return `${datePart}T${timePart}`;
}

function getZoneFromLocationInput(inputValue) {
  const searchValue = normalizeString(inputValue || "");

  if (!searchValue) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }

  const zone = zoneLookup.get(searchValue)
    || zoneLookupByCountry.get(searchValue)
    || zoneLookupByZone.get(searchValue);

  if (zone) {
    return zone;
  }

  if (inputValue && inputValue.trim().length > 0) {
    setStatus("Location not found. Showing UTC.");
  }

  return "UTC";
}

function getZoneParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZone: timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const obj = {};
  parts.forEach((part) => {
    if (part.type !== "literal") {
      obj[part.type] = part.value;
    }
  });

  const hour = Number(obj.hour || 0);
  return {
    year: Number(obj.year),
    month: Number(obj.month),
    day: Number(obj.day),
    hour,
    minute: Number(obj.minute),
    second: Number(obj.second)
  };
}

function getZoneOffsetMs(date, timeZone) {
  const zoneParts = getZoneParts(date, timeZone);
  const zoneAsUtc = Date.UTC(
    zoneParts.year,
    zoneParts.month - 1,
    zoneParts.day,
    zoneParts.hour,
    zoneParts.minute,
    zoneParts.second
  );

  return zoneAsUtc - date.getTime();
}

function getInstantFromZoneWall(parts, timeZone) {
  let utcMillis = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

  for (let i = 0; i < 4; i += 1) {
    const currentDate = new Date(utcMillis);
    const offset = getZoneOffsetMs(currentDate, timeZone);
    const corrected = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - offset;

    if (Math.abs(corrected - utcMillis) < 1000) {
      break;
    }

    utcMillis = corrected;
  }

  return new Date(utcMillis);
}

function getBaseDateTimeFromInput() {
  const value = baseDateTime.value;
  if (!value) {
    return new Date();
  }

  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart || "00:00").split(":").map(Number);

  return getInstantFromZoneWall({ year, month, day, hour, minute, second: 0 }, getZoneFromLocationInput(baseLocation.value));
}

function renderComparison(baseInstant) {
  const targets = locations.slice(0, 4);

  targets.forEach((location, index) => {
    const zone = location.zone;

    const formattedTime = new Intl.DateTimeFormat(undefined, {
      timeZone: zone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(baseInstant);

    const formattedDate = new Intl.DateTimeFormat(undefined, {
      timeZone: zone,
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(baseInstant);

    compareLocationEls[index].textContent = location.city;
    compareZoneEls[index].textContent = zone;
    compareTimeEls[index].textContent = formattedTime;
    compareDateEls[index].textContent = formattedDate;
  });
}

function convertTime() {
  const zone = getZoneFromLocationInput(baseLocation.value);
  const baseInstant = getBaseDateTimeFromInput();

  if (!Number.isFinite(baseInstant.getTime())) {
    setStatus("Please enter a valid date and time.");
    return;
  }

  renderComparison(baseInstant);
  todayTag.textContent = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(baseInstant);
  setStatus(`Converted from ${zone.replace("/", " / ")}`);
}

function setStatus(message) {
  statusLine.textContent = message;
}

function resetForm() {
  baseLocation.value = "New York";
  baseDateTime.value = getDateTimeValueForNow();
  convertTime();
}

function initialize() {
  fillLocations();
  baseLocation.value = "New York";
  baseDateTime.value = getDateTimeValueForNow();

  convertButton.addEventListener("click", convertTime);
  resetButton.addEventListener("click", resetForm);

  nowButton.addEventListener("click", () => {
    baseDateTime.value = getDateTimeValueForNow();
    baseLocation.value = "New York";
    convertTime();
  });

  baseLocation.addEventListener("change", convertTime);
  baseDateTime.addEventListener("change", convertTime);

  convertTime();
}

initialize();
