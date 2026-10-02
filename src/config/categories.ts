import type { Capability, CategoryId, CategoryRoleId, Membership } from '../types/category';
import type { Role, User } from '../types';
import type { Language, TranslationDict } from '../lib/i18n';
import { CONSTRUCTION_VOCAB } from './vocab.construction';

/**
 * Category registry: the single source of truth for everything that differs between
 * categories (roles, task types, skills, rating tags, site fields, wording).
 * Components read from here instead of hardcoding coconut values.
 *
 * To add a category: add an entry to CATEGORIES, then document it in
 * .claude/docs/categories.md. No engine or dashboard changes should be needed.
 */

export type L10n = Record<Language, string>;

/** Per-category replacements for entries of the base i18n dictionary. */
export type Vocab = Partial<Record<keyof TranslationDict, L10n>>;

export type LegacyRole = Exclude<Role, 'admin'>;

export interface RoleCard {
  title: L10n;
  desc: L10n;
  bullets: [L10n, L10n, L10n];
  action: L10n;
}

export interface CategoryRole {
  id: CategoryRoleId;
  label: L10n;
  capability: Capability;
  canRegisterWorkers: boolean;
  /** The role name the current store/types use until the data layer migrates (S1-07). */
  legacyRole: LegacyRole;
  card: RoleCard;
}

export interface FieldOption {
  value: string;
  label: L10n;
}

export interface SiteField {
  key: string;
  /** 'top' = a first-class property of Estate (area_acres, tree_count); 'attributes' = Estate.attributes[key]. */
  target: 'top' | 'attributes';
  label: L10n;
  type: 'number' | 'select';
  unit?: L10n;
  /** Unit text when the value is exactly 1 ("1 floor", not "1 floors"). */
  unitOne?: L10n;
  options?: FieldOption[];
  required?: boolean;
  /** Input hints for number fields, and the value the form starts with. */
  min?: number;
  step?: number;
  defaultValue?: string;
  /** Set on fields that get a "total across all sites" tile on the sites tab. */
  totalLabel?: L10n;
}

/** A quick-pick location for the site form. */
export interface LocationPreset {
  label: L10n;
  location: string;
  lat: number;
  lng: number;
}

/** A derived figure shown on a site card, e.g. palms per acre. Return null to hide it. */
export interface SiteMetric {
  label: L10n;
  value: (site: SiteValues, lang: Language) => string | null;
}

export type PricingUnit = 'per_palm' | 'per_day' | 'lump_sum';

export interface CategoryConfig {
  id: CategoryId;
  label: L10n;
  tagline: L10n;
  description: L10n;
  icon: 'trees' | 'building';
  accent: 'emerald' | 'sky';
  /** "Estate" / "Site" */
  siteLabel: L10n;
  sitesLabel: L10n;
  roles: CategoryRole[];
  /** English keys; display text comes from the lookup tables in i18n.ts (tTaskType, tSkill, tReviewTag). */
  taskTypes: string[];
  skills: string[];
  ratingTags: string[];
  defaults: { taskType: string; skills: string[]; ratingTags: string[]; wageBudget: string };
  siteFields: SiteField[];
  siteMetrics?: SiteMetric[];
  locationPresets: LocationPreset[];
  map: { center: { lat: number; lng: number }; zoom: number };
  pricingUnit: PricingUnit;
  /** What the first landing-page stat counts: palms (coconut) or registered sites. */
  landingStat: 'tree_count' | 'site_count';
  vocab?: Vocab;
}

