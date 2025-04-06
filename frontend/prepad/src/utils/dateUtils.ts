// Utility function to generate month/year options for the date dropdowns in MM/YYYY format
export const generateMonthYearOptions = () => {
  // Use current date from the system
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const options = [];
  
  // Generate options for the past 10 years including current year
  for (let yearOffset = 0; yearOffset < 10; yearOffset++) {
    const year = currentYear - yearOffset;
    
    // For current year, only include months up to current month
    const monthLimit = yearOffset === 0 ? currentMonth + 1 : 12;
    
    for (let month = 0; month < monthLimit; month++) {
      // Format: MM/YYYY (month is 1-indexed for display)
      const monthNumber = month + 1;
      const value = `${year}-${month.toString().padStart(2, '0')}`;
      const display = `${monthNumber.toString().padStart(2, '0')}/${year}`;
      
      options.push({ value, display });
    }
  }
  
  return options;
};