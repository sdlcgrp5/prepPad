from pydparser import ResumeParser
import json

def process_resume(file_path):
    """
    Custom function to process the uploaded file.
    Modify this function to implement your specific processing logic.
    
    Args:
        file_path: Path to the uploaded file
        
    Returns:
        Processed content as a JSON object
    """
    # Run the resume through the resume processor
    print(file_path)
    processed_resume = ResumeParser(file_path).get_extracted_data()

    return str(processed_resume) 

    # processed_resume_json = json.dumps(processed_resume)
    
    # return processed_resume_json