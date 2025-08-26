// Goals page functionality
document.addEventListener('DOMContentLoaded', function() {
    const goalsButton = document.querySelector('[data-page="goals"]');
    const mainContent = document.getElementById('main-content');
    const goalsPage = document.getElementById('goals-page');

    // Function to show goals page
    function showGoalsPage() {
        // Hide all other pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.style.display = 'none';
        });
        
        // Show goals page
        goalsPage.style.display = 'block';
        
        // Update active state in sidebar
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        goalsButton.classList.add('active');
    }

    // Add click event listener to goals button
    if (goalsButton) {
        goalsButton.addEventListener('click', function(e) {
            e.preventDefault();
            showGoalsPage();
        });
    }
}); 