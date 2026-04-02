// =============================================================================
// PII Nickname Generator
// =============================================================================
// Maps PII tokens (or any name string) to consistent fake nicknames.
// Nicknames match the cultural/gender profile of the original but carry zero
// PII risk, allowing internal teams to discuss cases using stable aliases.
//
// Usage:
//   getNickname('PII-AL7U')            -> deterministic alias
//   getNickname('PII-AL7U', 'female', 'arabic')  -> culturally matched alias
//   getNickname('Smita Patil')         -> hash-based alias (for demo data)
// =============================================================================

/* ---- Name pools ---- */

const ARABIC_MALE = [
  'Saeed Al Rashidi', 'Hamdan Al Ketbi', 'Sultan Al Qasimi', 'Omar Al Suwaidi',
  'Rashid Al Falasi', 'Khalid Al Shamsi', 'Ahmed Al Zaabi', 'Faisal Al Muhairi',
  'Mansoor Al Nuaimi', 'Tariq Al Dhaheri', 'Nasser Al Marzooqi', 'Yousef Al Ameri',
  'Majid Al Balooshi', 'Waleed Al Kaabi', 'Jamal Al Mansoori', 'Hasan Al Shehi',
  'Ibrahim Al Hosani', 'Saif Al Hammadi', 'Zayed Al Romaithi', 'Abdulla Al Tayer',
];

const ARABIC_FEMALE = [
  'Shamsa Al Nuaimi', 'Mozah Al Maktoum', 'Latifa Al Falasi', 'Mariam Al Suwaidi',
  'Fatima Al Ketbi', 'Noura Al Qasimi', 'Hessa Al Shamsi', 'Amna Al Zaabi',
  'Reem Al Muhairi', 'Shaikha Al Dhaheri', 'Maryam Al Marzooqi', 'Ayesha Al Ameri',
  'Salama Al Balooshi', 'Maitha Al Kaabi', 'Khawla Al Mansoori', 'Asma Al Shehi',
  'Rawdha Al Hosani', 'Jawaher Al Hammadi', 'Meera Al Romaithi', 'Sara Al Tayer',
];

const INDIAN_MALE = [
  'Kiran Salve', 'Vivek Malhotra', 'Nikhil Sharma', 'Amit Deshmukh',
  'Rohan Kulkarni', 'Suresh Iyer', 'Arjun Reddy', 'Deepak Mehta',
  'Rajesh Nair', 'Sanjay Gupta', 'Manoj Pillai', 'Vikram Chauhan',
  'Anil Banerjee', 'Prashant Joshi', 'Ramesh Srinivasan', 'Gaurav Bhat',
  'Ashwin Rao', 'Naveen Das', 'Sachin Verma', 'Harish Menon',
];

const INDIAN_FEMALE = [
  'Ananya Desai', 'Kavya Menon', 'Riya Kapoor', 'Priya Sharma',
  'Sneha Nair', 'Divya Iyer', 'Pooja Reddy', 'Meera Gupta',
  'Swati Kulkarni', 'Neha Joshi', 'Pallavi Mehta', 'Shruti Pillai',
  'Anjali Banerjee', 'Sunita Rao', 'Rekha Srinivasan', 'Nandini Bhat',
  'Deepa Das', 'Vidya Chauhan', 'Asha Verma', 'Lakshmi Menon',
];

const WESTERN_MALE = [
  'Daniel Foster', 'Ryan Mitchell', 'Andrew Clark', 'James Peterson',
  'Michael Turner', 'Robert Spencer', 'Thomas Bennett', 'William Hayes',
  'Christopher Grant', 'Matthew Cooper', 'David Brooks', 'Steven Porter',
  'Richard Sullivan', 'Kevin Murphy', 'Brian Taylor', 'Patrick Walsh',
  'Jason Campbell', 'Mark Henderson', 'Scott Russell', 'Paul Morgan',
];

const WESTERN_FEMALE = [
  'Rachel Adams', 'Emily Turner', 'Sophie Bennett', 'Jessica Cooper',
  'Laura Mitchell', 'Sarah Spencer', 'Hannah Clark', 'Megan Hayes',
  'Olivia Grant', 'Emma Brooks', 'Chloe Porter', 'Rebecca Sullivan',
  'Nicole Murphy', 'Stephanie Taylor', 'Katherine Walsh', 'Victoria Campbell',
  'Samantha Henderson', 'Lauren Russell', 'Michelle Morgan', 'Amanda Foster',
];

type NationalityKey = 'arabic' | 'indian' | 'western';
type GenderKey = 'male' | 'female';

