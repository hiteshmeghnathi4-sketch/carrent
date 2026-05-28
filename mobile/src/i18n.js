const CITY_MAP = {
  delhi: "દિલ્હી",
  mumbai: "મુંબઈ",
  bengaluru: "બેંગલુરુ",
  hyderabad: "હૈદરાબાદ",
  pune: "પુણે",
  chennai: "ચેન્નાઈ",
  rajkot: "રાજકોટ",
  upleta: "ઉપલેટા",
  uoleta: "ઉઓલેટા",
};

const CATEGORY_MAP = {
  suv: "એસયુવી",
  sedan: "સેડાન",
  hatchback: "હેચબેક",
  ev: "ઇવી",
};

const TRANSMISSION_MAP = {
  automatic: "ઓટોમેટિક",
  manual: "મેન્યુઅલ",
  manually: "મેન્યુઅલ",
  manuall: "મેન્યુઅલ",
};

const FUEL_MAP = {
  petrol: "પેટ્રોલ",
  diesel: "ડીઝલ",
  electric: "ઇલેક્ટ્રિક",
  cng: "સીએનજી",
};

const STATUS_MAP = {
  pending: "બાકી",
  accepted: "મંજૂર",
  rejected: "નકારેલ",
  active: "સક્રિય",
  inactive: "નિષ્ક્રિય",
  available: "ઉપલબ્ધ",
  unavailable: "ઉપલબ્ધ નથી",
  all: "બધા",
};

const ROLE_MAP = {
  user: "વપરાશકર્તા",
  admin: "એડમિન",
};

const DESCRIPTION_MAP = {
  "A premium SUV tuned for long highway drives, weekend escapes, and confident city cruising.":
    "લાંબા હાઇવે પ્રવાસ, વિકએન્ડ ટ્રિપ અને આરામદાયક સિટી ડ્રાઇવ માટે તૈયાર પ્રીમિયમ એસયુવી.",
  "Comfort-first sedan with refined cabin space, ideal for urban business trips and family travel.":
    "વિસ્તૃત અને આરામદાયક કેબિનવાળી સેડાન, શહેરના બિઝનેસ ટ્રિપ અને પરિવાર સાથેના પ્રવાસ માટે ઉત્તમ.",
  "Adventure-led icon with bold styling and open-road personality for quick getaways.":
    "ઝડપી ગેટવે અને સાહસિક મુસાફરી માટે bold સ્ટાઇલિંગવાળી આઇકોનિક કાર.",
  "Spacious 7-seater loaded with comfort and safety for larger groups and airport runs.":
    "મોટા જૂથો અને એરપોર્ટ મુસાફરી માટે આરામ તથા સલામતીથી ભરપૂર વિશાળ 7-સીટર.",
  "Sporty compact hatchback that makes city traffic feel far lighter and more fun.":
    "સ્પોર્ટી કોમ્પેક્ટ હેચબેક જે શહેરના ટ્રાફિકને વધુ હળવો અને મજેદાર બનાવે છે.",
  "Futuristic electric crossover with instant torque, a lounge-like cabin, and standout design.":
    "તાત્કાલિક પાવર, આરામદાયક કેબિન અને આકર્ષક ડિઝાઇનવાળો ભવિષ્યવાદી ઇલેક્ટ્રિક ક્રોસઓવર.",
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function translateFrom(map, value) {
  return map[normalize(value)] || value;
}

export function translateCity(value) {
  return translateFrom(CITY_MAP, value);
}

export function translateCategory(value) {
  return translateFrom(CATEGORY_MAP, value);
}

export function translateTransmission(value) {
  return translateFrom(TRANSMISSION_MAP, value);
}

export function translateFuel(value) {
  return translateFrom(FUEL_MAP, value);
}

export function translateStatus(value) {
  return translateFrom(STATUS_MAP, value);
}

export function translateRole(value) {
  return translateFrom(ROLE_MAP, value);
}

export function translateDescription(value) {
  return DESCRIPTION_MAP[String(value || "").trim()] || value;
}

export function formatSeats(seats) {
  return `${seats} બેઠકો`;
}

export function formatDays(days) {
  return `${days} દિવસ`;
}

export function localizeLabel(value) {
  const key = normalize(value);

  return (
    STATUS_MAP[key] ||
    ROLE_MAP[key] ||
    CITY_MAP[key] ||
    CATEGORY_MAP[key] ||
    TRANSMISSION_MAP[key] ||
    FUEL_MAP[key] ||
    value
  );
}