const COCONUT: CategoryConfig = {
  id: 'coconut',
  label: { en: 'Coconut', si: 'පොල්', ta: 'தேங்காய்' },
  tagline: {
    en: 'Hire verified harvesting crews for your coconut estate.',
    si: 'ඔබේ පොල් වතුව සඳහා සත්‍යාපිත අස්වනු නෙළන කණ්ඩායම් බඳවා ගන්න.',
    ta: 'உங்கள் தென்னந்தோட்டத்திற்கு சரிபார்க்கப்பட்ட அறுவடைக் குழுக்களை அமர்த்துங்கள்.',
  },
  description: {
    en: 'Climbers, pluckers and huskers for estates across the Coconut Triangle, with every payment held safely in escrow until the work is done.',
    si: 'පොල් ත්‍රිකෝණය පුරා වතු සඳහා ගස් නගින්නන්, පොල් කඩන්නන් සහ ලෙලි ගසන්නන්. වැඩ අවසන් වන තුරු සෑම ගෙවීමක්ම එස්ක්‍රෝ ගිණුමක ආරක්ෂිතව තැන්පත් වේ.',
    ta: 'தென்னை முக்கோணம் முழுவதும் உள்ள தோட்டங்களுக்கு மரம் ஏறுவோர், தேங்காய் பறிப்போர் மற்றும் உரிப்போர். வேலை முடியும் வரை ஒவ்வொரு கட்டணமும் எஸ்க்ரோவில் பாதுகாப்பாக இருக்கும்.',
  },
  icon: 'trees',
  accent: 'emerald',
  siteLabel: { en: 'Estate', si: 'වත්ත', ta: 'தோட்டம்' },
  sitesLabel: { en: 'Estates', si: 'වතු', ta: 'தோட்டங்கள்' },
  roles: [
    {
      id: 'owner',
      label: { en: 'Landowner', si: 'ඉඩම් හිමිකරු', ta: 'நில உரிமையாளர்' },
      capability: 'poster',
      canRegisterWorkers: false,
      legacyRole: 'owner',
      card: {
        title: { en: 'For Coconut Estate Owners', si: 'පොල් ඉඩම් හිමිකරුවන් සඳහා', ta: 'தென்னை தோட்ட உரிமையாளர்களுக்கு' },
        desc: { en: 'Register estates across Kurunegala & Puttalam, specify palm counts and plucking cycles, receive competitive bids from verified crews, and fund protected escrow.', si: 'කුරුණෑගල, පුත්තලම ඇතුළු ප්‍රදේශ වල ඉඩම් ලියාපදිංචි කර, ගස් ගණන දක්වා, ශ්‍රමික කණ්ඩායම් වලින් තරඟකාරී මිල ගණන් ලබාගෙන ආරක්ෂිත එස්ක්‍රෝ ක්‍රමයට වැඩ පවරන්න.', ta: 'உங்கள் நிலங்களை பதிவு செய்து, மரங்களின் எண்ணிக்கையை குறிப்பிட்டு, குழுக்களிடமிருந்து நியாயமான ஏலங்களை பெற்று எஸ்க்ரோ மூலம் பாதுகாப்பாக வேலை ஒதுக்குங்கள்.' },
        bullets: [
          { en: 'Google Maps boundary registration', si: 'Google Maps මගින් ඉඩම් මායිම් ලියාපදිංචිය', ta: 'Google Maps மூலம் எல்லை பதிவு' },
          { en: 'Deposit escrow to unlock crew contacts', si: 'කණ්ඩායමේ දුරකථන අංක විවෘත කිරීමට එස්ක්‍රෝ තැන්පත් කිරීම', ta: 'குழுவின் தொடர்பு எண்களை திறக்க எஸ்க்ரோ செலுத்துதல்' },
          { en: 'Dual 4-digit PIN completion release', si: 'ද්විත්ව ඉලක්කම් 4 PIN මගින් නිමාව තහවුරු කිරීම', ta: 'இருவழி 4 இலக்க PIN மூலம் வேலை முடிவு உறுதி' },
        ],
        action: { en: 'Enter as Estate Owner →', si: 'වතු හිමිකරු ලෙස පිවිසෙන්න →', ta: 'உரிமையாளராக உள்நுழைக →' },
      },
    },
    {
      id: 'broker',
      label: { en: 'Labour Broker', si: 'ශ්‍රම තැරැව්කරු', ta: 'தொழிலாளர் தரகர்' },
      capability: 'bidder',
      canRegisterWorkers: true,
      legacyRole: 'supervisor',
      card: {
        title: { en: 'For Supervisors & Brokers', si: 'අධීක්ෂකයින් සහ තැරැව්කරුවන් සඳහා', ta: 'மேற்பார்வையாளர்கள் மற்றும் தரகர்களுக்கு' },
        desc: { en: 'Manage climber and harvester rosters, bid on high-value estate jobs, mark daily field attendance, and collect guaranteed commission with no wage withholding.', si: 'ගස් නගින්නන් සහ කම්කරුවන් සංවිධානය කර, විශාල රැකියා සඳහා ලංසු ඉදිරිපත් කර, දෛනික පැමිණීම සටහන් කර සහතික කල කොමිස් මුදල් ලබාගන්න.', ta: 'மரம் ஏறுபவர்கள் மற்றும் தொழிலாளர் பட்டியலை நிர்வகித்து, ஏலங்களை வென்று, தினசரி வருகையை பதிவு செய்து உத்தரவாதமான கமிஷனைப் பெறுங்கள்.' },
        bullets: [
          { en: 'Manage climber crew roster', si: 'ගස් නගින්නන්ගේ කණ්ඩායම කළමනාකරණය', ta: 'மரம் ஏறுபவர்கள் குழுவை நிர்வகித்தல்' },
          { en: 'Bid on coconut plucking contracts', si: 'පොල් කැඩීමේ කොන්ත්‍රාත් සඳහා ලංසු ඉදිරිපත් කිරීම', ta: 'தேங்காய் பறிக்கும் ஒப்பந்தங்களுக்கு ஏலம் கோருதல்' },
          { en: 'Offline field attendance & wage tracking', si: 'නොබැඳි පැමිණීම සහ වැටුප් නිරීක්ෂණය', ta: 'இணையமில்லா வருகை மற்றும் கூலி கண்காணிப்பு' },
        ],
        action: { en: 'Enter as Supervisor →', si: 'අධීක්ෂක ලෙස පිවිසෙන්න →', ta: 'மேற்பார்வையாளராக உள்நுழைக →' },
      },
    },
    {
      id: 'worker',
      label: { en: 'Worker', si: 'ශ්‍රමිකයා', ta: 'தொழிலாளி' },
      capability: 'crew',
      canRegisterWorkers: false,
      legacyRole: 'worker',
      card: {
        title: { en: 'For Harvesters & Workers', si: 'ගස් නගින්නන් සහ කම්කරුවන් සඳහා', ta: 'மரம் ஏறுபவர்கள் மற்றும் தொழிலாளர்களுக்கு' },
        desc: { en: 'Get fair plucking rates per palm, track your verified attendance, build a transparent Sri Lankan trust score, and receive direct on-time payouts.', si: 'ගසකට සාධාරණ මිලක්, සහතික කළ වැටුප්, විශ්වසනීයත්ව ලකුණු සහ වැඩ නිමවූ වහාම නියමිත වේලාවට මුදල් ලබාගැනීමේ විශ්වාසය.', ta: 'ஒரு மரத்திற்கு நியாயமான கூலி, சரிபார்க்கப்பட்ட வருகை, வெளிப்படையான நம்பிக்கை மதிப்பெண் மற்றும் சரியான நேரத்தில் பணத்தைப் பெறுங்கள்.' },
        bullets: [
          { en: 'Fair per-palm plucking wages', si: 'ගසකට සාධාරණ පොල් කැඩීමේ වැටුප', ta: 'ஒரு மரத்திற்கு நியாயமான கூலி' },
          { en: 'Verified attendance & wage ledger', si: 'සත්‍යාපිත පැමිණීම සහ වැටුප් වාර්තා', ta: 'சரிபார்க்கப்பட்ட வருகை மற்றும் கூலி பதிவேடு' },
          { en: 'Build national climber trust rating', si: 'ජාතික මට්ටමේ විශ්වාස ලකුණු ගොඩනැගීම', ta: 'தேசிய அளவிலான நம்பகத்தன்மை மதிப்பெண்' },
        ],
        action: { en: 'Enter as Field Worker →', si: 'ශ්‍රමිකයෙකු ලෙස පිවිසෙන්න →', ta: 'தொழிலாளியாக உள்நுழைக →' },
      },
    },
  ],
  taskTypes: [
    'Coconut Harvesting & Bunch Lowering',
    'Fertilizer Ring Application & Mulching',
    'Dry Frond Trimming & Crown Cleaning',
    'Nut Husking & Copra Drying Batch',
    'Undergrowth Tractor Clearing',
  ],
  skills: [
    'Tree Climbing',
    'Coconut Plucking',
    'Nut Gathering',
    'Nut Husking',
    'Fertilizer Trenching',
    'Organic Mulching',
    'Crown Cleaning',
    'Copra Bagging',
  ],
  ratingTags: ['Punctual Crew', 'Zero Nut Damage', 'Safe Tree Climbing', 'Clean Estate', 'Fast Harvest'],
  defaults: {
    taskType: 'Coconut Harvesting & Bunch Lowering',
    skills: ['Tree Climbing', 'Coconut Plucking'],
    ratingTags: ['Punctual Crew', 'Safe Tree Climbing', 'Clean Estate'],
    wageBudget: '42000',
  },
  siteFields: [
    {
      key: 'area_acres',
      target: 'top',
      label: { en: 'Area (Acres)', si: 'බිම් ප්‍රමාණය (අක්කර)', ta: 'நிலப்பரப்பு (ஏக்கர்)' },
      type: 'number',
      unit: { en: 'acres', si: 'අක්කර', ta: 'ஏக்கர்' },
      required: true,
      min: 0.5,
      step: 0.1,
      defaultValue: '10.0',
      totalLabel: { en: 'Total Area (Acres)', si: 'මුළු ප්‍රමාණය (අක්කර)', ta: 'மொத்த பரப்பளவு (ஏக்கர்)' },
    },
    {
      key: 'tree_count',
      target: 'top',
      label: { en: 'Tree Count (Palms)', si: 'ගස් ගණන (පොල් ගස්)', ta: 'மரங்களின் எண்ணிக்கை (தென்னை)' },
      type: 'number',
      unit: { en: 'palms', si: 'ගස්', ta: 'மரங்கள்' },
      required: true,
      min: 10,
      defaultValue: '650',
      totalLabel: { en: 'Total Coconut Palms (Trees)', si: 'මුළු පොල් ගස් ගණන', ta: 'மொத்த தென்னை மரங்கள்' },
    },
  ],
  siteMetrics: [
    {
      label: { en: 'Density', si: 'ඝනත්වය', ta: 'அடர்த்தி' },
      value: (site, lang) =>
        site.area_acres && site.tree_count
          ? `${Math.round(site.tree_count / site.area_acres)} ${l10n({ en: '/ ac', si: '/ අක්කරයට', ta: '/ ஏக்கருக்கு' }, lang)}`
          : null,
    },
  ],
  locationPresets: [
    { label: { en: 'Narammala', si: 'නාරම්මල', ta: 'நரம்மல' }, location: 'Narammala, Kurunegala', lat: 7.4344, lng: 80.2181 },
    { label: { en: 'Madampe', si: 'මාදම්පේ', ta: 'மாதம்பே' }, location: 'Madampe, Chilaw', lat: 7.4988, lng: 79.8458 },
    { label: { en: 'Kuliyapitiya', si: 'කුලියාපිටිය', ta: 'குளியாப்பிட்டிய' }, location: 'Kuliyapitiya, Wayamba', lat: 7.4689, lng: 80.0436 },
  ],
  map: { center: { lat: 7.45, lng: 80.05 }, zoom: 10 },
  pricingUnit: 'per_palm',
  landingStat: 'tree_count',
};