const NAME_POOLS: Record<NationalityKey, Record<GenderKey, string[]>> = {
  arabic:  { male: ARABIC_MALE,  female: ARABIC_FEMALE  },
  indian:  { male: INDIAN_MALE,  female: INDIAN_FEMALE  },
  western: { male: WESTERN_MALE, female: WESTERN_FEMALE },
};

/* ---- Deterministic hash ---- */

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0; // Convert to 32-bit int
  }
  return Math.abs(hash);
}

/* ---- Nationality guesser (best-effort from the name string) ---- */

function guessNationality(name: string): NationalityKey {
  const lower = name.toLowerCase();
  // Arabic indicators
  if (/\b(al[- ]|bin |bint |abd |abu |mohammed|ahmed|fatima|khalid|omar)\b/i.test(lower)) return 'arabic';
  if (/\b(khan|sheikh|sultan)\b/i.test(lower)) return 'arabic';
  // Indian indicators
  if (/\b(kumar|singh|sharma|patel|gupta|nair|reddy|iyer|desai|pillai|menon|kapoor|banerjee|joshi|verma|chauhan|mehta|rao|das|bhat|patil|kulkarni|deshmukh|srinivasan)\b/i.test(lower)) return 'indian';
  if (/\b(priya|ananya|kavya|riya|sneha|divya|pooja|meera|swati|neha|vivek|nikhil|amit|rohan|suresh|arjun|deepak|rajesh|sanjay|manoj|vikram)\b/i.test(lower)) return 'indian';
  // Default to western
  return 'western';
}

/* ---- Gender guesser (best-effort) ---- */

function guessGender(name: string): GenderKey {
  const first = name.split(/\s+/)[0]?.toLowerCase() || '';
  // Common female endings / names
  const femalePatterns = /^(fatima|mariam|noura|shamsa|mozah|latifa|hessa|amna|reem|shaikha|maryam|ayesha|salama|maitha|khawla|asma|rawdha|jawaher|meera|sara|ananya|kavya|riya|priya|sneha|divya|pooja|meera|swati|neha|pallavi|shruti|anjali|sunita|rekha|nandini|deepa|vidya|asha|lakshmi|rachel|emily|sophie|jessica|laura|sarah|hannah|megan|olivia|emma|chloe|rebecca|nicole|stephanie|katherine|victoria|samantha|lauren|michelle|amanda|smita|geeta|seema|padma|radha|indira|sushma|savitri)$/;
  if (femalePatterns.test(first)) return 'female';
  // Common male patterns
  const malePatterns = /^(ahmed|mohammed|khalid|omar|rashid|sultan|hamdan|faisal|mansoor|tariq|nasser|yousef|majid|waleed|jamal|hasan|ibrahim|saif|zayed|abdulla|saeed|kiran|vivek|nikhil|amit|rohan|suresh|arjun|deepak|rajesh|sanjay|manoj|vikram|anil|prashant|ramesh|gaurav|ashwin|naveen|sachin|harish|daniel|ryan|andrew|james|michael|robert|thomas|william|christopher|matthew|david|steven|richard|kevin|brian|patrick|jason|mark|scott|paul)$/;
  if (malePatterns.test(first)) return 'male';
  // Fallback: hash-based (deterministic)
  return simpleHash(name) % 2 === 0 ? 'male' : 'female';
}

/* ---- Session cache ---- */

const nicknameCache = new Map<string, string>();

/* ---- Public API ---- */

/**
 * Generate a deterministic, culturally-appropriate nickname for a PII value.
 *
 * @param token   The PII token or real name string to alias
 * @param gender  Optional gender hint ('male' | 'female')
 * @param nationality Optional nationality hint ('arabic' | 'indian' | 'western')
 * @returns A consistent fake name
 */
export function getNickname(
  token: string,
  gender?: GenderKey,
  nationality?: NationalityKey,
): string {
  if (!token) return '';

  const cacheKey = `${token}|${gender || ''}|${nationality || ''}`;
  const cached = nicknameCache.get(cacheKey);
  if (cached) return cached;

  const nat = nationality || guessNationality(token);
  const gen = gender || guessGender(token);
  const pool = NAME_POOLS[nat][gen];
  const idx = simpleHash(token) % pool.length;
  const nickname = pool[idx];

  nicknameCache.set(cacheKey, nickname);
  return nickname;
}

/**
 * Clear the session nickname cache (useful on logout).
 */
export function clearNicknameCache(): void {
  nicknameCache.clear();
}
