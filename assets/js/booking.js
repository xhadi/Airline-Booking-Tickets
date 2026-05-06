const airportNames = {
    'JFK': 'New York',
    'LHR': 'London Heathrow',
    'DXB': 'Dubai',
    'CDG': 'Paris Charles de Gaulle',
    'JED': 'Jeddah',
    'RUH': 'Riyadh',
    'DMM': 'Dammam',
    'LAX': 'Los Angeles',
    'NRT': 'Tokyo Narita',
    'SIN': 'Singapore',
    'SYD': 'Sydney',
    'YYZ': 'Toronto',
    'FRA': 'Frankfurt',
    'MAD': 'Madrid',
    'AMS': 'Amsterdam',
    'IST': 'Istanbul',
    'BKK': 'Bangkok',
    'HKG': 'Hong Kong',
    'MLE': 'Malé',
    'CAI': 'Cairo'
};

// State for add-ons
let offerServices = { bags: [], seatMaps: [], currency: 'SAR' };
let selectedBags = {};
let selectedSeats = {};
let currentSeatMapPassenger = null;
let currentSeatMapSegment = null;
let savedTravelers = [];

function loadFlightData() {
    const flightData = localStorage.getItem('selectedFlight');
    if (!flightData) {
        window.location.href = '../index.html';
        return;
    }
    return JSON.parse(flightData);
}

