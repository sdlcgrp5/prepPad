import re
import json
from xml.dom.minidom import Document

# from pydparser import ResumeParser
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    pipeline,
)
import requests
import pdfplumber
from docx import Document
from lxml import html
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time


def analysisPrompt(resume_text, job_details):
    prompt = [
        {
            "role": "system",
            "content": "You are a recruiter that is comparing an applicant's resume to the job posting that you are hiring for. You will provide feedback in JSON format.",
        },
        {
            "role": "user",
            "content": f"""
                Here is the analysis of the applicant's resume: {resume_text}
                Here is the analysis of the job posting: {job_details}
                Now, run a comparison between the two analyses to provide feedback to the applicant.
                Create a JSON response with the following structure:
                {{
                    "strengths": [list of strengths compared to job posting],
                    "weaknesses": [list of weaknesses compared to job posting],
                    "improvement_tips": [list of tips to improve resume],
                    "match_score": number between 0 and 100
                }}
                    """,
        },
    ]
    return prompt


def resumeProcessorPrompt(resume_text):
    prompt = [
        {
            "role": "system",
            "content": "You are a job applicant looking to see what information is in your resume.",
        },
        {
            "role": "user",
            "content": f"""Here is the text from your resume: {resume_text}

                    Look through the text that is given to find the following details:
                    
                    name = string
                    contact_info = list['email', 'phone_number', 'address']
                    work_experience = list['company', 'position', 'start_date', 'end_date', 'description']
                    education = list['institution', 'degree', 'start_date', 'end_date']
                    skills = list[string]
                    certifications = list[string]
                    awards = list[string]
                    publications = list[string]
                    projects = list['project_name', 'description'] 
                    languages = list[string]

                    Once you have found the details, please put them into a JSON object. If a field is empty, set it to null.
                    """,
        },
    ]

    return prompt


def jobProcessorPrompt(job_posting):
    prompt = [
        {
            "role": "system",
            "content": "You are a job applicant seeking information from a job posting.",
        },
        {
            "role": "user",
            "content": f"""
                        Look through the text that is given to find the following details and include as much information as possible:
                        
                        title = string
                        description = string
                        qualifications = list[string]
                        skills = list[string]
                        responsibilities =list[string]
                        salary_range = string
                        location = string
                        posted_date = string
                        company_name = string
                        Here is the given text: {job_posting}

                        Once you have found the details, please put them into a JSON object. If nothing can be found for a field, set it to null.
                        """,
        },
    ]
    return prompt


def resume_job_desc_analysis(resume_file_path, job_posting_url):
    try:
        # Process the resume
        resume_data = str(process_resume(resume_file_path))
        if not resume_data:
            raise ValueError("Failed to process resume")

        # Extract job description details
        job_data = str(analyze_job_posting(job_posting_url))
        if not job_data:
            raise ValueError("Failed to analyze job posting")

        # Implement job description and resume comparison here
        API_KEY = "sk-75cf0d8df48c4ec09b1e951ba3667bbe"
        url = "https://api.deepseek.com/chat/completions"
        headers = {
            "Content-Type": "application/json", 
            "Authorization": f"Bearer {API_KEY}"
        }
        
        analysis_prompt = analysisPrompt(resume_data, job_data)
        data = {
            "model": "deepseek-chat",
            "messages": analysis_prompt,
            "response_format": {"type": "json_object"},
            "stream": False,
        }
        
        print(f"Sending request to DeepSeek API...")
        response = requests.post(url, headers=headers, json=data)
        
        print(f"Response status code: {response.status_code}")
        print(f"Response content: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            return json.loads(result["choices"][0]["message"]["content"])
        else:
            error_msg = f"Request failed with status code: {response.status_code}"
            error_msg += f"\nResponse: {response.text}"
            raise ValueError(error_msg)

    except Exception as e:
        print(f"Error in resume_job_desc_analysis: {str(e)}")
        return {
            "error": str(e),
            "status": "failed",
            "resume_processed": bool(resume_data),
            "job_data_processed": bool(job_data)
        }


def process_resume(resume_file_path):
    resume_text = ""
    if resume_file_path.endswith(".pdf"):
        with pdfplumber.open(f"{resume_file_path}") as pdf:
            for page in pdf.pages:
                resume_text += page.extract_text()
    elif resume_file_path.endswith(".docx"):
        doc = Document(resume_file_path)
        resume_text = "\n".join([p.text for p in doc.paragraphs])
    else:
        raise ValueError("Unsupported file format. Use PDF or DOCX.")

    API_KEY = "sk-75cf0d8df48c4ec09b1e951ba3667bbe"
    url = "https://api.deepseek.com/chat/completions"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"}
    data = {
        "model": "deepseek-chat",
        "messages": resumeProcessorPrompt(resume_text),
        "response_format": {"type": "json_object"},
        "stream": False,
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        result = response.json()
        print(json.loads(result["choices"][0]["message"]["content"]))
        return json.loads(result["choices"][0]["message"]["content"])
    else:
        print("Request failed, error code:", response.status_code)


def analyze_job_posting(job_posting):
    API_KEY = "sk-75cf0d8df48c4ec09b1e951ba3667bbe"

    url = "https://api.deepseek.com/chat/completions"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"}

    data = {
        "model": "deepseek-chat",  # Use 'deepseek-reasoner' for R1 model or 'deepseek-chat' for V3 model
        "messages": jobProcessorPrompt(job_posting),
        "response_format": {"type": "json_object"},
        "stream": False,  # Disable streaming
    }

    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
        result = response.json()
        print(json.loads(result["choices"][0]["message"]["content"]))
        return json.loads(result["choices"][0]["message"]["content"])
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
    try:
        # Set up Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.binary_location = "/usr/bin/chromium"

        # Initialize the driver with explicit service
        service = Service(executable_path="/usr/bin/chromedriver")
        driver = webdriver.Chrome(
            service=service,
            options=chrome_options
        )

        # Load the page and wait for content to load
        driver.get(url)
        time.sleep(5)  # Wait for dynamic content to load

        # Get the page source after JavaScript execution
        job_posting_html = driver.page_source
        driver.quit()

        # Parse HTML and extract text
        tree = html.fromstring(job_posting_html)
        job_posting = clean_text(tree)
        
        # Process with your existing analysis
        job_details_deepseek = analyze_job_posting(job_posting)
        if job_details_deepseek:
            return job_details_deepseek

    except Exception as e:
        return {
            "url": url,
            "status_code": 500,
            "description": f"Error extracting job posting: {str(e)}",
            "full_text": "",
            "html": "",
        }
