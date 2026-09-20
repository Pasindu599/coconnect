export type Language = 'en' | 'si' | 'ta';

export interface TranslationDict {
  app_title: string;
  tagline: string;
  login: string;
  logout: string;
  phone_number: string;
  enter_phone: string;
  send_otp: string;
  enter_otp: string;
  verify_continue: string;
  demo_accounts: string;
  active_role: string;
  switch_role: string;
  landowner: string;
  supervisor: string;
  worker: string;
  admin: string;
  
  // Navigation
  nav_home: string;
  nav_dashboard: string;
  nav_map: string;
  nav_drive: string;
  nav_profile: string;
  nav_admin: string;
  nav_login: string;
  nav_get_started: string;

  // Website & Hero
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  hero_cta_admin: string;
  
  // Features / Pillars
  features_title: string;
  features_subtitle: string;
  feat_escrow_title: string;
  feat_escrow_desc: string;
  feat_dual_pin_title: string;
  feat_dual_pin_desc: string;
  feat_gis_map_title: string;
  feat_gis_map_desc: string;
  feat_nic_title: string;
  feat_nic_desc: string;
  feat_trust_title: string;
  feat_trust_desc: string;
  feat_mobile_title: string;
  feat_mobile_desc: string;

  // Role Cards
  roles_heading: string;
  role_owner_title: string;
  role_owner_desc: string;
  role_owner_action: string;
  role_supervisor_title: string;
  role_supervisor_desc: string;
  role_supervisor_action: string;
  role_worker_title: string;
  role_worker_desc: string;
  role_worker_action: string;

  // Stats
  stat_palms: string;
  stat_escrow: string;
  stat_climbers: string;
  stat_satisfaction: string;

  // Admin Portal & Login
  admin_login_title: string;
  admin_login_subtitle: string;
  admin_email_label: string;
  admin_pin_label: string;
  admin_login_btn: string;
  admin_quick_auth: string;
  back_to_home: string;
  admin_title: string;
  verification_queue: string;
  exceptions_queue: string;
  audit_trail: string;
  trust_formula: string;

  // Status
  verified: string;
  pending: string;
  unverified: string;
  rejected: string;
  escrow_held: string;
  escrow_released: string;
  escrow_pending: string;
  
  // Owner Dashboard
  my_lands: string;
  add_land: string;
  posted_jobs: string;
  post_job: string;
  bids_received: string;
  award_job: string;
  escrow_protection: string;
  contacts_hidden_notice: string;
  contacts_unlocked_notice: string;
  confirm_completion: string;
  enter_pin: string;
  
  // Supervisor Dashboard
  crew_roster: string;
  add_worker: string;
  open_jobs: string;
  submit_bid: string;
  daily_attendance: string;
  mark_present: string;
  offline_outbox: string;
  submit_completion: string;
  
  // Worker Dashboard
  my_assignments: string;
  attendance_history: string;
  wages_earned: string;
  trust_score: string;
  
  // Shared / Profile
  profile: string;
  nic_verification: string;
  upload_doc: string;
  rating_reviews: string;
  rate_job: string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    app_title: 'Coconnect',
    tagline: 'Coconut Sector Labour Hiring & Escrow Platform',
    login: 'Log In',
    logout: 'Log Out',
    phone_number: 'Phone Number',
    enter_phone: 'Enter phone (e.g. +94 77 123 4567)',
    send_otp: 'Send Verification Code',
    enter_otp: 'Enter 6-Digit OTP Code',
    verify_continue: 'Verify & Continue',
    demo_accounts: 'Instant Demo Sign-in',
    active_role: 'Active Role',
    switch_role: 'Switch Role',
    landowner: 'Landowner (Estate Owner)',
    supervisor: 'Supervisor / Labour Broker',
    worker: 'Agricultural Worker',
    admin: 'Coconnect Admin Panel',

    // Navigation
    nav_home: 'Home Website',
    nav_dashboard: 'My Dashboard',
    nav_map: 'Farm GIS Map',
    nav_drive: 'Google Drive Backup',
    nav_profile: 'My Profile & NIC',
    nav_admin: 'Admin Panel',
    nav_login: 'Log In',
    nav_get_started: 'Get Started',

    // Website & Hero
    hero_badge: "Sri Lanka's National Coconut Labour Platform",
    hero_title: 'Fair Labour Hiring, Protected Escrow & GIS Field Operations',
    hero_subtitle: 'Connecting Coconut Estate Owners with Verified Labour Crews, Harvesters, and Supervisors across Kurunegala, Puttalam, Gampaha, and the entire Coconut Triangle.',
    hero_cta_primary: 'Enter Role Portal / Log In',
    hero_cta_secondary: 'Explore Coconut Lands Map',
    hero_cta_admin: 'Staff Admin Access (/admin)',

