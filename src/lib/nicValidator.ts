/**
 * Sri Lankan National Identity Card (NIC) Validation & Parser
 * Supports:
 * - Old Format: 9 digits followed by 'V' or 'X' (e.g., 852341829V)
 * - New Format: 12 digits (introduced in 2016, e.g., 198523401829)
 */

export interface NicValidationResult {
  isValid: boolean;
  format: 'OLD_9V' | 'NEW_12' | 'INVALID';
  formattedNumber: string;
  birthYear?: number;
  gender?: 'MALE' | 'FEMALE';
  dayOfYear?: number;
  approxDob?: string;
  errorMessage?: string;
  /**
   * Language-independent key for `errorMessage`. Consumers should translate
   * this via the matching `nicv_*` entry in the i18n dictionary rather than
   * rendering `errorMessage`, which is English-only.
   */
  errorCode?: 'nicv_required' | 'nicv_bad_day_9' | 'nicv_bad_year_12' | 'nicv_bad_day_12' | 'nicv_format';
}

export function validateAndParseSriLankanNic(rawNic: string): NicValidationResult {
  if (!rawNic) {
    return { isValid: false, format: 'INVALID', formattedNumber: '', errorMessage: 'NIC number is required.', errorCode: 'nicv_required' };
  }

  const clean = rawNic.trim().toUpperCase().replace(/\s+/g, '');

  // 1. Old Format Check: 9 digits followed by V or X
  const oldRegex = /^([0-9]{9})([VX])$/;
  const oldMatch = clean.match(oldRegex);

  if (oldMatch) {
    const digits = oldMatch[1];
    const yearDigits = parseInt(digits.substring(0, 2), 10);
    const birthYear = 1900 + yearDigits;
    const days = parseInt(digits.substring(2, 5), 10);

    let gender: 'MALE' | 'FEMALE' = 'MALE';
    let dayOfYear = days;

    if (days > 500) {
      gender = 'FEMALE';
      dayOfYear = days - 500;
    }

    if (dayOfYear < 1 || dayOfYear > 366) {
      return {
        isValid: false,
        format: 'OLD_9V',
        formattedNumber: clean,
        errorMessage: 'Invalid birth day sequence in 9-digit NIC.',
        errorCode: 'nicv_bad_day_9',
      };
    }

    // Estimate DOB
    const approxDate = new Date(Date.UTC(birthYear, 0, dayOfYear));
    const approxDob = approxDate.toISOString().split('T')[0];

    return {
      isValid: true,
      format: 'OLD_9V',
      formattedNumber: clean,
      birthYear,
      gender,
      dayOfYear,
      approxDob,
    };
  }

  // 2. New Format Check: 12 digits
  const newRegex = /^([0-9]{4})([0-9]{3})([0-9]{5})$/;
  const newMatch = clean.match(newRegex);

  if (newMatch) {
    const birthYear = parseInt(newMatch[1], 10);
    const days = parseInt(newMatch[2], 10);

    if (birthYear < 1900 || birthYear > 2026) {
      return {
        isValid: false,
        format: 'NEW_12',
        formattedNumber: clean,
        errorMessage: 'Invalid birth year in 12-digit NIC.',
        errorCode: 'nicv_bad_year_12',
      };
    }

    let gender: 'MALE' | 'FEMALE' = 'MALE';
    let dayOfYear = days;

    if (days > 500) {
      gender = 'FEMALE';
      dayOfYear = days - 500;
    }

    if (dayOfYear < 1 || dayOfYear > 366) {
      return {
        isValid: false,
        format: 'NEW_12',
        formattedNumber: clean,
        errorMessage: 'Invalid birth day sequence in 12-digit NIC.',
        errorCode: 'nicv_bad_day_12',
      };
    }

    const approxDate = new Date(Date.UTC(birthYear, 0, dayOfYear));
    const approxDob = approxDate.toISOString().split('T')[0];

    return {
      isValid: true,
      format: 'NEW_12',
      formattedNumber: clean,
      birthYear,
      gender,
      dayOfYear,
      approxDob,
    };
  }

  return {
    isValid: false,
    format: 'INVALID',
    formattedNumber: clean,
    errorMessage: 'NIC must be either 9 digits followed by V/X (e.g. 852341829V) or 12 digits (e.g. 198523401829).',
    errorCode: 'nicv_format',
  };
}

