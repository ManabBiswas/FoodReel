/**
 * Display name for a user or partner record.
 */
export const displayName = (person, fallback = 'User') => {
  if (!person) return fallback;

  // Partner records
  if (person.companyName) return person.companyName;

  // A display name, if some endpoint already composes one for us
  if (person.name) return person.name;

  const first = person.firstName || person.firstname || '';
  const last = person.lastName || person.lastname || '';

  if (first || last) return `${first} ${last}`.trim();

  // Username-style accounts
  if (person.username) return person.username;

  return person.email || fallback;
};

/** First letter for avatar fallbacks. */
export const displayInitial = (person, fallback = 'U') =>
  displayName(person)?.[0]?.toUpperCase() || fallback;

export default displayName;