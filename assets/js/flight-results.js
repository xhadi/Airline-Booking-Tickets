        // --- 1. Autocomplete Logic for Airports (from index.html) ---
        // Alert modal function
        function showAlert(title, message) {
            const existing = document.querySelector('.alert-modal-overlay');
            if (existing) existing.remove();
            
            const overlay = document.createElement('div');
            overlay.className = 'alert-modal-overlay';
            overlay.innerHTML = `
                <div class="alert-modal">
                    <div class="alert-modal-icon error">!</div>
                    <div class="alert-modal-title">${title}</div>
                    <div class="alert-modal-message">${message}</div>
                    <button class="alert-modal-btn">OK</button>
                </div>
            `;
            
            overlay.querySelector('.alert-modal-btn').onclick = () => overlay.remove();
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
            document.body.appendChild(overlay);
        }

        function showLoadingModal() {
            const existing = document.querySelector('.loading-modal-overlay');
            if (existing) existing.remove();
            
            const overlay = document.createElement('div');
            overlay.className = 'loading-modal-overlay';
            overlay.innerHTML = `
                <div class="loading-modal">
                    <div class="loading-spinner"></div>
                    <div class="loading-title">Searching Flights</div>
                    <div class="loading-message">Please wait while we find the best flights for you...</div>
                </div>
            `;
            document.body.appendChild(overlay);
            return overlay;
        }

        function hideLoadingModal() {
            const existing = document.querySelector('.loading-modal-overlay');
            if (existing) existing.remove();
        }
        
        const airports = [
            { code: 'JFK', name: 'New York (JFK)' },
            { code: 'LHR', name: 'London Heathrow (LHR)' },
            { code: 'DXB', name: 'Dubai (DXB)' },
            { code: 'CDG', name: 'Paris Charles de Gaulle (CDG)' },
            { code: 'JED', name: 'Jeddah (JED)' },
            { code: 'RUH', name: 'Riyadh (RUH)' },
            { code: 'DMM', name: 'Dammam (DMM)' },
            { code: 'LAX', name: 'Los Angeles (LAX)' },
            { code: 'NRT', name: 'Tokyo Narita (NRT)' },
            { code: 'SIN', name: 'Singapore (SIN)' },
            { code: 'SYD', name: 'Sydney (SYD)' },
            { code: 'YYZ', name: 'Toronto (YYZ)' },
            { code: 'FRA', name: 'Frankfurt (FRA)' },
            { code: 'MAD', name: 'Madrid (MAD)' },
            { code: 'AMS', name: 'Amsterdam (AMS)' },
            { code: 'IST', name: 'Istanbul (IST)' },
            { code: 'BKK', name: 'Bangkok (BKK)' },
            { code: 'HKG', name: 'Hong Kong (HKG)' },
            { code: 'MLE', name: 'Malé (MLE)' },
            { code: 'CAI', name: 'Cairo (CAI)' }
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
                    if (displayInput.value && !codeInput.value) {
                        displayInput.value = ''; 
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
            
            const btn = document.querySelector('.btn-search');
            const ogText = btn.innerText;
            btn.innerText = "Processing...";
            showLoadingModal();

            // Collect Base data
            const tripType = document.querySelector('input[name="trip-type"]:checked').value;
            const fromCode = document.getElementById('from-code').value;
            const toCode = document.getElementById('to-code').value;
            const cabinClass = document.getElementById('cabin-class').value;
            const rawDates = document.getElementById('travel-dates').value;
            
            // Ensure inputs are strictly set
            if (!fromCode || !toCode) {
                showAlert("Missing Airport", "Please select a valid airport from the dropdown list.");
                btn.innerText = ogText;
                return;
            }

            if (fromCode === toCode) {
                showAlert("Invalid Route", "Departure and destination airports cannot be the same.");
                btn.innerText = ogText;
                return;
            }

            if (!rawDates) {
                showAlert("Missing Dates", "Please select travel dates.");
                btn.innerText = ogText;
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

            // Round-trip requires return date
            if (tripType === 'round-trip' && !returnDate) {
                showAlert("Missing Return Date", "Please select a return date for round-trip flights.");
                btn.innerText = ogText;
                return;
            }

            document.getElementById('outbound-date').value = outboundDate;
            document.getElementById('return-date').value = returnDate;

            // Build Slices Array for Duffel API
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
            
            if (!adultCount || adultCount < 1) {
                showAlert("Missing Passenger", "Please add at least one adult passenger.");
                btn.innerText = ogText;
                return;
            }
            
            for(let i = 0; i < adultCount; i++) {
                passengers.push({ type: 'adult' });
            }

            const childSelects = document.querySelectorAll('select[name="child_ages[]"]');
            childSelects.forEach(select => {
                passengers.push({ type: 'child', age: parseInt(select.value) });
            });

            // Simulate the final JSON Payload
            const payload = {
                slices: slices,
                passengers: passengers,
                cabin_class: cabinClass
            };
            
            // Store in local storage
            localStorage.setItem('flightSearchParams', JSON.stringify(payload));
            
            // Trigger new search and reset button
            fetchFlights();
            setTimeout(() => { btn.innerText = ogText; }, 800);
        });

        // --- 5. Flight Results Rendering logic ---
        let currentFlights = [];

        let filterState = {
            priceMin: null,
            priceMax: null,
            stops: 'any', // 'any', 'nonstop', '1stop'
            departureTime: { morning: true, afternoon: true, evening: true },
            airlines: [],
            sortBy: 'cheapest'
        };

        function getStopsCount(flight) {
            const segments = flight.slices?.[0]?.segments;
            if (!segments || segments.length === 0) return 0;
            return segments.length - 1;
        }

        function getDepartureHour(flight) {
            const departureTime = flight.slices?.[0]?.segments?.[0]?.departure_time;
            if (!departureTime) return 0;
            const date = new Date(departureTime);
            return isNaN(date.getTime()) ? 0 : date.getHours();
        }

        function getAirlineName(flight) {
            const firstSegment = flight.slices?.[0]?.segments?.[0];
            if (!firstSegment) return 'Airline';
            return firstSegment.carrier_name || firstSegment.operating_carrier?.name || 'Airline';
        }

        function getUniqueAirlines(flights) {
            const airlines = new Set();
            flights.forEach(flight => {
                airlines.add(getAirlineName(flight));
            });
            return Array.from(airlines).sort();
        }

        function applyFilters(flights) {
            let filtered = flights.filter(flight => {
                const price = parseFloat(flight.price?.total) || 0;

                if (filterState.priceMin !== null && price < filterState.priceMin) {
                    return false;
                }
                if (filterState.priceMax !== null && price > filterState.priceMax) {
                    return false;
                }

                const stops = getStopsCount(flight);
                if (filterState.stops === 'nonstop' && stops > 0) return false;
                if (filterState.stops === '1stop' && stops > 1) return false;

                const hour = getDepartureHour(flight);
                if (hour >= 6 && hour < 12 && !filterState.departureTime.morning) return false;
                if (hour >= 12 && hour < 18 && !filterState.departureTime.afternoon) return false;
                if (hour >= 18 && hour < 24 && !filterState.departureTime.evening) return false;

                if (filterState.airlines.length > 0) {
                    const airline = getAirlineName(flight);
                    if (!filterState.airlines.includes(airline)) return false;
                }

                return true;
            });

            if (filterState.sortBy === 'cheapest') {
                filtered.sort((a, b) => (parseFloat(a.price?.total) || 0) - (parseFloat(b.price?.total) || 0));
            } else if (filterState.sortBy === 'highest') {
                filtered.sort((a, b) => (parseFloat(b.price?.total) || 0) - (parseFloat(a.price?.total) || 0));
            }

            return filtered;
        }

        function renderFilterSidebar() {
            const sidebar = document.getElementById('filter-sidebar');
            if (!sidebar || currentFlights.length === 0) return;

            const prices = currentFlights.map(f => parseFloat(f.price?.total) || 0);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const currentMin = filterState.priceMin ?? minPrice;
            const currentMax = filterState.priceMax ?? maxPrice;

            const airlines = getUniqueAirlines(currentFlights);
            
            sidebar.innerHTML = `
                <div class="filter-header">
                    <h3 class="filter-header-title">Filters</h3>
                    <button class="filter-reset-btn" id="clear-filters-btn">Reset</button>
                </div>

                <div class="filter-group">
                    <div class="filter-group-title">Price</div>
                    <div class="price-slider-container">
                        <div class="price-labels">
                            <span>$${Math.round(currentMin)}</span>
                            <span>$${Math.round(currentMax)}</span>
                        </div>
                        <div class="slider-track">
                            <input type="range" class="price-slider" id="price-min-slider" 
                                min="${Math.floor(minPrice)}" max="${Math.ceil(maxPrice)}" value="${Math.round(currentMin)}">
                            <input type="range" class="price-slider" id="price-max-slider" 
                                min="${Math.floor(minPrice)}" max="${Math.ceil(maxPrice)}" value="${Math.round(currentMax)}">
                        </div>
                        <div class="price-range-display">$${Math.round(currentMin)} - $${Math.round(currentMax)}</div>
                    </div>
                </div>

                <div class="filter-group">
                    <div class="filter-group-title">Stops</div>
                    <div class="filter-options">
                        <label class="filter-option">
                            <input type="radio" name="stops" value="any" ${filterState.stops === 'any' ? 'checked' : ''}>
                            <span class="radio-mark"></span>
                            <span>Any</span>
                        </label>
                        <label class="filter-option">
                            <input type="radio" name="stops" value="nonstop" ${filterState.stops === 'nonstop' ? 'checked' : ''}>
                            <span class="radio-mark"></span>
                            <span>No stops</span>
                        </label>
                        <label class="filter-option">
                            <input type="radio" name="stops" value="1stop" ${filterState.stops === '1stop' ? 'checked' : ''}>
                            <span class="radio-mark"></span>
                            <span>1 stop max</span>
                        </label>
                    </div>
                </div>

                <div class="filter-group">
                    <div class="filter-group-title">Departure Time</div>
                    <div class="filter-options">
                        <label class="filter-option">
                            <input type="checkbox" id="time-morning" ${filterState.departureTime.morning ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            <span>Morning</span>
                            <span class="time-badge">6AM-12PM</span>
                        </label>
                        <label class="filter-option">
                            <input type="checkbox" id="time-afternoon" ${filterState.departureTime.afternoon ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            <span>Afternoon</span>
                            <span class="time-badge">12PM-6PM</span>
                        </label>
                        <label class="filter-option">
                            <input type="checkbox" id="time-evening" ${filterState.departureTime.evening ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            <span>Evening</span>
                            <span class="time-badge">6PM-12AM</span>
                        </label>
                    </div>
                </div>

                <div class="filter-group">
                    <div class="filter-group-title">Airlines</div>
                    <div class="filter-options airline-options" data-count="${airlines.length}">
                        ${airlines.slice(0, 5).map(airline => `
                            <label class="filter-option">
                                <input type="checkbox" class="airline-checkbox" value="${airline}" ${filterState.airlines.length === 0 || filterState.airlines.includes(airline) ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                <span>${airline}${filterState.airlines.length === 1 && filterState.airlines[0] === airline ? ' (only)' : ''}</span>
                            </label>
                        `).join('')}
                        ${airlines.length > 5 ? `<button class="show-more-btn" onclick="toggleAirlines()">Show more (${airlines.length - 5})</button>` : ''}
                    </div>
                </div>
            `;
            
            if (window.airlineExpanded) {
                addAllAirlines();
            }
        }

        function addAllAirlines() {
            const container = document.querySelector('.airline-options');
            if (!container) return;
            const airlines = getUniqueAirlines(currentFlights);
            const shown = container.querySelectorAll('.airline-checkbox').length;
            const remaining = airlines.slice(shown);
            
            const html = remaining.map(airline => `
                <label class="filter-option">
                    <input type="checkbox" class="airline-checkbox" value="${airline}" ${filterState.airlines.length === 0 || filterState.airlines.includes(airline) ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    <span>${airline}${filterState.airlines.length === 1 && filterState.airlines[0] === airline ? ' (only)' : ''}</span>
                </label>
            `).join('');
            
            const btn = container.querySelector('.show-more-btn');
            if (btn) btn.remove();
            container.insertAdjacentHTML('beforeend', html);
            
            container.querySelectorAll('.airline-checkbox').forEach(cb => {
                cb.addEventListener('change', updateAirlinesFilter);
            });
            window.airlineExpanded = true;
        }

        function toggleAirlines() {
            addAllAirlines();
            refreshFlightDisplay();
        }

            document.getElementById('price-min-slider').addEventListener('input', updatePriceFilter);
            document.getElementById('price-max-slider').addEventListener('input', updatePriceFilter);
            document.querySelectorAll('input[name="stops"]').forEach(radio => {
                radio.addEventListener('change', e => updateStopsFilter(e.target.value));
            });
            document.getElementById('time-morning').addEventListener('change', e => updateTimeFilter('morning', e.target.checked));
            document.getElementById('time-afternoon').addEventListener('change', e => updateTimeFilter('afternoon', e.target.checked));
            document.getElementById('time-evening').addEventListener('change', e => updateTimeFilter('evening', e.target.checked));
            document.querySelectorAll('.airline-checkbox').forEach(cb => {
                cb.addEventListener('change', updateAirlinesFilter);
            });
            document.getElementById('clear-filters-btn').addEventListener('click', clearAllFilters);

            document.getElementById('sort-select')?.addEventListener('change', e => {
                filterState.sortBy = e.target.value;
                refreshFlightDisplay();
            });
        }

        function updatePriceFilter() {
            const minSlider = document.getElementById('price-min-slider');
            const maxSlider = document.getElementById('price-max-slider');
            const minVal = parseInt(minSlider.value);
            const maxVal = parseInt(maxSlider.value);
            
            filterState.priceMin = minVal;
            filterState.priceMax = maxVal;
            
            const display = document.querySelector('.price-range-display');
            if (display) display.textContent = `$${minVal} - $${maxVal}`;
            
            refreshFlightDisplay();
        }

        function updateStopsFilter(value) {
            filterState.stops = value;
            refreshFlightDisplay();
        }

        function updateTimeFilter(type, checked) {
            filterState.departureTime[type] = checked;
            refreshFlightDisplay();
        }

        function updateAirlinesFilter() {
            const checkboxes = document.querySelectorAll('.airline-checkbox:checked');
            filterState.airlines = Array.from(checkboxes).map(cb => cb.value);
            refreshFlightDisplay();
        }

        function clearAllFilters() {
            filterState = {
                priceMin: null,
                priceMax: null,
                stops: 'any',
                departureTime: { morning: true, afternoon: true, evening: true },
                airlines: [],
                sortBy: filterState.sortBy
            };
            renderFilterSidebar();
            refreshFlightDisplay();
        }

        function refreshFlightDisplay() {
            const container = document.getElementById('flight-cards-container');
            const countText = document.getElementById('results-count-text');
            
            const filteredFlights = applyFilters(currentFlights);
            
            const hasActiveFilters = filterState.priceMin !== null || filterState.priceMax !== null || 
                !filterState.stops.nonStop || !filterState.stops.oneStop || !filterState.stops.twoPlus ||
                !filterState.departureTime.morning || !filterState.departureTime.afternoon || !filterState.departureTime.evening ||
                filterState.airlines.length > 0;
            
            if (hasActiveFilters) {
                countText.innerText = `Found ${currentFlights.length} flights (${filteredFlights.length} after filters)`;
            } else {
                countText.innerText = `Found ${currentFlights.length} flights`;
            }

            container.innerHTML = filteredFlights.map(flight => createFlightCardHTML(flight)).join('');
        }

        function formatDuration(pt) {
            if (!pt) return '';
            let result = '';
            const hoursMatch = pt.match(/(\d+)H/);
            const minutesMatch = pt.match(/(\d+)M/);
            
            if (hoursMatch) result += hoursMatch[1] + 'h ';
            if (minutesMatch) result += minutesMatch[1] + 'm';
            return result.trim() || pt;
        }

        function formatTime(isoString) {
            const date = new Date(isoString);
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }

        function createFlightCardHTML(flight) {
            // Support multi-segment slices by getting the first departure and last arrival of the first slice
            const slice = flight.slices[0];
            const firstSegment = slice.segments[0];
            const lastSegment = slice.segments[slice.segments.length - 1];
            
            const airlineName = firstSegment.carrier_name || firstSegment.carrier_code || 'Airline';
            const airlineInitial = airlineName.charAt(0).toUpperCase();
            
            const stops = slice.segments.length - 1;
            const stopsText = stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`;

            return `
                <div class="flight-card">
                    <div class="flight-info-container">
                        <div class="flight-airline-sec">
                            <div class="airline-logo-placeholder">${airlineInitial}</div>
                            <span class="airline-name">${airlineName}</span>
                            <span class="flight-stops" style="display:block; font-size:0.75rem; color:#6B7280; margin-top:4px;">${stopsText}</span>
                        </div>
                        
                        <div class="flight-times-sec">
                            <div class="time-box">
                                <div class="time-val">${formatTime(firstSegment.departure_time)}</div>
                                <div class="time-iata">${firstSegment.origin}</div>
                            </div>
                            
                            <div class="flight-duration-box">
                                <div class="duration-val">${formatDuration(slice.duration)}</div>
                                <div class="duration-line"></div>
                            </div>
                            
                            <div class="time-box">
                                <div class="time-val">${formatTime(lastSegment.arrival_time)}</div>
                                <div class="time-iata">${lastSegment.destination}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flight-price-sec">
                        <div>
                            <span class="price-val">${flight.price.total}</span>
                            <span class="price-currency">${flight.price.currency}</span>
                        </div>
                        <button class="btn-select" onclick="selectFlight('${flight.id}')">Select</button>
                    </div>
                </div>
            `;
        }

        function selectFlight(flightId) {
            const selectedFlight = currentFlights.find(f => f.id === flightId);
            if (selectedFlight) {
                // Pass passengers info from the stored search params
                const searchParams = JSON.parse(localStorage.getItem('flightSearchParams') || '{}');
                selectedFlight.passengers = searchParams.passengers ? searchParams.passengers.length : 1;
                localStorage.setItem('selectedFlight', JSON.stringify(selectedFlight));
                window.location.href = 'booking.html';
            }
        }

        function fetchFlights() {
            const container = document.getElementById('flight-cards-container');
            const countText = document.getElementById('results-count-text');
            
            container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #6B7280;">Searching flights... Please wait.</div>';
            countText.innerText = 'Searching...';

            const payloadRaw = localStorage.getItem('flightSearchParams');
            if (!payloadRaw) {
                container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #EF4444;">No search parameters found. Please go back and try again.</div>';
                countText.innerText = 'Error';
                return;
            }

            const payload = JSON.parse(payloadRaw);

            // Update title dynamically if we can infer origin and dest from the first slice
            if (payload.slices && payload.slices.length > 0) {
                document.querySelector('.results-title').innerText = `Flights from ${payload.slices[0].origin} to ${payload.slices[0].destination}`;
            }

            fetch('../backend/api/search_flights.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                
                currentFlights = data.flights || [];
                
                const hasActiveFilters = filterState.priceMin !== null || filterState.priceMax !== null || 
                    !filterState.stops.nonStop || !filterState.stops.oneStop || !filterState.stops.twoPlus ||
                    !filterState.departureTime.morning || !filterState.departureTime.afternoon || !filterState.departureTime.evening ||
                    filterState.airlines.length > 0;
                
                const filteredFlights = applyFilters(currentFlights);
                
                if (hasActiveFilters) {
                    countText.innerText = `Found ${currentFlights.length} flights (${filteredFlights.length} after filters)`;
                } else {
                    countText.innerText = `Found ${currentFlights.length} flights`;
                }
                
                if (currentFlights.length === 0) {
                    container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #6B7280;">No flights found for this route and date.</div>';
                    return;
                }

                container.innerHTML = filteredFlights.map(flight => createFlightCardHTML(flight)).join('');
                renderFilterSidebar();
                hideLoadingModal();
            })
            .catch(error => {
                console.error("Fetch error:", error);
                container.innerHTML = `<div style="text-align:center; padding: 2rem; color: #EF4444;">Failed to fetch flights: ${error.message}</div>`;
                countText.innerText = 'Error';
                hideLoadingModal();
            });
        }

        document.addEventListener("DOMContentLoaded", () => {
            // Load destination from Explore clicks
            const destFromExplore = localStorage.getItem('searchDestination');
            const payloadRaw = localStorage.getItem('flightSearchParams');
            
            if (destFromExplore && !payloadRaw) {
                // Direct from Explore - just pre-fill destination
                const destCode = destFromExplore.match(/\(([A-Z]+)\)/)?.[1] || '';
                const destName = destFromExplore.replace(/\s*\([A-Z]+\)/, '');
                document.getElementById('to-display').value = destName + (destCode ? ` (${destCode})` : '');
                document.getElementById('to-code').value = destCode;
            } else if (payloadRaw) {
                // Has valid search params (from previous search with dates) - populate full form
                try {
                    const payload = JSON.parse(payloadRaw);
                    
                    // 1. Trip Type
                    if (payload.slices && payload.slices.length === 1) {
                        document.getElementById('type-one-way').checked = true;
                        fp.set('mode', 'single');
                        document.getElementById('travel-dates').placeholder = 'Departure';
                        if (fp.altInput) fp.altInput.placeholder = 'Departure';
                    } else if (payload.slices && payload.slices.length === 2) {
                        document.getElementById('type-round-trip').checked = true;
                        fp.set('mode', 'range');
                        document.getElementById('travel-dates').placeholder = 'Departure - Return';
                        if (fp.altInput) fp.altInput.placeholder = 'Departure - Return';
                    }

                    // 2. From / To
                    if (payload.slices && payload.slices.length > 0) {
                        const originCode = payload.slices[0].origin;
                        const destCode = payload.slices[0].destination;
                        
                        const originMatch = airports.find(a => a.code === originCode);
                        if (originMatch) {
                            document.getElementById('from-display').value = originMatch.name;
                            document.getElementById('from-code').value = originCode;
                        } else {
                            document.getElementById('from-display').value = originCode;
                            document.getElementById('from-code').value = originCode;
                        }

                        const destMatch = airports.find(a => a.code === destCode);
                        if (destMatch) {
                            document.getElementById('to-display').value = destMatch.name;
                            document.getElementById('to-code').value = destCode;
                        } else {
                            document.getElementById('to-display').value = destCode;
                            document.getElementById('to-code').value = destCode;
                        }

                        // 3. Travel Dates
                        let dates = [payload.slices[0].departure_date];
                        document.getElementById('outbound-date').value = dates[0] || '';
                        if (payload.slices.length === 2 && payload.slices[1].departure_date) {
                            dates.push(payload.slices[1].departure_date);
                            document.getElementById('return-date').value = dates[1];
                        }
                        // Only set dates if we have valid departure date
                        if (payload.slices[0].departure_date) {
                            fp.setDate(dates);
                        }
                    }

                    // 4. Travelers
                    if (payload.passengers && payload.passengers.length > 0) {
                        const adults = payload.passengers.filter(p => p.type === 'adult').length;
                        const children = payload.passengers.filter(p => p.type === 'child');
                        
                        document.getElementById('adults-count').innerText = adults;
                        document.getElementById('adults-input').value = adults;
                        
                        document.getElementById('children-count').innerText = children.length;
                        document.getElementById('children-input').value = children.length;

                        if (children.length > 0) {
                            renderChildAges(children.length);
                            // Set the ages in the dropdowns
                            setTimeout(() => {
                                const selects = document.querySelectorAll('select[name="child_ages[]"]');
                                children.forEach((child, index) => {
                                    if (selects[index]) {
                                        selects[index].value = child.age || 0;
                                    }
                                });
                            }, 0);
                        } else {
                            renderChildAges(0);
                        }
                        updateSummary();
                    }

                    // 5. Cabin Class
                    if (payload.cabin_class) {
                        document.getElementById('cabin-class').value = payload.cabin_class;
                    }

                } catch (e) {
                    console.error("Error parsing search params for form:", e);
                }
            }

            // Only auto-fetch if valid date exists in params
            const hasValidDate = payload && payload.slices && payload.slices[0] && payload.slices[0].departure_date;
            if (hasValidDate) {
                fetchFlights();
            }
        });

        // Clear Search Button
        document.getElementById('btn-clear-search')?.addEventListener('click', () => {
            localStorage.removeItem('flightSearchParams');
            localStorage.removeItem('searchDestination');
            document.getElementById('from-display').value = '';
            document.getElementById('from-code').value = '';
            document.getElementById('to-display').value = '';
            document.getElementById('to-code').value = '';
            document.getElementById('travel-dates').value = '';
            document.getElementById('outbound-date').value = '';
            document.getElementById('return-date').value = '';
            document.getElementById('adults-count').textContent = '1';
            document.getElementById('adults-input').value = '1';
            document.getElementById('children-count').textContent = '0';
            document.getElementById('children-input').value = '0';
            document.getElementById('travelers-summaryText').textContent = '1 Adult';
            document.getElementById('cabin-class').value = 'economy';
            document.getElementById('type-round-trip').checked = true;
            fp.set('mode', 'range');
            fp.clear();
            
            // Simple toast notification
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#374151;color:white;padding:12px 24px;border-radius:8px;font-size:14px;z-index:4000;';
            toast.textContent = 'Search cleared';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
        });
