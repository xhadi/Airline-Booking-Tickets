document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('../backend/api/profile.php');
        if (!res.ok) {
            if (res.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Failed to fetch profile');
        }
        
        const data = await res.json();
        
        if (data.success) {
            renderProfile(data);
            renderTravelers(data.travelers || []);
            renderBookings(data.bookings || []);
            populateSettings(data.user);
        } else {
            throw new Error(data.error || 'Failed to load profile');
        }
    } catch (err) {
        console.error(err);
        document.getElementById('profile-name').textContent = 'Error loading profile';
        document.getElementById('profile-email').textContent = '';
        document.getElementById('profile-phone').textContent = '';
        document.getElementById('profile-member-since').textContent = '';
        document.getElementById('travelers-container').innerHTML = 
            '<div style="text-align:center; padding: 2rem; color: #EF4444;">Failed to load travelers.</div>';
        document.getElementById('active-bookings-container').innerHTML = 
            '<div style="text-align:center; padding: 2rem; color: #EF4444;">Failed to load bookings.</div>';
    }
});

function renderProfile(data) {
    document.getElementById('profile-name').textContent = `${data.user.first_name} ${data.user.last_name}`;
    document.getElementById('profile-email').textContent = data.user.email;
    document.getElementById('profile-phone').textContent = data.user.phone_number || 'Not provided';
    
    const date = new Date(data.user.created_at);
    document.getElementById('profile-member-since').textContent = `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    
    document.getElementById('stat-flights').textContent = data.stats.total_flights;
    const currency = data.bookings.length > 0 ? data.bookings[0].currency : 'USD';
    document.getElementById('stat-spent').textContent = data.stats.total_spent > 0 ? 
        `${currency} ${parseFloat(data.stats.total_spent).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 
        `${currency} 0`;
    document.getElementById('stat-passengers').textContent = data.stats.total_passengers;
}

function renderTravelers(travelers) {
    const container = document.getElementById('travelers-container');
    if (travelers.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #6B7280;">No saved travelers. Add one to get started!</div>';
        return;
    }
    
    let html = '';
    travelers.forEach(t => {
        const badgeClass = t.is_complete ? 'badge-complete' : 'badge-incomplete';
        const badgeText = t.is_complete ? 'COMPLETE' : 'INCOMPLETE';
        const dob = new Date(t.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const typeLabel = t.gender === 'm' ? 'Male' : 'Female';
        
        html += `
            <div class="traveler-card">
                <div class="traveler-header">
                    <div>
                        <h4 class="traveler-name">${t.first_name} ${t.last_name}</h4>
                        <p class="traveler-meta">${typeLabel} • Born ${dob}</p>
                    </div>
                    <span class="traveler-badge ${badgeClass}">${badgeText}</span>
                </div>
                ${t.passport_masked ? `
                    <div class="traveler-passport">
                        <strong>Passport:</strong> ${t.passport_masked}
                        <button class="btn-reveal" onclick="revealPassport(${t.id})">[Reveal]</button>
                    </div>
                ` : '<div class="traveler-passport" style="color: #EF4444;">⚠ No passport on file</div>'}
                ${!t.is_complete ? '<div class="traveler-warning">⚠ Missing: issuing_country, document_expiry</div>' : ''}
                <div class="traveler-actions">
                    <button class="btn-edit-traveler" onclick="editTraveler(${t.id})">Edit</button>
                    <button class="btn-delete-traveler" onclick="deleteTraveler(${t.id})">Delete</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderBookings(bookings) {
    const now = new Date();
    const active = bookings.filter(b => {
        const snapshot = b.flight_snapshot;
        let depTime = null;
        
        if (snapshot && snapshot.slices && snapshot.slices[0] && snapshot.slices[0].segments) {
            const depTimeStr = snapshot.slices[0].segments[0].departure_time || snapshot.slices[0].segments[0].departing_at;
            depTime = new Date(depTimeStr);
        }
        
        if (b.status === 'cancelled') return false;
        if (b.status === 'refunded') return false;
        if (b.status === 'pending') return true;
        if (depTime && depTime > now) return true;
        
        return false;
    });
    
    const historical = bookings.filter(b => !active.includes(b));
    
    renderActiveBookings(active);
    renderHistoricalBookings(historical);
}

function renderActiveBookings(bookings) {
    const container = document.getElementById('active-bookings-container');
    if (bookings.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #6B7280;">No active itineraries.</div>';
        return;
    }
    
    let html = '';
    bookings.forEach(booking => {
        const flight = booking.flight_snapshot;
        let origin = "---", dest = "---", depTime = "---", arrTime = "---", airline = "---", stopsText = "---";
        
        if (flight && flight.slices && flight.slices[0] && flight.slices[0].segments) {
            const segments = flight.slices[0].segments;
            const first = segments[0], last = segments[segments.length - 1];
            
            origin = typeof first.origin === 'object' ? first.origin.iata_code : first.origin;
            dest = typeof last.destination === 'object' ? last.destination.iata_code : last.destination;
            
            const depTimeStr = first.departure_time || first.departing_at;
            const arrTimeStr = last.arrival_time || last.arriving_at;
            
            depTime = new Date(depTimeStr).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            arrTime = new Date(arrTimeStr).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            airline = first.carrier_name || (first.operating_carrier ? first.operating_carrier.name : '') || first.carrier_code || (first.operating_carrier ? first.operating_carrier.iata_code : '') || 'Unknown Airline';
            const stops = segments.length - 1;
            stopsText = stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`;
        }
        
        const statusColor = getStatusColor(booking.status);
        const statusBg = getStatusBg(booking.status);
        
        html += `
            <div class="booking-card" style="border-left: 4px solid ${statusColor};">
                <div class="booking-top">
                    <div class="pnr-display" onclick="copyPNR('${booking.pnr}')" title="Click to copy">PNR: ${booking.pnr} ✓</div>
                    <span class="booking-badge" style="background: ${statusBg}; color: ${statusColor};">${booking.status.toUpperCase()}</span>
                </div>
                <div class="booking-details">
                    <div>
                        <div class="route-display">${origin} → ${dest}</div>
                        <div class="time-display">${depTime}</div>
                        <div class="flight-info">${airline} • ${stopsText}</div>
                    </div>
                    <div class="booking-price">
                        <div>${booking.currency} ${booking.total_price}</div>
                        <div class="passenger-count">${booking.passenger_count} Passenger${booking.passenger_count > 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div class="booking-actions" style="text-align:right; margin-top:0.5rem;">
                    <button class="btn-cancel-flight" onclick="cancelBooking(${booking.id}, '${booking.pnr}', ${booking.total_price}, '${booking.currency}', ${JSON.stringify(booking.flight_snapshot).replace(/"/g, '&quot;')})">Cancel Flight</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderHistoricalBookings(bookings) {
    const container = document.getElementById('historical-bookings-container');
    if (bookings.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 1rem; color: #6B7280;">No historical flights.</div>';
        return;
    }
    
    let html = '';
    bookings.forEach(booking => {
        const flight = booking.flight_snapshot;
        let origin = "---", dest = "---", depTime = "---", arrTime = "---", airline = "---", stopsText = "---";
        
        if (flight && flight.slices && flight.slices[0] && flight.slices[0].segments) {
            const segments = flight.slices[0].segments;
            const first = segments[0], last = segments[segments.length - 1];
            
            origin = typeof first.origin === 'object' ? first.origin.iata_code : first.origin;
            dest = typeof last.destination === 'object' ? last.destination.iata_code : last.destination;
            
            const depTimeStr = first.departure_time || first.departing_at;
            const arrTimeStr = last.arrival_time || last.arriving_at;
            
            depTime = new Date(depTimeStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            arrTime = new Date(arrTimeStr).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            airline = first.carrier_name || (first.operating_carrier ? first.operating_carrier.name : '') || first.carrier_code || (first.operating_carrier ? first.operating_carrier.iata_code : '') || 'Unknown Airline';
            const stops = segments.length - 1;
            stopsText = stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`;
        }
        
        const statusColor = getStatusColor(booking.status);
        const statusBg = getStatusBg(booking.status);
        
        const isCompleted = booking.status === 'confirmed';
        const hasExistingReview = booking.has_review;
        const reviewBtnHtml = isCompleted
            ? `<button class="btn-write-review" onclick="openReviewForBooking(
                   ${booking.id}, '${escapeAttr(getRoute(booking.flight_snapshot))}',
                   '${escapeAttr(getDepartureDate(booking.flight_snapshot))}',
                   ${hasExistingReview ? 'true' : 'false'},
                   ${hasExistingReview ? booking.id : 'null'}
               )">
               ${hasExistingReview ? '✏️ Edit Review' : '⭐ Write Review'}
             </button>`
            : '';
        
        html += `
            <div class="booking-card" style="border-left: 4px solid ${statusColor};">
                <div class="booking-top">
                    <div class="pnr-display" onclick="copyPNR('${booking.pnr}')" title="Click to copy">PNR: ${booking.pnr} ✓</div>
                    <span class="booking-badge" style="background: ${statusBg}; color: ${statusColor};">${booking.status.toUpperCase()}</span>
                </div>
                <div class="booking-details">
                    <div>
                        <div class="route-display">${origin} → ${dest}</div>
                        <div class="time-display">${depTime}</div>
                        <div class="flight-info">${airline} • ${stopsText}</div>
                    </div>
                    <div class="booking-price">
                        <div>${booking.currency} ${booking.total_price}</div>
                        <div class="passenger-count">${booking.passenger_count} Passenger${booking.passenger_count > 1 ? 's' : ''}</div>
                    </div>
                </div>
                ${reviewBtnHtml ? `<div class="booking-actions" style="text-align:right; margin-top:0.5rem;">${reviewBtnHtml}</div>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function populateSettings(user) {
    document.getElementById('settings-email').value = user.email;
    document.getElementById('settings-phone').value = user.phone_number || '';
}

function copyPNR(pnr) {
    navigator.clipboard.writeText(pnr).then(() => {
        showToast('PNR copied to clipboard!');
    });
}

function revealPassport(id) {
    showToast('Passport reveal requires additional authentication');
}

function editTraveler(id) {
    showToast('Edit traveler functionality coming soon');
}

function deleteTraveler(id) {
    if (confirm('Are you sure you want to delete this traveler?')) {
        showToast('Delete functionality coming soon');
    }
}

function getStatusColor(status) {
    switch(status.toLowerCase()) {
        case 'confirmed': return '#00D100';
        case 'pending': return '#F59E0B';
        case 'cancelled': return '#EF4444';
        case 'refunded': return '#14B8A6';
        default: return '#6B7280';
    }
}

function getStatusBg(status) {
    switch(status.toLowerCase()) {
        case 'confirmed': return '#D1FAE5';
        case 'pending': return '#FEF3C7';
        case 'cancelled': return '#FEE2E2';
        case 'refunded': return '#CCFBF1';
        default: return '#F3F4F6';
    }
}

async function cancelBooking(bookingId, pnr, totalPrice = 0, currency = 'USD', flightSnapshot = null) {
    const now = new Date();
    let origin = '---', destination = '---', depDateStr = '---';
    let refundPct = 100, penalty = 0, netRefund = 0, daysUntil = 0;
    
    if (flightSnapshot && flightSnapshot.slices && flightSnapshot.slices[0] && flightSnapshot.slices[0].segments) {
        const firstSeg = flightSnapshot.slices[0].segments[0];
        const lastSeg = flightSnapshot.slices[0].segments[flightSnapshot.slices[0].segments.length - 1];
        origin = typeof firstSeg.origin === 'object' ? firstSeg.origin.iata_code : firstSeg.origin;
        destination = typeof lastSeg.destination === 'object' ? lastSeg.destination.iata_code : lastSeg.destination;
        const depTime = firstSeg.departure_time || firstSeg.departing_at;
        const depDate = new Date(depTime);
        depDateStr = depDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        
        daysUntil = Math.ceil((depDate - now) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 7) {
            refundPct = 100;
            penalty = 0;
        } else if (daysUntil >= 3) {
            refundPct = 50;
            penalty = totalPrice * 0.5;
        } else {
            refundPct = 0;
            penalty = totalPrice;
        }
    }
    
    netRefund = totalPrice - penalty;
    const penaltyDisplay = penalty > 0 ? `-${currency} ${penalty.toFixed(2)}` : `${currency} 0.00`;
    const netRefundDisplay = netRefund > 0 ? `${currency} ${netRefund.toFixed(2)}` : `${currency} 0.00`;
    const travelCreditDisplay = netRefund > 0 ? `${currency} ${netRefund.toFixed(2)}` : null;
    const showTravelCredit = netRefund > 0;
    const isNoRefund = netRefund === 0;
    
    const modalHtml = `
        <div id="cancel-modal" class="modal-overlay" onclick="event.stopPropagation()">
            <div class="modal-content" style="max-width: 460px;">
                <div class="modal-header">
                    <h3>Cancel Your Flight to ${destination}?</h3>
                    <button class="modal-close" onclick="closeCancelModal()">✕</button>
                </div>
                <div style="padding: 1.5rem;">
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <div style="font-size: 0.75rem; color: #64748B; text-transform: uppercase; margin-bottom: 0.5rem;">Flight Details</div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.875rem;">
                            <span><strong>${origin} → ${destination}</strong></span>
                            <span style="color: #64748B;">${depDateStr}</span>
                        </div>
                        <div style="font-size: 0.875rem; color: #64748B; margin-top: 0.25rem;">Confirmation: ${pnr}</div>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-size: 0.75rem; color: #64748B; text-transform: uppercase; margin-bottom: 0.75rem;">The Financial Reality</div>
                        <div style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #E2E8F0;">
                                <span style="color: #374151;">Total Paid</span>
                                <span style="color: #374151; font-weight: 500;">${currency} ${totalPrice.toFixed(2)}</span>
                            </div>
                            ${!isNoRefund ? `
                            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #E2E8F0; background: #FEF2F2;">
                                <span style="color: #DC2626;">Cancellation Penalty</span>
                                <span style="color: #DC2626; font-weight: 500;">${penaltyDisplay}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #F0FDF4;">
                                <span style="color: #166534; font-weight: 600;">Net Cash Refund</span>
                                <span style="color: #166534; font-weight: 700;">${netRefundDisplay}</span>
                            </div>
                            ` : `
                            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #FEF3C7;">
                                <span style="color: #92400E; font-weight: 600;">No Refund Available</span>
                                <span style="color: #92400E; font-weight: 700;">${netRefundDisplay}</span>
                            </div>
                            `}
                        </div>
                        ${!isNoRefund ? '<div style="font-size: 0.75rem; color: #64748B; margin-top: 0.5rem; text-align: right;">Returned to original card in 3-5 days</div>' : `<div style="font-size: 0.75rem; color: #64748B; margin-top: 0.5rem; text-align: right;">Flight departs in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}</div>`}
                    </div>
                    
                    ${showTravelCredit ? `
                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-size: 0.75rem; color: #64748B; text-transform: uppercase; margin-bottom: 0.75rem;">Convert to Travel Credit</div>
                        <div style="background: #EFF6FF; border: 1px solid #3B82F6; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 0.875rem; color: #1E40AF; margin-bottom: 0.25rem;">Get your refund as travel credit</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #2563EB;">${travelCreditDisplay}</div>
                            <div style="font-size: 0.75rem; color: #3B82F6;">Available immediately for future flights</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div style="display: flex; gap: 1rem; flex-direction: column;">
                        ${showTravelCredit ? `
                        <button class="btn-travel-credit" onclick="confirmCancel(${bookingId}, ${totalPrice}, 'credit')">
                            Claim ${travelCreditDisplay} Travel Credit
                        </button>
                        <button class="btn-refund-card" onclick="confirmCancel(${bookingId}, ${totalPrice}, 'refund')">
                            Refund ${netRefundDisplay} to Card
                        </button>
                        ` : isNoRefund ? `
                        <button class="btn-refund-card" onclick="confirmCancel(${bookingId}, ${totalPrice}, 'refund')" style="background: #FEE2E2; border-color: #FCA5A5;">
                            Cancel Flight (No Refund)
                        </button>
                        ` : `
                        <button class="btn-refund-card" onclick="confirmCancel(${bookingId}, ${totalPrice}, 'refund')">
                            Refund ${netRefundDisplay} to Card
                        </button>
                        `}
                    </div>
                    <button class="btn-keep-flight" onclick="closeCancelModal()" style="width: 100%; margin-top: 0.75rem;">
                        Keep My Flight
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeCancelModal() {
    const modal = document.getElementById('cancel-modal');
    if (modal) modal.remove();
}

async function confirmCancel(bookingId, totalPrice, refundType = 'refund') {
    closeCancelModal();
    
    try {
        const res = await fetch('../backend/api/cancel_booking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking_id: bookingId, refund_type: refundType })
        });
        
        const data = await res.json();
        
        if (data.success) {
            showToast(data.message || 'Booking cancelled successfully');
            refreshProfile();
        } else {
            showToast(data.error || 'Failed to cancel booking');
        }
    } catch (err) {
        console.error(err);
        showToast('Error cancelling booking');
    }
}

function getRoute(snapshot) {
    if (snapshot && snapshot.slices && snapshot.slices[0] && snapshot.slices[0].segments) {
        const first = snapshot.slices[0].segments[0];
        const last = snapshot.slices[0].segments[snapshot.slices[0].segments.length - 1];
        
        const origin = typeof first.origin === 'object' ? first.origin.iata_code : first.origin;
        const dest = typeof last.destination === 'object' ? last.destination.iata_code : last.destination;
        
        return `${origin} → ${dest}`;
    }
    return '---';
}

function getDepartureDate(snapshot) {
    if (snapshot && snapshot.slices && snapshot.slices[0] && snapshot.slices[0].segments) {
        const t = snapshot.slices[0].segments[0].departure_time || snapshot.slices[0].segments[0].departing_at;
        return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return '---';
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.getElementById('historical-header')?.addEventListener('click', () => {
    const content = document.getElementById('historical-bookings-container');
    const icon = document.querySelector('#historical-header .collapse-icon');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.textContent = '▶';
    }
});

document.getElementById('btn-save-settings')?.addEventListener('click', async () => {
    const phone = document.getElementById('settings-phone').value;
    const currentPassword = document.getElementById('settings-current-password')?.value || '';
    const newPassword = document.getElementById('settings-password')?.value || '';
    const confirmPassword = document.getElementById('settings-confirm-password')?.value || '';
    
    if (newPassword !== '' && newPassword.length < 8) {
        showToast('Password must be at least 8 characters');
        return;
    }
    
    if (newPassword !== '' && newPassword !== confirmPassword) {
        showToast('New passwords do not match');
        return;
    }
    
    try {
        const res = await fetch('../backend/api/update_settings.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phone_number: phone,
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('settings-current-password').value = '';
            document.getElementById('settings-password').value = '';
            document.getElementById('settings-confirm-password').value = '';
            showToast(data.message || 'Settings saved successfully!');
        } else {
            showToast(data.error || 'Failed to save settings');
        }
    } catch (err) {
        console.error(err);
        showToast('Error saving settings');
    }
});

// Add New Traveler button
document.getElementById('btn-add-traveler')?.addEventListener('click', () => {
    showTravelerModal();
});

function showTravelerModal(travelerId = null, travelerData = null) {
    // Remove existing modal if any
    const existingModal = document.getElementById('traveler-modal');
    if (existingModal) existingModal.remove();
    
    const isEdit = travelerId !== null;
    const title = isEdit ? 'Edit Traveler' : 'Add New Traveler';
    
    const modalHtml = `
        <div id="traveler-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="closeTravelerModal()">✕</button>
                </div>
                <form id="traveler-form" class="modal-form">
                    <div class="form-group">
                        <label class="form-label">First Name</label>
                        <input type="text" class="form-input" name="first_name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name</label>
                        <input type="text" class="form-input" name="last_name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Date of Birth</label>
                        <input type="date" class="form-input" name="date_of_birth" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Gender</label>
                        <select class="form-input" name="gender" required>
                            <option value="m">Male</option>
                            <option value="f">Female</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Passport Number (optional)</label>
                        <input type="text" class="form-input" name="passport_number" placeholder="${isEdit ? 'Leave blank to keep existing' : 'Optional'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Issuing Country (ISO code, e.g., USA)</label>
                        <input type="text" class="form-input" name="issuing_country" maxlength="3" required placeholder="Required">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Document Expiry</label>
                        <input type="date" class="form-input" name="document_expiry">
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel" onclick="closeTravelerModal()">Cancel</button>
                        <button type="submit" class="btn-submit">${isEdit ? 'Update' : 'Add'} Traveler</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Pre-fill form fields if editing
    if (travelerData) {
        const form = document.getElementById('traveler-form');
        form.first_name.value = travelerData.first_name || '';
        form.last_name.value = travelerData.last_name || '';
        form.date_of_birth.value = travelerData.date_of_birth ? travelerData.date_of_birth.split(' ')[0] : '';
        form.gender.value = travelerData.gender || 'm';
        form.issuing_country.value = travelerData.issuing_country || '';
        form.document_expiry.value = travelerData.document_expiry ? travelerData.document_expiry.split(' ')[0] : '';
    }
    
    // Handle form submission
    document.getElementById('traveler-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            first_name: e.target.first_name.value,
            last_name: e.target.last_name.value,
            date_of_birth: e.target.date_of_birth.value,
            gender: e.target.gender.value,
            passport_number: e.target.passport_number.value || undefined,
            issuing_country: e.target.issuing_country.value || undefined,
            document_expiry: e.target.document_expiry.value || undefined
        };
        
        if (isEdit) {
            formData.id = travelerId;
        }
        
        try {
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch('../backend/api/travelers.php', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Request failed');

            const data = await res.json();

            if (data.success && data.id) {
                showToast(isEdit ? 'Traveler updated!' : 'Traveler added!');
                closeTravelerModal();
                // Refresh profile data
                refreshProfile();
            } else {
                showToast('Error: ' + (data.error || 'Failed to save'));
            }
        } catch (err) {
            console.error(err);
            showToast('Error saving traveler');
        }
    });
}

function closeTravelerModal() {
    const modal = document.getElementById('traveler-modal');
    if (modal) modal.remove();
}

async function refreshProfile() {
    try {
        const res = await fetch('../backend/api/profile.php');
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();
        if (data.success) {
            renderTravelers(data.travelers || []);
        }
    } catch (err) {
        console.error('Failed to refresh profile', err);
    }
}

// Update editTraveler function
window.editTraveler = async function(id) {
    try {
        const res = await fetch(`../backend/api/travelers.php?id=${id}`);
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();
        if (data.success && data.travelers && data.travelers.length > 0) {
            showTravelerModal(id, data.travelers[0]);
        } else {
            showToast('Failed to load traveler data');
        }
    } catch (err) {
        console.error(err);
        showToast('Error loading traveler');
    }
};

// Update deleteTraveler function
window.deleteTraveler = async function(id) {
    if (confirm('Are you sure you want to delete this traveler?')) {
        try {
            const res = await fetch(`../backend/api/travelers.php?id=${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Request failed');
            const data = await res.json();
            if (data.success) {
                showToast('Traveler deleted!');
                refreshProfile();
            } else {
                showToast('Error deleting traveler');
            }
        } catch (err) {
            console.error(err);
            showToast('Error deleting traveler');
        }
    }
};

function escapeAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

async function openReviewForBooking(bookingId, route, depDate, hasReview, reviewId) {
    const parts = route.split('→').map(s => s.trim());
    const origin = parts[0] || '---';
    const dest = parts[1] || '---';

    const booking = {
        id: bookingId,
        origin: origin,
        dest: dest,
        depDate: depDate
    };

    if (hasReview === 'true' && reviewId) {
        try {
            const res = await fetch(`../backend/api/reviews.php?booking_id=${bookingId}`);
            const data = await res.json();
            if (data.success && data.review) {
                showReviewModal(booking, data.review);
            } else {
                showReviewModal(booking);
            }
        } catch (err) {
            console.error(err);
            showReviewModal(booking);
        }
    } else {
        showReviewModal(booking);
    }
}
