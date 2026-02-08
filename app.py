from flask import Flask, render_template, request, jsonify, session
import pandas as pd
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'library-secret-key-2024'

# Excel file configuration
EXCEL_FILE = 'books.xlsx'

# Initialize Excel file if not exists
def init_excel_file():
    if not os.path.exists(EXCEL_FILE):
        columns = ['Book_ID', 'Title', 'Author', 'ISBN', 'Genre', 'Year', 
                   'Availability', 'Issued_To', 'Issued_Date', 'Return_Date']
        df = pd.DataFrame(columns=columns)
        df.to_excel(EXCEL_FILE, index=False, engine='openpyxl')

        # Add some sample books
        sample_books = [
            ['B001', 'The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Classic', 1925, 'Available', '', '', ''],
            ['B002', 'To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'Fiction', 1960, 'Available', '', '', ''],
            ['B003', '1984', 'George Orwell', '9780451524935', 'Dystopian', 1949, 'Issued', 'S1001', '2024-01-15', '2024-02-15'],
            ['B004', 'Pride and Prejudice', 'Jane Austen', '9781503290563', 'Romance', 1813, 'Available', '', '', ''],
            ['B005', 'The Hobbit', 'J.R.R. Tolkien', '9780547928227', 'Fantasy', 1937, 'Available', '', '', ''],
            ['B006', 'The Catcher in the Rye', 'J.D. Salinger', '9780316769488', 'Fiction', 1951, 'Available', '', '', ''],
            ['B007', 'Harry Potter and the Sorcerer\'s Stone', 'J.K. Rowling', '9780590353427', 'Fantasy', 1997, 'Available', '', '', ''],
            ['B008', 'The Lord of the Rings: The Fellowship of the Ring', 'J.R.R. Tolkien', '9780544003415', 'Fantasy', 1954, 'Available', '', '', ''],
            ['B009', 'The Alchemist', 'Paulo Coelho', '9780061122415', 'Philosophy', 1988, 'Available', '', '', ''],
            ['B010', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', '9780062316097', 'History', 2011, 'Available', '', '', ''],
            ['B011', 'The Da Vinci Code', 'Dan Brown', '9780307474278', 'Thriller', 2003, 'Available', '', '', ''],
            ['B012', 'The Hunger Games', 'Suzanne Collins', '9780439023481', 'Dystopian', 2008, 'Available', '', '', ''],
            ['B013', 'Gone Girl', 'Gillian Flynn', '9780307588371', 'Thriller', 2012, 'Available', '', '', ''],
            ['B014', 'The Kite Runner', 'Khaled Hosseini', '9781594631931', 'Fiction', 2003, 'Available', '', '', ''],
            ['B015', 'Educated', 'Tara Westover', '9780399590504', 'Memoir', 2018, 'Available', '', '', '']
        ]

        for book in sample_books:
            df.loc[len(df)] = book

        df.to_excel(EXCEL_FILE, index=False, engine='openpyxl')

# Librarian credentials (in production, use database)
LIBRARIAN_CREDENTIALS = {
    'username': 'librarian',
    'password': 'library123'
}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if (data['username'] == LIBRARIAN_CREDENTIALS['username'] and 
        data['password'] == LIBRARIAN_CREDENTIALS['password']):
        session['librarian_logged_in'] = True
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Invalid credentials'})

@app.route('/logout')
def logout():
    session.pop('librarian_logged_in', None)
    return jsonify({'success': True})

@app.route('/add_book', methods=['POST'])
def add_book():
    if not session.get('librarian_logged_in'):
        return jsonify({'success': False, 'error': 'Unauthorized'})
    
    data = request.json
    
    # Read existing data
    df = pd.read_excel(EXCEL_FILE, engine='openpyxl')
    
    # Generate new Book ID
    book_id = f"B{str(len(df) + 1).zfill(3)}"
    
    # Add new book
    new_book = {
        'Book_ID': book_id,
        'Title': data['title'],
        'Author': data['author'],
        'ISBN': data['isbn'],
        'Genre': data['genre'],
        'Year': int(data['year']),
        'Availability': 'Available',
        'Issued_To': '',
        'Issued_Date': '',
        'Return_Date': ''
    }
    
    df = pd.concat([df, pd.DataFrame([new_book])], ignore_index=True)
    df.to_excel(EXCEL_FILE, index=False, engine='openpyxl')
    
    return jsonify({'success': True, 'book_id': book_id})

@app.route('/issue_book', methods=['POST'])
def issue_book():
    if not session.get('librarian_logged_in'):
        return jsonify({'success': False, 'error': 'Unauthorized'})
    
    data = request.json
    
    df = pd.read_excel(EXCEL_FILE)
    
    # Find the book
    mask = df['Book_ID'] == data['book_id']
    if not df[mask].empty:
        if df.loc[mask, 'Availability'].values[0] == 'Available':
            today = datetime.now().strftime('%Y-%m-%d')
            return_date = data.get('return_date', '2024-03-15')
            
            df.loc[mask, 'Availability'] = 'Issued'
            df.loc[mask, 'Issued_To'] = data['student_id']
            df.loc[mask, 'Issued_Date'] = today
            df.loc[mask, 'Return_Date'] = return_date
            
            df.to_excel(EXCEL_FILE, index=False, engine='openpyxl')
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Book already issued'})
    
    return jsonify({'success': False, 'error': 'Book not found'})

@app.route('/return_book', methods=['POST'])
def return_book():
    if not session.get('librarian_logged_in'):
        return jsonify({'success': False, 'error': 'Unauthorized'})
    
    data = request.json
    
    df = pd.read_excel(EXCEL_FILE, engine='openpyxl')

    mask = df['Book_ID'] == data['book_id']
    if not df[mask].empty:
        if df.loc[mask, 'Availability'].values[0] == 'Issued':
            df.loc[mask, 'Availability'] = 'Available'
            df.loc[mask, 'Issued_To'] = ''
            df.loc[mask, 'Issued_Date'] = ''
            df.loc[mask, 'Return_Date'] = ''

            df.to_excel(EXCEL_FILE, index=False, engine='openpyxl')
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Book not issued'})
    
    return jsonify({'success': False, 'error': 'Book not found'})

@app.route('/view_books')
def view_books():
    df = pd.read_excel(EXCEL_FILE, engine='openpyxl')
    books = df.fillna('').to_dict('records')
    return jsonify(books)

@app.route('/search', methods=['POST'])
def search():
    data = request.json
    search_type = data['type']
    query = data['query'].lower()
    
    df = pd.read_excel(EXCEL_FILE)
    
    if search_type == 'title':
        results = df[df['Title'].str.lower().str.contains(query, na=False)]
    elif search_type == 'author':
        results = df[df['Author'].str.lower().str.contains(query, na=False)]
    elif search_type == 'id':
        results = df[df['Book_ID'].str.lower().str.contains(query, na=False)]
    else:
        results = df
    
    books = results.fillna('').to_dict('records')
    return jsonify(books)

@app.route('/issued_books')
def issued_books():
    if not session.get('librarian_logged_in'):
        return jsonify({'error': 'Unauthorized'})

    df = pd.read_excel(EXCEL_FILE, engine='openpyxl')
    issued = df[df['Availability'] == 'Issued']
    books = issued.fillna('').to_dict('records')
    return jsonify(books)

@app.route('/check_login')
def check_login():
    return jsonify({'logged_in': session.get('librarian_logged_in', False)})

if __name__ == '__main__':
    init_excel_file()
    app.run(debug=True, port=5000)