function renderPassengers(count) {
    const container = document.getElementById('passengers-container');
    let html = '';
    for (let i = 1; i <= count; i++) {
        html += `
            <div class="passenger-form" id="passenger-card-${i}">
                <div class="passenger-header">
                    <span class="passenger-number">Passenger ${i}</span>
                    <span class="passenger-type" id="pax-type-badge-${i}">Adult</span>
                </div>
                <div class="passenger-type-select">
                    <span class="passenger-type-label">Type:</span>
                    <select class="search-input" id="pax-type-${i}" onchange="onPassengerTypeChange(${i})">
                        <option value="adult">Adult</option>
                        <option value="child">Child (2-11)</option>
                        <option value="infant_without_seat">Infant (0-1)</option>
                    </select>
                </div>
                <div class="saved-traveler-bar">
                    <span class="passenger-type-label">Use saved traveler:</span>
                    <select class="search-input" id="saved-traveler-select-${i}" onchange="applyTraveler(${i}, this.value)">
                        <option value="">— Enter manually —</option>
                    </select>
                </div>
                <div class="passenger-fields">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="field-label" for="title-${i}">Title</label>
                            <select class="search-input" id="title-${i}" required>
                                <option value="">Select</option>
                                <option value="mr">Mr</option>
                                <option value="mrs">Mrs</option>
                                <option value="ms">Ms</option>
                                <option value="miss">Miss</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="field-label" for="first-name-${i}">First Name</label>
                            <input type="text" class="search-input" id="first-name-${i}" required>
                        </div>
                        <div class="form-group">
                            <label class="field-label" for="last-name-${i}">Last Name</label>
                            <input type="text" class="search-input" id="last-name-${i}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="field-label" for="dob-${i}">Date of Birth</label>
                            <input type="date" class="search-input" id="dob-${i}" required>
                            <span class="field-error" id="dob-error-${i}" style="display:none;"></span>
                        </div>
                        <div class="form-group">
                            <label class="field-label" for="gender-${i}">Gender</label>
                            <select class="search-input" id="gender-${i}" required>
                                <option value="">Select</option>
                                <option value="m">Male</option>
                                <option value="f">Female</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="field-label" for="email-${i}">Email</label>
                            <input type="email" class="search-input" id="email-${i}" required>
                        </div>
                        <div class="form-group">
                            <label class="field-label" for="phone-${i}">Phone Number</label>
                            <input type="tel" class="search-input" id="phone-${i}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="field-label" for="passport-${i}">Passport Number</label>
                            <input type="text" class="search-input" id="passport-${i}" required>
                        </div>
                        <div class="form-group">
                            <label class="field-label" for="issuing-country-${i}">Issuing Country</label>
                            <input type="text" class="search-input" id="issuing-country-${i}" placeholder="e.g. SAU" maxlength="3" required>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function onPassengerTypeChange(index) {
    const type = document.getElementById(`pax-type-${index}`).value;
    const badge = document.getElementById(`pax-type-badge-${index}`);
    badge.textContent = type === 'child' ? 'Child' : type === 'infant_without_seat' ? 'Infant' : 'Adult';
}

function validateDob(index, type) {
    const dobInput = document.getElementById(`dob-${index}`);
    const errorEl = document.getElementById(`dob-error-${index}`);
    const dobValue = dobInput.value;

    if (!dobValue) {
        showFieldError(errorEl, 'Date of birth is required');
        return false;
    }

    const dob = new Date(dobValue);
    const now = new Date();
    const age = now.getFullYear() - dob.getFullYear();

    if (type === 'child') {
        if (age < 2 || age >= 12) {
            showFieldError(errorEl, 'Child must be between 2 and 11 years old');
            return false;
        }
    } else if (type === 'infant_without_seat') {
        if (age < 0 || age >= 2) {
            showFieldError(errorEl, 'Infant must be under 2 years old');
            return false;
        }
    }

    hideFieldError(errorEl);
    return true;
}

function luhnCheck(num) {
    let sum = 0;
    let alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
        let n = parseInt(num.charAt(i), 10);
        if (alt) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
    }
    return sum % 10 === 0;
}

function validateCard() {
    const numberEl = document.getElementById('card-number');
    const errorEl = document.getElementById('card-number-error');
    const num = numberEl.value.replace(/\s/g, '');

    if (num.length < 13 || num.length > 19) {
        showFieldError(errorEl, 'Card number must be 13-19 digits');
        return false;
    }
    if (!/^\d+$/.test(num)) {
        showFieldError(errorEl, 'Card number must contain only digits');
        return false;
    }
    if (!luhnCheck(num)) {
        showFieldError(errorEl, 'Invalid card number');
        return false;
    }

    hideFieldError(errorEl);
    return true;
}

function validateExpiry() {
    const el = document.getElementById('card-expiry');
    const errorEl = document.getElementById('card-expiry-error');
    const val = el.value;

    const match = val.match(/^(\d{2})\/(\d{2})$/);
    if (!match) {
        showFieldError(errorEl, 'Use format MM/YY');
        return false;
    }

    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10) + 2000;

    if (month < 1 || month > 12) {
        showFieldError(errorEl, 'Invalid month');
        return false;
    }

    const now = new Date();
    const expiry = new Date(year, month);
    if (expiry <= now) {
        showFieldError(errorEl, 'Card has expired');
        return false;
    }

    hideFieldError(errorEl);
    return true;
}

function validateCvv() {
    const el = document.getElementById('card-cvv');
    const errorEl = document.getElementById('card-cvv-error');
    const val = el.value;

    if (!/^\d{3,4}$/.test(val)) {
        showFieldError(errorEl, 'CVV must be 3 or 4 digits');
        return false;
    }

    hideFieldError(errorEl);
    return true;
}

function showFieldError(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
}

function hideFieldError(el) {
    el.textContent = '';
    el.style.display = 'none';
}

async function loadSavedTravelers() {
    try {
        const res = await fetch('../backend/api/checkout_travelers.php');
        const data = await res.json();
        if (data.success && data.travelers && data.travelers.length > 0) {
            savedTravelers = data.travelers;
            const flight = loadFlightData();
            const count = flight ? (flight.passengers || 1) : 1;
            for (let i = 1; i <= count; i++) {
                const select = document.getElementById(`saved-traveler-select-${i}`);
                if (!select) continue;
                data.travelers.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = `${t.first_name} ${t.last_name} (${t.date_of_birth})`;
                    select.appendChild(opt);
                });
            }
        }

        const userRes = await fetch('../backend/api/auth/status.php');
        const userData = await userRes.json();
        if (userData.authenticated && userData.user) {
            const flight = loadFlightData();
            const count = flight ? (flight.passengers || 1) : 1;
            for (let i = 1; i <= count; i++) {
                const emailEl = document.getElementById(`email-${i}`);
                const phoneEl = document.getElementById(`phone-${i}`);
                if (emailEl && userData.user.email) emailEl.value = userData.user.email;
                if (phoneEl && userData.user.phone_number) phoneEl.value = userData.user.phone_number;
            }
        }
    } catch (err) {
        console.error('Failed to load saved travelers', err);
    }
}

function applyTraveler(index, travelerId) {
    const traveler = savedTravelers.find(t => t.id == travelerId);
    if (!traveler) return;

    document.getElementById(`first-name-${index}`).value = traveler.first_name || '';
    document.getElementById(`last-name-${index}`).value = traveler.last_name || '';
    document.getElementById(`dob-${index}`).value = traveler.date_of_birth || '';
    document.getElementById(`gender-${index}`).value = traveler.gender || '';
    document.getElementById(`passport-${index}`).value = traveler.passport_number || '';
    document.getElementById(`issuing-country-${index}`).value = traveler.issuing_country || '';
    document.getElementById(`title-${index}`).value = traveler.gender === 'f' ? 'ms' : 'mr';
}

function populateFlightSummary(flight) {
    const slice = flight.slices[0];
    const firstSegment = slice.segments[0];
    const lastSegment = slice.segments[slice.segments.length - 1];
    
    document.getElementById('summary-origin').textContent = firstSegment.origin;
    document.getElementById('summary-origin-city').textContent = airportNames[firstSegment.origin] || firstSegment.origin;
    document.getElementById('summary-dest').textContent = lastSegment.destination;
    document.getElementById('summary-dest-city').textContent = airportNames[lastSegment.destination] || lastSegment.destination;
    
    const depDate = new Date(firstSegment.departure_time);
    document.getElementById('summary-date').textContent = depDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    
    const airlineName = firstSegment.carrier_name || firstSegment.carrier_code || 'Airline';
    document.getElementById('summary-airline').textContent = airlineName;
    document.getElementById('summary-departure').textContent = formatTime(firstSegment.departure_time);
    document.getElementById('summary-arrival').textContent = formatTime(lastSegment.arrival_time);
    document.getElementById('summary-duration').textContent = formatDuration(slice.duration);
}

function formatTime(isoString) {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(pt) {
    const hoursMatch = pt.match(/(\d+)H/);
    const minutesMatch = pt.match(/(\d+)M/);
    let result = '';
    if (hoursMatch) result += hoursMatch[1] + 'h ';
    if (minutesMatch) result += minutesMatch[1] + 'm';
    return result.trim() || pt;
}

// ========================
// Add-ons / Services Logic
// ========================

async function fetchOfferServices(offerId) {
    const res = await fetch('../backend/api/get_offer_services.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId }),
    });
    const data = await res.json();
    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch services');
    }
    return data;
}

function renderAddOns(services, passengerCount) {
    document.getElementById('addons-loading').style.display = 'none';

    const hasBags = services.bags && services.bags.length > 0;
    const hasSeats = services.seatMaps && services.seatMaps.length > 0;

    if (!hasBags && !hasSeats) {
        document.getElementById('no-services-msg').style.display = 'flex';
        return;
    }

    if (hasBags) {
        renderBaggageOptions(services.bags, services.currency);
        document.getElementById('baggage-section').style.display = 'block';
    }

    if (hasSeats) {
        renderSeatSummary(passengerCount, services.seatMaps);
        document.getElementById('seat-selection-section').style.display = 'block';
    }
}

function renderBaggageOptions(bags, currency) {
    const container = document.getElementById('baggage-options');
    let html = '';

    bags.forEach(bag => {
        const qty = selectedBags[bag.id] || 0;
        const weightStr = bag.weight ? `${bag.weight} ${bag.weight_unit}` : '';
        const priceStr = bag.total_amount > 0 ? `${currency} ${bag.total_amount.toFixed(2)}` : 'Free';

        html += `
            <div class="baggage-option-card ${qty > 0 ? 'selected' : ''}" id="bag-card-${bag.id}">
                <div class="baggage-option-info">
                    <div class="baggage-option-icon">
                        <span class="material-symbols-outlined">luggage</span>
                    </div>
                    <div>
                        <div class="baggage-option-name">${bag.name}</div>
                        <div class="baggage-option-desc">${weightStr}</div>
                    </div>
                </div>
                <div class="baggage-option-right">
                    <span class="baggage-option-price">${priceStr}</span>
                    <div class="baggage-option-qty">
                        <button class="baggage-qty-btn" onclick="changeBagQty('${bag.id}', -1)" ${qty === 0 ? 'disabled' : ''}>-</button>
                        <span class="baggage-qty-value" id="bag-qty-${bag.id}">${qty}</span>
                        <button class="baggage-qty-btn" onclick="changeBagQty('${bag.id}', 1)" ${qty >= bag.maximum_quantity ? 'disabled' : ''}>+</button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function changeBagQty(serviceId, delta) {
    const current = selectedBags[serviceId] || 0;
    const newQty = Math.max(0, current + delta);

    if (newQty === 0) {
        delete selectedBags[serviceId];
    } else {
        selectedBags[serviceId] = newQty;
    }

    const bag = offerServices.bags.find(b => b.id === serviceId);
    if (bag) {
        const card = document.getElementById(`bag-card-${serviceId}`);
        if (card) {
            card.className = `baggage-option-card ${newQty > 0 ? 'selected' : ''}`;
            document.getElementById(`bag-qty-${serviceId}`).textContent = newQty;
            const btns = card.querySelectorAll('.baggage-qty-btn');
            btns[0].disabled = newQty === 0;
            btns[1].disabled = newQty >= bag.maximum_quantity;
        }
    }

    updateTotal();
}

function renderSeatSummary(passengerCount, seatMaps) {
    const container = document.getElementById('seat-summary-container');
    let html = '';

    for (let i = 1; i <= passengerCount; i++) {
        const seat = selectedSeats[i] || null;
        const seatDisplay = seat ? `${seat.designator} — ${seat.price > 0 ? offerServices.currency + ' ' + seat.price.toFixed(2) : 'Free'}` : 'No seat selected';

        html += `
            <div class="seat-passenger-row" id="seat-row-${i}">
                <div>
                    <span class="seat-passenger-name">Passenger ${i}</span>
                    <div class="seat-passenger-selected" id="seat-display-${i}">${seatDisplay}</div>
                </div>
                <div class="seat-passenger-actions">
                    <button class="btn-view-seat-map" onclick="openSeatMapModal(${i})" type="button">
                        <span class="material-symbols-outlined">event_seat</span>
                        ${seat ? 'Change' : 'Select Seat'}
                    </button>
                    ${seat ? `<button class="btn-clear-seat" onclick="clearSeat(${i})" type="button">Clear</button>` : ''}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function updateTotal() {
    const flightData = localStorage.getItem('selectedFlight');
    if (!flightData) return;
    
    const flight = JSON.parse(flightData);
    const flightTotal = parseFloat(flight.price.total);
    const currency = flight.price.currency || 'SAR';
    
    const taxes = flight.price.tax_amount ? parseFloat(flight.price.tax_amount) : Math.round(flightTotal * 0.15 / 1.15);
    const basePrice = flightTotal - taxes;
    let total = flightTotal;
    
    document.getElementById('price-fare').textContent = `${currency} ${basePrice.toFixed(2)}`;
    document.getElementById('price-taxes').textContent = `${currency} ${taxes.toFixed(2)}`;
    
    let bagTotal = 0;
    Object.keys(selectedBags).forEach(serviceId => {
        const bag = offerServices.bags.find(b => b.id === serviceId);
        if (bag) {
            bagTotal += bag.total_amount * selectedBags[serviceId];
        }
    });

    const bagLine = document.getElementById('price-bag-line');
    if (bagLine) {
        bagLine.style.display = bagTotal > 0 ? 'flex' : 'none';
        document.getElementById('price-bag').textContent = `${currency} ${bagTotal.toFixed(2)}`;
    }
    total += bagTotal;
    
    let seatTotal = 0;
    Object.keys(selectedSeats).forEach(paxIdx => {
        seatTotal += selectedSeats[paxIdx].price || 0;
    });

    const seatLine = document.getElementById('price-seat-line');
    if (seatLine) {
        seatLine.style.display = seatTotal > 0 ? 'flex' : 'none';
        document.getElementById('price-seat').textContent = `${currency} ${seatTotal.toFixed(2)}`;
    }
    total += seatTotal;
    
    document.getElementById('price-total').textContent = `${currency} ${total.toFixed(2)}`;
}

// ========================
// Seat Map Modal
// ========================

function openSeatMapModal(passengerIndex) {
    currentSeatMapPassenger = passengerIndex;

    if (!offerServices.seatMaps || offerServices.seatMaps.length === 0) return;
    currentSeatMapSegment = offerServices.seatMaps[0];

    const modal = document.getElementById('seat-map-modal');
    const title = document.getElementById('seat-map-modal-title');
    const subtitle = document.getElementById('seat-map-modal-subtitle');

    title.textContent = `Select Seat — Passenger ${passengerIndex}`;
    subtitle.textContent = `${currentSeatMapSegment.origin} → ${currentSeatMapSegment.destination} | ${currentSeatMapSegment.aircraft}`;

    renderSeatMapGrid();
    modal.style.display = 'flex';
}

function closeSeatMapModal() {
    document.getElementById('seat-map-modal').style.display = 'none';
    currentSeatMapPassenger = null;
    currentSeatMapSegment = null;
}

function renderSeatMapGrid() {
    const grid = document.getElementById('seat-map-grid');
    const seatMap = currentSeatMapSegment;
    if (!seatMap) return;

    let html = '';
    html += `<div class="aircraft-nose">Front of aircraft</div>`;

    const seats = seatMap.seats || [];

    const rows = {};
    const rowOrder = [];
    seats.forEach(seat => {
        const rowMatch = seat.designator.match(/^(\d+)/);
        if (!rowMatch) return;
        const rowNum = rowMatch[1];
        if (!rows[rowNum]) {
            rows[rowNum] = [];
            rowOrder.push(rowNum);
        }
        rows[rowNum].push(seat);
    });

    rowOrder.forEach(rowNum => {
        html += `<div class="seat-map-row"><span class="seat-map-row-label">${rowNum}</span>`;

        const rowSeats = rows[rowNum];
        let prevCol = null;
        rowSeats.forEach(seat => {
            const colLetter = seat.designator.replace(/^\d+/, '');

            if (prevCol) {
                const prevCode = prevCol.charCodeAt(0);
                const currCode = colLetter.charCodeAt(0);
                if (currCode - prevCode > 1) {
                    html += `<div class="seat-cell gap"></div>`;
                }
            }
            prevCol = colLetter;

            const isSelected = selectedSeats[currentSeatMapPassenger] &&
                               selectedSeats[currentSeatMapPassenger].designator === seat.designator;
            const hasService = seat.service !== null;

            let seatClass = 'occupied';
            if (hasService) {
                if (isSelected) {
                    seatClass = 'selected';
                } else if (seat.service.total_amount === 0) {
                    seatClass = 'free';
                } else {
                    seatClass = 'available';
                }
            }

            if (seatClass === 'occupied') {
                html += `<div class="seat-cell ${seatClass}">${colLetter}</div>`;
            } else {
                const priceStr = hasService && seat.service.total_amount > 0
                    ? ` (${offerServices.currency} ${seat.service.total_amount.toFixed(0)})`
                    : '';
                html += `<div class="seat-cell ${seatClass}" onclick="selectSeat('${seat.designator}', '${seat.service ? seat.service.id : ''}', ${hasService ? seat.service.total_amount : 0}, '${seat.type}')" title="${seat.name}${priceStr}">${colLetter}</div>`;
            }
        });

        html += `</div>`;
    });

    grid.innerHTML = html;
}

function selectSeat(designator, serviceId, price, type) {
    if (!serviceId) return;

    selectedSeats[currentSeatMapPassenger] = {
        serviceId: serviceId,
        designator: designator,
        price: price,
        type: type,
        segmentId: currentSeatMapSegment.segment_id,
    };

    renderSeatMapGrid();

    const flight = loadFlightData();
    renderSeatSummary(flight.passengers || 1, offerServices.seatMaps);
    updateTotal();
}

function clearSeat(passengerIndex) {
    delete selectedSeats[passengerIndex];
    const flight = loadFlightData();
    renderSeatSummary(flight.passengers || 1, offerServices.seatMaps);
    updateTotal();
}

// ========================
// Formatters
// ========================

function formatCardNumber(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
}

function formatExpiry(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
        return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
}

// ========================
// Event Handlers
// ========================

document.getElementById('booking-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const cardValid = validateCard();
    const expiryValid = validateExpiry();
    const cvvValid = validateCvv();

    if (!cardValid || !expiryValid || !cvvValid) return;

    const flight = loadFlightData();
    const passengerCount = flight.passengers || 1;

    for (let i = 1; i <= passengerCount; i++) {
        const type = document.getElementById(`pax-type-${i}`).value;
        const dobValid = validateDob(i, type);
        if (!dobValid) return;

        const title = document.getElementById(`title-${i}`).value;
        if (!title) {
            alert('Please select title for Passenger ' + i);
            return;
        }

        const gender = document.getElementById(`gender-${i}`).value;
        if (!gender) {
            alert('Please select gender for Passenger ' + i);
            return;
        }

        const email = document.getElementById(`email-${i}`).value.trim();
        if (!email) {
            alert('Please enter email for Passenger ' + i);
            return;
        }

        const phone = document.getElementById(`phone-${i}`).value.trim();
        if (!phone) {
            alert('Please enter phone number for Passenger ' + i);
            return;
        }
    }

    const passengers = [];
    for (let i = 1; i <= passengerCount; i++) {
        passengers.push({
            type: document.getElementById(`pax-type-${i}`).value,
            title: document.getElementById(`title-${i}`).value,
            given_name: document.getElementById(`first-name-${i}`).value.trim(),
            family_name: document.getElementById(`last-name-${i}`).value.trim(),
            born_on: document.getElementById(`dob-${i}`).value,
            gender: document.getElementById(`gender-${i}`).value,
            email: document.getElementById(`email-${i}`).value.trim(),
            phone_number: document.getElementById(`phone-${i}`).value.trim(),
            passport_number: document.getElementById(`passport-${i}`).value.trim(),
            issuing_country: document.getElementById(`issuing-country-${i}`).value.trim().toUpperCase(),
        });
    }

    const services = [];
    Object.keys(selectedBags).forEach(serviceId => {
        services.push({ id: serviceId, quantity: selectedBags[serviceId] });
    });
    Object.keys(selectedSeats).forEach(paxIdx => {
        services.push({ id: selectedSeats[paxIdx].serviceId, quantity: 1 });
    });

    const totalText = document.getElementById('price-total').textContent;
    const totalAmount = parseFloat(totalText.replace(/[A-Z\s,]/g, ''));
    const currency = offerServices.currency || flight.price.currency || 'SAR';

    const paxNames = passengers.map(p => p.given_name + p.family_name).join('');
    const idempotencyKey = 'BOOK-' + btoa(flight.id + paxNames + Date.now()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);

    const submitBtn = document.querySelector('.btn-confirm');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    const errorOverlay = document.getElementById('error-overlay');
    errorOverlay.style.display = 'none';

    try {
        const res = await fetch('../backend/api/create_booking.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotencyKey,
                'X-CSRF-Token': window.csrfToken || '',
            },
            body: JSON.stringify({
                offer_id: flight.id,
                passengers: passengers,
                services: services,
                payment: {
                    type: 'balance',
                    amount: totalAmount.toFixed(2),
                    currency: currency,
                },
            }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.debug || data.error || 'Booking failed');
        }

        document.getElementById('confirmed-pnr').textContent = data.pnr || '---';
        document.getElementById('booking-form').style.display = 'none';
        document.getElementById('success-state').style.display = 'block';
        window.scrollTo(0, 0);

    } catch (err) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        const errorOverlay = document.getElementById('error-overlay');
        const errorText = document.getElementById('error-overlay-text');
        errorText.textContent = err.message;
        errorOverlay.style.display = 'flex';

        document.getElementById('error-overlay-retry').onclick = function() {
            errorOverlay.style.display = 'none';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        };
    }
});

document.getElementById('card-number').addEventListener('input', function(e) {
    e.target.value = formatCardNumber(e.target.value);
});

document.getElementById('card-expiry').addEventListener('input', function(e) {
    e.target.value = formatExpiry(e.target.value);
});

document.addEventListener('DOMContentLoaded', function() {
    const flight = loadFlightData();
    if (flight) {
        populateFlightSummary(flight);
        renderPassengers(flight.passengers || 1);
        updateTotal();
        loadSavedTravelers();

        fetch('../backend/api/auth/csrf_token.php')
            .then(res => res.json())
            .then(data => {
                if (data.csrf_token) {
                    window.csrfToken = data.csrf_token;
                }
            })
            .catch(() => {});

        const offerId = flight.id;
        if (offerId) {
            fetchOfferServices(offerId)
                .then(services => {
                    offerServices = services;
                    renderAddOns(services, flight.passengers || 1);
                    updateTotal();
                })
                .catch(() => {
                    document.getElementById('addons-loading').style.display = 'none';
                    document.getElementById('addons-error').style.display = 'flex';
                });
        }
    }
});
