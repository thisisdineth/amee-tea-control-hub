document.addEventListener('DOMContentLoaded', () => {
    // Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyA-M8XsFZaZPu_lBIx0TbqcmzhTXeHRjQM", // Replace with your actual API key if different
        authDomain: "ecommerceapp-dab53.firebaseapp.com",
        databaseURL: "https://ecommerceapp-dab53-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "ecommerceapp-dab53",
        storageBucket: "ecommerceapp-dab53.appspot.com",
        messagingSenderId: "429988301014",
        appId: "1:429988301014:web:4f09bb412b6cf0b4a82177"
    };

    // Initialize Firebase (ensure it's only done once)
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database(); // Use Realtime Database

    // --- DOM Elements ---
    // Navbar
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // Table Creation Modal
    const addNewTableBtn = document.getElementById('addNewTableBtn');
    const newTableModal = document.getElementById('newTableModal');
    const closeButton = document.querySelector('.modal .close-button');
    const tableNameInput = document.getElementById('tableNameInput');
    const existingTableSuggestions = document.getElementById('existingTableSuggestions');
    const createOrUpdateTableBtn = document.getElementById('createOrUpdateTableBtn');

    // Current Table Display
    const currentTableSection = document.getElementById('currentTableSection');
    const currentTableNameDisplay = document.getElementById('currentTableName');
    const materialTableBody = document.getElementById('materialTableBody');

    // Add Row Form
    const addRowForm = document.getElementById('addRowForm');

    // All Tables List
    const allTablesList = document.getElementById('allTablesList');
    const searchTableInput = document.getElementById('searchTableInput');

    let activeTableName = null;
    let existingTableNames = [];

    // --- Mobile Menu Toggle ---
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Optional: Close mobile menu when a link is clicked
        const mobileNavLinks = mobileMenu.querySelectorAll('a.mobile-navbar-item');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (!mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            });
        });
    }


    // --- Modal Functionality ---
    if (addNewTableBtn) {
        addNewTableBtn.onclick = () => {
            if (newTableModal) newTableModal.style.display = 'flex'; // Use flex to enable centering
            if (tableNameInput) tableNameInput.value = '';
            if (existingTableSuggestions) existingTableSuggestions.innerHTML = '';
            fetchExistingTableNames(); // Fetch and show suggestions
        };
    }

    if (closeButton) {
        closeButton.onclick = () => {
            if (newTableModal) newTableModal.style.display = 'none';
        };
    }

    window.onclick = (event) => {
        if (newTableModal && event.target == newTableModal) {
            newTableModal.style.display = 'none';
        }
    };

    // --- Table Name Input and Suggestions ---
    if (tableNameInput) {
        tableNameInput.addEventListener('input', () => {
            const inputText = tableNameInput.value.toLowerCase();
            if (existingTableSuggestions) existingTableSuggestions.innerHTML = '';

            if (inputText.length > 0 && Array.isArray(existingTableNames)) {
                const suggestions = existingTableNames.filter(name => name.toLowerCase().includes(inputText));
                suggestions.forEach(name => {
                    const li = document.createElement('li');
                    li.textContent = name;
                    li.onclick = () => {
                        tableNameInput.value = name;
                        if (existingTableSuggestions) existingTableSuggestions.innerHTML = '';
                    };
                    if (existingTableSuggestions) existingTableSuggestions.appendChild(li);
                });
            }
        });
    }

    // --- Fetch Existing Table Names from RTDB ---
    async function fetchExistingTableNames() {
        try {
            const snapshot = await db.ref('inventoryTables').once('value');
            const data = snapshot.val();
            existingTableNames = data ? Object.keys(data) : [];
        } catch (error) {
            console.error("Error fetching table names: ", error);
            existingTableNames = [];
        }
        populateAllTablesList();
    }

    // --- Create or Update Table (Metadata in RTDB) ---
    if (createOrUpdateTableBtn) {
        createOrUpdateTableBtn.onclick = async () => {
            if (!tableNameInput) return;
            const tableName = tableNameInput.value.trim();
            if (!tableName) {
                alert('Table name cannot be empty.');
                return;
            }

            activeTableName = tableName;
            if (currentTableNameDisplay) currentTableNameDisplay.textContent = `Current Table: ${tableName}`;
            if (currentTableSection) currentTableSection.classList.remove('hidden');
            if (newTableModal) newTableModal.style.display = 'none';

            if (!existingTableNames.includes(tableName)) {
                try {
                    // Create metadata node for the new table
                    await db.ref(`inventoryTables/${tableName}`).set({ createdAt: firebase.database.ServerValue.TIMESTAMP });
                    existingTableNames.push(tableName);
                    populateAllTablesList();
                    console.log(`Table metadata for '${tableName}' created.`);
                } catch (error) {
                    console.error("Error creating table metadata: ", error);
                    alert('Error creating table metadata.');
                    return;
                }
            }
            loadTableData(tableName);
        };
    }

    // --- Load Table Data from RTDB ---
    async function loadTableData(tableName) {
        if (!tableName || !materialTableBody) return;
        materialTableBody.innerHTML = ''; // Clear existing rows
        try {
            // Order by inflowDate or a general transaction date if you have one
            const snapshot = await db.ref(tableName).orderByChild('inflowDate').once('value');
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    renderRow(childSnapshot.key, childSnapshot.val());
                });
            } else {
                console.log(`No data found for table ${tableName}`);
                // Optionally display a message in the table:
                // const row = materialTableBody.insertRow();
                // const cell = row.insertCell();
                // cell.colSpan = 16; // Adjust to your total number of data columns + actions
                // cell.textContent = 'No data available in this table.';
                // cell.style.textAlign = 'center';
            }
        } catch (error) {
            console.error(`Error loading data for table ${tableName}: `, error);
        }
    }

    // --- Render a Single Row in the Table ---
    // Structure: Date (main), Inflow (6), Outflow (5), Balance (3), Actions
    function renderRow(docId, data) {
        if (!materialTableBody) return;
        const row = materialTableBody.insertRow();
        row.setAttribute('data-id', docId);

        // 1. Main Date (Typically Inflow Date or a general transaction date)
        row.insertCell().textContent = data.inflowDate || data.transactionDate || ''; // Prioritize inflowDate

        // Inflow Data (6 cells)
        row.insertCell().textContent = data.inflowSupplier || '';
        row.insertCell().textContent = data.inflowEstate || '';
        row.insertCell().textContent = data.inflowGrade || '';
        row.insertCell().textContent = data.inflowBagWeight ? parseFloat(data.inflowBagWeight).toFixed(2) : '';
        row.insertCell().textContent = data.inflowBags || '';
        const totalInflowWeight = (data.inflowBagWeight && data.inflowBags)
            ? (parseFloat(data.inflowBagWeight) * parseInt(data.inflowBags)).toFixed(2)
            : (data.inflowTotalWeight ? parseFloat(data.inflowTotalWeight).toFixed(2) : '');
        row.insertCell().textContent = totalInflowWeight;

        // Outflow Data (5 cells: Date, Estate, Grade, Product, Weight)
        row.insertCell().textContent = data.outflowDate || ''; // Specific date for outflow
        row.insertCell().textContent = data.outflowEstate || '';
        row.insertCell().textContent = data.outflowGrade || '';
        row.insertCell().textContent = data.outflowProduct || '';
        row.insertCell().textContent = data.outflowWeight ? parseFloat(data.outflowWeight).toFixed(2) : '';

        // Balance Data (3 cells)
        row.insertCell().textContent = data.balanceEstate || '';
        row.insertCell().textContent = data.balanceGrade || '';
        row.insertCell().textContent = data.balanceQty ? parseFloat(data.balanceQty).toFixed(2) : '';

        // Actions Cell
        const actionsCell = row.insertCell();
        actionsCell.classList.add('actions');

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.classList.add('edit-btn', 'btn'); // Using btn class for styling consistency
        editBtn.onclick = () => editRow(docId, data);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-btn', 'btn'); // Using btn class
        deleteBtn.onclick = () => deleteRow(docId);

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    }


    // --- Add New Row to RTDB ---
    if (addRowForm) {
        addRowForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!activeTableName) {
                alert('Please select or create a table first.');
                return;
            }

            const inflowBagWeightVal = parseFloat(document.getElementById('inflowBagWeight').value) || 0;
            const inflowBagsVal = parseInt(document.getElementById('inflowBags').value) || 0;
            let inflowTotalWeightVal = null;
            if (inflowBagWeightVal > 0 && inflowBagsVal > 0) {
                inflowTotalWeightVal = (inflowBagWeightVal * inflowBagsVal).toFixed(2);
            }


            const rowData = {
                // Main transaction date - typically the inflow date if it's primarily an inflow record
                inflowDate: document.getElementById('inflowDate').value,

                // Inflow fields
                inflowSupplier: document.getElementById('inflowSupplier').value.trim() || null,
                inflowEstate: document.getElementById('inflowEstate').value.trim() || null,
                inflowGrade: document.getElementById('inflowGrade').value.trim() || null,
                inflowBagWeight: inflowBagWeightVal || null,
                inflowBags: inflowBagsVal || null,
                inflowTotalWeight: inflowTotalWeightVal,

                // Outflow fields (includes its own date now)
                outflowDate: document.getElementById('outflowDate').value || null, // Allow empty if no outflow
                outflowEstate: document.getElementById('outflowEstate').value.trim() || null,
                outflowGrade: document.getElementById('outflowGrade').value.trim() || null,
                outflowProduct: document.getElementById('outflowProduct').value.trim() || null,
                outflowWeight: parseFloat(document.getElementById('outflowWeight').value) || null,

                // Balance fields
                balanceEstate: document.getElementById('balanceEstate').value.trim() || null,
                balanceGrade: document.getElementById('balanceGrade').value.trim() || null,
                balanceQty: parseFloat(document.getElementById('balanceQty').value) || null,

                createdAt: firebase.database.ServerValue.TIMESTAMP
            };

            // Basic validation: ensure at least an inflowDate is present
            if (!rowData.inflowDate) {
                alert('Inflow Date is required.');
                document.getElementById('inflowDate').focus();
                return;
            }

            try {
                const newRowRef = db.ref(activeTableName).push();
                await newRowRef.set(rowData);
                loadTableData(activeTableName);
                addRowForm.reset();
                console.log("Row added with ID: ", newRowRef.key);
            } catch (error) {
                console.error("Error adding new row: ", error);
                alert('Error adding row. Check console for details.');
            }
        });
    }

    // --- Edit Row (RTDB) ---
    // This function uses prompts. For better UX, consider a modal or populating the addRowForm.
    function editRow(docId, currentData) {
        if (!activeTableName) return;

        // Create a temporary object to hold new values from prompts
        const newData = { ...currentData }; // Clone current data

        // Prompt for each field, pre-filling with current data
        // It's verbose, but clear. A loop or a more structured approach could be used for many fields.

        newData.inflowDate = prompt("Enter Inflow Date (YYYY-MM-DD):", currentData.inflowDate || "") || currentData.inflowDate;

        newData.inflowSupplier = prompt("Enter Inflow Supplier:", currentData.inflowSupplier || "") || currentData.inflowSupplier;
        newData.inflowEstate = prompt("Enter Inflow Estate:", currentData.inflowEstate || "") || currentData.inflowEstate;
        newData.inflowGrade = prompt("Enter Inflow Grade:", currentData.inflowGrade || "") || currentData.inflowGrade;
        newData.inflowBagWeight = parseFloat(prompt("Enter Inflow Bag Weight (Kg):", currentData.inflowBagWeight || "0")) || currentData.inflowBagWeight;
        newData.inflowBags = parseInt(prompt("Enter No. of Inflow Bags:", currentData.inflowBags || "0")) || currentData.inflowBags;
        // Recalculate inflowTotalWeight if components change
        if (newData.inflowBagWeight && newData.inflowBags) {
            newData.inflowTotalWeight = (newData.inflowBagWeight * newData.inflowBags).toFixed(2);
        } else {
            newData.inflowTotalWeight = currentData.inflowTotalWeight; // or prompt if it's manually entered
        }


        newData.outflowDate = prompt("Enter Outflow Date (YYYY-MM-DD):", currentData.outflowDate || "") || currentData.outflowDate;
        newData.outflowEstate = prompt("Enter Outflow Estate:", currentData.outflowEstate || "") || currentData.outflowEstate;
        newData.outflowGrade = prompt("Enter Outflow Grade:", currentData.outflowGrade || "") || currentData.outflowGrade;
        newData.outflowProduct = prompt("Enter Outflow Product:", currentData.outflowProduct || "") || currentData.outflowProduct;
        newData.outflowWeight = parseFloat(prompt("Enter Outflow Weight (Kg):", currentData.outflowWeight || "0")) || currentData.outflowWeight;

        newData.balanceEstate = prompt("Enter Balance Estate:", currentData.balanceEstate || "") || currentData.balanceEstate;
        newData.balanceGrade = prompt("Enter Balance Grade:", currentData.balanceGrade || "") || currentData.balanceGrade;
        newData.balanceQty = parseFloat(prompt("Enter Balance Qty (Kg):", currentData.balanceQty || "0")) || currentData.balanceQty;


        // Check if any actual changes were made (simple JSON string comparison)
        if (JSON.stringify(currentData) === JSON.stringify(newData)) {
            console.log("No changes made or dialog cancelled for all fields.");
            return;
        }

        // Add/update the 'updatedAt' timestamp
        newData.updatedAt = firebase.database.ServerValue.TIMESTAMP;

        db.ref(`${activeTableName}/${docId}`).update(newData)
            .then(() => {
                console.log("Row updated successfully");
                loadTableData(activeTableName); // Reload to show changes
            })
            .catch(error => {
                console.error("Error updating row: ", error);
                alert('Error updating row. Check console for details.');
            });
    }


    // --- Delete Row (RTDB) ---
    async function deleteRow(docId) {
        if (!activeTableName) return;
        if (confirm('Are you sure you want to delete this row?')) {
            try {
                await db.ref(`${activeTableName}/${docId}`).remove();
                console.log("Row deleted successfully");
                loadTableData(activeTableName); // Reload table
            } catch (error) {
                console.error("Error deleting row: ", error);
                alert('Error deleting row. Check console for details.');
            }
        }
    }

    // --- Populate "All Created Tables" List ---
    function populateAllTablesList() {
        if (!allTablesList || !searchTableInput || !Array.isArray(existingTableNames)) return;
        allTablesList.innerHTML = '';
        const searchTerm = searchTableInput.value.toLowerCase();

        existingTableNames
            .filter(name => name.toLowerCase().includes(searchTerm))
            .forEach(tableName => {
                const li = document.createElement('li');
                li.textContent = tableName;
                li.onclick = () => {
                    activeTableName = tableName;
                    if (currentTableNameDisplay) currentTableNameDisplay.textContent = `Current Table: ${tableName}`;
                    if (currentTableSection) currentTableSection.classList.remove('hidden');
                    loadTableData(tableName);
                    window.scrollTo({ top: currentTableSection.offsetTop - 80, behavior: 'smooth' }); // Scroll to table, considering navbar height
                };

                const deleteTableBtn = document.createElement('button');
                deleteTableBtn.textContent = 'Delete Table';
                deleteTableBtn.classList.add('btn', 'btn-danger', 'btn-sm'); // Added some styling classes
                deleteTableBtn.style.marginLeft = '10px'; // Add some space
                deleteTableBtn.onclick = (event) => {
                    event.stopPropagation(); // Prevent li click event
                    deleteEntireTable(tableName);
                };
                li.appendChild(deleteTableBtn);
                allTablesList.appendChild(li);
            });
    }

    // --- Delete Entire Table (Metadata and Data from RTDB) ---
    async function deleteEntireTable(tableNameToDelete) {
        if (confirm(`Are you sure you want to delete the entire table "${tableNameToDelete}" and all its data? This cannot be undone.`)) {
            try {
                // 1. Delete all data within the table's node
                await db.ref(tableNameToDelete).remove();
                console.log(`All data in table '${tableNameToDelete}' deleted.`);

                // 2. Delete the table metadata from 'inventoryTables'
                await db.ref(`inventoryTables/${tableNameToDelete}`).remove();
                console.log(`Metadata for table '${tableNameToDelete}' deleted.`);

                // 3. Update UI
                existingTableNames = existingTableNames.filter(name => name !== tableNameToDelete);
                populateAllTablesList();
                if (activeTableName === tableNameToDelete) {
                    if (currentTableSection) currentTableSection.classList.add('hidden');
                    activeTableName = null;
                    if (currentTableNameDisplay) currentTableNameDisplay.textContent = '';
                    if (materialTableBody) materialTableBody.innerHTML = ''; // Clear table body
                }
                alert(`Table "${tableNameToDelete}" deleted successfully.`);
            } catch (error) {
                console.error(`Error deleting table ${tableNameToDelete}: `, error);
                alert(`Error deleting table ${tableNameToDelete}. Check console for details.`);
            }
        }
    }

    // --- Search Table Functionality ---
    if (searchTableInput) {
        searchTableInput.addEventListener('input', populateAllTablesList);
    }

    // --- Initial Load ---
    fetchExistingTableNames(); // Fetch table names when the page loads
});