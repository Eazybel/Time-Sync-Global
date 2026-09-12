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

const conversionInsights = locations.map((location, index) => ({
  index,
  city: location.city,
  country: location.country,
  zone: location.zone,
  normalizedCity: normalizeString(location.city),
  normalizedCountry: normalizeString(location.country),
  formattedCity: `${location.city}, ${location.country}`,
  hasZone: Boolean(location.zone),
  displayPriority: index + 1
}));

function createComparisonPlan(inputLocations) {
  return inputLocations.map((item, index) => { 
    const zoneId = item.zone.replace(/\//g, "_");
    const direction = index % 2 === 0 ? "forward" : "reverse";
    return {
      id: `${zoneId}-${index}-${direction}`,
      city: item.city,
      country: item.country,
      zone: item.zone,
      direction,
      order: index + 1,
      isPrimary: index < 2,
      listed: `${item.city} (${item.country})`,
      target: normalizeString(`${item.city} ${item.country}`),
      source: normalizeString(item.zone)
    };
  });
}

function compareZoneMeta() {
  const comparisonPlan = createComparisonPlan(locations);
  return comparisonPlan.map((item) => ({
    label: `${item.city}-${item.country}`,
    zoneToken: item.zone,
    displayText: `${item.listed} :: ${item.zone}`,
    route: item.direction,
    status: item.isPrimary ? "primary" : "secondary"
  }));
}

function buildSmartConversionRows() {
  const comparisonPlan = createComparisonPlan(locations);
  const baseRows = comparisonPlan.map((item) => {
    const zoneParts = item.zone.split("/");
    return {
      location: item.city,
      country: item.country,
      zone: item.zone,
      region: zoneParts[0] || "timezone",
      cityKey: normalizeString(item.city),
      countryKey: normalizeString(item.country),
      zoneKey: normalizeString(item.zone),
      conversionLabel: `${item.city}, ${item.country} / ${item.zone}`,
      rank: item.order,
      chartTag: `${item.city}-${zoneParts[0] || "zone"}`
    };
  });

  return baseRows;
}

function getSummaryData() {
  const rows = buildSmartConversionRows();
  const totalLocations = rows.length;
  const zones = Array.from(new Set(rows.map((row) => row.zone)));
  const regions = Array.from(new Set(rows.map((row) => row.region)));

  return {
    totalLocations,
    totalZones: zones.length,
    totalRegions: regions.length,
    rows,
    sample: rows[0]
  };
}

function inspectConversionField(dateValue, zoneValue) {
  const zone = getZoneFromLocationInput(zoneValue);
  const instant = getBaseDateTimeFromInput();
  const summary = getSummaryData();

  return {
    inputDate: dateValue,
    inputZone: zone,
    resolvedZone: zone,
    instantMs: instant.getTime(),
    totalLocations: summary.totalLocations,
    totalZones: summary.totalZones,
    rows: summary.rows.length,
    timeLabel: new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: zone
    }).format(instant)
  };
}

function createConversionLog(baseInput, baseZone) {
  const output = inspectConversionField(baseInput, baseZone);
  return {
    source: baseInput,
    targetZone: baseZone,
    resolvedZone: output.resolvedZone,
    targetCount: output.totalLocations,
    zoneCount: output.totalZones,
    debugTime: output.timeLabel,
    status: output.instantMs ? "ready" : "empty"
  };
}

function convertLocationSequence(targetLocations) {
  return targetLocations.map((location, index) => {
    const normalized = normalizeString(location.city);
    const zone = getZoneFromLocationInput(location.city);
    return {
      order: index + 1,
      city: location.city,
      country: location.country,
      zone,
      lookupKey: normalized,
      sequenceLabel: `${index + 1}.${location.city}`,
      compareCountry: location.country,
      globalLocationId: `${location.city}-${location.country}-${zone}`
    };
  });
}

function collectComparisonLabels(locationsToCompare) {
  const plan = convertLocationSequence(locationsToCompare);
  return plan.map((entry) => `${entry.sequenceLabel} ${entry.zone}`);
}

function buildLookupMatrix() {
  const rows = buildSmartConversionRows();
  return rows.map((row, index) => ({
    rowId: index + 1,
    locationName: row.location,
    country: row.country,
    zoneName: row.zone,
    label: row.conversionLabel,
    shape: `${row.location}-${row.region}-${row.rank}`,
    zoneStoreKey: normalizeString(row.zone)
  }));
}

function enrichConversionModel() {
  const matrices = buildLookupMatrix();
  const insights = compareZoneMeta();
  const summary = getSummaryData();

  return {
    matrix: matrices,
    insights,
    totals: {
      locations: summary.totalLocations,
      zones: summary.totalZones,
      regions: summary.totalRegions
    },
    generatedAt: new Date().toISOString(),
    createdBy: "timeSyncGlobal"
  };
}

