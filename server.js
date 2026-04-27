const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const XLSX = require("xlsx");

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const SESSION_SECRET = process.env.SESSION_SECRET || "prime-plus-secret";
const YANDEX_MAPS_API_KEY = process.env.YANDEX_MAPS_API_KEY || "";
const YANDEX_GEOCODER_API_KEY = process.env.YANDEX_GEOCODER_API_KEY || YANDEX_MAPS_API_KEY || "";

const DESIGN_SETTINGS_FILE = path.join(__dirname, 'design-settings.json');
const TARIFF_POSITIONS_FILE = path.join(__dirname, 'tariff-positions.json');
const DEFAULT_TARIFF_POSITIONS = JSON.parse("{\"titleA4\": {\"x\": -5, \"y\": 0}, \"titleA5\": {\"x\": -5, \"y\": 35}, \"titleA6\": {\"x\": -5, \"y\": 35}, \"arrowA4\": {\"x\": 370, \"y\": 36}, \"arrowA5\": {\"x\": 370, \"y\": 206}, \"arrowA6\": {\"x\": 370, \"y\": 291}}");
const DEFAULT_DESIGN_SETTINGS = JSON.parse("{\"heroLead\": {\"text\": \"\u0417\u0430\u044f\u0432\u0438\u0442\u0435 \u043e \u0441\u0435\u0431\u0435 \u0438 \u0440\u0430\u0441\u043a\u0440\u0443\u0442\u0438\u0442\u0435 \u0441\u0432\u043e\u0439 \u0431\u0440\u0435\u043d\u0434 \u0438\u043b\u0438 \u0442\u043e\u0432\u0430\u0440\u044b.\\n\u041f\u0440\u043e\u0434\u0432\u0438\u0433\u0430\u0439\u0442\u0435 \u0443\u0441\u043b\u0443\u0433\u0438 \u0431\u044b\u0441\u0442\u0440\u043e \u0438 \u044d\u0444\u0444\u0435\u043a\u0442\u0438\u0432\u043d\u043e \u0441\u0440\u0435\u0434\u0438 \u0448\u0438\u0440\u043e\u043a\u043e\u0439 \u0430\u0443\u0434\u0438\u0442\u043e\u0440\u0438\u0438.\", \"x\": 0, \"y\": 0, \"fontSize\": \"\", \"width\": \"\", \"fontFamily\": \"\"}, \"heroSubhead\": {\"text\": \"\u0424\u043e\u0440\u043c\u0430\u0442 \u0440\u0435\u043a\u043b\u0430\u043c\u044b: \u0432 \u043d\u0430\u043b\u0438\u0447\u0438\u0438 16 \u0441\u043b\u043e\u0442\u043e\u0432 \u0444\u043e\u0440\u043c\u0430\u0442\u0430 A5\", \"x\": 0, \"y\": 0, \"fontSize\": \"\", \"width\": \"\", \"fontFamily\": \"\"}, \"coverageTitle\": {\"text\": \"\u041c\u044b \u0440\u0430\u0441\u043f\u043e\u043b\u0430\u0433\u0430\u0435\u043c\u0441\u044f \u0431\u043e\u043b\u0435\u0435 \u0447\u0435\u043c \u0432\\n600 \u043f\u043e\u0434\u044a\u0435\u0437\u0434\u0430\u0445\", \"x\": -60, \"y\": 0, \"fontSize\": \"\", \"width\": \"\", \"fontFamily\": \"\"}, \"tariffA4\": {\"text\": \"\u0422\u0410\u0420\u0418\u0424 \u00ab\u041e\u0411\u042a\u0415\u041c\u041d\u042b\u0419\u00bb. \u041a\u043e\u043b\u043e\u043d\u043a\u0430 \u0444\u043e\u0440\u043c\u0430\u0442\u0430 A4\\n\u042d\u0442\u043e\u0442 \u0444\u043e\u0440\u043c\u0430\u0442 \u0432 \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438 \u0440\u0430\u0432\u0435\u043d \u0446\u0435\u043b\u043e\u043c\u0443 \u043b\u0438\u0441\u0442\u0443 A4.\\n\u0420\u0430\u0437\u043c\u0435\u0440 \u0431\u0443\u043c\u0430\u0433\u0438 \u0444\u043e\u0440\u043c\u0430\u0442\u0430 A4 \u043f\u043e \u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u0443 ISO 216 \u0441\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442\\n210 \u00d7 297 \u043c\u043c.\", \"x\": 0, \"y\": 0, \"fontSize\": \"\", \"width\": \"470\", \"fontFamily\": \"\"}, \"tariffA5\": {\"text\": \"\u0422\u0410\u0420\u0418\u0424 \u00ab\u0412\u0415\u0421\u042c \u0413\u041e\u0420\u041e\u0414\u00bb. \u041a\u043e\u043b\u043e\u043d\u043a\u0430 \u0444\u043e\u0440\u043c\u0430\u0442\u0430 A5\\n\u042d\u0442\u043e\u0442 \u0444\u043e\u0440\u043c\u0430\u0442 \u0432 \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438 \u0440\u0430\u0432\u0435\u043d \u043f\u043e\u043b\u043e\u0432\u0438\u043d\u0435 \u043b\u0438\u0441\u0442\u0430 A4.\\n\u0420\u0430\u0437\u043c\u0435\u0440 \u0431\u0443\u043c\u0430\u0433\u0438 \u0444\u043e\u0440\u043c\u0430\u0442\u0430 A5 \u043f\u043e \u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u0443 ISO 216 \u0441\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442\\n148 \u00d7 210 \u043c\u043c.\", \"x\": 0, \"y\": 0, \"fontSize\": \"\", \"width\": \"470\", \"fontFamily\": \"\"}, \"tariffA6\": {\"text\": \"\u0422\u0410\u0420\u0418\u0424 \u00ab\u041b\u0410\u0419\u0422\u00bb. \u041a\u043e\u043b\u043e\u043d\u043a\u0430 \u0444\u043e\u0440\u043c\u0430\u0442\u0430 A6\\n\u042d\u0442\u043e\u0442 \u0444\u043e\u0440\u043c\u0430\u0442 \u0440\u0430\u0432\u0435\u043d \u043f\u043e\u043b\u043e\u0432\u0438\u043d\u0435 \u043b\u0438\u0441\u0442\u0430 A5.\\n\u0420\u0430\u0437\u043c\u0435\u0440 \u0431\u0443\u043c\u0430\u0433\u0438 \u0444\u043e\u0440\u043c\u0430\u0442\u0430 A6 \u0441\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442\\n105 \u00d7 148 \u043c\u043c.\", \"x\": 0, \"y\": 0, \"fontSize\": \"\", \"width\": \"470\", \"fontFamily\": \"\"}}");

