/**
 * Calculate age from birthdate
 * @param birthdate - Birthdate string in format YYYY-MM-DD or any valid date string
 * @returns Age in years, or null if birthdate is invalid
 */
export const calculateAge = (birthdate: string | null | undefined): number | null => {
  if (!birthdate) return null;

  try {
    const birth = new Date(birthdate);
    const today = new Date();

    // Check if birthdate is valid
    if (isNaN(birth.getTime())) return null;

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Adjust age if birth month hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  } catch (error) {
    return null;
  }
};