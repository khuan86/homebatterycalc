// Solar PV Battery Charging Calculator JavaScript

class SolarCalculator {
    constructor() {
        this.currentLevelInput = document.getElementById('currentLevel');
        this.batterySizeInput = document.getElementById('batterySize');
        this.solarGenerationInput = document.getElementById('solarGeneration');
        
        this.hoursResult = document.getElementById('hoursResult');
        this.minutesResult = document.getElementById('minutesResult');
        this.completionTimeResult = document.getElementById('completionTime');
        this.statusMessage = document.getElementById('statusMessage');
        
        this.init();
    }
    
    init() {
        // Add event listeners for real-time updates
        this.currentLevelInput.addEventListener('input', () => this.calculate());
        this.batterySizeInput.addEventListener('input', () => this.calculate());
        this.solarGenerationInput.addEventListener('input', () => this.calculate());
        
        // Update completion time every minute
        setInterval(() => this.updateCompletionTime(), 60000);
        
        // Initial calculation
        this.calculate();
    }
    
    calculate() {
        const currentLevel = parseFloat(this.currentLevelInput.value) || 0;
        const batterySize = parseFloat(this.batterySizeInput.value) || 0;
        const solarGeneration = parseFloat(this.solarGenerationInput.value) || 0;
        
        // Clear previous status
        this.clearStatus();
        
        // Input validation
        if (batterySize <= 0) {
            this.showStatus('Please enter a valid battery size', 'error');
            this.resetResults();
            return;
        }
        
        if (currentLevel < 0) {
            this.showStatus('Current battery level cannot be negative', 'error');
            this.resetResults();
            return;
        }
        
        if (currentLevel >= batterySize) {
            this.showStatus('Battery is already full!', 'success');
            this.setResults('0.00', '0', 'Full');
            return;
        }
        
        if (solarGeneration <= 0) {
            this.showStatus('No solar generation - battery will not charge', 'warning');
            this.setResults('∞', '∞', 'Never');
            return;
        }
        
        // Calculate remaining capacity
        const remainingCapacity = batterySize - currentLevel;
        
        if (remainingCapacity <= 0) {
            this.showStatus('Battery is already full!', 'success');
            this.setResults('0.00', '0', 'Full');
            return;
        }
        
        // Calculate time to full
        const hoursToFull = remainingCapacity / solarGeneration;
        const minutesToFull = Math.round(hoursToFull * 60);
        
        // Calculate completion time
        const now = new Date();
        const completionDate = new Date(now.getTime() + (hoursToFull * 60 * 60 * 1000));
        const completionTimeString = this.formatTime(completionDate);
        
        // Update results
        this.setResults(
            hoursToFull.toFixed(2),
            minutesToFull.toString(),
            completionTimeString
        );
        
        // Show success status
        this.showStatus(`${remainingCapacity.toFixed(2)} kWh remaining to charge`, 'info');
    }
    
    setResults(hours, minutes, completionTime) {
        this.hoursResult.textContent = hours;
        this.minutesResult.textContent = minutes;
        this.completionTimeResult.textContent = completionTime;
        
        // Add loading animation briefly
        this.hoursResult.classList.add('loading');
        this.minutesResult.classList.add('loading');
        this.completionTimeResult.classList.add('loading');
        
        setTimeout(() => {
            this.hoursResult.classList.remove('loading');
            this.minutesResult.classList.remove('loading');
            this.completionTimeResult.classList.remove('loading');
        }, 200);
    }
    
    resetResults() {
        this.setResults('--', '--', '--:-- --');
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
    }
    
    clearStatus() {
        this.statusMessage.textContent = '';
        this.statusMessage.className = 'status-message';
    }
    
    updateCompletionTime() {
        // Recalculate completion time to account for current time changes
        if (this.completionTimeResult.textContent !== '--:-- --' && 
            this.completionTimeResult.textContent !== 'Full' && 
            this.completionTimeResult.textContent !== 'Never') {
            this.calculate();
        }
    }
}

// Utility functions for enhanced user experience
function formatNumber(num, decimals = 2) {
    if (isNaN(num) || !isFinite(num)) return '--';
    return parseFloat(num).toFixed(decimals);
}

function validateInput(input, min = 0, max = Infinity) {
    const value = parseFloat(input.value);
    if (isNaN(value) || value < min || value > max) {
        input.classList.add('error');
        return false;
    }
    input.classList.remove('error');
    return true;
}

// Enhanced input validation with visual feedback
function setupInputValidation() {
    const inputs = document.querySelectorAll('input[type="number"]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            const value = parseFloat(this.value);
            
            if (this.value && (isNaN(value) || value < 0)) {
                this.style.borderColor = 'var(--color-error)';
                this.style.boxShadow = '0 0 0 3px rgba(var(--color-error-rgb), 0.2)';
            } else {
                this.style.borderColor = '';
                this.style.boxShadow = '';
            }
        });
        
        input.addEventListener('focus', function() {
            this.style.borderColor = 'var(--color-primary)';
            this.style.boxShadow = 'var(--focus-ring)';
        });
    });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const calculator = new SolarCalculator();
    setupInputValidation();
    
    // Add keyboard shortcuts for better UX
    document.addEventListener('keydown', function(e) {
        // Clear all inputs with Ctrl+R (but prevent page refresh)
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            document.getElementById('currentLevel').value = '';
            document.getElementById('solarGeneration').value = '';
            calculator.calculate();
        }
        
        // Focus first input with F1
        if (e.key === 'F1') {
            e.preventDefault();
            document.getElementById('currentLevel').focus();
        }
    });
    
    // Add helpful tooltips on hover (using title attributes)
    document.getElementById('currentLevel').title = 'Enter the current charge level of your battery';
    document.getElementById('batterySize').title = 'Total capacity of your battery system';
    document.getElementById('solarGeneration').title = 'Current power output from your solar panels';
});

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SolarCalculator;
}