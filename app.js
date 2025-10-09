// Solar Battery Management Calculator with VPP Revenue Planning

class BatteryManagementCalculator {
    constructor() {
        // Battery information inputs
        this.currentLevelInput = document.getElementById('currentLevel');
        this.batterySizeInput = document.getElementById('batterySize');
        this.reserveLevelInput = document.getElementById('reserveLevel');
        
        // Solar charging inputs
        this.solarGenerationInput = document.getElementById('solarGeneration');
        
        // VPP discharge inputs
        this.dischargeDurationInput = document.getElementById('dischargeDuration');
        this.dischargeRateInput = document.getElementById('dischargeRate');
        this.exportPriceInput = document.getElementById('exportPrice');
        
        // Solar charging results
        this.hoursResult = document.getElementById('hoursResult');
        this.minutesResult = document.getElementById('minutesResult');
        this.completionTimeResult = document.getElementById('completionTime');
        this.chargingStatus = document.getElementById('chargingStatus');
        
        // VPP discharge results
        this.energyDischargedResult = document.getElementById('energyDischarged');
        this.finalBatteryLevelResult = document.getElementById('finalBatteryLevel');
        this.batteryUsageResult = document.getElementById('batteryUsage');
        this.totalRevenueResult = document.getElementById('totalRevenue');
        this.vppStatus = document.getElementById('vppStatus');
        
        this.init();
    }
    
    init() {
        // Add event listeners for real-time updates
        this.currentLevelInput.addEventListener('input', () => this.calculateAll());
        this.batterySizeInput.addEventListener('input', () => this.calculateAll());
        this.reserveLevelInput.addEventListener('input', () => this.calculateAll());
        this.solarGenerationInput.addEventListener('input', () => this.calculateCharging());
        this.dischargeDurationInput.addEventListener('input', () => this.calculateVPP());
        this.dischargeRateInput.addEventListener('input', () => this.calculateVPP());
        this.exportPriceInput.addEventListener('input', () => this.calculateVPP());
        
        // Update completion time every minute
        setInterval(() => this.updateCompletionTime(), 60000);
        
        // Initial calculations
        this.calculateAll();
    }
    
    calculateAll() {
        this.calculateCharging();
        this.calculateVPP();
    }
    
