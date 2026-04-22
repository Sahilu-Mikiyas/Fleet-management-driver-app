import fitz # PyMuPDF
import sys

def read_pdf(file_path):
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        with open('pdf-output.txt', 'w', encoding='utf-8') as out:
            out.write(text)
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    read_pdf(r'C:\Users\VICTUS\Downloads\Fleetdocs.pdf')
