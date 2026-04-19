document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('../backend/api/profile.php');
        if (!res.ok) {
            if (res.status === 401) {
                // Should be caught by auth.js, but handle just in case
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Failed to fetch profile');
        }
        
        const data = await res.json();
        
        if (data.success) {
            renderProfile(data);
        }
    } catch (err) {
        console.error(err);
        document.getElementById('bookings-container').innerHTML = 
            '<div style="text-align:center; padding: 2rem; color: #EF4444;">Failed to load profile data.</div>';
    }
});

function renderProfile(data) {
    // 1. Identity
    document.getElementById('profile-name').textContent = `${data.user.first_name} ${data.user.last_name}`;
    document.getElementById('profile-email').textContent = data.user.email;
    
    const date = new Date(data.user.created_at);
    document.getElementById('profile-member-since').textContent = `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    
    // 2. Stats
    document.getElementById('stat-flights').textContent = data.stats.total_flights;
    // Format spent to 2 decimal places if there is any spending
    document.getElementById('stat-spent').textContent = data.stats.total_spent > 0 ? parseFloat(data.stats.total_spent).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0';
    document.getElementById('stat-passengers').textContent = data.stats.total_passengers;
    
    // 3. Bookings
    const container = document.getElementById('bookings-container');
    if (!data.bookings || data.bookings.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #6B7280;">No bookings found. Time to plan a trip!</div>';
        return;
    }
    
    let html = '';
    data.bookings.forEach(booking => {
        const flight = booking.flight_snapshot;
        // Parse Duffel v2 data structure
        let origin = "---";
        let dest = "---";
        let depTime = "---";
        let arrTime = "---";
        let airline = "---";
        let stopsText = "---";
        
        if (flight && flight.slices && flight.slices.length > 0 && flight.slices[0].segments) {
            const segments = flight.slices[0].segments;
            const first = segments[0];
            const last = segments[segments.length - 1];
            
            origin = first.origin;
            dest = last.destination;
            depTime = new Date(first.departure_time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            arrTime = new Date(last.arrival_time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            airline = first.carrier_name || first.carrier_code;
            
            const stops = segments.length - 1;
            stopsText = stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`;
        }
        
        const statusColor = booking.status.toLowerCase() === 'confirmed' ? '#10B981' : '#F59E0B';

        html += `
            <div class="flight-card" style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.5rem;">
                    <div style="font-weight: 600; color: #374151;">PNR: ${booking.pnr}</div>
                    <div style="background-color: ${statusColor}20; color: ${statusColor}; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; text-transform: uppercase;">
                        ${booking.status}
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                    <div style="flex: 1; min-width: 200px;">
                        <div style="font-size: 0.875rem; color: #6B7280; margin-bottom: 0.25rem;">${airline} &bull; ${stopsText}</div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: #111827;">${origin}</div>
                                <div style="font-size: 0.75rem; color: #6B7280;">${depTime}</div>
                            </div>
                            <span class="material-symbols-outlined" style="color: #9CA3AF;">flight</span>
                            <div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: #111827;">${dest}</div>
                                <div style="font-size: 0.75rem; color: #6B7280;">${arrTime}</div>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.875rem; color: #6B7280;">Total Paid</div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: #2563EB;">${booking.currency} ${booking.total_price}</div>
                        <div style="font-size: 0.75rem; color: #6B7280;">${booking.passenger_count} Passenger${booking.passenger_count > 1 ? 's' : ''}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}