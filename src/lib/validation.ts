
export const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string) => {
  // Indonesian phone number format or international
  return /^(^\+62|62|08)[0-9]{7,15}$/.test(phone.replace(/\s/g, ''));
};

export const isDateInPast = (dateStr: string) => {
  if (!dateStr) return true;
  const date = new Date(dateStr);
  const now = new Date();
  return date <= now;
};

export const isDateRecent = (dateStr: string, monthsPast = 12, monthsFuture = 3) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  
  const minDate = new Date();
  minDate.setMonth(now.getMonth() - monthsPast);
  
  const maxDate = new Date();
  maxDate.setMonth(now.getMonth() + monthsFuture);
  
  return date >= minDate && date <= maxDate;
};
