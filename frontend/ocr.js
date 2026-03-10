// ===================================
// MEDICINE LIST GENERATOR - OCR MODULE
// Google Gemini API Integration
// ===================================

const GEMINI_MODEL_NAME = 'gemini-2.5-flash';
// SECURITY WARNING: API key is hardcoded and visible in client-side code
// For production, consider:
// 1. Moving API calls to backend (recommended)
// 2. Using environment variables
// 3. Using a proxy server
const GEMINI_API_KEY = 'AIzaSyBIfSBE9WqgAEX3gX4Hp-0_tnKtqFo_R3A'; // Your working key

// Note: Newer models like 2.5 often require the 'v1beta' endpoint
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent`;

// DOM Elements
let ocrModal = null;
let fileInput = null;
let scanningOverlay = null;
let extractedMedicinesModal = null;
let extractedMedicines = [];

// Initialize OCR functionality
function initOCR() {
    // Create OCR button - now placed in patient section
    const ocrTriggerBtn = document.getElementById('ocrTriggerBtn');
    if (ocrTriggerBtn) {
        ocrTriggerBtn.onclick = openOCRModal;
    }
    
    // Create modal and file input
    createOCRModal();
    createFileInput();
}

// Create OCR Modal
function createOCRModal() {
    ocrModal = document.createElement('div');
    ocrModal.id = 'ocrModal';
    ocrModal.className = 'ocr-modal';
    ocrModal.innerHTML = `
        <div class="ocr-modal-content">
            <div class="ocr-modal-header">
                <h2>Extract Medicine from Image</h2>
                <button class="ocr-modal-close" onclick="closeOCRModal()">&times;</button>
            </div>
            <div class="ocr-modal-body">
                <div class="ocr-upload-area" id="ocrUploadArea">
                    <div class="ocr-upload-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                    </div>
                    <p class="ocr-upload-text">Click to upload or drag & drop</p>
                    <p class="ocr-upload-subtext">Supports JPG, PNG, WebP</p>
                </div>
                <div class="ocr-preview" id="ocrPreview" style="display: none;">
                    <img id="ocrPreviewImage" src="" alt="Prescription Preview">
                    <button class="ocr-remove-image" onclick="removeOCRImage()">&times;</button>
                </div>
                <div class="ocr-actions">
                    <button class="btn btn-primary ocr-scan-btn" id="ocrScanBtn" onclick="scanPrescription()" disabled>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        Scan Prescription
                    </button>
                    <button class="btn btn-secondary" onclick="closeOCRModal()">Cancel</button>
                </div>
            </div>
        </div>
        <div class="ocr-scanning-overlay" id="ocrScanningOverlay" style="display: none;">
            <div class="ocr-scanning-content">
                <div class="ocr-scanning-spinner"></div>
                <p>Scanning prescription...</p>
                <p class="ocr-scanning-subtext">This may take a few seconds</p>
            </div>
        </div>
    `;
    document.body.appendChild(ocrModal);
    
    // Setup drag and drop
    setupDragAndDrop();
}

// Create hidden file input
function createFileInput() {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment';
    fileInput.style.display = 'none';
    fileInput.onchange = handleFileSelect;
    document.body.appendChild(fileInput);
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const uploadArea = document.getElementById('ocrUploadArea');
    
    uploadArea.onclick = () => fileInput.click();
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('ocr-drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('ocr-drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('ocr-drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// Open OCR Modal
function openOCRModal() {
    ocrModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close OCR Modal
function closeOCRModal() {
    ocrModal.style.display = 'none';
    document.body.style.overflow = '';
    removeOCRImage();
}

// Handle file selection
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
}

// Handle file
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        showImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Show image preview
function showImagePreview(imageData) {
    const uploadArea = document.getElementById('ocrUploadArea');
    const preview = document.getElementById('ocrPreview');
    const previewImage = document.getElementById('ocrPreviewImage');
    const scanBtn = document.getElementById('ocrScanBtn');
    
    uploadArea.style.display = 'none';
    preview.style.display = 'block';
    previewImage.src = imageData;
    scanBtn.disabled = false;
    
    // Store image data for scanning
    ocrModal.dataset.imageData = imageData;
}

// Remove OCR image
function removeOCRImage() {
    const uploadArea = document.getElementById('ocrUploadArea');
    const preview = document.getElementById('ocrPreview');
    const previewImage = document.getElementById('ocrPreviewImage');
    const scanBtn = document.getElementById('ocrScanBtn');
    
    uploadArea.style.display = 'block';
    preview.style.display = 'none';
    previewImage.src = '';
    scanBtn.disabled = true;
    delete ocrModal.dataset.imageData;
    fileInput.value = '';
}

// Scan prescription
async function scanPrescription() {
    const imageData = ocrModal.dataset.imageData;
    if (!imageData) {
        alert('Please select an image first');
        return;
    }
    
    showScanningOverlay();
    
    try {
        const base64Data = imageData.split(',')[1];
        const mimeType = imageData.substring(5, imageData.indexOf(';'));
        
        // Strategy: Try the newest, fastest model. If 404, the service is likely off.
        // Using only available models from the API
        const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-flash-latest"];
        
        let success = false;
        let finalData = null;
        
        for (const modelName of modelsToTry) {
            if (success) break;
            
            console.log(`Attempting OCR with model: ${modelName}...`);
            
            try {
                const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
                
                const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { inline_data: { mime_type: mimeType, data: base64Data } },
                                { text: getExtractionPrompt() }
                            ]
                        }],
                        safetySettings: [
                            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                        ]
                    })
                });
                
                if (response.status === 404) {
                    console.warn(`Model ${modelName} returned 404 (Not Found). Checking next...`);
                    continue;
                }
                
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error?.message || response.statusText);
                }
                
                const result = await response.json();
                finalData = extractMedicineData(result); // Parse immediately
                
                if (finalData) {
                    success = true;
                }
                
            } catch (innerError) {
                console.error(`Attempt failed for ${modelName}:`, innerError);
            }
        }
        
        // === THIS WAS THE BUGGY PART IN YOUR OLD CODE ===
        // We only process if success is true.
        
        hideScanningOverlay();
        
        if (success && finalData && finalData.length > 0) {
            console.log("OCR Success! Found", finalData.length, "medicines");
            showExtractedMedicinesModal(finalData);
            closeOCRModal();
        } else if (success && finalData && finalData.length === 0) {
            hideScanningOverlay();
            alert("No medicines were detected in the image. Please try with a clearer prescription image.");
        } else {
            // If we get here, ALL attempts failed.
            alert("OCR Failed. \n\nMost likely cause: The 'Generative Language API' is not enabled in your Google Cloud Console for this project.\n\nPlease check the console (F12) for detailed logs.");
        }
        
    } catch (fatalError) {
        hideScanningOverlay();
        console.error('Fatal OCR Error:', fatalError);
        alert(`System Error: ${fatalError.message}`);
    }
}

// Get extraction prompt for Gemini API
function getExtractionPrompt() {
    return `You are a medical prescription OCR system. Extract ALL medicines found in this prescription image and return ONLY valid JSON in this exact format:

