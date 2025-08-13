
// Trie class is now globally available via window.Trie

// Global variables
let contactList = new Trie();
let currentSearchResults = [];

// DOM elements
let saveContactBtn, contactNameInput, contactNumberInput, delBtn, deleteInput, searchInput, searchClearBtn, contactListContainer;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Get DOM elements
    saveContactBtn = document.getElementById("saveContact");
    contactNameInput = document.getElementById("contactName");
    contactNumberInput = document.getElementById("contactNumber");
    delBtn = document.getElementById("del");
    deleteInput = document.getElementById("delete_input");
    searchInput = document.getElementById("search_input");
    searchClearBtn = document.getElementById("search_clear_btn");
    contactListContainer = document.querySelector('.contact-list-container');
    
    // Debug: Check if elements are found
    console.log('DOM Elements found:', {
        saveContactBtn: !!saveContactBtn,
        contactNameInput: !!contactNameInput,
        contactNumberInput: !!contactNumberInput,
        delBtn: !!delBtn,
        deleteInput: !!deleteInput,
        searchInput: !!searchInput,
        searchClearBtn: !!searchClearBtn,
        contactListContainer: !!contactListContainer
    });
    
    // Initialize event listeners
    setupEventListeners();
    
    // Load contacts from localStorage
    loadContactsFromStorage();
    
    // Initialize autocomplete
    initializeAutocomplete();
    
    // Update display
    updateContactListDisplay();
    
    console.log('Contact Management System V2.0 initialized successfully!');
    console.log('Initial contact list:', contactList.search(""));
}

function setupEventListeners() {
    // Add contact button
    if (saveContactBtn) {
        saveContactBtn.addEventListener('click', addContact);
    }
    
    // Delete contact button
    if (delBtn) {
        delBtn.addEventListener('click', deleteContact);
    }

    // Real-time filtering for delete input
    if (deleteInput) {
        deleteInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            if (query.length === 0) {
                // Reset to show all contacts
                updateContactListDisplay();
                return;
            }

            // Only filter if input contains numbers
            if (/^\d+$/.test(query)) {
                const results = contactList.search(query);
                
                // Update the contact list with filtered results
                if (contactListContainer) {
                    contactListContainer.innerHTML = '';
                    results.forEach(contact => {
                        const contactDiv = createContactListItem(contact);
                        contactListContainer.appendChild(contactDiv);
                    });
                }
                
                // Update the count display
                updateContactCount(results.length);
            }
        });
    }
    
    // Search input events
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keydown', handleSearchKeydown);
        searchInput.addEventListener('focus', showSearchResults);
    }
    
    // Clear search button
    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', clearSearch);
    }
    
    // Modal form validation
    if (contactNumberInput) {
        contactNumberInput.addEventListener('input', validatePhoneNumber);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === 'Escape') {
            clearSearch();
            hideSearchResults();
        }
    });
    
    // Click outside to close search results
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !e.target.closest('.autocomplete-items')) {
            hideSearchResults();
        }
    });
}

function addContact() {
    console.log('addContact function called');
    
    const name = contactNameInput.value.trim();
    const number = contactNumberInput.value.trim();
    
    console.log('Form values:', { name, number });
    
    // Validation
    if (!name || !number) {
        showNotification('Please fill in both name and phone number fields!', 'error');
        return;
    }
    
    if (name.length < 2) {
        showNotification('Name must be at least 2 characters long!', 'error');
        return;
    }
    
    if (number.length !== 4 || !/^\d{4}$/.test(number)) {
        showNotification('Phone number must be exactly 4 digits!', 'error');
        return;
    }
    
    // Check if number already exists
    const existingContacts = contactList.search(number);
    console.log('Existing contacts with this number:', existingContacts);
    
    if (existingContacts.length > 0) {
        showNotification('A contact with this phone number already exists!', 'error');
        return;
    }
    
    try {
        console.log('Adding contact to trie:', { name, number });
        
        // Add contact to trie
        contactList.add(number, name);
        
        console.log('Contact added to trie. Current contacts:', contactList.search(""));
        
        // Save to localStorage
        saveContactsToStorage();
        
        // Update contact list display
        updateContactListDisplay();
        
        // Clear form and close modal
        contactNameInput.value = "";
        contactNumberInput.value = "";
        
        // Close modal using Bootstrap
        const modal = bootstrap.Modal.getInstance(document.getElementById('addContactModal'));
        if (modal) {
            modal.hide();
        }
        
        showNotification('Contact added successfully!', 'success');
        
        // Update search results if search is active
        if (searchInput.value.trim()) {
            handleSearch();
        }
        
    } catch (error) {
        console.error('Error adding contact:', error);
        showNotification('Error adding contact. Please try again.', 'error');
    }
}

