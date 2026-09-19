export type Language = 'en' | 'si';

export const translations = {
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
    
    // Status
    verified: 'Verified',
    pending: 'Pending Verification',
    unverified: 'Unverified',
    rejected: 'Rejected',
    escrow_held: 'Funds in Escrow',
    escrow_released: 'Funds Released',
    escrow_pending: 'Escrow Required',
    
    // Owner
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
    
    // Supervisor
    crew_roster: 'Crew Roster & Availability',
    add_worker: 'Register Worker with Consent',
    open_jobs: 'Available Labour Jobs',
    submit_bid: 'Submit Crew Bid',
    daily_attendance: 'Daily Field Attendance',
    mark_present: 'Mark Present',
    offline_outbox: 'Offline Mode Outbox',
    submit_completion: 'Submit Completion & Wages',
    
    // Worker
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
    
    // Admin
    admin_title: 'Coconnect Staff Admin Control',
    verification_queue: 'Identity Verification Queue',
    exceptions_queue: 'Exceptions & Disputes Queue',
    audit_trail: 'Immutable Audit Trail',
    trust_formula: 'Trust Score Formula Rules',
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
    
    // Status
    verified: 'සත්‍යාපිතයි',
    pending: 'සත්‍යාපනය වෙමින් පවතී',
    unverified: 'තහවුරු කර නොමැත',
    rejected: 'ප්‍රතික්ෂේපිතයි',
    escrow_held: 'මුදල් එස්ක්‍රෝ ගිණුමේ රඳවා ඇත',
    escrow_released: 'මුදල් නිදහස් කරන ලදී',
    escrow_pending: 'එස්ක්‍රෝ තැන්පතුව අවශ්‍යයි',
    
    // Owner
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
    
    // Supervisor
    crew_roster: 'කණ්ඩායම් ලැයිස්තුව සහ ලබාගත හැකි බව',
    add_worker: 'කැමැත්ත සහිතව ශ්‍රමිකයෙකු එක් කරන්න',
    open_jobs: 'ලබාගත හැකි රැකියා',
    submit_bid: 'කණ්ඩායම් මිල ඉදිරිපත් කරන්න',
    daily_attendance: 'දෛනික ක්ෂේත්‍ර පැමිණීම',
    mark_present: 'පැමිණීම සටහන් කරන්න',
    offline_outbox: 'නොබැඳි (Offline) ක්‍රමය',
    submit_completion: 'වැටුප් වාර්තා සහ නිමාව ඉදිරිපත් කරන්න',
    
    // Worker
    my_assignments: 'මගේ පැවරුම්',
    attendance_history: 'පැමිණීමේ වාර්තා',
    wages_earned: 'උපයාගත් වැටුප්',
    trust_score: 'විශ්වසනීයත්ව ලකුණු',
    
    // Shared / Profile
    profile: 'පරිශීලක පැතිකඩ',
    nic_verification: 'ජාතික හැඳුනුම්පත් (NIC) සත්‍යාපනය',
    upload_doc: 'ලේඛන උඩුගත කරන්න',
    rating_reviews: 'ශ්‍රේණිගත කිරීම්',
    rate_job: 'ශ්‍රේණිගත කිරීම ලබා දෙන්න',
    
    // Admin
    admin_title: 'කොකොනෙක්ට් පරිපාලක පාලන මැදිරිය',
    verification_queue: 'හැඳුනුම්පත් සත්‍යාපන පෝලිම',
    exceptions_queue: 'ගැටළු සහ විවාද නිරාකරණය',
    audit_trail: 'වෙනස් කල නොහැකි විගණන වාර්තා',
    trust_formula: 'විශ්වාසනීයතා සූත්‍ර නීති',
  }
};