const CONSTRUCTION: CategoryConfig = {
  id: 'construction',
  label: { en: 'Construction', si: 'ඉදිකිරීම්', ta: 'கட்டுமானம்' },
  tagline: {
    en: 'Hire verified tradespeople for your building site.',
    si: 'ඔබේ ඉදිකිරීම් ස්ථානය සඳහා සත්‍යාපිත ශිල්පීන් බඳවා ගන්න.',
    ta: 'உங்கள் கட்டுமான இடத்திற்கு சரிபார்க்கப்பட்ட தொழிலாளர்களை அமர்த்துங்கள்.',
  },
  description: {
    en: 'Masons, carpenters, electricians and more from verified contractors and subcontractors, with every payment held safely in escrow until the work is signed off.',
    si: 'සත්‍යාපිත කොන්ත්‍රාත්කරුවන් සහ උප කොන්ත්‍රාත්කරුවන්ගෙන් පෙදරේරුවන්, වඩුවන්, විදුලි කාර්මිකයන් සහ තවත් අය. වැඩ අනුමත කරන තුරු සෑම ගෙවීමක්ම එස්ක්‍රෝ ගිණුමක ආරක්ෂිතව තැන්පත් වේ.',
    ta: 'சரிபார்க்கப்பட்ட ஒப்பந்ததாரர்கள் மற்றும் துணை ஒப்பந்ததாரர்களிடமிருந்து கொத்தனார், தச்சர், மின்சார பணியாளர் மற்றும் பலர். வேலை ஒப்புக்கொள்ளப்படும் வரை ஒவ்வொரு கட்டணமும் எஸ்க்ரோவில் பாதுகாப்பாக இருக்கும்.',
  },
  icon: 'building',
  accent: 'sky',
  siteLabel: { en: 'Site', si: 'ස්ථානය', ta: 'இடம்' },
  sitesLabel: { en: 'Sites', si: 'ස්ථාන', ta: 'இடங்கள்' },
  roles: [
    {
      id: 'client',
      label: { en: 'Client', si: 'ගනුදෙනුකරු', ta: 'வாடிக்கையாளர்' },
      capability: 'poster',
      canRegisterWorkers: false,
      legacyRole: 'owner',
      card: {
        title: { en: 'For Property & Site Owners', si: 'දේපළ සහ ස්ථාන හිමිකරුවන් සඳහා', ta: 'சொத்து மற்றும் இட உரிமையாளர்களுக்கு' },
        desc: {
          en: 'Register your building site, post jobs for masons, carpenters and helpers, compare bids from verified contractors, and fund a protected escrow.',
          si: 'ඔබේ ඉදිකිරීම් ස්ථානය ලියාපදිංචි කර, පෙදරේරුවන්, වඩුවන් සහ සහායකයන් සඳහා රැකියා පළ කර, සත්‍යාපිත කොන්ත්‍රාත්කරුවන්ගේ ලංසු සසඳා, ආරක්ෂිත එස්ක්‍රෝ ගිණුමට මුදල් තබන්න.',
          ta: 'உங்கள் கட்டுமான இடத்தைப் பதிவு செய்து, கொத்தனார், தச்சர் மற்றும் உதவியாளர்களுக்கு வேலைகளை இடுகையிட்டு, சரிபார்க்கப்பட்ட ஒப்பந்ததாரர்களின் ஏலங்களை ஒப்பிட்டு, பாதுகாப்பான எஸ்க்ரோவில் பணம் செலுத்துங்கள்.',
        },
        bullets: [
          { en: 'Pin your site on Google Maps', si: 'ඔබේ ස්ථානය Google Maps හි සලකුණු කරන්න', ta: 'உங்கள் இடத்தை Google Maps இல் குறிக்கவும்' },
          { en: 'Deposit escrow to unlock crew contacts', si: 'කණ්ඩායමේ දුරකථන අංක විවෘත කිරීමට එස්ක්‍රෝ තැන්පත් කරන්න', ta: 'குழுவின் தொடர்பு எண்களைத் திறக்க எஸ்க்ரோவில் செலுத்துங்கள்' },
          { en: 'Dual PIN sign-off before payment is released', si: 'මුදල් නිදහස් කිරීමට පෙර ද්විත්ව PIN අනුමැතිය', ta: 'பணம் விடுவிக்கும் முன் இருவழி PIN ஒப்புதல்' },
        ],
        action: { en: 'Enter as Client →', si: 'ගනුදෙනුකරු ලෙස පිවිසෙන්න →', ta: 'வாடிக்கையாளராக உள்நுழைக →' },
      },
    },
    {
      id: 'contractor',
      label: { en: 'Contractor', si: 'කොන්ත්‍රාත්කරු', ta: 'ஒப்பந்ததாரர்' },
      capability: 'bidder',
      canRegisterWorkers: true,
      legacyRole: 'supervisor',
      card: {
        title: { en: 'For Contractors', si: 'කොන්ත්‍රාත්කරුවන් සඳහා', ta: 'ஒப்பந்ததாரர்களுக்கு' },
        desc: {
          en: 'Register your tradespeople, bid on site jobs, record daily attendance, and get paid from escrow once the client signs off.',
          si: 'ඔබේ ශිල්පීන් ලියාපදිංචි කර, ඉදිකිරීම් රැකියා සඳහා ලංසු තබා, දෛනික පැමිණීම සටහන් කර, ගනුදෙනුකරු අනුමත කළ පසු එස්ක්‍රෝ ගිණුමෙන් ගෙවීම් ලබා ගන්න.',
          ta: 'உங்கள் தொழிலாளர்களைப் பதிவு செய்து, கட்டுமான வேலைகளுக்கு ஏலமிட்டு, தினசரி வருகையைப் பதிவு செய்து, வாடிக்கையாளர் ஒப்புக்கொண்டதும் எஸ்க்ரோவிலிருந்து கட்டணம் பெறுங்கள்.',
        },
        bullets: [
          { en: 'Manage your trades crew', si: 'ඔබේ ශිල්පී කණ්ඩායම කළමනාකරණය කරන්න', ta: 'உங்கள் தொழிலாளர் குழுவை நிர்வகிக்கவும்' },
          { en: 'Bid on construction jobs', si: 'ඉදිකිරීම් රැකියා සඳහා ලංසු තබන්න', ta: 'கட்டுமான வேலைகளுக்கு ஏலமிடுங்கள்' },
          { en: 'Offline attendance & wage tracking', si: 'නොබැඳි පැමිණීම සහ වැටුප් නිරීක්ෂණය', ta: 'இணையமில்லா வருகை மற்றும் கூலி கண்காணிப்பு' },
        ],
        action: { en: 'Enter as Contractor →', si: 'කොන්ත්‍රාත්කරු ලෙස පිවිසෙන්න →', ta: 'ஒப்பந்ததாரராக உள்நுழைக →' },
      },
    },
    {
      id: 'subcontractor',
      label: { en: 'Subcontractor', si: 'උප කොන්ත්‍රාත්කරු', ta: 'துணை ஒப்பந்ததாரர்' },
      capability: 'bidder',
      canRegisterWorkers: true,
      legacyRole: 'supervisor',
      card: {
        title: { en: 'For Subcontractors & Specialist Trades', si: 'උප කොන්ත්‍රාත්කරුවන් සහ විශේෂඥ ශිල්පීන් සඳහා', ta: 'துணை ஒப்பந்ததாரர்கள் மற்றும் சிறப்புத் தொழிலாளர்களுக்கு' },
        desc: {
          en: 'Specialist crews such as electricians, plumbers, tilers and painters can bid directly on client jobs and get paid securely through escrow.',
          si: 'විදුලි කාර්මිකයන්, ජල නළ කාර්මිකයන්, ටයිල් කරුවන් සහ තීන්ත ආලේපකයන් වැනි විශේෂඥ කණ්ඩායම්වලට ගනුදෙනුකරුවන්ගේ රැකියා සඳහා කෙලින්ම ලංසු තබා එස්ක්‍රෝ හරහා ආරක්ෂිතව ගෙවීම් ලබා ගත හැක.',
          ta: 'மின்சாரம், குழாய், ஓடு மற்றும் வண்ணம் பூசும் சிறப்புக் குழுக்கள் வாடிக்கையாளர் வேலைகளுக்கு நேரடியாக ஏலமிட்டு எஸ்க்ரோ மூலம் பாதுகாப்பாக கட்டணம் பெறலாம்.',
        },
        bullets: [
          { en: 'Showcase your specialist trade', si: 'ඔබේ විශේෂඥ ශිල්පය ප්‍රදර්ශනය කරන්න', ta: 'உங்கள் சிறப்புத் தொழிலைக் காட்டுங்கள்' },
          { en: 'Bid directly on client jobs', si: 'ගනුදෙනුකරුවන්ගේ රැකියා සඳහා කෙලින්ම ලංසු තබන්න', ta: 'வாடிக்கையாளர் வேலைகளுக்கு நேரடியாக ஏலமிடுங்கள்' },
          { en: 'Escrow-protected payment', si: 'එස්ක්‍රෝ ආරක්ෂිත ගෙවීම', ta: 'எஸ்க்ரோ பாதுகாப்பான கட்டணம்' },
        ],
        action: { en: 'Enter as Subcontractor →', si: 'උප කොන්ත්‍රාත්කරු ලෙස පිවිසෙන්න →', ta: 'துணை ஒப்பந்ததாரராக உள்நுழைக →' },
      },
    },
    {
      id: 'worker',
      label: { en: 'Tradesperson', si: 'ශිල්පියා', ta: 'தொழிலாளர்' },
      capability: 'crew',
      canRegisterWorkers: false,
      legacyRole: 'worker',
      card: {
        title: { en: 'For Masons, Carpenters & Workers', si: 'පෙදරේරුවන්, වඩුවන් සහ ශ්‍රමිකයන් සඳහා', ta: 'கொத்தனார், தச்சர் மற்றும் தொழிலாளர்களுக்கு' },
        desc: {
          en: 'See the jobs you are assigned to, track your verified attendance and wages, and build a trust score that follows you from site to site.',
          si: 'ඔබට පවරා ඇති රැකියා බලන්න, සත්‍යාපිත පැමිණීම සහ වැටුප් නිරීක්ෂණය කරන්න, සහ ස්ථානයෙන් ස්ථානයට ඔබ සමඟ යන විශ්වාස ලකුණු ගොඩනගන්න.',
          ta: 'உங்களுக்கு ஒதுக்கப்பட்ட வேலைகளைப் பாருங்கள், சரிபார்க்கப்பட்ட வருகை மற்றும் கூலியைக் கண்காணியுங்கள், இடத்திலிருந்து இடத்துக்கு உங்களுடன் வரும் நம்பகத்தன்மை மதிப்பெண்ணை உருவாக்குங்கள்.',
        },
        bullets: [
          { en: 'Verified attendance & wage ledger', si: 'සත්‍යාපිත පැමිණීම සහ වැටුප් ලේඛනය', ta: 'சரிபார்க்கப்பட்ட வருகை மற்றும் கூலி பதிவேடு' },
          { en: 'Fair, on-time payouts', si: 'සාධාරණ, නියමිත වේලාවට ගෙවීම්', ta: 'நியாயமான, நேரத்திற்கு கட்டணம்' },
          { en: 'Build your trade reputation', si: 'ඔබේ ශිල්ප කීර්තිය ගොඩනගන්න', ta: 'உங்கள் தொழில் நற்பெயரை உருவாக்குங்கள்' },
        ],
        action: { en: 'Enter as Tradesperson →', si: 'ශිල්පියෙකු ලෙස පිවිසෙන්න →', ta: 'தொழிலாளராக உள்நுழைக →' },
      },
    },
  ],
  taskTypes: [
    'Foundation & Masonry Work',
    'Concreting (Slab, Column & Beam)',
    'Carpentry & Formwork',
    'Electrical Wiring & Fittings',
    'Plumbing & Sanitary Installation',
    'Plastering & Painting',
    'Tiling & Floor Finishing',
    'Site Clearing & General Labour',
  ],
  skills: ['Mason', 'Carpenter', 'Electrician', 'Plumber', 'Painter', 'Tiler', 'Steel Fixer', 'Helper (Labourer)'],
  ratingTags: ['On Schedule', 'Quality Workmanship', 'Safe Site Practices', 'Clean Site', 'Good Communication'],
  defaults: {
    taskType: 'Foundation & Masonry Work',
    skills: ['Mason', 'Helper (Labourer)'],
    ratingTags: ['On Schedule', 'Quality Workmanship', 'Clean Site'],
    wageBudget: '150000',
  },
  siteFields: [
    {
      key: 'site_type',
      target: 'attributes',
      label: { en: 'Site Type', si: 'ස්ථාන වර්ගය', ta: 'இட வகை' },
      type: 'select',
      required: true,
      defaultValue: 'House',
      options: [
        { value: 'House', label: { en: 'House', si: 'නිවස', ta: 'வீடு' } },
        { value: 'Commercial Building', label: { en: 'Commercial Building', si: 'වාණිජ ගොඩනැගිල්ල', ta: 'வணிகக் கட்டிடம்' } },
        { value: 'Renovation', label: { en: 'Renovation', si: 'අලුත්වැඩියාව', ta: 'புதுப்பித்தல்' } },
        { value: 'Boundary Wall / Other', label: { en: 'Boundary Wall / Other', si: 'වැටවල් / වෙනත්', ta: 'எல்லைச் சுவர் / மற்றவை' } },
      ],
    },
    {
      key: 'floor_area_sqft',
      target: 'attributes',
      label: { en: 'Floor Area (sq ft)', si: 'වර්ග ප්‍රමාණය (වර්ග අඩි)', ta: 'தள அளவு (சதுர அடி)' },
      type: 'number',
      unit: { en: 'sq ft', si: 'වර්ග අඩි', ta: 'சதுர அடி' },
      required: true,
      min: 100,
      step: 50,
      defaultValue: '1500',
      totalLabel: { en: 'Total Floor Area (sq ft)', si: 'මුළු වර්ග ප්‍රමාණය (වර්ග අඩි)', ta: 'மொத்த தள அளவு (சதுர அடி)' },
    },
    {
      key: 'floors',
      target: 'attributes',
      label: { en: 'Number of Floors', si: 'තට්ටු ගණන', ta: 'மாடிகளின் எண்ணிக்கை' },
      type: 'number',
      unit: { en: 'floors', si: 'තට්ටු', ta: 'மாடிகள்' },
      unitOne: { en: 'floor', si: 'තට්ටුව', ta: 'மாடி' },
      min: 1,
      step: 1,
      defaultValue: '1',
    },
  ],
  locationPresets: [
    { label: { en: 'Colombo', si: 'කොළඹ', ta: 'கொழும்பு' }, location: 'Colombo', lat: 6.9271, lng: 79.8612 },
    { label: { en: 'Nugegoda', si: 'නුගේගොඩ', ta: 'நுகேகொடை' }, location: 'Nugegoda, Colombo District', lat: 6.8649, lng: 79.8997 },
    { label: { en: 'Kandy', si: 'මහනුවර', ta: 'கண்டி' }, location: 'Kandy', lat: 7.2906, lng: 80.6337 },
    { label: { en: 'Galle', si: 'ගාල්ල', ta: 'காலி' }, location: 'Galle', lat: 6.0535, lng: 80.221 },
  ],
  map: { center: { lat: 7.1, lng: 80.2 }, zoom: 8 },
  pricingUnit: 'per_day',
  landingStat: 'site_count',
  vocab: CONSTRUCTION_VOCAB,
};