{
    "medicines": [
        {
            "medicineName": "string (exact medicine name from image)",
            "genericName": "string or null (generic name if visible)",
            "dose": "string (e.g., '500mg', '50mg', '10mg')",
            "frequency": "Daily" | "per NEED" | "Weekly" | "Only Friday" | "Except WED & THUR",
            "foodTiming": "BEFORE FOOD" | "AFTER FOOD",
            "usedFor": "string (indication/reason for medicine)",
            "remarks": "string (any special instructions)"
        }
    ]
}

STRICT RULES:
1. Return ONLY the JSON object with a "medicines" array, no other text
2. Extract ALL medicines visible in the image
3. frequency MUST be exactly one of: "Daily", "per NEED", "Weekly", "Only Friday", "Except WED & THUR"
4. foodTiming MUST be exactly: "BEFORE FOOD" or "AFTER FOOD"
5. If unsure about frequency, default to "Daily"
6. If unsure about food timing, default to "AFTER FOOD"
7. If a field is not visible in the image, use null for that field
8. Return an empty array if no medicines are found
9. CRITICAL: If ANY text in the image is in Bengali (বাংলা), translate it to English. Translate Bengali numbers to English numbers (e.g., ৯ → 9, ৫ → 5). Translate Bengali words/phrases to their English equivalents (e.g., 'ব্যথা' → 'pain', 'দিন' → 'days', 'সকালে' → 'morning', 'দুপুরে' → 'noon', 'রাতে' → 'night'). All output must be in English only.`;
}

// Extract medicine data from Gemini response
function extractMedicineData(result) {
    try {
        console.log('Parsing API response...');
        
        if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
            console.error('Invalid response structure:', result);
            return null;
        }
        
        const text = result.candidates[0].content.parts[0].text;
        console.log('Extracted text from response:', text);
        
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = text;
        
        // Remove markdown code blocks if present
        const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
            console.log('Extracted JSON from markdown code block');
        } else {
            // Try to find JSON object in the text
            const objectMatch = text.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                jsonStr = objectMatch[0];
                console.log('Extracted JSON from plain text');
            }
        }
        
        console.log('JSON string to parse:', jsonStr);
        
        // Parse JSON
        const data = JSON.parse(jsonStr);
        console.log('Parsed data:', data);
        
        // Validate required fields - now expecting an array
        if (!data.medicines || !Array.isArray(data.medicines)) {
            console.error('Missing or invalid medicines array');
            return null;
        }
        
        // Normalize each medicine in the array
        const validFrequencies = ['Daily', 'per NEED', 'Weekly', 'Only Friday', 'Except WED & THUR'];
        const validFoodTimings = ['BEFORE FOOD', 'AFTER FOOD'];
        
        data.medicines.forEach(med => {
            // Normalize frequency
            if (!validFrequencies.includes(med.frequency)) {
                console.log('Invalid frequency, defaulting to Daily. Got:', med.frequency);
                med.frequency = 'Daily';
            }
            
            // Normalize food timing
            if (!validFoodTimings.includes(med.foodTiming)) {
                console.log('Invalid foodTiming, defaulting to AFTER FOOD. Got:', med.foodTiming);
                med.foodTiming = 'AFTER FOOD';
            }
        });
        
        return data.medicines;
    } catch (error) {
        console.error('Parse Error:', error);
        console.error('Error details:', error.message);
        return null;
    }
}

// Auto-fill form with extracted data (kept for backward compatibility)
function autoFillForm(data) {
    // Medicine Name
    if (data.medicineName) {
        document.getElementById('medicineName').value = data.medicineName;
    }
    
    // Generic Name
    if (data.genericName) {
        document.getElementById('genericName').value = data.genericName;
    }
    
    // Dose
    if (data.dose) {
        document.getElementById('dose').value = data.dose;
    }
    
    // Frequency
    if (data.frequency) {
        document.getElementById('frequency').value = data.frequency;
    }
    
    // Food Timing (radio button)
    if (data.foodTiming) {
        const foodRadios = document.querySelectorAll('input[name="foodTiming"]');
        foodRadios.forEach(radio => {
            radio.checked = (radio.value === data.foodTiming);
        });
    }
    
    // Used For
    if (data.usedFor) {
        document.getElementById('usedFor').value = data.usedFor;
    }
    
    // Remarks - check predefined checkboxes
    if (data.remarks) {
        const remarksLower = data.remarks.toLowerCase();
        
        // Check predefined checkboxes based on keywords
        const remarksCheckboxes = document.querySelectorAll('input[name="remarks"]');
        remarksCheckboxes.forEach(checkbox => {
            const checkboxValue = checkbox.value.toLowerCase();
            if (remarksLower.includes(checkboxValue) ||
                remarksLower.includes(checkboxValue.replace('complete full course', 'full course')) ||
                remarksLower.includes(checkboxValue.replace('not to lie down for 1 hour', 'upright')) ||
                remarksLower.includes(checkboxValue.replace('take with plenty of water', 'water'))) {
                checkbox.checked = true;
            }
        });
        
        // If remarks don't match predefined options, put in custom remarks
        const customRemarks = document.getElementById('customRemarks');
        const hasMatchingCheckbox = Array.from(remarksCheckboxes).some(cb => cb.checked);
        if (!hasMatchingCheckbox && data.remarks) {
            customRemarks.value = data.remarks;
        }
    }
    
    // Focus on dose field for user review
    document.getElementById('dose').focus();
}

// Create extracted medicines modal
function createExtractedMedicinesModal() {
    extractedMedicinesModal = document.createElement('div');
    extractedMedicinesModal.id = 'extractedMedicinesModal';
    extractedMedicinesModal.className = 'extracted-medicines-modal';
    extractedMedicinesModal.innerHTML = `
        <div class="extracted-modal-content">
            <div class="extracted-modal-header">
                <h2>Review Extracted Medicines</h2>
                <button class="extracted-modal-close" onclick="closeExtractedMedicinesModal()">&times;</button>
            </div>
            <div class="extracted-modal-body">
                <div class="warning-note">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 1.71 3h16.94a2 2 0 0 1.71-3L13.71 3.86a2 2 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <p><strong>Please carefully review the extracted data.</strong> Getting data from images is not recommended as it can make mistakes. Verify all information before adding to the patient's medicine list.</p>
                </div>
                <div class="extracted-medicines-list" id="extractedMedicinesList"></div>
            </div>
            <div class="extracted-modal-footer">
                <button class="btn btn-secondary" onclick="clearAllExtractedMedicines()">Clear All</button>
                <button class="btn btn-primary" onclick="submitAllExtractedMedicines()">Add All Medicines</button>
            </div>
        </div>
    `;
    document.body.appendChild(extractedMedicinesModal);
}

// Show extracted medicines modal
function showExtractedMedicinesModal(medicines) {
    if (!extractedMedicinesModal) {
        createExtractedMedicinesModal();
    }
    
    extractedMedicines = medicines;
    renderExtractedMedicines();
    
    extractedMedicinesModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close extracted medicines modal
function closeExtractedMedicinesModal() {
    if (extractedMedicinesModal) {
        extractedMedicinesModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Render extracted medicines in the modal
function renderExtractedMedicines() {
    const container = document.getElementById('extractedMedicinesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    extractedMedicines.forEach((med, index) => {
        const medicineCard = createMedicineCard(med, index);
        container.appendChild(medicineCard);
    });
}

// Create a medicine card for the modal
function createMedicineCard(med, index) {
    const card = document.createElement('div');
    card.className = 'extracted-medicine-card';
    card.dataset.index = index;
    
    // Process remarks for checkboxes and custom field
    const remarks = med.remarks || '';
    const remarksLower = remarks.toLowerCase();
    
    // Check if remarks match predefined options
    const hasCompleteCourse = remarksLower.includes('complete full course');
    const hasStayUpright = remarksLower.includes('not to lie down') || remarksLower.includes('stay upright');
    const hasTakeWithWater = remarksLower.includes('take with water') || remarksLower.includes('plenty of water');
    
    // Custom remarks (anything not matching predefined options)
    let customRemarks = remarks;
    if (hasCompleteCourse) {
        customRemarks = customRemarks.replace(/complete full course/gi, '').trim();
    }
    if (hasStayUpright) {
        customRemarks = customRemarks.replace(/not to lie down for 1 hour/gi, '').replace(/stay upright/gi, '').trim();
    }
    if (hasTakeWithWater) {
        customRemarks = customRemarks.replace(/take with plenty of water/gi, '').replace(/take with water/gi, '').trim();
    }
    // Clean up any remaining commas or extra spaces
    customRemarks = customRemarks.replace(/^,?\s*/, '').replace(/,?\s*$/, '').trim();
    
    card.innerHTML = `
        <div class="medicine-card-header">
            <span class="medicine-number">Medicine ${index + 1}</span>
            <button class="remove-medicine-btn" onclick="removeMedicineCard(${index})" title="Remove this medicine">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="medicine-card-body">
            <div class="form-group">
                <label>Medicine Name</label>
                <input type="text" class="extracted-field" data-field="medicineName" value="${med.medicineName || ''}" placeholder="Medicine name">
            </div>
            <div class="form-group">
                <label>Generic Name</label>
                <input type="text" class="extracted-field" data-field="genericName" value="${med.genericName || ''}" placeholder="Generic name">
            </div>
            <div class="form-group">
                <label>Dosage</label>
                <input type="text" class="extracted-field" data-field="dose" value="${med.dose || ''}" placeholder="e.g. 50mg">
            </div>
            <div class="form-group">
                <label>When to Take</label>
                <div class="timing-group">
                    <label class="timing-card">
                        <input type="checkbox" class="extracted-timing" data-field="timing" value="morning" ${med.timing && med.timing.includes('morning') ? 'checked' : ''}>
                        <div class="timing-content">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/></svg>
                            <span>Morning</span>
                        </div>
                    </label>
                    <label class="timing-card">
                        <input type="checkbox" class="extracted-timing" data-field="timing" value="noon" ${med.timing && med.timing.includes('noon') ? 'checked' : ''}>
                        <div class="timing-content">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/><path d="M16 12h2"/></svg>
                            <span>Noon</span>
                        </div>
                    </label>
                    <label class="timing-card">
                        <input type="checkbox" class="extracted-timing" data-field="timing" value="night" ${med.timing && med.timing.includes('night') ? 'checked' : ''}>
                        <div class="timing-content">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 01-2 1 21 12.79z"/></svg>
                            <span>Night</span>
                        </div>
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label>Frequency</label>
                <select class="extracted-field" data-field="frequency">
                    <option value="Daily" ${med.frequency === 'Daily' ? 'selected' : ''}>Daily</option>
                    <option value="per NEED" ${med.frequency === 'per NEED' ? 'selected' : ''}>As Needed</option>
                    <option value="Weekly" ${med.frequency === 'Weekly' ? 'selected' : ''}>Weekly</option>
                    <option value="Only Friday" ${med.frequency === 'Only Friday' ? 'selected' : ''}>Friday Only</option>
                    <option value="Except WED & THUR" ${med.frequency === 'Except WED & THUR' ? 'selected' : ''}>No Wed & Thu</option>
                </select>
            </div>
            <div class="form-group">
                <label>With Food</label>
                <div class="food-group">
                    <label class="food-toggle">
                        <input type="radio" class="extracted-food" data-field="foodTiming" value="BEFORE FOOD" ${med.foodTiming === 'BEFORE FOOD' ? 'checked' : ''}>
                        <div class="toggle-content">Before Food</div>
                    </label>
                    <label class="food-toggle">
                        <input type="radio" class="extracted-food" data-field="foodTiming" value="AFTER FOOD" ${med.foodTiming === 'AFTER FOOD' ? 'checked' : ''}>
                        <div class="toggle-content">After Food</div>
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label>Used For</label>
                <input type="text" class="extracted-field" data-field="usedFor" value="${med.usedFor || ''}" placeholder="e.g. Blood pressure">
            </div>
            <div class="form-group">
                <label>Instructions</label>
                <div class="remarks-group">
                    <label class="checkbox-label">
                        <input type="checkbox" class="extracted-remarks" data-field="remarks" value="Complete full course" ${hasCompleteCourse ? 'checked' : ''}>
                        <span>Complete full course</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="extracted-remarks" data-field="remarks" value="Not to lie down for 1 hour" ${hasStayUpright ? 'checked' : ''}>
                        <span>Stay upright 1 hour</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" class="extracted-remarks" data-field="remarks" value="Take with plenty of water" ${hasTakeWithWater ? 'checked' : ''}>
                        <span>Take with water</span>
                    </label>
                </div>
                <input type="text" class="extracted-field" data-field="customRemarks" value="${customRemarks || ''}" placeholder="Other instructions..." style="margin-top: 0.5rem;">
            </div>
        </div>
    `;
    
    return card;
}

// Remove a medicine card
function removeMedicineCard(index) {
    extractedMedicines.splice(index, 1);
    renderExtractedMedicines();
    
    // If no medicines left, close the modal
    if (extractedMedicines.length === 0) {
        closeExtractedMedicinesModal();
    }
}

// Clear all extracted medicines
function clearAllExtractedMedicines() {
    if (confirm('Are you sure you want to clear all extracted medicines?')) {
        extractedMedicines = [];
        closeExtractedMedicinesModal();
    }
}

// Submit all extracted medicines
async function submitAllExtractedMedicines() {
    // Gather all data from the modal
    const medicineCards = document.querySelectorAll('.extracted-medicine-card');
    const medicinesToAdd = [];
    
    medicineCards.forEach((card, cardIndex) => {
        const medicine = {};
        
        // Get medicine name
        const medicineName = card.querySelector('[data-field="medicineName"]').value;
        if (!medicineName.trim()) {
            alert(`Medicine ${cardIndex + 1} is missing a name. Please fill it in or remove it.`);
            return;
        }
        
        medicine.medicineName = medicineName;
        medicine.genericName = card.querySelector('[data-field="genericName"]').value;
        medicine.dose = card.querySelector('[data-field="dose"]').value;
        medicine.frequency = card.querySelector('[data-field="frequency"]').value;
        medicine.usedFor = card.querySelector('[data-field="usedFor"]').value;
        
        // Get food timing
        const foodRadios = card.querySelectorAll('.extracted-food');
        foodRadios.forEach(radio => {
            if (radio.checked) {
                medicine.foodTiming = radio.value;
            }
        });
        
        // Get timing checkboxes
        const timingCheckboxes = card.querySelectorAll('.extracted-timing:checked');
        medicine.timing = Array.from(timingCheckboxes).map(cb => cb.value);
        
        // Validate: At least one timing must be selected
        if (medicine.timing.length === 0) {
            alert(`Medicine ${cardIndex + 1} (${medicineName}): Please select at least one time (Morning/Noon/Night) to take the medicine.`);
            return;
        }
        
        // Get remarks
        const remarksCheckboxes = card.querySelectorAll('.extracted-remarks:checked');
        const selectedRemarks = Array.from(remarksCheckboxes).map(cb => cb.value);
        const customRemarks = card.querySelector('[data-field="customRemarks"]').value;
        
        if (selectedRemarks.length > 0) {
            medicine.remarks = selectedRemarks.join(', ');
        }
        if (customRemarks) {
            medicine.remarks = medicine.remarks ? medicine.remarks + ', ' + customRemarks : customRemarks;
        }
        
        medicinesToAdd.push(medicine);
    });
    
    if (medicinesToAdd.length === 0) {
        alert('No valid medicines to add.');
        return;
    }
    
    // Add each medicine to the main list (now async)
    let successCount = 0;
    let failCount = 0;
    
    for (const med of medicinesToAdd) {
        try {
            await addMedicineToList(med);
            successCount++;
        } catch (error) {
            console.error('Failed to add medicine:', med, error);
            failCount++;
        }
    }
    
    closeExtractedMedicinesModal();
    
    // Show success/failure message
    if (failCount > 0) {
        alert(`Added ${successCount} medicine(s) successfully. ${failCount} medicine(s) failed to add.`);
    } else {
        const message = `Successfully added ${successCount} medicine(s) to the list.`;
        console.log(message);
        showNotification(message, 'success');
    }
    
    // Optional: Scroll to the medicine list
    const medicineList = document.getElementById('medicineList');
    if (medicineList) {
        medicineList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Add medicine to the main list and save to backend
async function addMedicineToList(medicine) {
    // Convert timing array to schedule string (e.g., "1-0-0" for morning only)
    let morning = '0';
    let noon = '0';
    let night = '0';
    
    if (medicine.timing && medicine.timing.includes('morning')) morning = '1';
    if (medicine.timing && medicine.timing.includes('noon')) noon = '1';
    if (medicine.timing && medicine.timing.includes('night')) night = '1';
    
    const schedule = `${morning}-${noon}-${night}`;
    
    // Prepare medicine data for backend
    const medicineData = {
        medicine_name: medicine.medicineName || '',
        generic_name: medicine.genericName || '',
        dose: medicine.dose || '',
        instructions: medicine.remarks || '',
        cycle: medicine.frequency || 'Daily',
        schedule: schedule,
        with_food: medicine.foodTiming || 'AFTER FOOD',
        indication: medicine.usedFor || ''
    };
    
    // Save to backend
    const result = await saveToBackend(medicineData);
    
    if (result.success) {
        // Access the global medicines array from script.js
        if (typeof medicines !== 'undefined') {
            // Add to local state with backend-assigned ID
            const newMedicine = {
                id: result.medicine.id,
                medicineName: result.medicine.medicine_name,
                genericName: result.medicine.generic_name,
                dose: result.medicine.dose,
                timing: medicine.timing || [],
                frequency: medicine.frequency || 'Daily',
                foodTiming: medicine.foodTiming || 'AFTER FOOD',
                usedFor: medicine.usedFor || '',
                remarks: medicine.remarks ? [medicine.remarks] : [],
                createdAt: new Date().toISOString()
            };
            
            medicines.push(newMedicine);
            
            // Update the UI using the updateMedicineList function from script.js
            if (typeof updateMedicineList === 'function') {
                updateMedicineList();
            }
            
            // Update medicine count
            if (typeof updateMedicineCount === 'function') {
                updateMedicineCount();
            }
        }
    } else {
        console.error('Failed to save medicine to backend:', result.message);
        alert(`Failed to add medicine: ${result.message || 'Unknown error'}`);
    }
}

// Helper function to save medicine to backend (reused from script.js)
async function saveToBackend(medicineData) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add CSRF token if available
        const csrfToken = getCSRFToken();
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }
        
        const response = await fetch(`${API_BASE_URL}/medicines/add/`, {
            method: 'POST',
            headers: headers,
            credentials: 'include',
            body: JSON.stringify(medicineData)
        });
        
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
            console.error('User not authenticated or CSRF error');
            const data = await response.json();
            return { success: false, message: data.message || 'Not authenticated' };
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error saving medicine:', error);
        return { success: false, message: 'Network error' };
    }
}

// Helper function to get CSRF token from cookies
function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return decodeURIComponent(value);
        }
    }
    return null;
}

// Update medicine count (reusing existing logic)
function updateMedicineCount() {
    const medicineList = document.getElementById('medicineList');
    const countElement = document.getElementById('medicineCount');
    if (medicineList && countElement) {
        const count = medicineList.querySelectorAll('.medicine-item').length;
        countElement.textContent = count;
    }
}

// Show scanning overlay
function showScanningOverlay() {
    const overlay = document.getElementById('ocrScanningOverlay');
    overlay.style.display = 'flex';
}

// Hide scanning overlay
function hideScanningOverlay() {
    const overlay = document.getElementById('ocrScanningOverlay');
    overlay.style.display = 'none';
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (ocrModal && ocrModal.style.display === 'flex') {
            closeOCRModal();
        }
        if (extractedMedicinesModal && extractedMedicinesModal.style.display === 'flex') {
            closeExtractedMedicinesModal();
        }
    }
});

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    if (e.target === ocrModal && ocrModal.style.display === 'flex') {
        closeOCRModal();
    }
    if (e.target === extractedMedicinesModal && extractedMedicinesModal.style.display === 'flex') {
        closeExtractedMedicinesModal();
    }
});

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', initOCR);