/**
 * Generates sample Sri Lanka NIC front/back SVG data URLs for instant demonstration
 */
export function getSampleSriLankaNicCard(type: 'FRONT' | 'BACK', name: string, nic: string): string {
  if (type === 'FRONT') {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
        <defs>
          <linearGradient id="frontBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fdfbf7"/>
            <stop offset="50%" stop-color="#edf2f7"/>
            <stop offset="100%" stop-color="#e2e8f0"/>
          </linearGradient>
          <pattern id="guilloche" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="10" fill="none" stroke="#cbd5e1" stroke-width="0.5" stroke-opacity="0.6"/>
          </pattern>
        </defs>
        <rect width="600" height="380" rx="18" fill="url(#frontBg)" stroke="#94a3b8" stroke-width="2"/>
        <rect width="600" height="380" rx="18" fill="url(#guilloche)"/>
        
        <!-- Header Banner -->
        <rect x="0" y="0" width="600" height="60" rx="18" fill="#0f172a" fill-opacity="0.9"/>
        <text x="30" y="26" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#f8fafc" letter-spacing="1">DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA</text>
        <text x="30" y="44" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#38bdf8">NATIONAL IDENTITY CARD (ජාතික හැඳුනුම්පත / தேசிய அடையாள அட்டை)</text>
        <text x="540" y="38" font-family="system-ui, sans-serif" font-size="20" fill="#f59e0b" text-anchor="end">🇱🇰</text>

        <!-- Photo Frame -->
        <rect x="35" y="85" width="130" height="160" rx="10" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>
        <circle cx="100" cy="140" r="30" fill="#64748b"/>
        <path d="M 60 215 C 60 180, 140 180, 140 215 Z" fill="#64748b"/>
        <rect x="40" y="250" width="120" height="24" rx="4" fill="#0f172a" fill-opacity="0.05"/>
        <text x="100" y="266" font-family="monospace" font-size="11" text-anchor="middle" fill="#334155" font-weight="bold">OFFICIAL PHOTO</text>

        <!-- Card Details -->
        <text x="190" y="105" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#64748b" text-transform="uppercase">Identity Number / හැඳුනුම්පත් අංකය</text>
        <text x="190" y="130" font-family="monospace" font-size="22" font-weight="bold" fill="#0f172a" letter-spacing="2">${nic}</text>

        <text x="190" y="165" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#64748b" text-transform="uppercase">Full Name / සම්පූර්ණ නම</text>
        <text x="190" y="188" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">${name}</text>

        <text x="190" y="222" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#64748b" text-transform="uppercase">Country of Birth / උපන් රට</text>
        <text x="190" y="242" font-family="system-ui, sans-serif" font-size="13" font-weight="semibold" fill="#1e293b">Sri Lanka (ශ්‍රී ලංකා)</text>

        <text x="360" y="222" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#64748b" text-transform="uppercase">Card Status</text>
        <rect x="360" y="228" width="90" height="20" rx="6" fill="#dcfce7" stroke="#86efac"/>
        <text x="405" y="242" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#15803d" text-anchor="middle">ACTIVE CHIP</text>

        <!-- Bottom Security Strip & Specimen Watermark -->
        <rect x="25" y="295" width="550" height="60" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/>
        <text x="40" y="325" font-family="monospace" font-size="13" fill="#334155" letter-spacing="4">IDLKA${nic.replace(/[^0-9A-Z]/g, '')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
        <text x="40" y="345" font-family="monospace" font-size="13" fill="#334155" letter-spacing="4">${name.toUpperCase().replace(/\s+/g, '&lt;')}&lt;&lt;&lt;&lt;&lt;&lt;</text>
        
        <!-- Watermark -->
        <text x="470" y="190" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#94a3b8" fill-opacity="0.25" transform="rotate(-20 470 190)">FRONT SIDE</text>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } else {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
        <defs>
          <linearGradient id="backBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f8fafc"/>
            <stop offset="50%" stop-color="#f1f5f9"/>
            <stop offset="100%" stop-color="#e2e8f0"/>
          </linearGradient>
        </defs>
        <rect width="600" height="380" rx="18" fill="url(#backBg)" stroke="#94a3b8" stroke-width="2"/>

        <!-- Magnetic / Optical Band -->
        <rect x="0" y="35" width="600" height="45" fill="#1e293b"/>

        <!-- Back Details -->
        <text x="35" y="115" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#64748b" text-transform="uppercase">Permanent Address / ස්ථිර ලිපිනය</text>
        <text x="35" y="136" font-family="system-ui, sans-serif" font-size="13" font-weight="semibold" fill="#0f172a">No. 42/B, Temple Road, Narammala, Kurunegala</text>
        <text x="35" y="154" font-family="system-ui, sans-serif" font-size="12" fill="#475569">North Western Province (වයඹ පළාත), Sri Lanka</text>

        <text x="35" y="195" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#64748b" text-transform="uppercase">Place of Issue / නිකුත් කළ ස්ථානය</text>
        <text x="35" y="215" font-family="system-ui, sans-serif" font-size="12" font-weight="semibold" fill="#0f172a">Department of Registration of Persons, Battaramulla</text>

        <text x="35" y="250" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#64748b" text-transform="uppercase">Date of Issue / නිකුත් කළ දිනය</text>
        <text x="35" y="270" font-family="monospace" font-size="13" font-weight="bold" fill="#0f172a">2018-05-14</text>

        <!-- Barcode / QR Simulation -->
        <rect x="420" y="105" width="145" height="145" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
        <!-- Simplified QR grid -->
        <rect x="435" y="120" width="30" height="30" fill="#0f172a"/>
        <rect x="440" y="125" width="20" height="20" fill="#ffffff"/>
        <rect x="445" y="130" width="10" height="10" fill="#0f172a"/>

        <rect x="520" y="120" width="30" height="30" fill="#0f172a"/>
        <rect x="525" y="125" width="20" height="20" fill="#ffffff"/>
        <rect x="530" y="130" width="10" height="10" fill="#0f172a"/>

        <rect x="435" y="200" width="30" height="30" fill="#0f172a"/>
        <rect x="440" y="205" width="20" height="20" fill="#ffffff"/>
        <rect x="445" y="210" width="10" height="10" fill="#0f172a"/>

        <!-- Dots -->
        <rect x="475" y="125" width="35" height="8" fill="#0f172a"/>
        <rect x="480" y="145" width="15" height="20" fill="#0f172a"/>
        <rect x="475" y="180" width="40" height="12" fill="#0f172a"/>
        <rect x="480" y="210" width="55" height="15" fill="#0f172a"/>

        <text x="492" y="265" font-family="monospace" font-size="9" text-anchor="middle" fill="#64748b">CRYPTOGRAPHIC ID</text>

        <!-- Officer Signature -->
        <text x="35" y="315" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#64748b" text-transform="uppercase">Commissioner General Signature</text>
        <path d="M 35 345 Q 80 325 120 345 T 180 340 T 220 350" fill="none" stroke="#0284c7" stroke-width="2"/>

        <!-- Watermark -->
        <text x="280" y="220" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#94a3b8" fill-opacity="0.25" transform="rotate(-20 280 220)">BACK SIDE</text>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}