export const CATEGORIES: Record<CategoryId, CategoryConfig> = {
  coconut: COCONUT,
  construction: CONSTRUCTION,
};

export const CATEGORY_LIST: CategoryConfig[] = [COCONUT, CONSTRUCTION];

/** Data created before categories existed has no `category`; it is coconut data. */
export const DEFAULT_CATEGORY: CategoryId = 'coconut';

export const isCategoryId = (v: unknown): v is CategoryId => typeof v === 'string' && v in CATEGORIES;

export const getCategory = (id: CategoryId | null | undefined): CategoryConfig => CATEGORIES[id ?? DEFAULT_CATEGORY];

/** Category of any record that may predate categories (estates, jobs, workers). */
export const categoryOf = (item: { category?: CategoryId } | null | undefined): CategoryId =>
  item?.category ?? DEFAULT_CATEGORY;

export const l10n = (value: L10n | undefined, lang: Language): string => (value ? value[lang] || value.en : '');

// ---------------------------------------------------------------- roles & capabilities

/** The job engine checks capabilities, not role names. */
export const capabilityOfLegacyRole = (role: Role | undefined): Capability | null => {
  if (role === 'owner') return 'poster';
  if (role === 'supervisor') return 'bidder';
  if (role === 'worker') return 'crew';
  return null;
};

