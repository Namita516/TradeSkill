export const getCanonicalId = (obj) => {
  if (!obj) return 'unknown';
  const val = obj.userId || obj.id || obj.email || obj.emailAddress || obj.name || obj;
  return String(val || 'unknown').toLowerCase();
};

export const canonicalFromParts = (...parts) => {
  return parts.map(p => String(p || '').toLowerCase()).filter(Boolean).join('_');
};

export default getCanonicalId;
