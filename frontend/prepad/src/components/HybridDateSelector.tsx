import React, { useState, useEffect, useRef } from 'react';

interface DateSelectorProps {
  name: string;
  value: string;
  onChange: (e: any) => void;
  placeholder: string;
  allowPresent?: boolean;
}

const HybridDateSelector: React.FC<DateSelectorProps> = ({ 
  name, 
  value, 
  onChange, 
  placeholder,
  allowPresent = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Generate the options for the dropdown
  const generateDateOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Generate options for the past 10 years in descending order (newest first)
    for (let yearOffset = 0; yearOffset < 10; yearOffset++) {
      const year = currentYear - yearOffset;
      
      const startMonth = yearOffset === 0 ? currentMonth : 11; // Start from current month or December
      const endMonth = 0; // End with January
      
      // Loop through months in descending order
      for (let month = startMonth; month >= endMonth; month--) {
        const monthNum = month + 1; // Convert 0-indexed to 1-indexed
        const value = `${year}-${month.toString().padStart(2, '0')}`;
        const display = `${monthNum.toString().padStart(2, '0')}/${year}`;
        
        options.push({ value, display });
      }
    }
    
    return options;
  };
  
  const dateOptions = generateDateOptions();
  
  // Set initial input value based on the value prop
  useEffect(() => {
    if (value) {
      if (value === 'present') {
        setInputValue('Present');
      } else {
        const [year, month] = value.split('-');
        const monthNum = parseInt(month, 10) + 1; // Convert 0-indexed to 1-indexed
        setInputValue(`${monthNum.toString().padStart(2, '0')}/${year}`);
      }
    } else {
      setInputValue('');
    }
  }, [value]);
  
  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // When input changes, try to parse the date
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Try to parse as MM/YYYY
    const regexSlash = /^(\d{1,2})\/(\d{4})$/;
    const regexHyphen = /^(\d{1,2})-(\d{4})$/;
    const matchSlash = newValue.match(regexSlash);
    const matchHyphen = newValue.match(regexHyphen);
    const match = matchSlash || matchHyphen;
    
    if (match) {
      const month = parseInt(match[1], 10) - 1; // Convert to 0-indexed
      const year = parseInt(match[2], 10);
      const currentYear = new Date().getFullYear();
      
      // Validate month and year
      if (month >= 0 && month <= 11 && year >= 1900 && year <= currentYear) {
        // Create the value in format expected by the form (YYYY-MM)
        const formattedValue = `${year}-${month.toString().padStart(2, '0')}`;
        
        // Format the display value consistently as MM/YYYY
        setInputValue(`${(month + 1).toString().padStart(2, '0')}/${year}`);
        
        // Create a synthetic event to pass to the onChange handler
        const syntheticEvent = {
          target: {
            name,
            value: formattedValue
          }
        };
        
        onChange(syntheticEvent);
      }
    } else if (newValue.toLowerCase() === 'present' && allowPresent) {
      // Handle "present" as a special case
      const syntheticEvent = {
        target: {
          name,
          value: 'present'
        }
      };
      
      onChange(syntheticEvent);
    } else if (newValue === '') {
      // Handle empty input
      const syntheticEvent = {
        target: {
          name,
          value: ''
        }
      };
      
      onChange(syntheticEvent);
    }
  };
  
  // Handle selecting an option from the dropdown
  const handleSelectOption = (optionValue: string) => {
    // Find the option to get its display value
    const option = dateOptions.find(opt => opt.value === optionValue);
    
    if (option) {
      setInputValue(option.display);
    }
    
    // Create a synthetic event
    const syntheticEvent = {
      target: {
        name,
        value: optionValue
      }
    };
    
    onChange(syntheticEvent);
    setIsOpen(false);
  };
  
  // Handle selecting "Present" for end date
  const handleSelectPresent = () => {
    setInputValue('Present');
    
    const syntheticEvent = {
      target: {
        name,
        value: 'present'
      }
    };
    
    onChange(syntheticEvent);
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          name={name}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onClick={() => setIsOpen(true)}
          className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div 
          className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto">
          {allowPresent && (
            <div 
              className="px-4 py-2 hover:bg-purple-700 cursor-pointer text-white"
              onClick={handleSelectPresent}
            >
              Present
            </div>
          )}
          
          {dateOptions.map((option, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-purple-700 cursor-pointer text-white"
              onClick={() => handleSelectOption(option.value)}
            >
              {option.display}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HybridDateSelector;