export const getRole = (category: CategoryId, roleId: CategoryRoleId): CategoryRole | undefined =>
  CATEGORIES[category].roles.find(r => r.id === roleId);

export const rolesWithCapability = (category: CategoryId, capability: Capability): CategoryRole[] =>
  CATEGORIES[category].roles.filter(r => r.capability === capability);

export const canRegisterWorkers = (membership: Membership): boolean =>
  !!getRole(membership.category, membership.role)?.canRegisterWorkers;

const LEGACY_TO_COCONUT_ROLE: Record<LegacyRole, CategoryRoleId> = {
  owner: 'owner',
  supervisor: 'broker',
  worker: 'worker',
};

/**
 * The user's role per category. Users created before categories existed only have the
 * legacy `roles`; those are coconut memberships.
 */
export const membershipsOf = (user: Pick<User, 'roles' | 'memberships'> | null | undefined): Membership[] => {
  if (!user) return [];
  if (user.memberships && user.memberships.length > 0) return user.memberships;
  return user.roles
    .filter((r): r is LegacyRole => r !== 'admin')
    .map(r => ({ category: DEFAULT_CATEGORY, role: LEGACY_TO_COCONUT_ROLE[r] }));
};

/** Whether the user holds a role with this capability in the category (e.g. is a poster there). */
export const hasCapabilityIn = (
  user: Pick<User, 'roles' | 'memberships'> | null | undefined,
  category: CategoryId,
  capability: Capability
): boolean => membershipsInCategory(user, category).some(m => getRole(m.category, m.role)?.capability === capability);

