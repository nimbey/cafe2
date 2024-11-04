// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (token && role) {
        showDashboard(role);
    } else {
        showLogin();
    }
});