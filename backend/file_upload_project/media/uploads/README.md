This folder is for testing the individual modules used in prepPad.

resume-parser.py:

This module parses the user's resume and stores the information in a JSON object. The user's information is then saved to the database.

job-posting-parser.py:

This module parses the job posting that the user has pasted into the app. The job posting information is then stored in the database for later use in the app-analysis.py module.

app-analysis.py:

This module takes the users information and compares it to the information pulled from the job posting. The analysis looks at the user's experience level, education, etc. and checks if it satisfies the job posting's requirements. The analysis provides a match rating which is saved to the specific job posting for the user.