/** Whether the user holds a role with this capability in any category. */
export const hasAnyCapability = (
  user: Pick<User, 'roles' | 'memberships'> | null | undefined,
  capability: Capability
): boolean => membershipsOf(user).some(m => getRole(m.category, m.role)?.capability === capability);

export const membershipsInCategory = (
  user: Pick<User, 'roles' | 'memberships'> | null | undefined,
  category: CategoryId
): Membership[] => membershipsOf(user).filter(m => m.category === category);

/**
 * The legacy role the user acts as in this category: keep the current active role if it
 * is one of their roles here, otherwise the first one. Null if they are not a member.
 */
export const activeLegacyRoleIn = (
  user: Pick<User, 'roles' | 'memberships' | 'active_role'> | null | undefined,
  category: CategoryId
): LegacyRole | null => {
  const legacy = membershipsInCategory(user, category)
    .map(m => getRole(m.category, m.role)?.legacyRole)
    .filter((r): r is LegacyRole => !!r);
  if (legacy.length === 0) return null;
  return user && legacy.includes(user.active_role as LegacyRole) ? (user.active_role as LegacyRole) : legacy[0];
};

// ---------------------------------------------------------------- site fields

export type SiteValues = {
  area_acres?: number;
  tree_count?: number;
  attributes?: Record<string, string | number>;
};

