// ===================================
// MEDICINE LIST GENERATOR - JAVASCRIPT
// ===================================

// State Management
let medicines = [];
let medicineIdCounter = 0;
let selectedAutocompleteIndex = -1;
let currentAutocompleteResults = [];

// DOM Elements
const medicineForm = document.getElementById('medicineForm');
const medicineList = document.getElementById('medicineList');
const medicineCount = document.getElementById('medicineCount');
const clearFormBtn = document.getElementById('clearForm');
const clearAllBtn = document.getElementById('clearAll');
const generatePDFBtn = document.getElementById('generatePDF');

// Form Inputs
const inputs = {
    patientName: document.getElementById('patientName'),
    medicineName: document.getElementById('medicineName'),
    genericName: document.getElementById('genericName'),
    dose: document.getElementById('dose'),
    frequency: document.getElementById('frequency'),
    usedFor: document.getElementById('usedFor'),
    customRemarks: document.getElementById('customRemarks')
};

// Auto-complete Elements
const autocompleteDropdown = document.getElementById('autocompleteDropdown');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    updateMedicineList();
    updateMedicineCount();
    setupAutocomplete();
});

// Auto-complete Setup
function setupAutocomplete() {
    inputs.medicineName.addEventListener('input', handleAutocompleteInput);
    inputs.medicineName.addEventListener('keydown', handleAutocompleteKeydown);
    document.addEventListener('click', handleDocumentClick);
}

function handleAutocompleteInput(e) {
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        hideAutocomplete();
        return;
    }
    
    currentAutocompleteResults = searchMedicine(query);
    
    if (currentAutocompleteResults.length > 0) {
        showAutocomplete(currentAutocompleteResults);
    } else {
        hideAutocomplete();
    }
}

function handleAutocompleteKeydown(e) {
    if (!autocompleteDropdown.classList.contains('active')) return;
    
    const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedAutocompleteIndex = Math.min(selectedAutocompleteIndex + 1, items.length - 1);
        updateAutocompleteSelection(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedAutocompleteIndex = Math.max(selectedAutocompleteIndex - 1, -1);
        updateAutocompleteSelection(items);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedAutocompleteIndex >= 0 && items[selectedAutocompleteIndex]) {
            selectAutocompleteItem(currentAutocompleteResults[selectedAutocompleteIndex]);
        }
    } else if (e.key === 'Escape') {
        hideAutocomplete();
    }
}

function handleDocumentClick(e) {
    if (!e.target.closest('.autocomplete-container')) {
        hideAutocomplete();
    }
}

function showAutocomplete(results) {
    selectedAutocompleteIndex = -1;
    autocompleteDropdown.innerHTML = results.map((med, index) => `
        <div class="autocomplete-item" data-index="${index}">
            <div class="autocomplete-item-name">${escapeHtml(med.name)}</div>
            <div class="autocomplete-item-generic">${escapeHtml(med.genericName)}</div>
        </div>
    `).join('');
    
    autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            selectAutocompleteItem(results[index]);
        });
    });
    
    autocompleteDropdown.classList.add('active');
}

function hideAutocomplete() {
    autocompleteDropdown.classList.remove('active');
    selectedAutocompleteIndex = -1;
    currentAutocompleteResults = [];
}