function deleteContact() {
    const number = deleteInput.value.trim();
    
    if (number.length !== 4 || !/^\d{4}$/.test(number)) {
        showNotification('Please enter a valid 4-digit phone number!', 'error');
        return;
    }
    
    // Check if contact exists
    const existingContacts = contactList.search(number);
    if (existingContacts.length === 0) {
        showNotification('No contact found with this phone number!', 'error');
        return;
    }
    
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the contact with number ${number}?`)) {
        return;
    }
    
    try {
        // Delete contact from trie
        contactList.del(number);
        
        // Save to localStorage
        saveContactsToStorage();
        
        // Update contact list display
        updateContactListDisplay();
        
        deleteInput.value = "";
        showNotification('Contact deleted successfully!', 'success');
        
        // Update search results if search is active
        if (searchInput.value.trim()) {
            handleSearch();
        }
        
    } catch (error) {
        console.error('Error deleting contact:', error);
        showNotification('Error deleting contact. Please try again.', 'error');
    }
}

function handleSearch() {
    console.log('🔍 handleSearch function called!');
    console.log('Search input value:', searchInput.value);
    
    const query = searchInput.value.trim();
    console.log('Trimmed query:', query);
    
    if (query.length === 0) {
        console.log('Empty query, hiding search results');
        hideSearchResults();
        updateClearButtonVisibility();
        // Show all contacts when search is empty
        updateContactListDisplay();
        return;
    }
    
    console.log('Updating clear button visibility');
    updateClearButtonVisibility();
    
    try {
        console.log('Searching contacts with query:', query);
        // Search contacts
        const results = contactList.search(query);
        console.log('Search results:', results);
        currentSearchResults = results;
        
        // Display results in dropdown
        displaySearchResults(results, query);
        
        // Update main contact list with filtered results
        if (contactListContainer) {
            contactListContainer.innerHTML = '';
            results.forEach(contact => {
                const contactDiv = createContactListItem(contact);
                contactListContainer.appendChild(contactDiv);
            });
        }
        
    } catch (error) {
        console.error('❌ Search error:', error);
        showNotification('Error performing search. Please try again.', 'error');
    }
}

function displaySearchResults(results, query) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Update search results count
    updateSearchResultsCount(results.length);
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No contacts found for "${query}"</p>
                <small>Try searching by name or phone number</small>
            </div>
        `;
    } else {
        results.forEach((contact, index) => {
            const item = createSearchResultItem(contact, query, index);
            container.appendChild(item);
        });
    }
    
    showSearchResults();
}

