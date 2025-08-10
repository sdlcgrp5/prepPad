"""
PII Anonymizer Module for Resume Processing
Handles detection and anonymization of personally identifiable information
before sending data to external AI services.
"""

import re
import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import hashlib


@dataclass
class PIIMatch:
    """Represents a detected PII element"""
    type: str  # 'email', 'phone', 'name', 'address'
    original_value: str
    placeholder: str
    start_pos: int
    end_pos: int


class PIIAnonymizer:
    """
    Anonymizes personally identifiable information in text content
    while maintaining the ability to reconstruct original data.
    """
    
    def __init__(self):
        # Email pattern - comprehensive regex for email detection
        self.email_pattern = re.compile(
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            re.IGNORECASE
        )
        
        # Phone number patterns - various formats
        self.phone_patterns = [
            re.compile(r'\b\d{3}-\d{3}-\d{4}\b'),  # 123-456-7890
            re.compile(r'\b\(\d{3}\)\s*\d{3}-\d{4}\b'),  # (123) 456-7890
            re.compile(r'\b\d{3}\.\d{3}\.\d{4}\b'),  # 123.456.7890
            re.compile(r'\b\d{3}\s+\d{3}\s+\d{4}\b'),  # 123 456 7890
            re.compile(r'\b\+?1?\s*\(?(\d{3})\)?[-.\s]*(\d{3})[-.\s]*(\d{4})\b'),  # Various formats with optional +1
        ]
        
        # Address patterns - street addresses, zip codes
        self.address_patterns = [
            re.compile(r'\b\d{1,5}\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Circle|Cir|Way|Place|Pl)\b', re.IGNORECASE),
            re.compile(r'\b\d{5}(?:-\d{4})?\b'),  # ZIP codes
        ]
        
        # Name patterns - common name indicators
        self.name_indicators = [
            r'\bMr\.\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
            r'\bMs\.\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
            r'\bMrs\.\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
            r'\bDr\.\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
        ]
        
        # Placeholder counters
        self.placeholders = {
            'email': 0,
            'phone': 0,
            'name': 0,
            'address': 0
        }
    
    def _generate_placeholder(self, pii_type: str) -> str:
        """Generate a unique placeholder for a PII type"""
        self.placeholders[pii_type] += 1
        return f'[{pii_type.upper()}_{self.placeholders[pii_type]}]'
    
    def detect_emails(self, text: str) -> List[PIIMatch]:
        """Detect email addresses in text"""
        matches = []
        for match in self.email_pattern.finditer(text):
            matches.append(PIIMatch(
                type='email',
                original_value=match.group(),
                placeholder=self._generate_placeholder('email'),
                start_pos=match.start(),
                end_pos=match.end()
            ))
        return matches
    
    def detect_phones(self, text: str) -> List[PIIMatch]:
        """Detect phone numbers in text"""
        matches = []
        for pattern in self.phone_patterns:
            for match in pattern.finditer(text):
                # Skip if this position is already matched by another pattern
                if not any(m.start_pos <= match.start() < m.end_pos for m in matches):
                    matches.append(PIIMatch(
                        type='phone',
                        original_value=match.group(),
                        placeholder=self._generate_placeholder('phone'),
                        start_pos=match.start(),
                        end_pos=match.end()
                    ))
        return matches
    
    def detect_addresses(self, text: str) -> List[PIIMatch]:
        """Detect addresses and ZIP codes in text"""
        matches = []
        for pattern in self.address_patterns:
            for match in pattern.finditer(text):
                # Skip if this position is already matched
                if not any(m.start_pos <= match.start() < m.end_pos for m in matches):
                    matches.append(PIIMatch(
                        type='address',
                        original_value=match.group(),
                        placeholder=self._generate_placeholder('address'),
                        start_pos=match.start(),
                        end_pos=match.end()
                    ))
        return matches
    
    def detect_names_from_structure(self, text: str) -> List[PIIMatch]:
        """
        Detect names from resume structure and common patterns
        This is more complex and may require ML, but we'll use heuristics
        """
        matches = []
        
        # Look for names with titles
        for pattern in self.name_indicators:
            for match in re.finditer(pattern, text):
                matches.append(PIIMatch(
                    type='name',
                    original_value=match.group(1),  # Capture group with the name
                    placeholder=self._generate_placeholder('name'),
                    start_pos=match.start(1),
                    end_pos=match.end(1)
                ))
        
        # Look for names at the beginning of the document (common in resumes)
        lines = text.split('\n')[:5]  # Check first 5 lines
        for i, line in enumerate(lines):
            line = line.strip()
            # Simple heuristic: line with 2-3 capitalized words, no common resume keywords
            if (re.match(r'^[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$', line) and 
                not any(keyword in line.lower() for keyword in ['resume', 'cv', 'curriculum', 'contact', 'phone', 'email'])):
                # Find the position in the original text
                start_pos = text.find(line)
                if start_pos != -1:
                    matches.append(PIIMatch(
                        type='name',
                        original_value=line,
                        placeholder=self._generate_placeholder('name'),
                        start_pos=start_pos,
                        end_pos=start_pos + len(line)
                    ))
                    break  # Only take the first likely name
        
        return matches
    
    def anonymize_text(self, text: str, preserve_structure: bool = True) -> Tuple[str, Dict]:
        """
        Anonymize PII in text and return anonymized text with mapping for reconstruction
        
        Args:
            text: Original text to anonymize
            preserve_structure: Whether to preserve document structure and formatting
            
        Returns:
            Tuple of (anonymized_text, mapping_dict)
        """
        # Reset placeholder counters
        self.placeholders = {key: 0 for key in self.placeholders}
        
        # Detect all PII
        all_matches = []
        all_matches.extend(self.detect_emails(text))
        all_matches.extend(self.detect_phones(text))
        all_matches.extend(self.detect_addresses(text))
        all_matches.extend(self.detect_names_from_structure(text))
        
        # Sort matches by position (reverse order for replacement)
        all_matches.sort(key=lambda x: x.start_pos, reverse=True)
        
        # Create anonymized text
        anonymized_text = text
        mapping = {}
        
        for match in all_matches:
            # Replace the original value with placeholder
            anonymized_text = (
                anonymized_text[:match.start_pos] + 
                match.placeholder + 
                anonymized_text[match.end_pos:]
            )
            
            # Store mapping for reconstruction
            mapping[match.placeholder] = {
                'type': match.type,
                'original_value': match.original_value,
                'start_pos': match.start_pos,
                'end_pos': match.end_pos
            }
        
        return anonymized_text, mapping
    
    def deanonymize_text(self, anonymized_text: str, mapping: Dict) -> str:
        """
        Reconstruct original text from anonymized text using mapping
        """
        result = anonymized_text
        
        # Replace placeholders with original values
        for placeholder, info in mapping.items():
            result = result.replace(placeholder, info['original_value'])
        
        return result
    
    def anonymize_json_data(self, data: Dict) -> Tuple[Dict, Dict]:
        """
        Anonymize PII in structured JSON data (for processed resume data)
        """
        anonymized_data = data.copy()
        mapping = {}
        
        # Fields that typically contain PII
        pii_fields = {
            'name': 'name',
            'email': 'email', 
            'phone': 'phone',
            'address': 'address',
            'zipCode': 'address',
            'location': 'address'
        }
        
        for field, pii_type in pii_fields.items():
            if field in anonymized_data and anonymized_data[field]:
                placeholder = self._generate_placeholder(pii_type)
                mapping[placeholder] = {
                    'type': pii_type,
                    'original_value': anonymized_data[field],
                    'field': field
                }
                anonymized_data[field] = placeholder
        
        # Handle nested contact_info
        if 'contact_info' in anonymized_data:
            contact_mapping = {}
            for field in ['email', 'phone', 'zipCode']:
                if field in anonymized_data['contact_info'] and anonymized_data['contact_info'][field]:
                    pii_type = 'email' if field == 'email' else 'phone' if field == 'phone' else 'address'
                    placeholder = self._generate_placeholder(pii_type)
                    contact_mapping[placeholder] = {
                        'type': pii_type,
                        'original_value': anonymized_data['contact_info'][field],
                        'field': f'contact_info.{field}'
                    }
                    anonymized_data['contact_info'][field] = placeholder
            mapping.update(contact_mapping)
        
        return anonymized_data, mapping
    
    def deanonymize_data(self, data: Dict, mapping: Dict) -> Dict:
        """
        Deanonymize structured data (like JSON) using the mapping
        """
        if not mapping:
            return data
            
        # Deep copy to avoid modifying original
        result = json.loads(json.dumps(data)) if isinstance(data, dict) else data
        
        def deanonymize_recursive(obj):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if isinstance(value, str):
                        # Replace any placeholders in string values
                        for placeholder, info in mapping.items():
                            if placeholder in value:
                                value = value.replace(placeholder, info['original_value'])
                        obj[key] = value
                    elif isinstance(value, (dict, list)):
                        obj[key] = deanonymize_recursive(value)
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    if isinstance(item, str):
                        # Replace any placeholders in string values
                        for placeholder, info in mapping.items():
                            if placeholder in item:
                                item = item.replace(placeholder, info['original_value'])
                        obj[i] = item
                    elif isinstance(item, (dict, list)):
                        obj[i] = deanonymize_recursive(item)
            return obj
        
        return deanonymize_recursive(result)
    
    def create_anonymization_report(self, mapping: Dict) -> Dict:
        """
        Create a report of what was anonymized
        """
        report = {
            'total_items': len(mapping),
            'types': {},
            'items': []
        }
        
        for placeholder, info in mapping.items():
            pii_type = info['type']
            if pii_type not in report['types']:
                report['types'][pii_type] = 0
            report['types'][pii_type] += 1
            
            report['items'].append({
                'type': pii_type,
                'placeholder': placeholder,
                'masked_value': info['original_value'][:3] + '*' * (len(info['original_value']) - 3)
            })
        
        return report


# Utility functions for easy integration
def anonymize_resume_text(text: str) -> Tuple[str, Dict]:
    """Quick function to anonymize resume text"""
    anonymizer = PIIAnonymizer()
    return anonymizer.anonymize_text(text)


def anonymize_resume_data(data: Dict) -> Tuple[Dict, Dict]:
    """Quick function to anonymize structured resume data"""
    anonymizer = PIIAnonymizer()
    return anonymizer.anonymize_json_data(data)


def deanonymize_response(anonymized_response: str, mapping: Dict) -> str:
    """Quick function to deanonymize AI response"""
    anonymizer = PIIAnonymizer()
    return anonymizer.deanonymize_text(anonymized_response, mapping)