function updateAutocompleteSelection(items) {
    items.forEach((item, index) => {
        if (index === selectedAutocompleteIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function selectAutocompleteItem(med) {
    inputs.medicineName.value = med.name;
    inputs.genericName.value = med.genericName;
    inputs.usedFor.value = med.usedFor;
    if (med.dose) {
        inputs.dose.value = med.dose;
    }
    hideAutocomplete();
    inputs.dose.focus();
}

// Event Listeners
medicineForm.addEventListener('submit', handleFormSubmit);
clearFormBtn.addEventListener('click', clearForm);
clearAllBtn.addEventListener('click', handleClearAll);
generatePDFBtn.addEventListener('click', generatePDF);

// Form Submission Handler
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get timing checkboxes
    const timingCheckboxes = document.querySelectorAll('input[name="timing"]:checked');
    const timing = Array.from(timingCheckboxes).map(cb => cb.value);
    
    // Get food timing radio
    const foodTimingRadio = document.querySelector('input[name="foodTiming"]:checked');
    const foodTiming = foodTimingRadio ? foodTimingRadio.value : '';
    
    // Get remarks checkboxes
    const remarksCheckboxes = document.querySelectorAll('input[name="remarks"]:checked');
    const remarks = Array.from(remarksCheckboxes).map(cb => cb.value);
    
    // Add custom remarks if any
    if (inputs.customRemarks.value.trim()) {
        remarks.push(inputs.customRemarks.value.trim());
    }
    
    // Validate timing (at least one must be selected)
    if (timing.length === 0) {
        showNotification('Please select at least one time (Morning/Noon/Night)', 'error');
        return;
    }
    
    const medicine = {
        id: ++medicineIdCounter,
        patientName: inputs.patientName.value.trim(),
        medicineName: inputs.medicineName.value.trim(),
        genericName: inputs.genericName.value.trim(),
        dose: inputs.dose.value.trim(),
        timing: timing,
        frequency: inputs.frequency.value,
        foodTiming: foodTiming,
        usedFor: inputs.usedFor.value.trim(),
        remarks: remarks,
        createdAt: new Date().toISOString()
    };
    
    medicines.push(medicine);
    saveToLocalStorage();
    updateMedicineList();
    updateMedicineCount();
    
    // Clear only medicine-related fields, keep patient name
    inputs.medicineName.value = '';
    inputs.genericName.value = '';
    inputs.dose.value = '';
    inputs.usedFor.value = '';
    inputs.customRemarks.value = '';
    medicineForm.reset();
    inputs.patientName.value = medicine.patientName; // Restore patient name
    
    // Focus back to medicine name for rapid entry
    inputs.medicineName.focus();
    
    // Show success feedback
    showNotification('Medicine added successfully!', 'success');
}

// Clear Form
function clearForm() {
    medicineForm.reset();
    inputs.medicineName.focus();
    hideAutocomplete();
}

// Handle Clear All
function handleClearAll() {
    if (medicines.length === 0) {
        showNotification('No medicines to clear', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear all medicines? This action cannot be undone.')) {
        medicines = [];
        saveToLocalStorage();
        updateMedicineList();
        updateMedicineCount();
        showNotification('All medicines cleared', 'info');
    }
}

// Delete Medicine
function deleteMedicine(id) {
    medicines = medicines.filter(med => med.id !== id);
    saveToLocalStorage();
    updateMedicineList();
    updateMedicineCount();
    showNotification('Medicine removed', 'info');
}

// Get timing string (e.g., "1 – 0 – 1")
function getTimingString(timing) {
    let morning = '0';
    let noon = '0';
    let night = '0';
    
    if (timing.includes('morning')) morning = '1';
    if (timing.includes('noon')) noon = '1';
    if (timing.includes('night')) night = '1';
    
    return `${morning}-${noon}-${night}`;
}

// Get timing class for color coding
function getTimingClass(timing) {
    const classes = [];
    if (timing.includes('morning')) classes.push('timing-morning');
    if (timing.includes('noon')) classes.push('timing-noon');
    if (timing.includes('night')) classes.push('timing-night');
    
    if (classes.length === 3) return 'timing-all';
    return classes.join(' ');
}

// Get timing priority for sorting
function getTimingPriority(timing) {
    // Priority: Morning (1) > Morning-Noon (2) > Morning-Noon-Night (3) > Noon (4) > Noon-Night (5) > Night (6)
    const hasMorning = timing.includes('morning');
    const hasNoon = timing.includes('noon');
    const hasNight = timing.includes('night');
    
    if (hasMorning && !hasNoon && !hasNight) return 1;
    if (hasMorning && hasNoon && !hasNight) return 2;
    if (hasMorning && hasNoon && hasNight) return 3;
    if (!hasMorning && hasNoon && !hasNight) return 4;
    if (!hasMorning && hasNoon && hasNight) return 5;
    if (!hasMorning && !hasNoon && hasNight) return 6;
    return 7;
}

// Get sub-group shade based on instructions, cycle, food, indication
function getSubgroupShade(med) {
    let shadeLevel = 0;
    
    // Check for variations in frequency, food timing, remarks
    if (med.frequency !== 'Daily') shadeLevel += 1;
    if (med.foodTiming !== 'BEFORE FOOD') shadeLevel += 1;
    if (med.remarks.length > 0) shadeLevel += 1;
    if (med.usedFor) shadeLevel += 1;
    
    return shadeLevel;
}

// Sort medicines by schedule priority
function sortMedicines() {
    medicines.sort((a, b) => {
        const priorityA = getTimingPriority(a.timing);
        const priorityB = getTimingPriority(b.timing);
        
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        
        // If same timing, sort by medicine name
        return a.medicineName.localeCompare(b.medicineName);
    });
}

// Update Medicine List UI
function updateMedicineList() {
    if (medicines.length === 0) {
        medicineList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💊</div>
                <p>No medicines added yet</p>
                <p style="font-size: 1rem; color: var(--text-light); margin-top: 0.5rem;">Use the form above to add medicines to your schedule</p>
            </div>
        `;
        return;
    }
    
    // Sort medicines by schedule
    sortMedicines();
    
    medicineList.innerHTML = medicines.map((med, index) => `
        <div class="medicine-item ${getTimingClass(med.timing)}" data-id="${med.id}" style="animation-delay: ${index * 0.05}s">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <div class="medicine-name">${escapeHtml(med.medicineName)}</div>
                    ${med.genericName ? `<div class="medicine-generic">${escapeHtml(med.genericName)}</div>` : ''}
                </div>
                <button onclick="deleteMedicine(${med.id})" style="background: transparent; border: none; color: var(--text-light); cursor: pointer; padding: 0.5rem; border-radius: 6px; transition: all 0.2s ease; font-size: 1.25rem;" onmouseover="this.style.background='#fee2e2'; this.style.color='#dc2626'" onmouseout="this.style.background='transparent'; this.style.color='var(--text-light)'">×</button>
            </div>
            
            <div class="medicine-details">
                ${med.dose ? `
                <div class="medicine-detail">
                    <strong>Dosage</strong>
                    <span>${escapeHtml(med.dose)}</span>
                </div>
                ` : ''}
                <div class="medicine-detail">
                    <strong>Schedule</strong>
                    <span>${getTimingString(med.timing)}</span>
                </div>
                <div class="medicine-detail">
                    <strong>Frequency</strong>
                    <span>${escapeHtml(med.frequency)}</span>
                </div>
                <div class="medicine-detail">
                    <strong>With Food</strong>
                    <span>${escapeHtml(med.foodTiming)}</span>
                </div>
                ${med.usedFor ? `
                    <div class="medicine-detail">
                        <strong>Used For</strong>
                        <span>${escapeHtml(med.usedFor)}</span>
                    </div>
                ` : ''}
            </div>
            
            ${med.remarks.length > 0 ? `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--border-color); font-size: 1rem; color: var(--text-dark);">
                    <strong style="display: block; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.35rem; font-weight: 700;">Special Instructions</strong>
                    ${escapeHtml(med.remarks.join(', '))}
                </div>
            ` : ''}
        </div>
    `).join('');
    
    // Check for scroll overflow and update scroll indicator
    updateScrollIndicator();
}

// Update scroll indicator visibility based on scroll state
function updateScrollIndicator() {
    const wrapper = medicineList.closest('.medicine-list-wrapper');
    if (!wrapper) return;
    
    // Check if there's overflow content
    const hasOverflow = medicineList.scrollHeight > medicineList.clientHeight;
    
    if (hasOverflow) {
        wrapper.classList.add('has-overflow');
    } else {
        wrapper.classList.remove('has-overflow');
        wrapper.classList.remove('at-bottom');
        return;
    }
    
    // Check if scrolled to bottom
    const isAtBottom = medicineList.scrollTop + medicineList.clientHeight >= medicineList.scrollHeight - 10;
    
    if (isAtBottom) {
        wrapper.classList.add('at-bottom');
    } else {
        wrapper.classList.remove('at-bottom');
    }
    
    // Position scroll indicator at bottom of visible area
    const scrollIndicator = wrapper.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        const wrapperHeight = wrapper.clientHeight;
        scrollIndicator.style.top = (wrapperHeight - scrollIndicator.offsetHeight) + 'px';
    }
}

// Add scroll event listener to medicine list
medicineList.addEventListener('scroll', updateScrollIndicator);

// Update Medicine Count
function updateMedicineCount() {
    const count = medicines.length;
    medicineCount.textContent = `${count} medicine${count !== 1 ? 's' : ''}`;
}

// Generate PDF with improved timing grouping and color coding
async function generatePDF() {
    if (medicines.length === 0) {
        showNotification('Please add at least one medicine before generating PDF', 'error');
        return;
    }
    
    try {
        showNotification('Generating PDF...', 'info');
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // PDF Configuration - Full width, no side margins
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pageWidth - (margin * 2);
        
        // Color Palette from Screenshot
        const headerColor = [255, 249, 196];     /* #fff9c4 - Yellow/Gold header */
        const textColor = [26, 26, 26];             /* #1a1a1a - Dark text */
        const lightColor = [107, 114, 128];           /* #6b7280 - Light text */
        
        // Row Colors from Screenshot
        const rowGreen = [200, 230, 201];          /* #c8e6c9 - Green rows */
        const rowBlue = [187, 222, 251];           /* #bbdefb - Blue rows */
        const rowPeach = [255, 204, 188];          /* #ffccbc - Peach/salmon rows */
        const rowDark = [66, 66, 66];              /* #424242 - Black/dark gray rows */
        
        // Timing Colors (Greenish for morning, yellowish for noon, yellow-green for morn-noon)
        const timingMorning = [34, 197, 94];       /* #22c55e - Green */
        const timingNoon = [251, 191, 36];         /* #fbbf24 - Yellowish */
        const timingMornNoon = [132, 204, 22];     /* #84cc16 - Yellow-green */
        
        // Sub-group shades (different greens for distinguishing)
        const subgroupLight = [220, 252, 231];      /* #dcfce7 - Light green */
        const subgroupMedium = [134, 239, 172];     /* #86efac - Medium green */
        const subgroupDark = [22, 163, 74];          /* #16a34a - Dark green */
        
        // Function to get row color based on timing profile
        function getRowColor(med) {
            const hasMorning = med.timing.includes('morning');
            const hasNoon = med.timing.includes('noon');
            const hasNight = med.timing.includes('night');
            
            // Calculate shade based on variations in frequency, food timing, remarks
            let shadeLevel = 0;
            if (med.frequency !== 'Daily') shadeLevel += 1;
            if (med.foodTiming !== 'BEFORE FOOD') shadeLevel += 1;
            if (med.remarks.length > 0) shadeLevel += 1;
            if (med.usedFor) shadeLevel += 1;
            
            // Morning medicines - greenish tones
            if (hasMorning) {
                if (shadeLevel === 0) return subgroupLight;
                if (shadeLevel === 1) return subgroupMedium;
                if (shadeLevel >= 2) return subgroupDark;
            }
            
            // Noon medicines - yellowish tones
            if (hasNoon && !hasMorning && !hasNight) {
                if (shadeLevel === 0) return rowPeach;
                if (shadeLevel >= 1) return rowDark;
            }
            
            // Night medicines - darker tones
            if (hasNight && !hasMorning && !hasNoon) {
                if (shadeLevel === 0) return rowBlue;
                if (shadeLevel >= 1) return rowDark;
            }
            
            return rowGreen; // Default
        }
        
        // Header Section - Full width
        doc.setFillColor(...headerColor);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        // Patient Name (main title)
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        const patientName = inputs.patientName.value.trim() || 'Patient Name';
        doc.text(patientName, margin, 18);
        
        // Date
        const date = new Date();
        const dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(...lightColor);
        doc.text(`Date: ${dateStr}`, pageWidth - margin, 18, { align: 'right' });
        
        // Color Legend
        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Schedule:', margin, 28);
        
        doc.setFillColor(...timingMorning);
        doc.rect(margin + 55, 24, 8, 5, 'F');
        doc.text('Morning', margin + 65, 28);
        
        doc.setFillColor(...timingNoon);
        doc.rect(margin + 115, 24, 8, 5, 'F');
        doc.text('Noon', margin + 125, 28);
        
        doc.setFillColor(...timingMornNoon);
        doc.rect(margin + 170, 24, 8, 5, 'F');
        doc.text('Night', margin + 180, 28);
        
        // Reset text color
        doc.setTextColor(...textColor);
        
        // Sort medicines by schedule for PDF
        sortMedicines();
        
        // Prepare table data with improved column names
        const tableData = medicines.map((med, index) => {
            const timingStr = getTimingString(med.timing);
            const remarksStr = med.remarks.length > 0 ? med.remarks.join(', ') : '';
            
            return [
                index + 1,
                med.medicineName,
                med.genericName || '-',
                med.dose,
                remarksStr,
                med.frequency,
                timingStr,
                med.foodTiming,
                med.usedFor || '-'
            ];
        });
        
        // Generate table with full width and proper text wrapping
        doc.autoTable({
            startY: 55,
            head: [['#', 'Medicine', 'Generic', 'Dose', 'Instructions', 'Cycle', 'Schedule', 'With Food', 'Indication']],
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 11,
                cellPadding: 5,
                textColor: [...textColor],
                lineColor: [200, 200, 200],
                lineWidth: 0.5,
                overflow: 'linebreak',
                overflowLineBreak: 'auto',
                fontStyle: 'normal'
            },
            headStyles: {
                fillColor: headerColor,
                textColor: [...textColor],
                fontStyle: 'bold',
                fontSize: 12,
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
                1: { cellWidth: 45, fontStyle: 'bold' },      // Medicine - wider
                2: { cellWidth: 35, fontStyle: 'italic' },   // Generic - wider
                3: { cellWidth: 20 },                          // Dose
                4: { cellWidth: 40, cellWidth: 'wrap' },   // Instructions - wider with wrap
                5: { cellWidth: 20 },                          // Cycle
                6: { cellWidth: 25, halign: 'center' },   // Schedule
                7: { cellWidth: 25 },                          // With Food
                8: { cellWidth: 35, fontStyle: 'italic' }   // Indication
            },
            margin: { top: 55, right: margin, bottom: margin, left: margin },
            didParseCell: function(data) {
                if (data.section === 'body') {
                    const med = medicines[data.row.index];
                    data.cell.styles.fillColor = getRowColor(med);
                    data.cell.styles.textColor = data.cell.styles.fillColor[0] < 128 ? [255, 255, 255] : [0, 0, 0];
                }
            },
            didDrawPage: function(data) {
                const pageNumber = doc.internal.getNumberOfPages();
                doc.setFontSize(10);
                doc.setTextColor(...lightColor);
                doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
        });
        
        // Footer
        const finalY = doc.lastAutoTable.finalY + 10;
        if (finalY < pageHeight - 30) {
            doc.setFillColor(...headerColor);
            doc.rect(margin, finalY, contentWidth, 10, 'F');
            
            doc.setTextColor(...textColor);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('IMPORTANT:', margin + 5, finalY + 6);
            
            doc.setFont('helvetica', 'normal');
            doc.text('Always consult your healthcare provider before starting or changing any medication.', margin + 35, finalY + 6);
        }
        
        // Generate filename
        const filename = `Medicine_List_${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}.pdf`;
        
        // Save PDF
        doc.save(filename);
        
        showNotification('PDF generated successfully!', 'success');
        
    } catch (error) {
        console.error('PDF Generation Error:', error);
        showNotification('Error generating PDF. Please try again.', 'error');
    }
}

// Local Storage Functions
function saveToLocalStorage() {
    localStorage.setItem('medicineList', JSON.stringify(medicines));
    localStorage.setItem('medicineIdCounter', medicineIdCounter.toString());
}

function loadFromLocalStorage() {
    const savedMedicines = localStorage.getItem('medicineList');
    const savedCounter = localStorage.getItem('medicineIdCounter');
    
    if (savedMedicines) {
        medicines = JSON.parse(savedMedicines);
    }
    
    if (savedCounter) {
        medicineIdCounter = parseInt(savedCounter, 10);
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        padding: 1rem 1.5rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-family: 'Segoe UI', -apple-system, sans-serif;
        font-size: 1rem;
        font-weight: 500;
        border-left: 4px solid ${getNotificationColor(type)};
    `;
    
    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(40px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(40px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Append to body
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        success: '#22c55e',
        error: '#dc2626',
        info: '#22c55e'
    };
    return colors[type] || colors.info;
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
            medicineForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to clear form
    if (e.key === 'Escape' && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT')) {
        clearForm();
    }
});