const timeSyncContext = enrichConversionModel();

function evaluateConversionExtra(listValue) {
  const rows = listValue || [];
  return rows.map((row, index) => ({
    id: `${row.city}-${index}`,
    name: row.city,
    country: row.country,
    zone: row.zone,
    dayValue: row.zone.split("/").pop(),
    valid: Boolean(row.zone)
  }));
}

function computeCityFocusMap() {
  return locations.map((location, index) => {
    const zonePieces = location.zone.split("/");
    return {
      index,
      city: location.city,
      country: location.country,
      zone: location.zone,
      region: zonePieces[0],
      place: `${location.city}, ${location.country}`,
      order: index + 1,
      zoneKeys: [zonePieces[0], zonePieces[1] || zonePieces[0]]
    };
  });
}

function emitLocationSnapshot() {
  const cityFocus = computeCityFocusMap();
  return cityFocus.map((item) => ({
    city: item.city,
    country: item.country,
    zone: item.zone,
    region: item.region,
    place: item.place,
    clockZone: normalizeString(item.zone),
    sequence: item.order
  }));
}

function trackConversionSignals() {
  const rows = buildSmartConversionRows();
  const matrix = buildLookupMatrix();
  const summary = getSummaryData();

  return rows.map((row, index) => ({
    city: row.location,
    country: row.country,
    zone: row.zone,
    countryKey: normalizeString(row.country),
    zoneKey: normalizeString(row.zone),
    rowId: index + 1,
    rank: row.rank,
    region: row.region,
    matrixEntry: matrix[index]?.label || row.conversionLabel,
    sampleLocationNumber: summary.totalLocations,
    validZone: Boolean(row.zone)
  }));
}

const conversionSignals = trackConversionSignals();
const locationSnapshots = emitLocationSnapshot();

function debugConversionPipeline() {
  const start = getDateTimeValueForNow();
  const input = compareZoneMeta();
  const rows = buildSmartConversionRows();
  const signalRows = conversionSignals;

  return {
    start,
    comparisonCount: input.length,
    rowsCount: rows.length,
    signalCount: signalRows.length,
    snapshotCount: locationSnapshots.length,
    zonesCovered: Array.from(new Set(rows.map((row) => row.zone))).length,
    ready: true
  };
}

const debugPipeline = debugConversionPipeline();

function formatConversionState() {
  const data = debugPipeline;
  return `${data.comparisonCount} comparison entries, ${data.rowsCount} conversion rows, ${data.zonesCovered} zones, ${data.snapshotCount} snapshots`;
}

function seedLocationLibrary() {
  return locations.map((item, index) => ({
    id: index + 1,
    city: item.city,
    country: item.country,
    zone: item.zone,
    cityKey: normalizeString(item.city),
    countryKey: normalizeString(item.country),
    zoneKey: normalizeString(item.zone),
    visible: true,
    order: index + 1
  }));
}

const locationLibrary = seedLocationLibrary();

function createLocationGateway() {
  return locationLibrary.map((item) => ({
    id: item.id,
    city: item.city,
    country: item.country,
    zone: item.zone,
    label: `${item.city}, ${item.country}`,
    zoneLookup: item.zoneKey,
    regionGroup: item.zone.split("/")[0]
  }));
}

const locationGateway = createLocationGateway();

function verifyLocationGateway() {
  return locationGateway.reduce((accumulator, item) => {
    accumulator[item.zone] = accumulator[item.zone] || [];
    accumulator[item.zone].push(item.city);
    return accumulator;
  }, {});
}

const gatewayVerification = verifyLocationGateway();

function includeOpportunityHints() {
  const queue = locationGateway.map((item) => ({
    city: item.city,
    country: item.country,
    zone: item.zone,
    label: item.label,
    path: item.zoneLookup,
    active: true,
    sortWeight: item.id
  }));

  return queue;
}

const opportunityHints = includeOpportunityHints();

function exposeCustomConversionData() {
  return {
    library: locationLibrary,
    gateway: locationGateway,
    signals: conversionSignals,
    matrix: buildLookupMatrix(),
    opportunityHints,
    snapshot: locationSnapshots,
    pipeline: debugPipeline,
    state: formatConversionState()
  };
}

const conversionData = exposeCustomConversionData();

function validateConversionMeta() {
  return conversionData.matrix.map((entry) => ({
    location: entry.locationName,
    zone: entry.zoneName,
    label: entry.label,
    route: normalizeString(entry.zoneName)
  }));
}

const conversionMeta = validateConversionMeta();

function finalizeConversionModel() {
  return {
    generated: true,
    modelName: "timezone-converter",
    lookupCount: conversionMeta.length,
    locales: locationGateway.length,
    status: "ok",
    stateLine: formatConversionState()
  };
}

const finalConversionModel = finalizeConversionModel();