function createSearchResultItem(contact, query, index) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.setAttribute('data-index', index);
    
    // Highlight matching parts
    let displayName = highlightMatch(contact.name, query);
    let displayNumber = highlightMatch(contact.number, query);
    
    item.innerHTML = `
        <div class="contact-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="contact-info">
            <div class="contact-name">${displayName}</div>
            <div class="contact-number">${displayNumber}</div>
        </div>
        <div class="contact-actions">
            <button class="btn btn-sm btn-outline-primary" onclick="editContact('${contact.number}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteContactByNumber('${contact.number}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add click handler
    item.addEventListener('click', function(e) {
        if (!e.target.closest('.contact-actions')) {
            selectSearchResult(contact);
        }
    });
    
    return item;
}

function highlightMatch(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function selectSearchResult(contact) {
    searchInput.value = `${contact.name} (${contact.number})`;
    hideSearchResults();
    showNotification(`Selected: ${contact.name}`, 'info');
}

function handleSearchKeydown(e) {
    const results = document.querySelectorAll('.search-result-item');
    let currentFocus = -1;
    
    // Find currently focused item
    results.forEach((item, index) => {
        if (item.classList.contains('active')) {
            currentFocus = index;
        }
    });
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            currentFocus = (currentFocus + 1) % results.length;
            setActiveSearchResult(currentFocus);
            break;
        case 'ArrowUp':
            e.preventDefault();
            currentFocus = (currentFocus - 1 + results.length) % results.length;
            setActiveSearchResult(currentFocus);
            break;
        case 'Enter':
            e.preventDefault();
            if (currentFocus >= 0 && currentFocus < results.length) {
                const contact = currentSearchResults[currentFocus];
                selectSearchResult(contact);
            }
            break;
        case 'Escape':
            hideSearchResults();
            break;
    }
}

function setActiveSearchResult(index) {
    // Remove all active classes
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current item
    const items = document.querySelectorAll('.search-result-item');
    if (items[index]) {
        items[index].classList.add('active');
        items[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function clearSearch() {
    searchInput.value = '';
    hideSearchResults();
    updateClearButtonVisibility();
    searchInput.focus();
}

function updateClearButtonVisibility() {
    if (searchClearBtn) {
        searchClearBtn.style.display = searchInput.value.length > 0 ? 'flex' : 'none';
    }
}

function showSearchResults() {
    const container = document.getElementById('searchResults');
    if (container) {
        container.style.display = 'block';
    }
}

function hideSearchResults() {
    const container = document.getElementById('searchResults');
    if (container) {
        container.style.display = 'none';
    }
}

function validatePhoneNumber() {
    const value = this.value.replace(/[^0-9]/g, '');
    this.value = value.substring(0, 4);
    
    // Visual feedback
    if (value.length === 4) {
        this.classList.add('is-valid');
        this.classList.remove('is-invalid');
    } else if (value.length > 0) {
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
    } else {
        this.classList.remove('is-valid', 'is-invalid');
    }
}

function initializeAutocomplete() {
    // This is handled by the search input events
    console.log('Autocomplete initialized');
}

function loadContactsFromStorage() {
    try {
        const savedContacts = localStorage.getItem('contactList');
        if (savedContacts) {
            const contactsData = JSON.parse(savedContacts);
            
            // Clear existing trie and rebuild
            contactList = new Trie();
            
            // Add saved contacts
            contactsData.forEach(contact => {
                contactList.add(contact.number, contact.name);
            });
            
            console.log(`Loaded ${contactsData.length} contacts from localStorage`);
        } else {
            // No saved contacts, use default
            contactList = new Trie();
            console.log('No saved contacts found, using default contacts');
        }
    } catch (error) {
        console.error('Error loading contacts from localStorage:', error);
        // If there's an error, use default contacts
        contactList = new Trie();
    }
}

function saveContactsToStorage() {
    console.log('=== saveContactsToStorage called ===');
    
    try {
        console.log('1. Getting all contacts from trie...');
        const allContacts = contactList.search("");
        console.log('2. Contacts found in trie:', allContacts);
        console.log('3. Number of contacts:', allContacts.length);
        
        if (allContacts.length === 0) {
            console.log('⚠️ WARNING: No contacts found in trie! This might be the problem.');
        }
        
        const contactsData = allContacts.map(contact => ({
            name: contact.name,
            number: contact.number
        }));
        
        console.log('4. Data to save:', contactsData);
        console.log('5. JSON string:', JSON.stringify(contactsData));
        
        localStorage.setItem('contactList', JSON.stringify(contactsData));
        console.log('6. ✅ Successfully saved to localStorage');
        console.log('7. localStorage now contains:', localStorage.getItem('contactList'));
        
    } catch (error) {
        console.error('❌ ERROR in saveContactsToStorage:', error);
        showNotification('Error saving contacts. Please try again.', 'error');
    }
}

function updateContactListDisplay() {
    console.log('updateContactListDisplay called');
    console.log('contactListContainer:', contactListContainer);
    
    if (!contactListContainer) {
        contactListContainer = document.querySelector('.contact-list-container');
        console.log('Found contactListContainer:', contactListContainer);
        if (!contactListContainer) {
            console.error('Could not find contact list container!');
            return;
        }
    }
    
    // Clear existing display
    contactListContainer.innerHTML = '';
    
    // Get all contacts
    const allContacts = contactList.search("");
    console.log('All contacts found:', allContacts);
    
    // Update contact count
    updateContactCount(allContacts.length);
    
    if (allContacts.length === 0) {
        console.log('No contacts found, showing empty state');
        const noContactsMsg = document.createElement('div');
        noContactsMsg.className = 'text-center py-4 text-muted';
        noContactsMsg.innerHTML = `
            <i class="fas fa-users fa-3x mb-3 text-muted"></i>
            <h5 class="text-muted">No contacts yet</h5>
            <p class="text-muted">Add your first contact to get started!</p>
            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addContactModal">
                <i class="fas fa-plus"></i> Add First Contact
            </button>
        `;
        contactListContainer.appendChild(noContactsMsg);
        return;
    }
    
    console.log(`Displaying ${allContacts.length} contacts`);
    
    // Sort contacts by name
    allContacts.sort((a, b) => a.name.localeCompare(b.name));
    
    // Display contacts
    allContacts.forEach(contact => {
        const contactDiv = createContactListItem(contact);
        contactListContainer.appendChild(contactDiv);
    });
    
    console.log('Contact list display updated');
}

function updateContactCount(count) {
    const contactCountElement = document.getElementById('contactCount');
    const totalContactsElement = document.getElementById('totalContacts');
    
    if (contactCountElement) {
        contactCountElement.textContent = count;
    }
    
    if (totalContactsElement) {
        totalContactsElement.textContent = count;
    }
}

function updateSearchResultsCount(count) {
    const searchResultsCountElement = document.getElementById('searchResultsCount');
    if (searchResultsCountElement) {
        searchResultsCountElement.textContent = count;
    }
}

function createContactListItem(contact) {
    const contactDiv = document.createElement('div');
    contactDiv.className = 'list-group-item list-group-item-action contact-list-item';
    contactDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="contact-avatar me-3">
                <i class="fas fa-user-circle fa-2x text-primary"></i>
            </div>
            <div class="flex-grow-1">
                <h6 class="mb-1">${contact.name}</h6>
                <small class="text-muted">${contact.number}</small>
            </div>
            <div class="contact-actions">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editContact('${contact.number}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteContactByNumber('${contact.number}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return contactDiv;
}

// Global functions for onclick handlers
window.editContact = function(number) {
    const contact = contactList.search(number)[0];
    if (contact) {
        contactNameInput.value = contact.name;
        contactNumberInput.value = contact.number;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addContactModal'));
        modal.show();
        
        // Change button text
        saveContactBtn.textContent = 'Update Contact';
        saveContactBtn.onclick = updateContact;
    }
};

window.deleteContactByNumber = function(number) {
    if (confirm(`Are you sure you want to delete the contact with number ${number}?`)) {
        try {
            contactList.del(number);
            saveContactsToStorage();
            updateContactListDisplay();
            
            // Update search results if search is active
            if (searchInput.value.trim()) {
                handleSearch();
            }
            
            showNotification('Contact deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting contact:', error);
            showNotification('Error deleting contact. Please try again.', 'error');
        }
    }
};

window.exportContacts = function() {
    try {
        const allContacts = contactList.search("");
        if (allContacts.length === 0) {
            showNotification('No contacts to export!', 'warning');
            return;
        }
        
        const contactsData = allContacts.map(contact => ({
            Name: contact.name,
            'Phone Number': contact.number
        }));
        
        // Convert to CSV
        const csvContent = convertToCSV(contactsData);
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`Exported ${allContacts.length} contacts successfully!`, 'success');
        
    } catch (error) {
        console.error('Error exporting contacts:', error);
        showNotification('Error exporting contacts. Please try again.', 'error');
    }
};

window.clearAllContacts = function() {
    const contactCount = contactList.search("").length;
    if (contactCount === 0) {
        showNotification('No contacts to clear!', 'info');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ALL ${contactCount} contacts? This action cannot be undone!`)) {
        try {
            // Clear the trie
            contactList = new Trie();
            
            // Clear localStorage
            localStorage.removeItem('contactList');
            
            // Update display
            updateContactListDisplay();
            
            // Clear search
            if (searchInput) {
                searchInput.value = '';
                hideSearchResults();
                updateClearButtonVisibility();
            }
            
            showNotification(`All ${contactCount} contacts have been cleared!`, 'success');
            
        } catch (error) {
            console.error('Error clearing contacts:', error);
            showNotification('Error clearing contacts. Please try again.', 'error');
        }
    }
};

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

