from pydparser import ResumeParser
import json
import psycopg2

# run the ResumeParser module from pydparser
print("\n\rNow running resume-parser.py")
result = ResumeParser("functionalsample.pdf").get_extracted_data()
# the result is saved as a dictionary object
print(result)
result_json = json.dumps(result)

db_config = {
    "dbname": "postgres",  # Replace with your database name
    "user": "postgres",  # Replace with your username
    "password": "postgres",  # Replace with your password
    "host": "localhost",  # Replace with your host if not local
    "port": 5432,  # Replace with your port if not default
}

username = "John Smith"
email = "johnsmith@domain.com"

# Connect to the database
try:
    connection = psycopg2.connect(**db_config)
    cursor = connection.cursor()

    # Insert the user into the users table
    query = """
    INSERT INTO users (username, email)
    VALUES (%s, %s);
    """
    cursor.execute(query, (username, email))

    # Insert the JSON data into the resumes table
    query = """
    INSERT INTO resumes (user_id, resume_data)
    VALUES (%s, %s);
    """
    user_id = 1  # Replace with the actual user_id
    cursor.execute(query, (user_id, result_json))

    # Commit the transaction
    connection.commit()
    print("Resume inserted successfully!")

except Exception as e:
    print(f"An error occurred: {e}")

finally:
    # Close the database connection
    if connection:
        cursor.close()
        connection.close()
    # try:
    #     result = ResumeParserModule(resume_path)
    # except:
    #     print(f"error: {resume_path} is not a valid path.")
    # else:
    #     print("Parsing was a success!")
    #     print(result)
