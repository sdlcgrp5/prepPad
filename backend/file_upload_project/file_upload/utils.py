from pydparser import ResumeParser
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    pipeline,
)
import requests
import pdfplumber
from lxml import html


def process_resume(resume_file_path):
    resume_text = ""
    with pdfplumber.open(f"{resume_file_path}") as pdf:
        for page in pdf.pages:
            resume_text += page.extract_text()
    
    API_KEY = "sk-75cf0d8df48c4ec09b1e951ba3667bbe"
    url = "https://api.deepseek.com/chat/completions"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"}
    data = {
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "system",
                "content": "You are a job applicant looking to see what information is in your resume.",
            },
            {
                "role": "user",
                "content": f"""Here is the text from your resume: {resume_text}

                    Look through the text that is given to find the following details:
                    1. Your name
                    2. Your contact information
                    3. Your work experience
                    4. Your education
                    5. Your skills
                    6. Your certifications
                    7. Your awards
                    8. Your publications
                    9. Your projects
                    10. Your languages
                    """,
            },
        ],
        "stream": False,
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        result = response.json()
        print(result["choices"][0]["message"]["content"])
        return result["choices"][0]["message"]["content"]
    else:
        print("Request failed, error code:", response.status_code)


def analyze_job_posting(job_posting):
    API_KEY = "sk-75cf0d8df48c4ec09b1e951ba3667bbe"

    url = "https://api.deepseek.com/chat/completions"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"}

    data = {
        "model": "deepseek-chat",  # Use 'deepseek-reasoner' for R1 model or 'deepseek-chat' for V3 model
        "messages": [
            {
                "role": "system",
                "content": "You are a job applicant seeking information from a job posting.",
            },
            {
                "role": "user",
                "content": f"""
                        Look through the text that is given to find the following details:
                        1. The job description
                        2. The qualifications required
                        3. The skills required
                        4. The key responsibilities
                        5. The salary range
                        6. The location of the job"
                        Here is the given text: {job_posting}
                        """,
            },
        ],
        "stream": False,  # Disable streaming
    }

    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
        result = response.json()
        print(result["choices"][0]["message"]["content"])
        return result["choices"][0]["message"]["content"]
    else:
        print("Request failed, error code:", response.status_code)


def clean_text(tree):
    # Remove scripts/styles (XPath)
    for tag in tree.xpath("//script | //style | //noscript | //svg"):
        tag.getparent().remove(tag)
    raw_text = tree.text_content()  # Extracts all text, including whitespace
    text = raw_text.replace("\n", "").replace("\t", "").strip()
    return text


def ner(text):
    """
    Named Entity Recognition (NER) using the DSLIM BERT model

    Args:
        text (str): Input text for NER

    Returns:
        dict: NER results
    """
    tokenizer = AutoTokenizer.from_pretrained("dslim/bert-base-NER")
    model = AutoModelForTokenClassification.from_pretrained("dslim/bert-base-NER")
    ner_pipeline = pipeline("ner", model=model, tokenizer=tokenizer)

    return ner_pipeline(text)


# Ask a question and get an answer
def ask_question(text, question):
    qa_pipeline = pipeline(
        "question-answering", model="distilbert-base-cased-distilled-squad"
    )
    answer = qa_pipeline(question=question, context=text)
    return answer["answer"]


# Extract qualifications, responsibilities, and salary range from job description
def extract_qa_fields(text):
    questions = {
        "description": "What is the job description?",
        "qualifications": "What are the required qualifications from the job description?",
        "skills": "What are the required skills from the job description?",
        "responsibilities": "What are the key responsibilities from the job description?",
        "salary": "What is the salary range?",
    }
    return {k: ask_question(text, q) for k, q in questions.items()}


# def process_resume(file_path):
#     """
#     Custom function to process the uploaded file.
#     Modify this function to implement your specific processing logic.

#     Args:
#         file_path: Path to the uploaded file

#     Returns:
#         Processed content as a JSON object
#     """
#     # Run the resume through the resume processor
#     print(file_path)
#     processed_resume = ResumeParser(file_path).get_extracted_data()

#     return str(processed_resume)


def extract_job_description(url):
    """
    Extract job description text from a given URL

    Args:
        url (str): URL of the job posting

    Returns:
        dict: Extracted job description details
    """
    # Send a request to the website
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    response = requests.get(url, headers=headers)
    try:
        # Check if the request was successful
        if response.status_code == 200:
            # Parse HTML and extract all raw text
            job_posting_html = response.text
            tree = html.fromstring(job_posting_html)

            # Extract job description text
            job_posting = clean_text(tree)
            print(job_posting)

            job_details_deepseek = analyze_job_posting(job_posting)
            job_details_ner = ner(job_posting)
            job_details_qa = extract_qa_fields(job_posting)
            result = {
                "url": url,
                "status_code": response.status_code,
                "full_text": job_posting,
            }

            # Extract job description text
            if job_posting:
                result["deepseek_results"] = job_details_deepseek
                result["ner_results"] = job_details_ner
                result["qa_results"] = job_details_qa
                result["html"] = str(job_posting_html)
            else:
                result["description"] = "Job description could not be extracted"
                result["html"] = ""

            return result
        else:
            return {
                "url": url,
                "status_code": response.status_code,
                "description": f"Failed to retrieve the webpage: {response.status_code}",
                "full_text": "",
                "html": "",
            }
    except Exception as e:
        return {
            "url": url,
            "status_code": 500,
            "description": f"Error extracting job posting: {str(e)}",
            "full_text": "",
            "html": "",
        }