export const getSiteFieldValue = (site: SiteValues, field: SiteField): string | number | undefined =>
  field.target === 'top' ? (site as Record<string, any>)[field.key] : site.attributes?.[field.key];

/** One field of a site as display text, e.g. "2,400 sq ft" or the translated site type. Empty when unset. */
export const formatSiteFieldValue = (site: SiteValues, field: SiteField, lang: Language): string => {
  const value = getSiteFieldValue(site, field);
  if (value === undefined || value === '') return '';
  if (field.type === 'select') {
    return l10n(field.options?.find(o => o.value === value)?.label, lang) || String(value);
  }
  const shown = typeof value === 'number' ? value.toLocaleString() : value;
  const unit = value === 1 && field.unitOne ? field.unitOne : field.unit;
  return unit ? `${shown} ${l10n(unit, lang)}` : String(shown);
};

/**
 * One-line summary of a site's registry fields, e.g. "10 acres • 650 palms" (coconut) or
 * "House • 2,400 sq ft • 2 floors" (construction). Uses the site's own category.
 */
export const formatSiteSummary = (site: SiteValues & { category?: CategoryId }, lang: Language, separator = ' • '): string =>
  getCategory(categoryOf(site))
    .siteFields.map(field => formatSiteFieldValue(site, field, lang))
    .filter(Boolean)
    .join(separator);

