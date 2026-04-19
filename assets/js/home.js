// --- 1. Autocomplete Logic for Airports ---
const airports = [
    { code: 'JFK', name: 'New York (JFK)' },
    { code: 'LHR', name: 'London Heathrow (LHR)' },
    { code: 'DXB', name: 'Dubai (DXB)' },
    { code: 'CDG', name: 'Paris Charles de Gaulle (CDG)' },
    { code: 'JED', name: 'Jeddah (JED)' },
    { code: 'RUH', name: 'Riyadh (RUH)' },
    { code: 'LAX', name: 'Los Angeles (LAX)' },
    { code: 'NRT', name: 'Tokyo Narita (NRT)' },
    { code: 'SIN', name: 'Singapore (SIN)' },
    { code: 'SYD', name: 'Sydney (SYD)' },
    { code: 'YYZ', name: 'Toronto (YYZ)' },
    { code: 'FRA', name: 'Frankfurt (FRA)' },
    { code: 'MAD', name: 'Madrid (MAD)' }
];

function setupAutocomplete(displayId, codeId, dropdownId) {
    const displayInput = document.getElementById(displayId);
    const codeInput = document.getElementById(codeId);
    const dropdown = document.getElementById(dropdownId);

    displayInput.addEventListener('input', function() {
        const val = this.value.toLowerCase();
        dropdown.innerHTML = '';
        if (!val) {
            dropdown.classList.remove('active');
            codeInput.value = '';
            return;
        }

        const matches = airports.filter(a => 
            a.code.toLowerCase().includes(val) || a.name.toLowerCase().includes(val)
        );

        if (matches.length > 0) {
            dropdown.classList.add('active');
            matches.forEach(match => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.innerHTML = `<span class="autocomplete-code">${match.code}</span> <span>${match.name}</span>`;
                item.addEventListener('click', function() {
                    displayInput.value = match.name;
                    codeInput.value = match.code;
                    dropdown.classList.remove('active');
                });
                dropdown.appendChild(item);
            });
        } else {
            dropdown.classList.remove('active');
        }
    });

    // Close when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== displayInput && e.target !== dropdown) {
            dropdown.classList.remove('active');
            // Force valid code selection
            if (displayInput.value && !codeInput.value) {
                displayInput.value = ''; // clear if they didn't pick from list
            }
        }
    });
}

setupAutocomplete('from-display', 'from-code', 'from-autocomplete');
setupAutocomplete('to-display', 'to-code', 'to-autocomplete');

// --- 2. Date Picker and Trip Type ---
let fp = flatpickr("#travel-dates", {
    mode: "range",
    dateFormat: "Y-m-d",
    minDate: "today",
    altInput: true,
    altFormat: "F j, Y",
    showMonths: 2
});

const tripTypeRadios = document.getElementsByName('trip-type');
tripTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'one-way') {
            fp.set('mode', 'single');
            document.getElementById('travel-dates').placeholder = 'Departure';
            if (fp.altInput) fp.altInput.placeholder = 'Departure';
        } else {
            fp.set('mode', 'range');
            document.getElementById('travel-dates').placeholder = 'Departure - Return';
            if (fp.altInput) fp.altInput.placeholder = 'Departure - Return';
        }
        fp.clear();
    });
});

// --- 3. Travelers Logic & Child Ages ---
const travelersBtn = document.getElementById('travelers-btn');
const travelersDropdown = document.getElementById('travelers-dropdown');
const travelersDone = document.getElementById('travelers-done');
const summaryText = document.getElementById('travelers-summaryText');
const childAgesContainer = document.getElementById('child-ages-container');
const childAgesList = document.getElementById('child-ages-list');

travelersBtn.addEventListener('click', () => {
    const isHidden = travelersDropdown.getAttribute('aria-hidden') === 'true';
    travelersDropdown.setAttribute('aria-hidden', !isHidden);
});

travelersDone.addEventListener('click', () => {
    travelersDropdown.setAttribute('aria-hidden', 'true');
});

window.addEventListener('click', (e) => {
    if (!travelersBtn.contains(e.target) && !travelersDropdown.contains(e.target)) {
        travelersDropdown.setAttribute('aria-hidden', 'true');
    }
});