    // Features / Pillars
    features_title: 'Engineered for Trust in Sri Lankan Agriculture',
    features_subtitle: 'Eliminating middleman exploitation, ghost workers, delayed wages, and disputed boundaries with cryptographically secured workflows.',
    feat_escrow_title: '100% Escrow Protection',
    feat_escrow_desc: 'Estate owners deposit funds into escrow before work begins. Contact phone numbers remain strictly masked until escrow is funded to prevent circumvention.',
    feat_dual_pin_title: 'Dual-PIN Wage Release',
    feat_dual_pin_desc: 'Funds only release when both the Estate Owner and the Supervisor submit cryptographically verified 4-digit PINs upon satisfactory completion of harvesting.',
    feat_gis_map_title: 'Google Maps GIS Boundaries',
    feat_gis_map_desc: 'Interactive estate polygon boundaries, palm counts, soil access notes, and real-time crew assignment using Google Maps Platform.',
    feat_nic_title: 'Sri Lankan NIC Verification',
    feat_nic_desc: 'Formal KYC vetting supporting Old 9V and New 12-Digit Smart NICs with side-by-side front and back photo inspection.',
    feat_trust_title: 'Dynamic Trust Score Rules',
    feat_trust_desc: 'Transparent formula grading on-time completion, plucking accuracy, attendance fidelity, and dispute resolution.',
    feat_mobile_title: 'Field-Ready & Offline First',
    feat_mobile_desc: 'Supervisors can mark field muster rolls and record climber attendance offline; entries sync automatically once cellular connectivity resumes.',

    // Role Cards
    roles_heading: 'Tailored Portals for Every Coconut Sector Participant',
    role_owner_title: 'For Coconut Estate Owners',
    role_owner_desc: 'Register estates across Kurunegala & Puttalam, specify palm counts and plucking cycles, receive competitive bids from verified crews, and fund protected escrow.',
    role_owner_action: 'Enter as Estate Owner →',
    role_supervisor_title: 'For Supervisors & Brokers',
    role_supervisor_desc: 'Manage climber and harvester rosters, bid on high-value estate jobs, mark daily field attendance, and collect guaranteed commission with no wage withholding.',
    role_supervisor_action: 'Enter as Supervisor →',
    role_worker_title: 'For Harvesters & Workers',
    role_worker_desc: 'Get fair plucking rates per palm, track your verified attendance, build a transparent Sri Lankan trust score, and receive direct on-time payouts.',
    role_worker_action: 'Enter as Field Worker →',

    // Stats
    stat_palms: '14,500+ Coconut Palms Managed',
    stat_escrow: 'Rs. 8.4M+ Escrow Protected',
    stat_climbers: '340+ Verified Harvesters',
    stat_satisfaction: '99.4% Dual-PIN Success Rate',

    // Admin Portal & Login
    admin_login_title: 'Coconnect Staff Administration & KYC Desk',
    admin_login_subtitle: 'Restricted access for Coconnect verification officers, dispute adjudicators, and compliance auditors.',
    admin_email_label: 'Staff ID / Official Email',
    admin_pin_label: '6-Digit Security Passcode',
    admin_login_btn: 'Authenticate & Open Admin Portal',
    admin_quick_auth: 'Quick Auth (Niluka Fernando • Staff Officer)',
    back_to_home: '← Return to Public Home Website',
    admin_title: 'Coconnect Staff Admin Control',
    verification_queue: 'Identity Verification Queue',
    exceptions_queue: 'Exceptions & Disputes Queue',
    audit_trail: 'Immutable Audit Trail',
    trust_formula: 'Trust Score Formula Rules',

    // Status
    verified: 'Verified',
    pending: 'Pending Verification',
    unverified: 'Unverified',
    rejected: 'Rejected',
    escrow_held: 'Funds in Escrow',
    escrow_released: 'Funds Released',
    escrow_pending: 'Escrow Required',

    // Owner Dashboard
    my_lands: 'My Coconut Lands (Estates)',
    add_land: 'Register New Land',
    posted_jobs: 'My Posted Jobs',
    post_job: 'Post Labour Job',
    bids_received: 'Bids Received',
    award_job: 'Accept Bid & Fund Escrow',
    escrow_protection: 'Escrow Protection Active',
    contacts_hidden_notice: 'Contact details are locked until escrow payment is deposited.',
    contacts_unlocked_notice: 'Escrow funded! Direct contact details released.',
    confirm_completion: 'Dual-Confirm Completion',
    enter_pin: 'Enter 4-Digit Security PIN',