const SLOTS_FILE = path.join(__dirname, "slots.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const GEOCODE_CACHE_FILE = path.join(__dirname, "geocoded_houses.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    }
  })
);

app.use(express.static(PUBLIC_DIR));

function findExcelFile() {
  const preferred = path.join(__dirname, "doma.xlsx");
  if (fs.existsSync(preferred)) return preferred;

  const files = fs.readdirSync(__dirname);
  const xlsx = files.find((name) => {
    const lower = name.toLowerCase();
    return lower.endsWith(".xlsx") && !lower.startsWith("~$");
  });

  return xlsx ? path.join(__dirname, xlsx) : null;
}

function readSlots() {
  if (!fs.existsSync(SLOTS_FILE)) {
    const initial = Array(16).fill(0);
    fs.writeFileSync(SLOTS_FILE, JSON.stringify(initial), "utf8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(SLOTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 16) return parsed;
  } catch (_) {}

  const fallback = Array(16).fill(0);
  fs.writeFileSync(SLOTS_FILE, JSON.stringify(fallback), "utf8");
  return fallback;
}

function writeSlots(slots) {
  fs.writeFileSync(SLOTS_FILE, JSON.stringify(slots), "utf8");
}

function normalizeKey(key) {
  return String(key || "")
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(row, variants) {
  const entries = Object.entries(row);
  for (const variant of variants) {
    const normalizedVariant = normalizeKey(variant);
    const found = entries.find(([key]) => normalizeKey(key) === normalizedVariant);
    if (found && found[1] !== undefined && found[1] !== null && String(found[1]).trim() !== "") {
      return found[1];
    }
  }

  for (const variant of variants) {
    const normalizedVariant = normalizeKey(variant);
    const found = entries.find(([key]) => normalizeKey(key).includes(normalizedVariant));
    if (found && found[1] !== undefined && found[1] !== null && String(found[1]).trim() !== "") {
      return found[1];
    }
  }

  return "";
}

function cleanValue(value) {
  return String(value ?? "").trim();
}

function readHousesRaw() {
  const file = findExcelFile();
  if (!file) return [];

  const workbook = XLSX.readFile(file);
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function normalizeHouses() {
  const raw = readHousesRaw();

  return raw
    .map((row) => {
      const street = cleanValue(pick(row, [
        "Наименование улице",
        "Наименование улицы",
        "Улица",
        "Адрес",
        "street"
      ]));

      const house = cleanValue(pick(row, [
        "№ дома",
        "Номер дома",
        "Дом",
        "house"
      ]));

      const entrances = cleanValue(pick(row, [
        "кол-во подъездов в доме",
        "Количество подъездов",
        "количество подъездов",
        "Подъездов",
        "entrances"
      ]));

      const floors = cleanValue(pick(row, [
        "этажность",
        "Количество этажей",
        "Этажей",
        "floors"
      ]));

      const flats = cleanValue(pick(row, [
        "Количество квартир",
        "Квартир",
        "квартиры",
        "flats"
      ]));

      const values = Object.values(row);

      const latRaw = cleanValue(pick(row, [
        "lat",
        "latitude",
        "широта",
        "координата широта"
      ]) || values[6]);

      const lonRaw = cleanValue(pick(row, [
        "lon",
        "lng",
        "longitude",
        "долгота",
        "координата долгота"
      ]) || values[7]);

      const lat = Number(String(latRaw).replace(",", "."));
      const lon = Number(String(lonRaw).replace(",", "."));

      const address = street && house ? `${street} д.${house}` : cleanValue(pick(row, ["Адрес", "address"]));

      return {
        street,
        house,
        address,
        entrances,
        floors,
        flats,
        lat: Number.isFinite(lat) ? lat : null,
        lon: Number.isFinite(lon) ? lon : null
      };
    })
    .filter((row) => row.address || row.street || row.house);
}

function readGeocodeCache() {
  if (!fs.existsSync(GEOCODE_CACHE_FILE)) return {};

  try {
    return JSON.parse(fs.readFileSync(GEOCODE_CACHE_FILE, "utf8"));
  } catch (_) {
    return {};
  }
}

function writeGeocodeCache(cache) {
  fs.writeFileSync(GEOCODE_CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
}

async function geocodeAddress(address) {
  const query = `Россия, Республика Татарстан, Нижнекамск, ${address}`;

  if (YANDEX_GEOCODER_API_KEY) {
    const url = new URL("https://geocode-maps.yandex.ru/1.x/");
    url.searchParams.set("apikey", YANDEX_GEOCODER_API_KEY);
    url.searchParams.set("geocode", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("results", "1");

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const member = data?.response?.GeoObjectCollection?.featureMember?.[0];
      const pos = member?.GeoObject?.Point?.pos;
      if (pos) {
        const [lon, lat] = pos.split(" ").map(Number);
        if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
      }
    }
  }

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("q", query);
  nominatimUrl.searchParams.set("format", "json");
  nominatimUrl.searchParams.set("limit", "1");
  nominatimUrl.searchParams.set("addressdetails", "0");

  const osmRes = await fetch(nominatimUrl, {
    headers: {
      "User-Agent": "PrimePlusSite/1.0 contact Prime.plus.rt@gmail.com",
      "Accept-Language": "ru"
    }
  });

  if (!osmRes.ok) return null;

  const osmData = await osmRes.json();
  const item = osmData?.[0];
  if (!item) return null;

  const lat = Number(item.lat);
  const lon = Number(item.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon };
}

async function getHousesWithCoordinates() {
  return normalizeHouses().filter((house) => {
    return Number.isFinite(Number(house.lat)) && Number.isFinite(Number(house.lon));
  });
}

app.get("/api/slots", (req, res) => {
  res.json(readSlots());
});

app.get("/api/houses", (req, res) => {
  res.json(normalizeHouses());
});

app.get("/api/houses-map", async (req, res) => {
  try {
    const houses = await getHousesWithCoordinates();
    res.json(houses);
  } catch (error) {
    res.json(normalizeHouses());
  }
});

app.get("/api/map-config", (req, res) => {
  res.json({
    yandexMapsApiKey: YANDEX_MAPS_API_KEY
  });
});

app.get("/api/admin/status", (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};

  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }

  res.status(401).json({ ok: false, message: "Неверный пароль" });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.post("/api/admin/save-slots", (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ ok: false, message: "Нет доступа" });
  }

  const { slots } = req.body || {};
  if (!Array.isArray(slots) || slots.length !== 16) {
    return res.status(400).json({ ok: false, message: "Некорректные данные" });
  }

  const normalized = slots.map((v) => (v ? 1 : 0));
  writeSlots(normalized);
  res.json({ ok: true });
});



app.post("/api/admin/geocode-all", async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ ok: false, message: "Нет доступа" });
  }

  try {
    const houses = await getHousesWithCoordinates({ geocode: true });
    res.json({
      ok: true,
      total: houses.length,
      geocoded: houses.filter((h) => h.lat && h.lon).length
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Не удалось получить координаты" });
  }
});

