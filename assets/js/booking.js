        const airportNames = {
            'JFK': 'New York',
            'LHR': 'London Heathrow',
            'DXB': 'Dubai',
            'CDG': 'Paris Charles de Gaulle',
            'JED': 'Jeddah',
            'RUH': 'Riyadh',
            'LAX': 'Los Angeles',
            'NRT': 'Tokyo Narita',
            'SIN': 'Singapore',
            'SYD': 'Sydney',
            'YYZ': 'Toronto',
            'FRA': 'Frankfurt',
            'MAD': 'Madrid'
        };

        const addonPrices = {
            extraBag: 75,
            priorityBoarding: 50,
            travelInsurance: 45,
            extraLegroom: 100
        };

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
                const passengerType = i === 1 && count > 0 ? 'Adult' : (i <= count ? 'Adult' : 'Child');
                html += `
                    <div class="passenger-form">
                        <div class="passenger-header">
                            <span class="passenger-number">Passenger ${i}</span>
                            <span class="passenger-type">${passengerType}</span>
                        </div>
                        <div class="passenger-fields">
                            <div class="form-row">
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
                                    <label class="field-label" for="email-${i}">Email</label>
                                    <input type="email" class="search-input" id="email-${i}" required>
                                </div>
                                <div class="form-group">
                                    <label class="field-label" for="phone-${i}">Phone</label>
                                    <input type="tel" class="search-input" id="phone-${i}" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="field-label" for="passport-${i}">Passport Number</label>
                                    <input type="text" class="search-input" id="passport-${i}" required>
                                </div>
                                <div class="form-group">
                                    <label class="field-label" for="nationality-${i}">Nationality</label>
                                    <input type="text" class="search-input" id="nationality-${i}" required>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            container.innerHTML = html;
        }

        function populateFlightSummary(flight) {
            // Support multi-segment slices by getting the first departure and last arrival
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

        function updateTotal() {
            const flightData = localStorage.getItem('selectedFlight');
            if (!flightData) return;
            
            const flight = JSON.parse(flightData);
            const basePrice = parseFloat(flight.price.total);
            const currency = flight.price.currency || 'SAR';
            
            const taxes = Math.round(basePrice * 0.15);
            let total = basePrice + taxes;
            
            document.getElementById('price-fare').textContent = `${currency} ${basePrice.toFixed(2)}`;
            document.getElementById('price-taxes').textContent = `${currency} ${taxes.toFixed(2)}`;
            
            const bagCheckbox = document.getElementById('extra-bag');
            const boardingCheckbox = document.getElementById('priority-boarding');
            const insuranceCheckbox = document.getElementById('travel-insurance');
            const seatSelect = document.getElementById('seat-preference');
            
            document.getElementById('price-bag-line').style.display = bagCheckbox.checked ? 'flex' : 'none';
            document.getElementById('price-bag').textContent = bagCheckbox.checked ? `${currency} ${addonPrices.extraBag}` : `${currency} 0`;
            if (bagCheckbox.checked) total += addonPrices.extraBag;
            
            document.getElementById('price-boarding-line').style.display = boardingCheckbox.checked ? 'flex' : 'none';
            document.getElementById('price-boarding').textContent = boardingCheckbox.checked ? `${currency} ${addonPrices.priorityBoarding}` : `${currency} 0`;
            if (boardingCheckbox.checked) total += addonPrices.priorityBoarding;
            
            document.getElementById('price-insurance-line').style.display = insuranceCheckbox.checked ? 'flex' : 'none';
            document.getElementById('price-insurance').textContent = insuranceCheckbox.checked ? `${currency} ${addonPrices.travelInsurance}` : `${currency} 0`;
            if (insuranceCheckbox.checked) total += addonPrices.travelInsurance;
            
            let seatPrice = 0;
            if (seatSelect.value === 'extra-legroom') {
                seatPrice = addonPrices.extraLegroom || 100; // assuming extraLegroom is 100 as it's missing in addonPrices definition in html
                document.getElementById('price-seat-line').style.display = 'flex';
                document.getElementById('price-seat').textContent = `${currency} ${seatPrice}`;
            } else {
                document.getElementById('price-seat-line').style.display = 'none';
            }
            total += seatPrice;
            
            document.getElementById('price-total').textContent = `${currency} ${total.toFixed(2)}`;
        }

        function generatePNR() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let pnr = 'SKB';
            for (let i = 0; i < 5; i++) {
                pnr += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return pnr;
        }

        document.getElementById('booking-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const requiredFields = this.querySelectorAll('input[required]');
            let valid = true;
            requiredFields.forEach(field => {
                if (!field.value.trim()) valid = false;
            });
            
            if (!valid) {
                alert('Please fill in all required fields');
                return;
            }
            
            const pnr = generatePNR();
            document.getElementById('confirmed-pnr').textContent = pnr;
            
            document.getElementById('booking-form').style.display = 'none';
            document.getElementById('success-state').style.display = 'block';
            window.scrollTo(0, 0);
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
            }
        });