function updateContact() {
    const name = contactNameInput.value.trim();
    const number = contactNumberInput.value.trim();
    
    // Validation
    if (!name || !number) {
        showNotification('Please fill in both name and phone number fields!', 'error');
        return;
    }
    
    if (name.length < 2) {
        showNotification('Name must be at least 2 characters long!', 'error');
        return;
    }
    
    if (number.length !== 4 || !/^\d{4}$/.test(number)) {
        showNotification('Phone number must be exactly 4 digits!', 'error');
        return;
    }
    
    try {
        // Delete old contact and add new one
        contactList.del(number);
        contactList.add(number, name);
        
        // Save to localStorage
        saveContactsToStorage();
        
        // Update contact list display
        updateContactListDisplay();
        
        // Clear form and close modal
        contactNameInput.value = "";
        contactNumberInput.value = "";
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addContactModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reset button
        saveContactBtn.textContent = 'Save Contact';
        saveContactBtn.onclick = addContact;
        
        showNotification('Contact updated successfully!', 'success');
        
        // Update search results if search is active
        if (searchInput.value.trim()) {
            handleSearch();
        }
        
    } catch (error) {
        console.error('Error updating contact:', error);
        showNotification('Error updating contact. Please try again.', 'error');
    }
}

function showNotification(message, type = 'info') {
    // Map notification types to Bootstrap alert classes
    const alertClassMap = {
        'success': 'alert-success',
        'error': 'alert-error',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert ${alertClassMap[type] || 'alert-info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 350px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Test function to add a sample contact
window.testAddContact = function() {
    console.log('Test function called');
    
    // Add a test contact directly to the trie
    try {
        contactList.add('9999', 'Test User');
        console.log('Test contact added. Current contacts:', contactList.search(""));
        
        // Save to localStorage
        saveContactsToStorage();
        
        // Update display
        updateContactListDisplay();
        
        showNotification('Test contact added successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding test contact:', error);
        showNotification('Error adding test contact: ' + error.message, 'error');
    }
};

// Test function to test search functionality
window.testSearch = function() {
    console.log('🧪 Testing search functionality...');
    
    // Test if search input exists
    if (!searchInput) {
        console.error('❌ Search input not found!');
        return;
    }
    
    // Test if event listener is attached
    console.log('Search input element:', searchInput);
    console.log('Search input value:', searchInput.value);
    
    // Manually trigger search
    searchInput.value = 'test';
    searchInput.dispatchEvent(new Event('input'));
    
    console.log('✅ Search test completed');
};

// Export for testing
window.contactList = contactList;
window.testFunctions = {
    addContact,
    deleteContact,
    search: handleSearch,
    clearSearch,
    updateContactListDisplay,
    exportContacts: window.exportContacts,
    clearAllContacts: window.clearAllContacts
}; 