app.get("/api/geocode-debug", async (req, res) => {
  const houses = normalizeHouses();
  const withCoords = await getHousesWithCoordinates();
  res.json({
    hasYandexMapsApiKey: !!YANDEX_MAPS_API_KEY,
    hasYandexGeocoderApiKey: !!YANDEX_GEOCODER_API_KEY,
    excelRows: houses.length,
    geocodedRows: withCoords.filter((h) => h.lat && h.lon).length,
    sample: withCoords.slice(0, 5)
  });
});



app.get("/api/tariff-positions", (req, res) => {
  try {
    if (!fs.existsSync(TARIFF_POSITIONS_FILE)) {
      return res.json(DEFAULT_TARIFF_POSITIONS);
    }

    res.json(JSON.parse(fs.readFileSync(TARIFF_POSITIONS_FILE, "utf8")));
  } catch (_) {
    res.json(DEFAULT_TARIFF_POSITIONS);
  }
});

app.post("/api/admin/save-tariff-positions", (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(403).json({ error: "Нет доступа" });
  }

  try {
    fs.writeFileSync(TARIFF_POSITIONS_FILE, JSON.stringify(req.body || {}, null, 2), "utf8");
    res.json({ ok: true });
  } catch (_) {
    res.status(500).json({ error: "save failed" });
  }
});



app.get("/api/design-settings", (req, res) => {
  try {
    if (!fs.existsSync(DESIGN_SETTINGS_FILE)) {
      return res.json(DEFAULT_DESIGN_SETTINGS);
    }

    res.json(JSON.parse(fs.readFileSync(DESIGN_SETTINGS_FILE, "utf8")));
  } catch (_) {
    res.json(DEFAULT_DESIGN_SETTINGS);
  }
});

app.post("/api/admin/save-design-settings", (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(403).json({ error: "Нет доступа" });
  }

  try {
    fs.writeFileSync(DESIGN_SETTINGS_FILE, JSON.stringify(req.body || {}, null, 2), "utf8");
    res.json({ ok: true });
  } catch (_) {
    res.status(500).json({ error: "save failed" });
  }
});



app.post("/admin-login", (req, res) => {
  const password = req.body ? req.body.password : "";

  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
  }

  res.redirect("/");
});

app.post("/admin-logout", (req, res) => {
  if (req.session) {
    req.session.isAdmin = false;
  }

  res.redirect("/");
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});