    // Supervisor Dashboard
    crew_roster: 'Crew Roster & Availability',
    add_worker: 'Register Worker with Consent',
    open_jobs: 'Available Labour Jobs',
    submit_bid: 'Submit Crew Bid',
    daily_attendance: 'Daily Field Attendance',
    mark_present: 'Mark Present',
    offline_outbox: 'Offline Mode Outbox',
    submit_completion: 'Submit Completion & Wages',

    // Worker Dashboard
    my_assignments: 'My Job Assignments',
    attendance_history: 'Attendance History',
    wages_earned: 'Wages & Payouts',
    trust_score: 'Trust Score & Rating',

    // Shared / Profile
    profile: 'User Profile & Verification',
    nic_verification: 'National Identity Card (NIC) Verification',
    upload_doc: 'Upload Document',
    rating_reviews: 'Ratings & Reviews',
    rate_job: 'Submit Performance Rating',
  },

  si: {
    app_title: 'කොකොනෙක්ට් (Coconnect)',
    tagline: 'පොල් වගා ශ්‍රම බඳවාගැනීම් සහ එස්ක්‍රෝ ගෙවීම් පද්ධතිය',
    login: 'ඇතුල් වන්න',
    logout: 'ඉවත් වන්න',
    phone_number: 'දුරකථන අංකය',
    enter_phone: 'දුරකථන අංකය ඇතුලත් කරන්න (+94 77 123 4567)',
    send_otp: 'තහවුරු කිරීමේ කේතය යවන්න',
    enter_otp: 'ඉලක්කම් 6 කේතය (OTP) ඇතුලත් කරන්න',
    verify_continue: 'තහවුරු කර ඉදිරියට යන්න',
    demo_accounts: 'ක්ෂණික නිරූපණ ගිණුම්',
    active_role: 'වත්මන් භූමිකාව',
    switch_role: 'භූමිකාව මාරු කරන්න',
    landowner: 'ඉඩම් හිමිකරු (Estate Owner)',
    supervisor: 'ශ්‍රම අධීක්ෂක / තැරැව්කරු',
    worker: 'ක්ෂේත්‍ර ශ්‍රමිකයා',
    admin: 'පරිපාලක පුවරුව (Admin)',

    // Navigation
    nav_home: 'ප්‍රධාන වෙබ් අඩවිය',
    nav_dashboard: 'මගේ පාලක පුවරුව',
    nav_map: 'ක්ෂේත්‍ර GIS සිතියම',
    nav_drive: 'Google Drive උපස්ථය',
    nav_profile: 'පැතිකඩ සහ හැඳුනුම්පත',
    nav_admin: 'පරිපාලක පුවරුව',
    nav_login: 'ඇතුල් වන්න',
    nav_get_started: 'ලියාපදිංචි වන්න',

    // Website & Hero
    hero_badge: 'ශ්‍රී ලංකාවේ ජාතික පොල් ශ්‍රම සම්පත් වේදිකාව',
    hero_title: 'සාධාරණ ශ්‍රම බඳවාගැනීම්, සුරක්ෂිත එස්ක්‍රෝ සහ GIS ක්ෂේත්‍ර මෙහෙයුම්',
    hero_subtitle: 'කුරුණෑගල, පුත්තලම, ගම්පහ ඇතුළු මුළු පොල් ත්‍රිකෝණය පුරා විසිරී සිටින වතු හිමියන්, ශ්‍රමික කණ්ඩායම්, ගස් නගින්නන් සහ අධීක්ෂකයින් එකිනෙක සම්බන්ධ කිරීම.',
    hero_cta_primary: 'භූමිකාව තෝරා ඇතුල් වන්න',
    hero_cta_secondary: 'පොල් ඉඩම් සිතියම ගවේෂණය කරන්න',
    hero_cta_admin: 'කාර්යමණ්ඩල පරිපාලක පිවිසුම (/admin)',

    // Features / Pillars
    features_title: 'ශ්‍රී ලාංකික පොල් කර්මාන්තයේ උපරිම විශ්වාසනීයත්වය වෙනුවෙන්',
    features_subtitle: 'අතරමැදි සූරාකෑම්, ව්‍යාජ කම්කරුවන්, වැටුප් ප්‍රමාදයන් සහ ඉඩම් ආරවුල් වැළැක්වීමට තාක්ෂණික සහ නීතිමය විසඳුම්.',
    feat_escrow_title: '100% එස්ක්‍රෝ මූල්‍ය ආරක්ෂාව',
    feat_escrow_desc: 'වැඩ ආරම්භ කිරීමට පෙර ඉඩම් හිමියා මුදල් එස්ක්‍රෝ ගිණුමේ තැන්පත් කරයි. අතරමැදි ගැටළු වැළැක්වීමට මුදල් තැන්පත් කරන තෙක් දුරකථන අංක සඟවා තබයි.',
    feat_dual_pin_title: 'ද්විත්ව PIN කේත වැටුප් නිදහස් කිරීම',
    feat_dual_pin_desc: 'පොල් කැඩීම සාර්ථකව නිමවූ පසු වතු හිමියා සහ අධීක්ෂකවරයා යන දෙදෙනාම රහස්‍ය 4-ඉලක්කම් PIN කේතය ලබාදුන් විට පමණක් වැටුප් නිදහස් කෙරේ.',
    feat_gis_map_title: 'Google Maps GIS ක්ෂේත්‍ර සිතියම්කරණය',
    feat_gis_map_desc: 'පොල් ඉඩමේ සීමා මායිම්, ගස් ප්‍රමාණය, පොල් පැටවීමේ පිවිසුම් මාර්ග සහ ශ්‍රමික කණ්ඩායම් සිටින ස්ථාන සජීවීව සිතියම්ගත කිරීම.',
    feat_nic_title: 'ශ්‍රී ලංකා ජාතික හැඳුනුම්පත් (NIC) සත්‍යාපනය',
    feat_nic_desc: 'පුද්ගලයන් ලියාපදිංචි කිරීමේ දෙපාර්තමේන්තුවේ ප්‍රමිතීන්ට අනුව පැරණි 9V සහ නව 12-ඉලක්කම් හැඳුනුම්පත් වල ඉදිරිපස සහ පසුපස ඡායාරූප පරීක්ෂාව.',
    feat_trust_title: 'ගතික විශ්වසනීයතා ලකුණු පද්ධතිය',
    feat_trust_desc: 'වේලාවට වැඩ නිමකිරීම, පොල් කැඩීමේ නිරවද්‍යතාවය සහ සාධාරණ හැසිරීම අනුව ගණනය වන ස්වාධීන විශ්වාස ලකුණු.',
    feat_mobile_title: 'නොබැඳි (Offline) ක්‍රියාකාරීත්වය',
    feat_mobile_desc: 'අන්තර්ජාල සංඥා නොමැති දුරස්ථ වතු වලදී පවා දෛනික පැමිණීම සටහන් කළ හැකි අතර සංඥා ලැබුණු වහාම පද්ධතියට යාවත්කාලීන වේ.',

    // Role Cards
    roles_heading: 'පොල් ක්ෂේත්‍රයේ සියලු දෙනාට ගැළපෙන විශේෂිත පාලක පුවරු',
    role_owner_title: 'පොල් ඉඩම් හිමිකරුවන් සඳහා',
    role_owner_desc: 'කුරුණෑගල, පුත්තලම ඇතුළු ප්‍රදේශ වල ඉඩම් ලියාපදිංචි කර, ගස් ගණන දක්වා, ශ්‍රමික කණ්ඩායම් වලින් තරඟකාරී මිල ගණන් ලබාගෙන ආරක්ෂිත එස්ක්‍රෝ ක්‍රමයට වැඩ පවරන්න.',
    role_owner_action: 'වතු හිමිකරු ලෙස පිවිසෙන්න →',
    role_supervisor_title: 'අධීක්ෂකයින් සහ තැරැව්කරුවන් සඳහා',
    role_supervisor_desc: 'ගස් නගින්නන් සහ කම්කරුවන් සංවිධානය කර, විශාල රැකියා සඳහා ලංසු ඉදිරිපත් කර, දෛනික පැමිණීම සටහන් කර සහතික කල කොමිස් මුදල් ලබාගන්න.',
    role_supervisor_action: 'අධීක්ෂක ලෙස පිවිසෙන්න →',
    role_worker_title: 'ගස් නගින්නන් සහ කම්කරුවන් සඳහා',
    role_worker_desc: 'ගසකට සාධාරණ මිලක්, සහතික කළ වැටුප්, විශ්වසනීයත්ව ලකුණු සහ වැඩ නිමවූ වහාම නියමිත වේලාවට මුදල් ලබාගැනීමේ විශ්වාසය.',
    role_worker_action: 'ශ්‍රමිකයෙකු ලෙස පිවිසෙන්න →',

    // Stats
    stat_palms: '14,500+ කළමනාකරණය වන පොල් ගස්',
    stat_escrow: 'රු. මිලියන 8.4+ එස්ක්‍රෝ සුරක්ෂිත කළ මුදල්',
    stat_climbers: '340+ සත්‍යාපිත ගස් නගින්නන්',
    stat_satisfaction: '99.4% ද්විත්ව PIN සාර්ථකත්වය',

    // Admin Portal & Login
    admin_login_title: 'කොකොනෙක්ට් පද්ධති පරිපාලන සහ KYC පාලන මැදිරිය',
    admin_login_subtitle: 'කොකොනෙක්ට් සත්‍යාපන නිලධාරීන්, ආරවුල් විනිසුරුවන් සහ නීතිමය විගණකවරුන් සඳහා පමණක් වෙන්වූ නිල පිවිසුම.',
    admin_email_label: 'කාර්යමණ්ඩල හැඳුනුම් අංකය / විද්‍යුත් තැපෑල',
    admin_pin_label: 'ඉලක්කම් 6ක ආරක්ෂක මුරපදය',
    admin_login_btn: 'තහවුරු කර පරිපාලක පුවරුව විවෘත කරන්න',
    admin_quick_auth: 'ක්ෂණික පිවිසුම (නිලූකා ප්‍රනාන්දු • ජ්‍යෙෂ්ඨ නිලධාරී)',
    back_to_home: '← ප්‍රධාන වෙබ් අඩවියට ආපසු යන්න',
    admin_title: 'කොකොනෙක්ට් කාර්යමණ්ඩල පරිපාලන පාලනය',
    verification_queue: 'හැඳුනුම්පත් සත්‍යාපන පෝලිම',
    exceptions_queue: 'ගැටළු සහ විවාද නිරාකරණ මැදිරිය',
    audit_trail: 'වෙනස් කල නොහැකි විගණන වාර්තා',
    trust_formula: 'විශ්වාසනීයතා සූත්‍ර නීති',

    // Status
    verified: 'සත්‍යාපිතයි',
    pending: 'සත්‍යාපනය වෙමින් පවතී',
    unverified: 'තහවුරු කර නොමැත',
    rejected: 'ප්‍රතික්ෂේපිතයි',
    escrow_held: 'මුදල් එස්ක්‍රෝ ගිණුමේ රඳවා ඇත',
    escrow_released: 'මුදල් නිදහස් කරන ලදී',
    escrow_pending: 'එස්ක්‍රෝ තැන්පතුව අවශ්‍යයි',

    // Owner Dashboard
    my_lands: 'මගේ පොල් ඉඩම් (වතු)',
    add_land: 'නව ඉඩමක් ලියාපදිංචි කරන්න',
    posted_jobs: 'පළ කරන ලද රැකියා',
    post_job: 'නව රැකියාවක් පළ කරන්න',
    bids_received: 'ලැබුණු මිල ගණන්',
    award_job: 'මිල පිළිගෙන එස්ක්‍රෝ තැන්පත් කරන්න',
    escrow_protection: 'එස්ක්‍රෝ ආරක්ෂාව ක්‍රියාත්මකයි',
    contacts_hidden_notice: 'එස්ක්‍රෝ ගෙවීම සිදුකරන තෙක් දුරකථන අංක සඟවා ඇත.',
    contacts_unlocked_notice: 'එස්ක්‍රෝ තහවුරුයි! සම්බන්ධතා විස්තර විවෘත කරන ලදී.',
    confirm_completion: 'වැඩ නිමාව තහවුරු කිරීම',
    enter_pin: 'ඉලක්කම් 4 රහස්‍ය PIN ඇතුලත් කරන්න',

    // Supervisor Dashboard
    crew_roster: 'කණ්ඩායම් ලැයිස්තුව සහ ලබාගත හැකි බව',
    add_worker: 'කැමැත්ත සහිතව ශ්‍රමිකයෙකු එක් කරන්න',
    open_jobs: 'ලබාගත හැකි රැකියා',
    submit_bid: 'කණ්ඩායම් මිල ඉදිරිපත් කරන්න',
    daily_attendance: 'දෛනික ක්ෂේත්‍ර පැමිණීම',
    mark_present: 'පැමිණීම සටහන් කරන්න',
    offline_outbox: 'නොබැඳි (Offline) ක්‍රමය',
    submit_completion: 'වැටුප් වාර්තා සහ නිමාව ඉදිරිපත් කරන්න',

    // Worker Dashboard
    my_assignments: 'මගේ පැවරුම්',
    attendance_history: 'පැමිණීමේ වාර්තා',
    wages_earned: 'උපයාගත් වැටුප්',
    trust_score: 'විශ්වසනීයත්ව ලකුණු',

    // Shared / Profile
    profile: 'පරිශීලක පැතිකඩ සහ හැඳුනුම්පත',
    nic_verification: 'ජාතික හැඳුනුම්පත් (NIC) සත්‍යාපනය',
    upload_doc: 'ලේඛන උඩුගත කරන්න',
    rating_reviews: 'ශ්‍රේණිගත කිරීම් සහ සමාලෝචන',
    rate_job: 'ශ්‍රේණිගත කිරීම ලබා දෙන්න',
  },

  ta: {
    app_title: 'கொகனெக்ட் (Coconnect)',
    tagline: 'தென்னை துறை தொழிலாளர் நியமனம் மற்றும் எஸ்க்ரோ தளம்',
    login: 'உள்நுழைக',
    logout: 'வெளியேறுக',
    phone_number: 'தொலைபேசி எண்',
    enter_phone: 'தொலைபேசி எண்ணை உள்ளிடவும் (+94 77 123 4567)',
    send_otp: 'சரிபார்ப்புக் குறியீட்டை அனுப்புக',
    enter_otp: '6 இலக்க OTP குறியீட்டை உள்ளிடவும்',
    verify_continue: 'சரிபார்த்து தொடரவும்',
    demo_accounts: 'உடனடி மாதிரி கணக்குகள்',
    active_role: 'தற்போதைய பதவி',
    switch_role: 'பதவியை மாற்றுக',
    landowner: 'நில உரிமையாளர் (தோட்ட உரிமையாளர்)',
    supervisor: 'மேற்பார்வையாளர் / தொழிலாளர் தரகர்',
    worker: 'விவசாய தொழிலாளி',
    admin: 'நிர்வாகக் குழு (Admin)',

    // Navigation
    nav_home: 'முகப்பு வலைத்தளம்',
    nav_dashboard: 'எனது கட்டுப்பாட்டு பலகை',
    nav_map: 'GIS வரைபடம்',
    nav_drive: 'Google Drive காப்புநகல்',
    nav_profile: 'விவரக்குறிப்பு & அடையாள அட்டை',
    nav_admin: 'நிர்வாக பலகை',
    nav_login: 'உள்நுழைக',
    nav_get_started: 'தொடங்குக',

    // Website & Hero
    hero_badge: 'இலங்கையின் தேசிய தென்னை தொழிலாளர் தளம்',
    hero_title: 'நியாயமான கூலி, பாதுகாக்கப்பட்ட எஸ்க்ரோ & GIS கள வரைபடம்',
    hero_subtitle: 'குருநாகல், புத்தளம், கம்பஹா மற்றும் இலங்கை தென்னை முக்கோணத்தில் உள்ள தோட்ட உரிமையாளர்களையும் சரிபார்க்கப்பட்ட தொழிலாளர் குழுக்களையும் இணைக்கும் நம்பகமான தளம்.',
    hero_cta_primary: 'பதவியைத் தேர்ந்தெடுத்து உள்நுழைக',
    hero_cta_secondary: 'தென்னை நில வரைபடத்தை ஆராய்க',
    hero_cta_admin: 'ஊழியர் நிர்வாக போர்ட்டல் (/admin)',

    // Features / Pillars
    features_title: 'இலங்கை தென்னை விவசாயத்தில் நம்பிக்கையை உருவாக்குகிறது',
    features_subtitle: 'இடைத்தரகர்களின் சுரண்டல், போலி தொழிலாளர்கள், தாமதமான சம்பளம் மற்றும் எல்லைப் பிரச்சினைகளை தொழில்நுட்பம் மூலம் முற்றாக தவிர்க்கிறது.',
    feat_escrow_title: '100% எஸ்க்ரோ நிதி பாதுகாப்பு',
    feat_escrow_desc: 'வேலை தொடங்குவதற்கு முன் தோட்ட உரிமையாளர் எஸ்க்ரோவில் பணத்தை டெபாசிட் செய்கிறார். பணம் செலுத்தப்படும் வரை தொலைபேசி எண்கள் மறைக்கப்பட்டு சுரண்டல் தடுக்கப்படும்.',
    feat_dual_pin_title: 'இருவழி PIN குறியீடு கூலி வழங்கல்',
    feat_dual_pin_desc: 'தேங்காய் பறிக்கும் வேலை முழுமையாக திருப்திகரமாக முடிந்ததும், உரிமையாளர் மற்றும் மேற்பார்வையாளர் இருவரும் 4 இலக்க இரகசிய PIN குறியீட்டை உள்ளிட்ட பின்னரே கூலி விடுவிக்கப்படும்.',
    feat_gis_map_title: 'Google Maps GIS கள வரைபடம்',
    feat_gis_map_desc: 'தென்னை தோட்ட எல்லைகள், மரங்களின் எண்ணிக்கை, தேங்காய் ஏற்றிச் செல்லும் வழிகள் மற்றும் களத்தில் உள்ள தொழிலாளர்களை நிகழ்நேரத்தில் வரைபடமாக்குதல்.',
    feat_nic_title: 'இலங்கை தேசிய அடையாள அட்டை (NIC) சரிபார்ப்பு',
    feat_nic_desc: 'பதிவுத் திணைக்களத்தின் தரத்திற்கேற்ப பழைய 9V மற்றும் புதிய 12 இலக்க ஸ்மார்ட் அடையாள அட்டைகளின் முன் மற்றும் பின் பக்கங்களை முழுமையாக ஆய்வு செய்தல்.',
    feat_trust_title: 'நம்பகத்தன்மை மதிப்பெண் விதிமுறைகள்',
    feat_trust_desc: 'நேரத்திற்கு வேலை முடித்தல், மரத்தில் ஏறுதல் தரம், வருகை பதிவு ஆகியவற்றின் அடிப்படையில் வெளிப்படையான மதிப்பெண் கணக்கீடு.',
    feat_mobile_title: 'இணையமில்லா ஆஃப்லைன் (Offline) முறை',
    feat_mobile_desc: 'தொலைதூர கிராமப்புற தோட்டங்களில் இணையம் இல்லாதபோதும் தொழிலாளர்களின் வருகையை பதிவு செய்யலாம்; இணைய இணைப்பு கிடைத்ததும் தானாக ஒத்திசைக்கப்படும்.',

    // Role Cards
    roles_heading: 'தென்னைத் துறையின் ஒவ்வொருவருக்கும் பிரத்தியேக தளங்கள்',
    role_owner_title: 'தென்னை தோட்ட உரிமையாளர்களுக்கு',
    role_owner_desc: 'உங்கள் நிலங்களை பதிவு செய்து, மரங்களின் எண்ணிக்கையை குறிப்பிட்டு, குழுக்களிடமிருந்து நியாயமான ஏலங்களை பெற்று எஸ்க்ரோ மூலம் பாதுகாப்பாக வேலை ஒதுக்குங்கள்.',
    role_owner_action: 'உரிமையாளராக உள்நுழைக →',
    role_supervisor_title: 'மேற்பார்வையாளர்கள் மற்றும் தரகர்களுக்கு',
    role_supervisor_desc: 'மரம் ஏறுபவர்கள் மற்றும் தொழிலாளர் பட்டியலை நிர்வகித்து, ஏலங்களை வென்று, தினசரி வருகையை பதிவு செய்து உத்தரவாதமான கமிஷனைப் பெறுங்கள்.',
    role_supervisor_action: 'மேற்பார்வையாளராக உள்நுழைக →',
    role_worker_title: 'மரம் ஏறுபவர்கள் மற்றும் தொழிலாளர்களுக்கு',
    role_worker_desc: 'ஒரு மரத்திற்கு நியாயமான கூலி, சரிபார்க்கப்பட்ட வருகை, வெளிப்படையான நம்பிக்கை மதிப்பெண் மற்றும் சரியான நேரத்தில் பணத்தைப் பெறுங்கள்.',
    role_worker_action: 'தொழிலாளியாக உள்நுழைக →',

    // Stats
    stat_palms: '14,500+ நிர்வகிக்கப்படும் தென்னை மரங்கள்',
    stat_escrow: 'ரூ. 8.4M+ எஸ்க்ரோ பாதுகாக்கப்பட்ட நிதி',
    stat_climbers: '340+ சரிபார்க்கப்பட்ட தொழிலாளர்கள்',
    stat_satisfaction: '99.4% இருவழி PIN வெற்றி விகிதம்',

    // Admin Portal & Login
    admin_login_title: 'கொகனெக்ட் கணினி நிர்வாகம் மற்றும் KYC மேசை',
    admin_login_subtitle: 'கொகனெக்ட் சரிபார்ப்பு அதிகாரிகள் மற்றும் நடுவர்களுக்கான பிரத்தியேக அதிகாரபூர்வ அனுமதி.',
    admin_email_label: 'ஊழியர் அடையாள எண் / உத்தியோகபூர்வ மின்னஞ்சல்',
    admin_pin_label: '6 இலக்க பாதுகாப்பு கடவுச்சொல்',
    admin_login_btn: 'உறுதிசெய்து நிர்வாக போர்ட்டலை திறக்கவும்',
    admin_quick_auth: 'உடனடி உள்நுழைவு (நிலுகா பெர்னாண்டோ • சிரேஷ்ட அதிகாரி)',
    back_to_home: '← பொது வலைத்தளத்திற்கு திரும்புக',
    admin_title: 'கொகனெக்ட் ஊழியர் நிர்வாக கட்டுப்பாடு',
    verification_queue: 'அடையாள அட்டை சரிபார்ப்பு வரிசை',
    exceptions_queue: 'சர்ச்சை தீர்வு மேசை',
    audit_trail: 'மாற்ற முடியாத தணிக்கை பதிவுகள்',
    trust_formula: 'நம்பகத்தன்மை சூத்திர விதிகள்',

    // Status
    verified: 'சரிபார்க்கப்பட்டது',
    pending: 'சரிபார்ப்பு நிலுவையில் உள்ளது',
    unverified: 'சரிபார்க்கப்படவில்லை',
    rejected: 'நிராகரிக்கப்பட்டது',
    escrow_held: 'பணம் எஸ்க்ரோவில் உள்ளது',
    escrow_released: 'பணம் விடுவிக்கப்பட்டது',
    escrow_pending: 'எஸ்க்ரோ வைப்பு தேவை',

    // Owner Dashboard
    my_lands: 'எனது தென்னை நிலங்கள் (தோட்டங்கள்)',
    add_land: 'புதிய நிலத்தை பதிவு செய்க',
    posted_jobs: 'பதிவு செய்யப்பட்ட வேலைகள்',
    post_job: 'புதிய வேலையை இடுகையிடுக',
    bids_received: 'பெறப்பட்ட ஏலங்கள்',
    award_job: 'ஏலத்தை ஏற்று எஸ்க்ரோ செலுத்துக',
    escrow_protection: 'எஸ்க்ரோ பாதுகாப்பு செயலில் உள்ளது',
    contacts_hidden_notice: 'எஸ்க்ரோ கட்டணம் செலுத்தப்படும் வரை தொடர்பு எண்கள் மறைக்கப்படும்.',
    contacts_unlocked_notice: 'எஸ்க்ரோ செலுத்தப்பட்டது! நேரடி தொடர்பு விவரங்கள் திறக்கப்பட்டன.',
    confirm_completion: 'இருவழி வேலை முடிவை உறுதிசெய்க',
    enter_pin: '4 இலக்க ரகசிய PIN குறியீட்டை உள்ளிடவும்',

    // Supervisor Dashboard
    crew_roster: 'குழு பட்டியல் மற்றும் இருப்பு',
    add_worker: 'சம்மதத்துடன் தொழிலாளியை சேர்க்கவும்',
    open_jobs: 'கிடைக்கக்கூடிய வேலைகள்',
    submit_bid: 'குழு ஏலத்தை சமர்ப்பிக்கவும்',
    daily_attendance: 'தினசரி கள வருகை',
    mark_present: 'வருகையை பதிவு செய்க',
    offline_outbox: 'இணையமில்லா (Offline) அவுட்பாக்ஸ்',
    submit_completion: 'கூலி மற்றும் முடிவை சமர்ப்பிக்கவும்',

    // Worker Dashboard
    my_assignments: 'எனது வேலை ஒதுக்கீடுகள்',
    attendance_history: 'வருகை வரலாறு',
    wages_earned: 'ஈட்டிய ஊதியம்',
    trust_score: 'நம்பகத்தன்மை மதிப்பெண்',

    // Shared / Profile
    profile: 'பயனர் சுயவிவரம் மற்றும் அடையாள அட்டை',
    nic_verification: 'தேசிய அடையாள அட்டை (NIC) சரிபார்ப்பு',
    upload_doc: 'ஆவணத்தை பதிவேற்றவும்',
    rating_reviews: 'மதிப்பீடுகள் மற்றும் விமர்சனங்கள்',
    rate_job: 'மதிப்பீட்டை சமர்ப்பிக்கவும்',
  }
};