    calculateCharging() {
        const currentLevel = parseFloat(this.currentLevelInput.value) || 0;
        const batterySize = parseFloat(this.batterySizeInput.value) || 0;
        const solarGeneration = parseFloat(this.solarGenerationInput.value) || 0;
        
        // Clear previous status
        this.clearChargingStatus();
        
        // Input validation
        if (batterySize <= 0) {
            this.showChargingStatus('Please enter a valid battery size', 'error');
            this.resetChargingResults();
            return;
        }
        
        if (currentLevel < 0) {
            this.showChargingStatus('Current battery level cannot be negative', 'error');
            this.resetChargingResults();
            return;
        }
        
        if (currentLevel >= batterySize) {
            this.showChargingStatus('Battery is already full!', 'success');
            this.setChargingResults('0.00', '0', 'Full');
            return;
        }
        
        if (solarGeneration <= 0) {
            this.showChargingStatus('No solar generation - battery will not charge', 'warning');
            this.setChargingResults('∞', '∞', 'Never');
            return;
        }
        
        // Calculate remaining capacity
        const remainingCapacity = batterySize - currentLevel;
        
        if (remainingCapacity <= 0) {
            this.showChargingStatus('Battery is already full!', 'success');
            this.setChargingResults('0.00', '0', 'Full');
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
        this.setChargingResults(
            hoursToFull.toFixed(2),
            minutesToFull.toString(),
            completionTimeString
        );
        
        // Show success status
        this.showChargingStatus(`${remainingCapacity.toFixed(2)} kWh remaining to charge`, 'info');
    }
    
    calculateVPP() {
        const currentLevel = parseFloat(this.currentLevelInput.value) || 0;
        const batterySize = parseFloat(this.batterySizeInput.value) || 0;
        const reserveLevel = parseFloat(this.reserveLevelInput.value) || 0;
        const dischargeDuration = parseFloat(this.dischargeDurationInput.value) || 0;
        const dischargeRate = parseFloat(this.dischargeRateInput.value) || 0;
        const exportPrice = parseFloat(this.exportPriceInput.value) || 0;
        
        // Clear previous VPP status
        this.clearVPPStatus();
        
        // Input validation
        if (batterySize <= 0) {
            this.showVPPStatus('Please enter a valid battery size', 'error');
            this.resetVPPResults();
            return;
        }
        
        if (currentLevel < 0) {
            this.showVPPStatus('Current battery level cannot be negative', 'error');
            this.resetVPPResults();
            return;
        }
        
        if (dischargeDuration <= 0 || dischargeRate <= 0) {
            this.resetVPPResults();
            return;
        }
        
        // Calculate reserve level in kWh
        const reserveLevelkWh = (batterySize * reserveLevel) / 100;
        
        // Calculate available energy for discharge (above reserve level)
        const availableForDischarge = Math.max(0, currentLevel - reserveLevelkWh);
        
        if (availableForDischarge <= 0) {
            this.showVPPStatus('Battery level is at or below reserve level', 'warning');
            this.setVPPResults('0.000', currentLevel.toFixed(3), '0.0', '$0.00');
            return;
        }
        
        // Calculate energy to be discharged
        const durationHours = dischargeDuration / 60;
        const requestedEnergyDischarge = durationHours * dischargeRate;
        
        // Limit discharge to available energy above reserve
        const actualEnergyDischarge = Math.min(requestedEnergyDischarge, availableForDischarge);
        
        // Calculate final battery level
        const finalBatteryLevel = currentLevel - actualEnergyDischarge;
        
        // Calculate battery usage percentage
        const batteryUsagePercent = (actualEnergyDischarge / batterySize) * 100;
        
        // Calculate revenue
        const revenue = actualEnergyDischarge * exportPrice;
        
        // Update results
        this.setVPPResults(
            actualEnergyDischarge.toFixed(3),
            finalBatteryLevel.toFixed(3),
            batteryUsagePercent.toFixed(1),
            this.formatCurrency(revenue)
        );
        
        // Status messages
        if (actualEnergyDischarge < requestedEnergyDischarge) {
            const shortfall = requestedEnergyDischarge - actualEnergyDischarge;
            this.showVPPStatus(`Discharge limited by reserve level. Shortfall: ${shortfall.toFixed(3)} kWh`, 'warning');
        } else if (finalBatteryLevel <= reserveLevelkWh + 0.1) {
            this.showVPPStatus('Discharge will bring battery close to reserve level', 'warning');
        } else {
            let statusMsg = `Discharge will use ${batteryUsagePercent.toFixed(1)}% of battery capacity`;
            if (exportPrice > 0) {
                statusMsg += ` and generate ${this.formatCurrency(revenue)} revenue`;
            }
            this.showVPPStatus(statusMsg, 'info');
        }
    }
    
    loadExampleData() {
        this.currentLevelInput.value = '25.5';
        this.batterySizeInput.value = '32.24';
        this.reserveLevelInput.value = '40';
        this.solarGenerationInput.value = '8.5';
        this.dischargeDurationInput.value = '30';
        this.dischargeRateInput.value = '10';
        this.exportPriceInput.value = '1.26';
        this.calculateAll();
    }
    
    setChargingResults(hours, minutes, completionTime) {
        this.hoursResult.textContent = hours;
        this.minutesResult.textContent = minutes;
        this.completionTimeResult.textContent = completionTime;
        
        this.addLoadingAnimation([this.hoursResult, this.minutesResult, this.completionTimeResult]);
    }
    
    setVPPResults(energy, finalLevel, usage, revenue) {
        this.energyDischargedResult.textContent = energy;
        this.finalBatteryLevelResult.textContent = finalLevel;
        this.batteryUsageResult.textContent = usage;
        this.totalRevenueResult.textContent = revenue;
        
        this.addLoadingAnimation([
            this.energyDischargedResult, 
            this.finalBatteryLevelResult, 
            this.batteryUsageResult, 
            this.totalRevenueResult
        ]);
    }
    
    resetChargingResults() {
        this.setChargingResults('--', '--', '--:-- --');
    }
    
    resetVPPResults() {
        this.setVPPResults('--', '--', '--', '$--');
    }
    
    addLoadingAnimation(elements) {
        elements.forEach(element => {
            element.classList.add('loading');
            setTimeout(() => element.classList.remove('loading'), 200);
        });
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('en-AU', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    formatCurrency(amount) {
        if (isNaN(amount) || !isFinite(amount)) return '$--';
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    showChargingStatus(message, type) {
        this.chargingStatus.textContent = message;
        this.chargingStatus.className = `status-message ${type}`;
    }
    
    showVPPStatus(message, type) {
        this.vppStatus.textContent = message;
        this.vppStatus.className = `status-message ${type}`;
    }
    
    clearChargingStatus() {
        this.chargingStatus.textContent = '';
        this.chargingStatus.className = 'status-message';
    }
    
    clearVPPStatus() {
        this.vppStatus.textContent = '';
        this.vppStatus.className = 'status-message';
    }
    
    updateCompletionTime() {
        // Recalculate completion time to account for current time changes
        if (this.completionTimeResult.textContent !== '--:-- --' && 
            this.completionTimeResult.textContent !== 'Full' && 
            this.completionTimeResult.textContent !== 'Never') {
            this.calculateCharging();
        }
    }
    
    // Utility method to get battery capacity available for discharge
    getAvailableCapacity() {
        const currentLevel = parseFloat(this.currentLevelInput.value) || 0;
        const batterySize = parseFloat(this.batterySizeInput.value) || 0;
        const reserveLevel = parseFloat(this.reserveLevelInput.value) || 0;
        const reserveLevelkWh = (batterySize * reserveLevel) / 100;
        
        return Math.max(0, currentLevel - reserveLevelkWh);
    }
    
    // Utility method to validate all inputs
    validateInputs() {
        const inputs = [
            this.currentLevelInput,
            this.batterySizeInput,
            this.reserveLevelInput,
            this.solarGenerationInput,
            this.dischargeDurationInput,
            this.dischargeRateInput,
            this.exportPriceInput
        ];
        
        inputs.forEach(input => {
            const value = parseFloat(input.value);
            const min = parseFloat(input.min) || 0;
            const max = parseFloat(input.max) || Infinity;
            
            if (input.value && (isNaN(value) || value < min || value > max)) {
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });
    }
}

// Enhanced input validation with visual feedback
function setupInputValidation() {
    const inputs = document.querySelectorAll('input[type="number"]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            const value = parseFloat(this.value);
            const min = parseFloat(this.min) || 0;
            const max = parseFloat(this.max) || Infinity;
            
            if (this.value && (isNaN(value) || value < min || value > max)) {
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
        
        // Real-time validation for immediate feedback
        input.addEventListener('input', function() {
            this.style.borderColor = '';
            this.style.boxShadow = '';
        });
    });
}

// Create and setup the Load Example button
function createExampleButton(calculator) {
    const exampleButton = document.createElement('button');
    exampleButton.textContent = 'Load Example';
    exampleButton.className = 'btn btn--secondary btn--sm';
    exampleButton.id = 'loadExampleBtn';
    
    // Style the button to be positioned in bottom right
    exampleButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--color-border);
    `;
    
    exampleButton.addEventListener('click', function() {
        calculator.loadExampleData();
    });
    
    document.body.appendChild(exampleButton);
    return exampleButton;
}

// Utility functions
function formatNumber(num, decimals = 2) {
    if (isNaN(num) || !isFinite(num)) return '--';
    return parseFloat(num).toFixed(decimals);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const calculator = new BatteryManagementCalculator();
    setupInputValidation();
    
    // Create the Load Example button
    createExampleButton(calculator);
    
    // Add keyboard shortcuts for better UX
    document.addEventListener('keydown', function(e) {
        // Clear all inputs with Ctrl+R (but prevent page refresh)
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            document.getElementById('currentLevel').value = '';
            document.getElementById('solarGeneration').value = '';
            document.getElementById('dischargeDuration').value = '';
            document.getElementById('dischargeRate').value = '';
            document.getElementById('exportPrice').value = '';
            calculator.calculateAll();
        }
        
        // Focus first input with F1
        if (e.key === 'F1') {
            e.preventDefault();
            document.getElementById('currentLevel').focus();
        }
        
        // Load example with F2
        if (e.key === 'F2') {
            e.preventDefault();
            calculator.loadExampleData();
        }
    });
    
    // Add helpful tooltips
    document.getElementById('currentLevel').title = 'Enter the current charge level of your battery';
    document.getElementById('batterySize').title = 'Total capacity of your battery system';
    document.getElementById('reserveLevel').title = 'Minimum battery level to maintain (as percentage)';
    document.getElementById('solarGeneration').title = 'Current power output from your solar panels';
    document.getElementById('dischargeDuration').title = 'How long you plan to discharge for VPP event';
    document.getElementById('dischargeRate').title = 'Power output rate during VPP discharge';
    document.getElementById('exportPrice').title = 'Price you receive per kWh exported to the grid';
});

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BatteryManagementCalculator;
}