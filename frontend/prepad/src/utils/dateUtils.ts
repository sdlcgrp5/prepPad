// Utility function to generate month/year options for the date dropdowns in MM/YYYY format
// Returns options in descending order (newest to oldest)
export const generateMonthYearOptions = () => {
  // Use current date from the system
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const options = [];
  
  // Generate options for the current year and past 9 years (10 years total)
  for (let yearOffset = 0; yearOffset < 10; yearOffset++) {
    const year = currentYear - yearOffset;
    
    // For current year, only include months up to current month
    // For past years, include all months
    const startMonth = yearOffset === 0 ? currentMonth : 11; // Start from current month or December
    const endMonth = 0; // End with January (0-indexed)
    
    // Loop through months in descending order
    for (let month = startMonth; month >= endMonth; month--) {
      // Format: MM/YYYY (month is 1-indexed for display)
      const monthNumber = month + 1;
      const value = `${year}-${month.toString().padStart(2, '0')}`;
      const display = `${monthNumber.toString().padStart(2, '0')}/${year}`;
      
      options.push({ value, display });
    }
  }
  
  return options;
};