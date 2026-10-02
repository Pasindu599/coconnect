import type { Vocab } from './categories';

/**
 * Wording that replaces the coconut-flavoured defaults in `src/lib/i18n.ts` while the
 * Construction category is active (see `getCategoryT`). Keys that are not listed here
 * keep their base text. Placeholders such as {name} and {amount} must stay intact.
 *
 * Sinhala and Tamil here were drafted by Claude: have a native speaker review them
 * before launch (tracked in .claude/docs/KNOWN_ISSUES.md).
 */
export const CONSTRUCTION_VOCAB: Vocab = {
  // ---- Brand / landing
  tagline: {
    en: 'Construction Labour Hiring & Escrow Platform',
    si: 'ඉදිකිරීම් ශ්‍රම බඳවාගැනීම් සහ එස්ක්‍රෝ ගෙවීම් පද්ධතිය',
    ta: 'கட்டுமானத் தொழிலாளர் நியமனம் மற்றும் எஸ்க்ரோ தளம்',
  },
  hero_badge: {
    en: "Sri Lanka's Construction Labour Platform",
    si: 'ශ්‍රී ලංකාවේ ඉදිකිරීම් ශ්‍රම සම්පත් වේදිකාව',
    ta: 'இலங்கையின் கட்டுமானத் தொழிலாளர் தளம்',
  },
  hero_subtitle: {
    en: 'Connecting property owners with verified contractors, subcontractors and skilled tradespeople: masons, carpenters, electricians and more, with every payment held safely in escrow.',
    si: 'දේපළ හිමිකරුවන් සත්‍යාපිත කොන්ත්‍රාත්කරුවන්, උප කොන්ත්‍රාත්කරුවන් සහ දක්ෂ ශිල්පීන් (වඩුවන්, පෙදරේරුවන්, විදුලි කාර්මිකයන් ආදීන්) සමඟ සම්බන්ධ කරයි. සෑම ගෙවීමක්ම එස්ක්‍රෝ ගිණුමක ආරක්ෂිතව තැන්පත් වේ.',
    ta: 'சொத்து உரிமையாளர்களை சரிபார்க்கப்பட்ட ஒப்பந்ததாரர்கள், துணை ஒப்பந்ததாரர்கள் மற்றும் திறமையான தொழிலாளர்களுடன் (கொத்தனார், தச்சர், மின்சார பணியாளர் உள்ளிட்டோர்) இணைக்கிறது. ஒவ்வொரு கட்டணமும் எஸ்க்ரோவில் பாதுகாப்பாக வைக்கப்படும்.',
  },
  hero_cta_secondary: {
    en: 'Explore Construction Sites Map',
    si: 'ඉදිකිරීම් ස්ථාන සිතියම බලන්න',
    ta: 'கட்டுமான இடங்களின் வரைபடத்தைப் பாருங்கள்',
  },
  roles_heading: {
    en: 'Tailored Portals for Every Construction Participant',
    si: 'ඉදිකිරීම් අංශයේ සෑම දායකයෙකු සඳහාම සකසන ලද පිවිසුම්',
    ta: 'கட்டுமானத் துறையின் ஒவ்வொருவருக்குமான தளங்கள்',
  },
  landing_coverage: {
    en: 'Island-wide coverage: Colombo, Gampaha, Kandy, Galle, Kurunegala & Beyond',
    si: 'දිවයින පුරා සේවාව: කොළඹ, ගම්පහ, මහනුවර, ගාල්ල, කුරුණෑගල සහ තවත් ප්‍රදේශ',
    ta: 'நாடு முழுவதும் சேவை: கொழும்பு, கம்பஹா, கண்டி, காலி, குருநாகல் மற்றும் பல',
  },
  stat_palms: {
    en: 'Active Construction Sites',
    si: 'ක්‍රියාත්මක ඉදිකිරීම් ස්ථාන',
    ta: 'செயலில் உள்ள கட்டுமான இடங்கள்',
  },
  stat_climbers: {
    en: 'Verified Tradespeople',
    si: 'සත්‍යාපිත ශිල්පීන්',
    ta: 'சரிபார்க்கப்பட்ட தொழிலாளர்கள்',
  },
  features_title: {
    en: 'Engineered for Trust on Every Building Site',
    si: 'සෑම ඉදිකිරීම් ස්ථානයකම විශ්වාසය සඳහා සැලසුම් කළ',
    ta: 'ஒவ்வொரு கட்டுமான இடத்திலும் நம்பிக்கைக்காக வடிவமைக்கப்பட்டது',
  },
  features_subtitle: {
    en: 'Eliminating ghost workers, delayed wages and disputed work with securely tracked workflows from the first bid to the final payment.',
    si: 'පළමු ලංසුවේ සිට අවසන් ගෙවීම දක්වා ආරක්ෂිතව නිරීක්ෂණය කරන ක්‍රියාවලි මගින් ව්‍යාජ කම්කරුවන්, වැටුප් ප්‍රමාදයන් සහ වැඩ පිළිබඳ ආරවුල් වැළැක්වීම.',
    ta: 'முதல் ஏலத்திலிருந்து இறுதிக் கட்டணம் வரை பாதுகாப்பாகக் கண்காணிக்கப்படும் செயல்முறைகள் மூலம் போலி தொழிலாளர்கள், தாமதமான கூலி மற்றும் வேலை தொடர்பான சர்ச்சைகளை நீக்குகிறது.',
  },
  feat_escrow_desc: {
    en: 'Clients deposit funds into escrow before work begins. Contact phone numbers stay masked until escrow is funded, to prevent circumvention.',
    si: 'වැඩ ආරම්භ කිරීමට පෙර ගනුදෙනුකරුවන් එස්ක්‍රෝ ගිණුමට මුදල් තැන්පත් කරයි. එස්ක්‍රෝ ගිණුම පිරවෙන තුරු දුරකථන අංක සඟවා තබනු ලැබේ.',
    ta: 'வேலை தொடங்கும் முன் வாடிக்கையாளர்கள் எஸ்க்ரோவில் பணம் செலுத்துவர். எஸ்க்ரோ நிரப்பப்படும் வரை தொலைபேசி எண்கள் மறைக்கப்படும்.',
  },
  feat_dual_pin_desc: {
    en: 'Funds are released only when both the client and the contractor confirm, with security PINs, that the work is complete.',
    si: 'වැඩ නිමා වූ බව ගනුදෙනුකරුවා සහ කොන්ත්‍රාත්කරු යන දෙපාර්ශවයම PIN මගින් තහවුරු කළ පසුව පමණක් මුදල් නිදහස් කෙරේ.',
    ta: 'வேலை முடிந்ததை வாடிக்கையாளர் மற்றும் ஒப்பந்ததாரர் இருவரும் PIN மூலம் உறுதிசெய்த பின்னரே பணம் விடுவிக்கப்படும்.',
  },
  feat_gis_map_desc: {
    en: 'Pin every building site on the map, with site type, floor area and access notes, and assign crews in real time using Google Maps Platform.',
    si: 'සෑම ඉදිකිරීම් ස්ථානයක්ම ප්‍රදේශයේ වර්ගය, වර්ග ප්‍රමාණය සහ ප්‍රවේශ සටහන් සමඟ සිතියමේ සලකුණු කර Google Maps මගින් කණ්ඩායම් පවරන්න.',
    ta: 'ஒவ்வொரு கட்டுமான இடத்தையும் வகை, தள அளவு மற்றும் அணுகல் குறிப்புகளுடன் வரைபடத்தில் குறித்து, Google Maps மூலம் குழுக்களை ஒதுக்குங்கள்.',
  },
  feat_trust_desc: {
    en: 'A transparent score based on on-time completion, workmanship quality, attendance and dispute resolution.',
    si: 'නියමිත වේලාවට නිම කිරීම, වැඩ තත්ත්වය, පැමිණීම සහ ආරවුල් විසඳීම මත පදනම් වූ විනිවිදභාවයෙන් යුත් ලකුණු.',
    ta: 'நேரத்திற்கு முடித்தல், வேலைத்தரம், வருகை மற்றும் சர்ச்சை தீர்வு அடிப்படையிலான வெளிப்படையான மதிப்பெண்.',
  },
  feat_mobile_desc: {
    en: 'Contractors can mark site attendance offline; entries sync automatically once the connection returns.',
    si: 'කොන්ත්‍රාත්කරුවන්ට අඩවියේ පැමිණීම නොබැඳිව සටහන් කළ හැක; සම්බන්ධතාව ලැබුණු විට ස්වයංක්‍රීයව සමමුහුර්ත වේ.',
    ta: 'ஒப்பந்ததாரர்கள் இணையமின்றி வருகையைப் பதிவு செய்யலாம்; இணைப்பு கிடைத்ததும் தானாக ஒத்திசைக்கப்படும்.',
  },

  worker: { en: 'Tradesperson', si: 'ශිල්පියා', ta: 'தொழிலாளர்' },
  required_skills_label: { en: 'Required Trades & Skills', si: 'අවශ්‍ය ශිල්ප සහ කුසලතා', ta: 'தேவையான தொழில்கள் மற்றும் திறன்கள்' },
  default_task: { en: 'Construction Task', si: 'ඉදිකිරීම් කාර්යය', ta: 'கட்டுமானப் பணி' },

  // ---- Role vocabulary
  landowner: {
    en: 'Client (Site Owner)',
    si: 'ගනුදෙනුකරු (ස්ථාන හිමියා)',
    ta: 'வாடிக்கையாளர் (இட உரிமையாளர்)',
  },
  landowner_label: { en: 'Client', si: 'ගනුදෙනුකරු', ta: 'வாடிக்கையாளர்' },
  owner_verified_label: { en: 'Client verified', si: 'ගනුදෙනුකරු තහවුරු කළා', ta: 'வாடிக்கையாளர் உறுதிசெய்தார்' },
  supervisor: {
    en: 'Contractor / Subcontractor',
    si: 'කොන්ත්‍රාත්කරු / උප කොන්ත්‍රාත්කරු',
    ta: 'ஒப்பந்ததாரர் / துணை ஒப்பந்ததாரர்',
  },
  supervisor_label: { en: 'Contractor', si: 'කොන්ත්‍රාත්කරු', ta: 'ஒப்பந்ததாரர்' },
  supervisor_logged: { en: 'Contractor logged', si: 'කොන්ත්‍රාත්කරු සටහන් කළා', ta: 'ஒப்பந்ததாரர் பதிவு செய்தார்' },
  supervisor_contact: { en: 'Contractor Contact', si: 'කොන්ත්‍රාත්කරුගේ සම්බන්ධතා', ta: 'ஒப்பந்ததாரர் தொடர்பு' },
  under_supervisor: { en: 'Under contractor', si: 'කොන්ත්‍රාත්කරු යටතේ', ta: 'ஒப்பந்ததாரரின் கீழ்' },
  supervisor_commission: { en: 'Contractor Margin', si: 'කොන්ත්‍රාත්කරුගේ ලාභාංශය', ta: 'ஒப்பந்ததாரர் லாபம்' },
  supervisor_commission_lkr: { en: 'Contractor Margin (LKR)', si: 'කොන්ත්‍රාත්කරුගේ ලාභාංශය (රු.)', ta: 'ஒப்பந்ததாரர் லாபம் (ரூ.)' },
  sup_submitted_completion: {
    en: 'Contractor submitted completion & wages',
    si: 'කොන්ත්‍රාත්කරු නිමාව සහ වැටුප් ඉදිරිපත් කළා',
    ta: 'ஒப்பந்ததாரர் முடிவு மற்றும் கூலியைச் சமர்ப்பித்தார்',
  },
  sup_portal_title: {
    en: 'Contractor & Subcontractor Portal',
    si: 'කොන්ත්‍රාත්කරු සහ උප කොන්ත්‍රාත්කරු පිවිසුම',
    ta: 'ஒப்பந்ததாரர் மற்றும் துணை ஒப்பந்ததாரர் தளம்',
  },
  sup_licensed_badge: { en: 'Verified Contractor', si: 'සත්‍යාපිත කොන්ත්‍රාත්කරු', ta: 'சரிபார்க்கப்பட்ட ஒப்பந்ததாரர்' },
  owner_budget: { en: 'Client Budget', si: 'ගනුදෙනුකරුගේ අයවැය', ta: 'வாடிக்கையாளர் பட்ஜெட்' },
  owner_hub_title: {
    en: 'Client Operations Hub',
    si: 'ගනුදෙනුකරු මෙහෙයුම් මධ්‍යස්ථානය',
    ta: 'வாடிக்கையாளர் செயல்பாட்டு மையம்',
  },
  owner_verified_badge: { en: 'Verified Client', si: 'සත්‍යාපිත ගනුදෙනුකරු', ta: 'சரிபார்க்கப்பட்ட வாடிக்கையாளர்' },
  owner_belt_note: {
    en: 'Construction Sites • Escrow Protection Active',
    si: 'ඉදිකිරීම් ස්ථාන • එස්ක්‍රෝ ආරක්ෂාව ක්‍රියාත්මකයි',
    ta: 'கட்டுமான இடங்கள் • எஸ்க்ரோ பாதுகாப்பு செயலில்',
  },
  publish_job: {
    en: 'Publish Job to Contractors',
    si: 'කොන්ත්‍රාත්කරුවන්ට රැකියාව පළ කරන්න',
    ta: 'ஒப்பந்ததாரர்களுக்கு வேலையை வெளியிடுக',
  },
  send_to_owner: {
    en: 'Send to Client for PIN Release',
    si: 'PIN නිදහස් කිරීම සඳහා ගනුදෙනුකරුට යවන්න',
    ta: 'PIN விடுவிப்புக்காக வாடிக்கையாளருக்கு அனுப்புக',
  },
  release_on_signoff: {
    en: 'Release on client completion sign-off',
    si: 'ගනුදෙනුකරුගේ නිමාව අනුමත කළ විට නිදහස් කරන්න',
    ta: 'வாடிக்கையாளர் முடிவை ஒப்புக்கொண்டதும் விடுவிக்கவும்',
  },
  completion_pin_note: {
    en: 'Signing with your security PIN releases the funds held in escrow to the contractor and the crew.',
    si: 'ඔබේ ආරක්ෂක PIN මගින් අත්සන් කිරීමෙන් එස්ක්‍රෝ ගිණුමේ ඇති මුදල් කොන්ත්‍රාත්කරුට සහ කණ්ඩායමට නිදහස් වේ.',
    ta: 'உங்கள் பாதுகாப்பு PIN மூலம் கையொப்பமிடுவது எஸ்க்ரோவில் உள்ள பணத்தை ஒப்பந்ததாரர் மற்றும் குழுவுக்கு விடுவிக்கும்.',
  },
  completion_desc: {
    en: 'Specify days worked and the daily rate for each crew member. This submits the official completion request for the client to confirm with their PIN.',
    si: 'එක් එක් කණ්ඩායම් සාමාජිකයා වැඩ කළ දින ගණන සහ දෛනික වැටුප සඳහන් කරන්න. මෙය ගනුදෙනුකරු PIN මගින් තහවුරු කිරීම සඳහා නිල නිමාවේ ඉල්ලීම ඉදිරිපත් කරයි.',
    ta: 'ஒவ்வொரு குழு உறுப்பினரும் வேலை செய்த நாட்கள் மற்றும் தினசரி கூலியைக் குறிப்பிடவும். இது வாடிக்கையாளர் PIN மூலம் உறுதிசெய்வதற்கான அதிகாரபூர்வ கோரிக்கையை சமர்ப்பிக்கிறது.',
  },
  completion_notes_default: {
    en: 'All agreed work completed and handed over. Site cleared.',
    si: 'එකඟ වූ සියලු වැඩ නිම කර භාර දෙන ලදී. ස්ථානය පිරිසිදු කර ඇත.',
    ta: 'ஒப்புக்கொண்ட அனைத்து வேலைகளும் முடிக்கப்பட்டு ஒப்படைக்கப்பட்டன. இடம் சுத்தம் செய்யப்பட்டது.',
  },
  wages_submitted_await: {
    en: 'Wages submitted: LKR {amount}. Awaiting the client’s PIN confirmation.',
    si: 'වැටුප් ඉදිරිපත් කරන ලදී: රු. {amount}. ගනුදෙනුකරුගේ PIN තහවුරු කිරීම බලාපොරොත්තුවෙන්.',
    ta: 'கூலி சமர்ப்பிக்கப்பட்டது: ரூ. {amount}. வாடிக்கையாளரின் PIN உறுதிப்படுத்தலுக்காக காத்திருக்கிறது.',
  },
  escrow_engine_desc: {
    en: 'Strict Escrow Rule: phone numbers and contact details stay encrypted and withheld until the client funds the verified escrow account. Funds are released to the contractor and crew only after dual-confirmation PIN verification at completion.',
    si: 'දැඩි එස්ක්‍රෝ රීතිය: ගනුදෙනුකරු සත්‍යාපිත එස්ක්‍රෝ ගිණුමට මුදල් තැන්පත් කරන තුරු දුරකථන අංක සහ සම්බන්ධතා තොරතුරු සංකේතනය කර සඟවා තබනු ලැබේ. නිමාවේදී ද්විත්ව PIN තහවුරු කිරීමෙන් පසුව පමණක් මුදල් කොන්ත්‍රාත්කරුට සහ කණ්ඩායමට නිදහස් වේ.',
    ta: 'கடுமையான எஸ்க்ரோ விதி: வாடிக்கையாளர் சரிபார்க்கப்பட்ட எஸ்க்ரோ கணக்கில் பணம் செலுத்தும் வரை தொலைபேசி எண்கள் மற்றும் தொடர்பு விவரங்கள் மறைக்கப்படும். முடிவில் இருவழி PIN சரிபார்ப்புக்குப் பின்னரே ஒப்பந்ததாரர் மற்றும் குழுவுக்கு பணம் விடுவிக்கப்படும்.',
  },
  attendance_dual_desc: {
    en: 'Neither party can finalize attendance alone. The contractor records the site check-in and the client verifies it on site. Mismatches automatically open an exception record.',
    si: 'කිසිදු පාර්ශවයකට තනිවම පැමිණීම අවසන් කළ නොහැක. කොන්ත්‍රාත්කරු අඩවි පැමිණීම සටහන් කරන අතර ගනුදෙනුකරු එය තහවුරු කරයි. නොගැලපීම් ස්වයංක්‍රීයව සිද්ධි වාර්තාවක් විවෘත කරයි.',
    ta: 'எந்த தரப்பும் தனியாக வருகையை இறுதி செய்ய முடியாது. ஒப்பந்ததாரர் இடத்தில் வருகையைப் பதிவு செய்ய, வாடிக்கையாளர் அதை சரிபார்ப்பார். பொருத்தமின்மை தானாகவே விதிவிலக்குப் பதிவைத் திறக்கும்.',
  },
  attendance_checkin_desc: {
    en: 'Mark attendance on remote building sites without network connectivity. Records queue in the local outbox and sync automatically.',
    si: 'ජාල සම්බන්ධතාවක් නොමැති ඉදිකිරීම් ස්ථානවලදී පැමිණීම සටහන් කරන්න. වාර්තා ස්වයංක්‍රීයව සමමුහුර්ත වේ.',
    ta: 'இணைப்பு இல்லாத கட்டுமான இடங்களிலும் வருகையைப் பதிவு செய்யலாம். பதிவுகள் தானாக ஒத்திசைக்கப்படும்.',
  },
  assigned_harvest_jobs: { en: 'Assigned Site Jobs', si: 'පවරා ඇති ඉදිකිරීම් රැකියා', ta: 'ஒதுக்கப்பட்ட கட்டுமான வேலைகள்' },
  no_nic_hint: {
    en: 'To accept construction assignments, bid on jobs and withdraw escrow funds, upload sharp photos of both your NIC Front and Back sides.',
    si: 'ඉදිකිරීම් රැකියා භාර ගැනීමට, ලංසු තැබීමට සහ එස්ක්‍රෝ මුදල් ලබා ගැනීමට, ඔබේ හැඳුනුම්පතේ ඉදිරිපස සහ පසුපස යන දෙපැත්තේම පැහැදිලි ඡායාරූප උඩුගත කරන්න.',
    ta: 'கட்டுமான பணிகளை ஏற்கவும், ஏலம் இடவும், எஸ்க்ரோ பணத்தைப் பெறவும், உங்கள் அடையாள அட்டையின் முன் மற்றும் பின் பக்கங்களின் தெளிவான புகைப்படங்களைப் பதிவேற்றுங்கள்.',
  },
  resolution_notes_default: {
    en: 'Client site log verified against the contractor’s GPS check-in. Wage adjusted accordingly.',
    si: 'ගනුදෙනුකරුගේ අඩවි සටහන කොන්ත්‍රාත්කරුගේ GPS පැමිණීම සමඟ සසඳා තහවුරු කළා. වැටුප ඒ අනුව සකස් කළා.',
    ta: 'வாடிக்கையாளர் இடப் பதிவு ஒப்பந்ததாரரின் GPS வருகையுடன் சரிபார்க்கப்பட்டது. கூலி அதற்கேற்ப சரிசெய்யப்பட்டது.',
  },
  nic_remarks_ph: {
    en: 'e.g. Registered address is the same as the site location in Kandy',
    si: 'උදා: ලියාපදිංචි ලිපිනය මහනුවර ඇති ස්ථානයේ ලිපිනයමයි',
    ta: 'எ.கா. பதிவு செய்த முகவரி கண்டியில் உள்ள இடத்தின் முகவரியே',
  },

  // ---- Sites (called "estates" / "lands" in the coconut wording)
  my_lands: { en: 'My Construction Sites', si: 'මගේ ඉදිකිරීම් ස්ථාන', ta: 'எனது கட்டுமான இடங்கள்' },
  add_land: { en: 'Register New Site', si: 'නව ස්ථානයක් ලියාපදිංචි කරන්න', ta: 'புதிய இடத்தைப் பதிவு செய்க' },
  select_estate: { en: 'Select Construction Site', si: 'ඉදිකිරීම් ස්ථානය තෝරන්න', ta: 'கட்டுமான இடத்தைத் தேர்ந்தெடுக்கவும்' },
  choose_land: { en: 'Choose site...', si: 'ස්ථානය තෝරන්න...', ta: 'இடத்தைத் தேர்ந்தெடுக்கவும்...' },
  estate_instructions: { en: 'Site Work Instructions', si: 'ස්ථානයේ වැඩ උපදෙස්', ta: 'இட வேலை அறிவுறுத்தல்கள்' },
  estate_instructions_ph: {
    en: 'Specific requirements, access times, materials and tools provided...',
    si: 'විශේෂ අවශ්‍යතා, ප්‍රවේශ වේලාවන්, සපයන ද්‍රව්‍ය සහ මෙවලම්...',
    ta: 'குறிப்பிட்ட தேவைகள், அணுகல் நேரங்கள், வழங்கப்படும் பொருட்கள் மற்றும் கருவிகள்...',
  },
  default_estate: { en: 'Site', si: 'ස්ථානය', ta: 'இடம்' },
  estate_name: { en: 'Site Name', si: 'ස්ථානයේ නම', ta: 'இடத்தின் பெயர்' },
  estate_name_ph: {
    en: 'e.g. Two-storey house, Nugegoda',
    si: 'උදා: නුගේගොඩ තට්ටු දෙකේ නිවස',
    ta: 'எ.கா. நுகேகொடையில் இரண்டு மாடி வீடு',
  },
  estate_notes_label: { en: 'Site Notes / Access Details (Optional)', si: 'ස්ථාන සටහන් / ප්‍රවේශ විස්තර (අත්‍යවශ්‍ය නොවේ)', ta: 'இடக் குறிப்புகள் / அணுகல் விவரங்கள் (விருப்பம்)' },
  estate_notes_ph: {
    en: 'Road access, water and electricity on site, storage space...',
    si: 'මාර්ග ප්‍රවේශය, අඩවියේ ජලය සහ විදුලිය, ගබඩා ඉඩ...',
    ta: 'சாலை அணுகல், இடத்தில் தண்ணீர் மற்றும் மின்சாரம், சேமிப்பு இடம்...',
  },
  save_land: { en: 'Save Site Registration', si: 'ස්ථාන ලියාපදිංචිය සුරකින්න', ta: 'இடப் பதிவைச் சேமிக்கவும்' },
  lands_desc: {
    en: 'Manage your construction sites, their type and floor area, and map locations for hiring crews.',
    si: 'ඔබේ ඉදිකිරීම් ස්ථාන, ඒවායේ වර්ගය, වර්ග ප්‍රමාණය සහ සිතියම් ස්ථාන කළමනාකරණය කර කණ්ඩායම් බඳවා ගන්න.',
    ta: 'உங்கள் கட்டுமான இடங்கள், அவற்றின் வகை, தள அளவு மற்றும் வரைபட இருப்பிடங்களை நிர்வகித்து குழுக்களை நியமியுங்கள்.',
  },
  view_lands_on_map: { en: 'View Sites on Map', si: 'ස්ථාන සිතියමේ බලන්න', ta: 'இடங்களை வரைபடத்தில் காண்க' },
  land_registered_success: {
    en: 'Site “{name}” was successfully registered with GPS coordinates.',
    si: '“{name}” ස්ථානය GPS ඛණ්ඩාංක සමඟ සාර්ථකව ලියාපදිංචි විය.',
    ta: '“{name}” இடம் GPS ஆயத்தொலைவுகளுடன் வெற்றிகரமாக பதிவு செய்யப்பட்டது.',
  },
  total_registered_lands: { en: 'Total Registered Sites', si: 'ලියාපදිංචි මුළු ස්ථාන', ta: 'பதிவு செய்யப்பட்ட மொத்த இடங்கள்' },
  estates_suffix: { en: 'Sites', si: 'ස්ථාන', ta: 'இடங்கள்' },
  coconut_triangle: { en: 'Island-wide', si: 'දිවයින පුරා', ta: 'நாடு முழுவதும்' },
  active_jobs_on_land: { en: 'Active jobs on site', si: 'ස්ථානයේ ක්‍රියාත්මක රැකියා', ta: 'இடத்தில் செயலில் உள்ள வேலைகள்' },
  post_job_for_land: { en: 'Post Job for this Site →', si: 'මෙම ස්ථානය සඳහා රැකියාවක් පළ කරන්න →', ta: 'இந்த இடத்திற்கு வேலையை இடுகையிடுக →' },

  // ---- Map
  nav_map: { en: 'Site GIS Map', si: 'ස්ථාන GIS සිතියම', ta: 'இட GIS வரைபடம்' },
  map_title: {
    en: 'Interactive Site & Labour Map',
    si: 'අන්තර්ක්‍රියාකාරී ස්ථාන සහ ශ්‍රම සිතියම',
    ta: 'ஊடாடும் இட மற்றும் தொழிலாளர் வரைபடம்',
  },
  map_sub: {
    en: 'Construction sites across Sri Lanka',
    si: 'ශ්‍රී ලංකාව පුරා ඉදිකිරීම් ස්ථාන',
    ta: 'இலங்கை முழுவதும் உள்ள கட்டுமான இடங்கள்',
  },
  map_estates: { en: 'Sites', si: 'ස්ථාන', ta: 'இடங்கள்' },
  map_drop_pin: { en: 'Drop Site Pin', si: 'ස්ථාන සලකුණ දමන්න', ta: 'இடக் குறியை இடுக' },
  map_new_land: { en: 'New Site Location', si: 'නව ස්ථාන පිහිටීම', ta: 'புதிய இட இருப்பிடம்' },
  map_estate_details: { en: 'Site Details', si: 'ස්ථාන විස්තර', ta: 'இட விவரங்கள்' },
  map_manage_land: { en: 'Manage Site', si: 'ස්ථානය කළමනාකරණය', ta: 'இடத்தை நிர்வகிக்கவும்' },

  // ---- Google Drive hub
  ws_sub: {
    en: 'Synchronize construction site registries, escrow agreements and NIC KYC records with Google Drive',
    si: 'ඉදිකිරීම් ස්ථාන ලේඛන, එස්ක්‍රෝ ගිවිසුම් සහ NIC KYC වාර්තා Google Drive සමඟ සමමුහුර්ත කරන්න',
    ta: 'கட்டுமான இடப் பதிவேடுகள், எஸ்க்ரோ ஒப்பந்தங்கள் மற்றும் NIC KYC பதிவுகளை Google Drive உடன் ஒத்திசைக்கவும்',
  },
  ws_firestore_desc: {
    en: 'NIC submissions, site details and labour jobs persist directly in Firebase Firestore.',
    si: 'NIC ඉදිරිපත් කිරීම්, ස්ථාන විස්තර සහ ශ්‍රම රැකියා Firebase Firestore හි සුරැකේ.',
    ta: 'NIC சமர்ப்பிப்புகள், இட விவரங்கள் மற்றும் தொழிலாளர் வேலைகள் Firebase Firestore இல் நேரடியாகச் சேமிக்கப்படும்.',
  },
  ws_export_estates: { en: 'Export Sites', si: 'ස්ථාන නිර්යාත කරන්න', ta: 'இடங்களை ஏற்றுமதி செய்க' },
  ws_connect_desc: {
    en: 'Sign in with your Google Workspace or personal account to unlock automatic export of construction contracts, escrow certificates and KYC identity verification records.',
    si: 'ඉදිකිරීම් ගිවිසුම්, එස්ක්‍රෝ සහතික සහ KYC අනන්‍යතා සත්‍යාපන වාර්තා ස්වයංක්‍රීයව නිර්යාත කිරීමට ඔබේ Google ගිණුමෙන් පිවිසෙන්න.',
    ta: 'கட்டுமான ஒப்பந்தங்கள், எஸ்க்ரோ சான்றிதழ்கள் மற்றும் KYC அடையாள சரிபார்ப்பு பதிவுகளை தானாக ஏற்றுமதி செய்ய உங்கள் Google கணக்கில் உள்நுழையுங்கள்.',
  },
  ws_err_estates: {
    en: 'Failed to export sites to Google Drive.',
    si: 'ස්ථාන Google Drive වෙත නිර්යාත කිරීම අසාර්ථක විය.',
    ta: 'இடங்களை Google Drive க்கு ஏற்றுமதி செய்ய முடியவில்லை.',
  },
};
