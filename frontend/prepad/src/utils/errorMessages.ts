/**
 * Utility functions to convert technical error messages to user-friendly messages
 */

export interface ErrorMapping {
  pattern: RegExp | string;
  message: string;
}

// Common Django validation error mappings
const djangoErrorMappings: ErrorMapping[] = [
  // URL validation errors
  {
    pattern: /job_posting_url.*Enter a valid URL/i,
    message: 'Invalid URL. Please enter a valid job posting URL.'
  },
  {
    pattern: /job_posting_url.*This field is required/i,
    message: 'Job posting URL is required. Please enter the job URL.'
  },
  
  // File validation errors
  {
    pattern: /file.*No file was submitted/i,
    message: 'Please upload your resume file.'
  },
  {
    pattern: /file.*The submitted file is empty/i,
    message: 'Your resume file appears to be empty. Please upload a valid file.'
  },
  {
    pattern: /file.*Upload a valid/i,
    message: 'Please upload a valid PDF or Word document.'
  },
  {
    pattern: /file.*File too large/i,
    message: 'Your resume file is too large. Please upload a file smaller than 10MB.'
  },
  
  // Authentication errors
  {
    pattern: /unauthorized|authentication/i,
    message: 'Session expired. Please refresh the page and try again.'
  },
  {
    pattern: /permission denied|forbidden/i,
    message: 'You do not have permission to perform this action.'
  },
  
  // Privacy/PII errors
  {
    pattern: /anonymize_pii.*required/i,
    message: 'Privacy settings error. Please try again.'
  },
  
  // Network/connection errors
  {
    pattern: /network error|connection/i,
    message: 'Connection error. Please check your internet connection and try again.'
  },
  {
    pattern: /timeout/i,
    message: 'Request timed out. Please try again.'
  },
  {
    pattern: /server error|500/i,
    message: 'Service temporarily unavailable. Please try again in a few minutes.'
  },
  
  // Generic Django errors
  {
    pattern: /django.*error/i,
    message: 'Analysis service is temporarily unavailable. Please try again.'
  },
  {
    pattern: /bad request|400/i,
    message: 'Invalid request. Please check your inputs and try again.'
  }
];

// General error patterns
const generalErrorMappings: ErrorMapping[] = [
  {
    pattern: /failed to fetch|fetch.*failed/i,
    message: 'Unable to connect to the service. Please check your internet connection.'
  },
  {
    pattern: /json.*parse|parse.*json/i,
    message: 'Service response error. Please try again.'
  },
  {
    pattern: /analysis.*not found|data.*not found/i,
    message: 'Analysis could not be completed. Please try again.'
  }
];

/**
 * Convert a technical error message to a user-friendly message
 */
export function getUserFriendlyError(error: string | Error): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Remove technical prefixes and clean up the message
  const cleanedError = errorMessage
    .replace(/^Error:\s*/i, '')
    .replace(/^Django\s+/i, '')
    .replace(/backend\s+error:\s*/i, '')
    .trim();

  // Try to parse Django validation errors
  const djangoValidationMatch = cleanedError.match(/(\d+)\s*-\s*({.*})/);
  if (djangoValidationMatch) {
    try {
      const errorData = JSON.parse(djangoValidationMatch[2]);
      return parseDjangoValidationErrors(errorData);
    } catch (e) {
      // Fall through to general mapping if JSON parsing fails
    }
  }

  // Check Django-specific mappings first
  for (const mapping of djangoErrorMappings) {
    if (typeof mapping.pattern === 'string') {
      if (cleanedError.toLowerCase().includes(mapping.pattern.toLowerCase())) {
        return mapping.message;
      }
    } else if (mapping.pattern.test(cleanedError)) {
      return mapping.message;
    }
  }

  // Check general error mappings
  for (const mapping of generalErrorMappings) {
    if (typeof mapping.pattern === 'string') {
      if (cleanedError.toLowerCase().includes(mapping.pattern.toLowerCase())) {
        return mapping.message;
      }
    } else if (mapping.pattern.test(cleanedError)) {
      return mapping.message;
    }
  }

  // If no mapping found, return a generic user-friendly message
  if (cleanedError.length > 100 || /[{}[\]]/g.test(cleanedError)) {
    return 'Something went wrong. Please try again or contact support if the problem persists.';
  }

  // Return cleaned error if it's already reasonably user-friendly
  return cleanedError.charAt(0).toUpperCase() + cleanedError.slice(1);
}

/**
 * Parse Django validation errors and convert to user-friendly messages
 */
function parseDjangoValidationErrors(errorData: any): string {
  if (typeof errorData !== 'object' || errorData === null) {
    return 'Invalid input. Please check your entries and try again.';
  }

  const errors: string[] = [];

  // Handle specific field errors
  for (const [field, fieldErrors] of Object.entries(errorData)) {
    if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      const firstError = fieldErrors[0];
      
      switch (field) {
        case 'job_posting_url':
          if (typeof firstError === 'string') {
            if (firstError.toLowerCase().includes('valid url')) {
              errors.push('Invalid URL. Please enter a valid job posting URL.');
            } else if (firstError.toLowerCase().includes('required')) {
              errors.push('Job posting URL is required.');
            } else {
              errors.push('Please check the job posting URL.');
            }
          }
          break;
          
        case 'file':
          if (typeof firstError === 'string') {
            if (firstError.toLowerCase().includes('no file')) {
              errors.push('Please upload your resume file.');
            } else if (firstError.toLowerCase().includes('empty')) {
              errors.push('Your resume file appears to be empty. Please upload a valid file.');
            } else if (firstError.toLowerCase().includes('valid')) {
              errors.push('Please upload a valid PDF or Word document.');
            } else {
              errors.push('Please check your resume file.');
            }
          }
          break;
          
        case 'anonymize_pii':
          errors.push('Privacy settings error. Please try again.');
          break;
          
        default:
          // Generic field error
          if (typeof firstError === 'string') {
            errors.push(`${field.replace(/_/g, ' ')}: ${firstError}`);
          }
      }
    }
  }

  return errors.length > 0 
    ? errors.join(' ') 
    : 'Invalid input. Please check your entries and try again.';
}

/**
 * Get user-friendly progress messages
 */
export function getUserFriendlyProgressMessage(technicalMessage: string): string {
  const progressMappings: Record<string, string> = {
    'Creating analysis job...': 'Preparing your analysis...',
    'Job created, starting analysis...': 'Analyzing your resume...',
    'Generating authentication token...': 'Securing your data...',
    'Calling Django backend directly...': 'Analysis in progress, please wait...',
    'Processing with Django backend...': 'Analyzing job match...',
    'Saving results...': 'Finalizing results...',
    'Analysis completed!': 'Analysis completed!',
    
    // Additional technical messages that might appear
    'Uploading file...': 'Processing your resume...',
    'Validating input...': 'Checking your inputs...',
    'Connecting to service...': 'Connecting to analysis service...',
    'Processing request...': 'Processing your request...',
    'Fetching job data...': 'Analyzing job requirements...',
    'Running analysis...': 'Comparing your profile...',
    'Generating report...': 'Creating your report...'
  };

  return progressMappings[technicalMessage] || technicalMessage;
}