function changeCount(type, delta) {
    const display = document.getElementById(type + '-count');
    const input = document.getElementById(type + '-input');
    let current = parseInt(display.innerText);
    
    let min = type === 'adults' ? 1 : 0;
    let newVal = Math.max(min, current + delta);
    
    display.innerText = newVal;
    input.value = newVal;
    
    if (type === 'children') {
        renderChildAges(newVal);
    }
    updateSummary();
}

function renderChildAges(count) {
    if (count === 0) {
        childAgesContainer.style.display = 'none';
        childAgesList.innerHTML = '';
        return;
    }
    
    childAgesContainer.style.display = 'block';
    
    // Retain existing values when adding/removing safely
    const existingSelects = childAgesList.querySelectorAll('select');
    const existingValues = Array.from(existingSelects).map(s => s.value);
    
    let html = '';
    for (let i = 0; i < count; i++) {
        const val = existingValues[i] || '0';
        let options = '';
        for (let j = 0; j <= 17; j++) {
            options += `<option value="${j}" ${val == j ? 'selected' : ''}>${j}</option>`;
        }
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-size: 0.75rem; color: #4B5563;">Child ${i + 1} Age</label>
                <select name="child_ages[]" required style="border: 1px solid #D1D5DB; border-radius: 0.25rem; padding: 0.25rem; font-size: 0.875rem; background: #fff;">
                    ${options}
                </select>
            </div>
        `;
    }
    childAgesList.innerHTML = html;
}

function updateSummary() {
    const adults = parseInt(document.getElementById('adults-count').innerText);
    const children = parseInt(document.getElementById('children-count').innerText);
    let text = `${adults} Adult${adults > 1 ? 's' : ''}`;
    if (children > 0) {
        text += `, ${children} Child${children > 1 ? 'ren' : ''}`;
    }
    summaryText.innerText = text;
}

// --- 4. Form Submission Parsing ---
document.getElementById('flight-search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Collect Base data
    const tripType = document.querySelector('input[name="trip-type"]:checked').value;
    const fromCode = document.getElementById('from-code').value;
    const toCode = document.getElementById('to-code').value;
    const cabinClass = document.getElementById('cabin-class').value;
    const rawDates = document.getElementById('travel-dates').value; // e.g., "2026-11-05 to 2026-11-15"
    
    // Ensure inputs are strictly set
    if (!fromCode || !toCode) {
        alert("Please select a valid airport from the dropdown list.");
        return;
    }

    if (!rawDates) {
        alert("Please select travel dates.");
        return;
    }

    // Split Dates logic
    let outboundDate = '';
    let returnDate = '';
    if (tripType === 'one-way') {
        outboundDate = rawDates;
    } else {
        const splitDates = rawDates.split(' to ');
        outboundDate = splitDates[0] || '';
        returnDate = splitDates[1] || '';
    }
    document.getElementById('outbound-date').value = outboundDate;
    document.getElementById('return-date').value = returnDate;

    // Build Slices Array for Duffel API mock
    const slices = [];
    if (outboundDate) {
        slices.push({ origin: fromCode, destination: toCode, departure_date: outboundDate });
    }
    if (tripType === 'round-trip' && returnDate) {
        slices.push({ origin: toCode, destination: fromCode, departure_date: returnDate });
    }

    // Build passenger Array logic
    const passengers = [];
    const adultCount = parseInt(document.getElementById('adults-input').value);
    for(let i = 0; i < adultCount; i++) {
        passengers.push({ type: 'adult' });
    }

    const childSelects = document.querySelectorAll('select[name="child_ages[]"]');
    childSelects.forEach(select => {
        passengers.push({ type: 'child', age: parseInt(select.value) });
    });

    // Simulate the final JSON Payload (Instead of POSTing, redirect with payload)
    const payload = {
        slices: slices,
        passengers: passengers,
        cabin_class: cabinClass
    };
    
    // Store in local storage to easily retrieve on the next page
    localStorage.setItem('flightSearchParams', JSON.stringify(payload));
    window.location.href = 'pages/flight-result.html';
});