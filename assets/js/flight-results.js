        // --- 1. Autocomplete Logic for Airports (from index.html) ---
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

            // Collect Base data
            const tripType = document.querySelector('input[name="trip-type"]:checked').value;
            const fromCode = document.getElementById('from-code').value;
            const toCode = document.getElementById('to-code').value;
            const cabinClass = document.getElementById('cabin-class').value;
            const rawDates = document.getElementById('travel-dates').value;
            
            // Ensure inputs are strictly set
            if (!fromCode || !toCode) {
                alert("Please select a valid airport from the dropdown list.");
                btn.innerText = ogText;
                return;
            }

            if (!rawDates) {
                alert("Please select travel dates.");
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
                countText.innerText = `Found ${currentFlights.length} flights`;
                
                if (currentFlights.length === 0) {
                    container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #6B7280;">No flights found for this route and date.</div>';
                    return;
                }

                container.innerHTML = currentFlights.map(flight => createFlightCardHTML(flight)).join('');
            })
            .catch(error => {
                console.error("Fetch error:", error);
                container.innerHTML = `<div style="text-align:center; padding: 2rem; color: #EF4444;">Failed to fetch flights: ${error.message}</div>`;
                countText.innerText = 'Error';
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
