// ========================
// MAIN APPLICATION
// ========================

// Quick Filter Function
function quickFilter(value) {
    const url = new URL(window.location.href);
    if (value === 'price-low') {
        url.searchParams.set('sort', 'price-asc');
    } else if (value === 'sale' || value === 'rent') {
        url.searchParams.set('listingType', value);
    } else {
        url.searchParams.set('type', value);
    }
    window.location.href = url.toString();
}
