document.addEventListener('DOMContentLoaded', function() {
    // Tab Switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                    
                    // Load data for specific tabs
                    if (tabId === 'student-search') {
                        loadAllBooks();
                    } else if (tabId === 'librarian-view' || tabId === 'librarian-issued') {
                        checkLibrarianLogin();
                    }
                }
            });
        });
    });
    
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Login successful!', 'success');
                    updateLibrarianUI(true);
                    // Switch to librarian view tab
                    const librarianViewBtn = document.querySelector('[data-tab="librarian-view"]');
                    if (librarianViewBtn) {
                        librarianViewBtn.click();
                    }
                } else {
                    showAlert('Invalid credentials!', 'error');
                }
            })
            .catch(error => {
                showAlert('Login failed!', 'error');
            });
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            fetch('/logout')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showAlert('Logged out successfully!', 'success');
                        updateLibrarianUI(false);
                    }
                });
        });
    }
    
    // Search Books
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const searchType = document.getElementById('searchType').value;
            const searchQuery = document.getElementById('searchQuery').value;
            
            fetch('/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: searchType,
                    query: searchQuery
                })
            })
            .then(response => response.json())
            .then(books => {
                displayBooks(books, 'searchResults');
            })
            .catch(error => {
                showAlert('Search failed!', 'error');
            });
        });
    }
    
    // Add Book
    const addBookForm = document.getElementById('addBookForm');
    if (addBookForm) {
        addBookForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const bookData = {
                title: document.getElementById('bookTitle').value,
                author: document.getElementById('bookAuthor').value,
                isbn: document.getElementById('bookISBN').value,
                genre: document.getElementById('bookGenre').value,
                year: document.getElementById('bookYear').value
            };
            
            fetch('/add_book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert(`Book added successfully! Book ID: ${data.book_id}`, 'success');
                    addBookForm.reset();
                    loadAllBooks();
                    loadLibrarianSections();
                } else {
                    showAlert(data.error || 'Failed to add book!', 'error');
                }
            })
            .catch(error => {
                showAlert('Failed to add book!', 'error');
            });
        });
    }
    
    // Issue Book
    const issueBookForm = document.getElementById('issueBookForm');
    if (issueBookForm) {
        issueBookForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const issueData = {
                book_id: document.getElementById('issueBookId').value,
                student_id: document.getElementById('studentId').value,
                return_date: document.getElementById('returnDate').value
            };
            
            fetch('/issue_book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(issueData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Book issued successfully!', 'success');
                    issueBookForm.reset();
                    loadLibrarianSections();
                    loadAllBooks();
                } else {
                    showAlert(data.error || 'Failed to issue book!', 'error');
                }
            })
            .catch(error => {
                showAlert('Failed to issue book!', 'error');
            });
        });
    }
    
    // Return Book
    const returnBookForm = document.getElementById('returnBookForm');
    if (returnBookForm) {
        returnBookForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const returnData = {
                book_id: document.getElementById('returnBookId').value
            };
            
            fetch('/return_book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(returnData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Book returned successfully!', 'success');
                    returnBookForm.reset();
                    loadLibrarianSections();
                    loadAllBooks();
                } else {
                    showAlert(data.error || 'Failed to return book!', 'error');
                }
            })
            .catch(error => {
                showAlert('Failed to return book!', 'error');
            });
        });
    }
    
    // View All Books
    const loadAllBooksBtn = document.getElementById('loadAllBooks');
    if (loadAllBooksBtn) {
        loadAllBooksBtn.addEventListener('click', loadAllBooks);
    }
    
    // Initial load
    loadAllBooks();
    
    // Functions
    function loadAllBooks() {
        fetch('/view_books')
            .then(response => response.json())
            .then(books => {
                displayBooks(books, 'allBooks');
            })
            .catch(error => {
                console.error('Error loading books:', error);
            });
    }
    
    function loadIssuedBooks() {
        fetch('/issued_books')
            .then(response => response.json())
            .then(books => {
                displayBooks(books, 'issuedBooks');
            })
            .catch(error => {
                console.error('Error loading issued books:', error);
            });
    }
    
    function displayBooks(books, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (books.length === 0) {
            container.innerHTML = '<div class="alert">No books found</div>';
            return;
        }
        
        let html = '';
        
        books.forEach(book => {
            const isAvailable = book.Availability === 'Available';
            
            html += `
                <div class="book-card">
                    <div class="book-header">
                        <span class="book-id">${book.Book_ID}</span>
                        <span class="availability ${isAvailable ? 'available' : 'issued'}">
                            ${book.Availability}
                        </span>
                    </div>
                    <h3 class="book-title">${book.Title}</h3>
                    <p class="book-author">by ${book.Author}</p>
                    <div class="book-details">
                        <span>📚 ${book.Genre}</span>
                        <span>📅 ${book.Year}</span>
                        <span>🔢 ${book.ISBN}</span>
                    </div>
                    ${!isAvailable ? `
                        <div class="book-details">
                            <span>👤 Issued to: ${book.Issued_To}</span>
                            <span>📅 Due: ${book.Return_Date}</span>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    function showAlert(message, type) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        // Insert at top of page
        const container = document.querySelector('.container');
        const header = document.querySelector('.header');
        container.insertBefore(alertDiv, header.nextSibling);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
    
    function updateLibrarianUI(isLoggedIn) {
        const loginSection = document.getElementById('librarian-login');
        const librarianSections = document.querySelectorAll('.librarian-section');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (isLoggedIn) {
            loginSection.classList.add('hidden');
            librarianSections.forEach(section => section.classList.remove('hidden'));
            if (loginBtn) loginBtn.classList.add('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
        } else {
            loginSection.classList.remove('hidden');
            librarianSections.forEach(section => section.classList.add('hidden'));
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.add('hidden');
        }
    }
    
    function checkLibrarianLogin() {
        fetch('/check_login')
            .then(response => response.json())
            .then(data => {
                updateLibrarianUI(data.logged_in);
            })
            .catch(error => {
                console.error('Error checking login status:', error);
                updateLibrarianUI(false);
            });
    }
    
    function loadLibrarianSections() {
        if (document.getElementById('librarian-view').classList.contains('active')) {
            loadAllBooks();
        } else if (document.getElementById('librarian-issued').classList.contains('active')) {
            loadIssuedBooks();
        }
    }
    
    // Initialize
    checkLibrarianLogin();
});