/** Starting values for the register-site form: each field's default, or the first option. */
export const siteFormDefaults = (category: CategoryConfig): Record<string, string> =>
  Object.fromEntries(
    category.siteFields.map(f => [f.key, f.defaultValue ?? (f.type === 'select' ? f.options?.[0]?.value ?? '' : '')])
  );

/**
 * Turns the form's text values into what the store takes. Fields that are first-class on
 * Estate (acres, trees) stay top-level (0 when the category has none); the rest go in `attributes`.
 * Returns the names of required fields that are empty or invalid when the form is incomplete.
 */
export const buildSitePayload = (
  category: CategoryConfig,
  values: Record<string, string>
):
  | { ok: true; area_acres: number; tree_count: number; attributes?: Record<string, string | number> }
  | { ok: false; missing: string[] } => {
  const missing: string[] = [];
  let area_acres = 0;
  let tree_count = 0;
  const attributes: Record<string, string | number> = {};

  for (const field of category.siteFields) {
    const raw = (values[field.key] ?? '').trim();
    const parsed = field.type === 'number' ? Number(raw) : raw;
    const invalid = raw === '' || (field.type === 'number' && !Number.isFinite(parsed));
    if (invalid) {
      if (field.required) missing.push(field.key);
      continue;
    }
    if (field.target === 'top') {
      if (field.key === 'area_acres') area_acres = parsed as number;
      if (field.key === 'tree_count') tree_count = parsed as number;
    } else {
      attributes[field.key] = parsed;
    }
  }

  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, area_acres, tree_count, attributes: Object.keys(attributes).length ? attributes : undefined };
};

/** Totals for the fields that have a `totalLabel`, across the given sites. */
export const siteTotals = (
  sites: SiteValues[],
  category: CategoryConfig
): { field: SiteField; total: number }[] =>
  category.siteFields
    .filter(f => f.totalLabel)
    .map(field => ({
      field,
      total: sites.reduce((sum, site) => sum + (Number(getSiteFieldValue(site, field)) || 0), 0),
    }));
