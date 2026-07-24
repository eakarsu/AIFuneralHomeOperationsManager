/* ============================================
   Eternal Haven Funeral Home - Operations Manager
   Complete SPA Application Logic (Vanilla JS)
   ============================================ */

(function () {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================

    const API_BASE = '/api';

    const FEATURES = {
        cases: {
            name: 'Case Management',
            endpoint: '/cases',
            tableColumns: [
                { key: 'case_number', label: 'Case #' },
                { key: 'deceased_name', label: 'Deceased Name' },
                { key: 'date_of_death', label: 'Date of Death', type: 'date' },
                { key: 'status', label: 'Status', type: 'badge' },
                { key: 'assigned_staff', label: 'Assigned Staff' }
            ],
            formFields: [
                { key: 'case_number', label: 'Case Number', type: 'text', required: true },
                { key: 'deceased_first_name', label: 'First Name', type: 'text', required: true },
                { key: 'deceased_last_name', label: 'Last Name', type: 'text', required: true },
                { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
                { key: 'date_of_death', label: 'Date of Death', type: 'date' },
                { key: 'cause_of_death', label: 'Cause of Death', type: 'text' },
                { key: 'next_of_kin_name', label: 'Next of Kin Name', type: 'text' },
                { key: 'next_of_kin_phone', label: 'Next of Kin Phone', type: 'text' },
                { key: 'next_of_kin_email', label: 'Next of Kin Email', type: 'email' },
                { key: 'next_of_kin_relationship', label: 'Relationship', type: 'text' },
                { key: 'assigned_staff', label: 'Assigned Staff', type: 'text' },
                { key: 'status', label: 'Status', type: 'select', options: ['active', 'completed', 'pending'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        services: {
            name: 'Service Planning',
            endpoint: '/services',
            tableColumns: [
                { key: 'service_type', label: 'Service Type', type: 'badge' },
                { key: 'service_date', label: 'Date', type: 'date' },
                { key: 'location', label: 'Location' },
                { key: 'status', label: 'Status', type: 'badge' },
                { key: 'total_cost', label: 'Cost', type: 'currency' }
            ],
            formFields: [
                { key: 'case_id', label: 'Case ID', type: 'number' },
                { key: 'service_type', label: 'Service Type', type: 'select', options: ['traditional_funeral', 'memorial', 'graveside', 'celebration_of_life', 'direct_burial', 'direct_cremation', 'viewing_only', 'military_honors'], required: true },
                { key: 'service_date', label: 'Service Date', type: 'date', required: true },
                { key: 'service_time', label: 'Service Time', type: 'text' },
                { key: 'location', label: 'Location', type: 'text' },
                { key: 'officiant', label: 'Officiant', type: 'text' },
                { key: 'music_selections', label: 'Music Selections', type: 'textarea' },
                { key: 'floral_arrangements', label: 'Floral Arrangements', type: 'textarea' },
                { key: 'estimated_attendees', label: 'Estimated Attendees', type: 'number' },
                { key: 'special_requests', label: 'Special Requests', type: 'textarea', fullWidth: true },
                { key: 'total_cost', label: 'Total Cost', type: 'number' },
                { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'completed', 'cancelled'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        compliance: {
            name: 'Regulatory Compliance',
            endpoint: '/compliance',
            tableColumns: [
                { key: 'state_code', label: 'State' },
                { key: 'requirement_name', label: 'Requirement' },
                { key: 'requirement_type', label: 'Type', type: 'badge' },
                { key: 'deadline', label: 'Deadline', type: 'date' },
                { key: 'is_active', label: 'Active', type: 'boolean' }
            ],
            formFields: [
                { key: 'state_code', label: 'State Code', type: 'text', required: true },
                { key: 'state_name', label: 'State Name', type: 'text', required: true },
                { key: 'requirement_type', label: 'Requirement Type', type: 'select', options: ['license', 'permit', 'regulation', 'reporting'] },
                { key: 'requirement_name', label: 'Requirement Name', type: 'text', required: true },
                { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
                { key: 'deadline_days', label: 'Deadline (Days)', type: 'number' },
                { key: 'penalty_amount', label: 'Penalty Amount', type: 'number' },
                { key: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'] },
                { key: 'last_reviewed', label: 'Last Reviewed', type: 'date' },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        pricing: {
            name: 'Pricing Management',
            endpoint: '/pricing',
            tableColumns: [
                { key: 'item_category', label: 'Category', type: 'badge' },
                { key: 'item_name', label: 'Item Name' },
                { key: 'price', label: 'Price', type: 'currency' },
                { key: 'is_required', label: 'Required', type: 'boolean' },
                { key: 'is_active', label: 'Active', type: 'boolean' }
            ],
            formFields: [
                { key: 'item_category', label: 'Category', type: 'select', options: ['professional_services', 'facilities', 'transportation', 'merchandise', 'cash_advances'], required: true },
                { key: 'item_name', label: 'Item Name', type: 'text', required: true },
                { key: 'item_description', label: 'Description', type: 'textarea', fullWidth: true },
                { key: 'unit_price', label: 'Price', type: 'number', required: true },
                { key: 'is_package', label: 'Is Package', type: 'select', options: ['true', 'false'] },
                { key: 'package_includes', label: 'Package Includes', type: 'textarea', fullWidth: true },
                { key: 'is_required', label: 'Required', type: 'select', options: ['true', 'false'] },
                { key: 'display_order', label: 'Display Order', type: 'number' },
                { key: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'] }
            ]
        },
        preneed: {
            name: 'Pre-Need Planning',
            endpoint: '/preneed',
            tableColumns: [
                { key: 'client_name', label: 'Client Name' },
                { key: 'plan_type', label: 'Plan Type', type: 'badge' },
                { key: 'payment_method', label: 'Payment' },
                { key: 'status', label: 'Status', type: 'badge' },
                { key: 'total_amount', label: 'Amount', type: 'currency' }
            ],
            formFields: [
                { key: 'plan_name', label: 'Plan Name', type: 'text', required: true },
                { key: 'client_first_name', label: 'First Name', type: 'text', required: true },
                { key: 'client_last_name', label: 'Last Name', type: 'text', required: true },
                { key: 'client_phone', label: 'Phone', type: 'text' },
                { key: 'client_email', label: 'Email', type: 'email' },
                { key: 'client_dob', label: 'Date of Birth', type: 'date' },
                { key: 'plan_type', label: 'Plan Type', type: 'select', options: ['basic', 'standard', 'premium', 'custom'], required: true },
                { key: 'payment_method', label: 'Payment Method', type: 'select', options: ['lump_sum', 'installment', 'insurance'] },
                { key: 'total_amount', label: 'Total Amount', type: 'number' },
                { key: 'amount_paid', label: 'Amount Paid', type: 'number' },
                { key: 'monthly_payment', label: 'Monthly Payment', type: 'number' },
                { key: 'service_preferences', label: 'Service Preferences', type: 'textarea', fullWidth: true },
                { key: 'merchandise_selections', label: 'Merchandise Selections', type: 'textarea', fullWidth: true },
                { key: 'special_instructions', label: 'Special Instructions', type: 'textarea', fullWidth: true },
                { key: 'status', label: 'Status', type: 'select', options: ['active', 'paid_in_full', 'cancelled', 'claimed'] }
            ]
        },
        atneed: {
            name: 'At-Need Services',
            endpoint: '/atneed',
            tableColumns: [
                { key: 'contact_name', label: 'Contact Name' },
                { key: 'urgency_level', label: 'Urgency', type: 'badge' },
                { key: 'received_date', label: 'Date', type: 'date' },
                { key: 'status', label: 'Status', type: 'badge' },
                { key: 'assigned_staff', label: 'Assigned' }
            ],
            formFields: [
                { key: 'case_id', label: 'Case ID', type: 'number' },
                { key: 'contact_first_name', label: 'Contact First Name', type: 'text', required: true },
                { key: 'contact_last_name', label: 'Contact Last Name', type: 'text', required: true },
                { key: 'contact_phone', label: 'Contact Phone', type: 'text' },
                { key: 'contact_email', label: 'Contact Email', type: 'email' },
                { key: 'contact_relationship', label: 'Relationship to Deceased', type: 'text' },
                { key: 'urgency_level', label: 'Urgency Level', type: 'select', options: ['immediate', 'standard', 'planned'], required: true },
                { key: 'initial_call_date', label: 'Initial Call Date', type: 'date' },
                { key: 'initial_call_time', label: 'Initial Call Time', type: 'text' },
                { key: 'location_of_death', label: 'Location of Death', type: 'text' },
                { key: 'removal_needed', label: 'Removal Needed', type: 'select', options: ['true', 'false'] },
                { key: 'removal_address', label: 'Removal Address', type: 'textarea' },
                { key: 'medical_examiner_required', label: 'Medical Examiner Required', type: 'select', options: ['true', 'false'] },
                { key: 'special_circumstances', label: 'Special Circumstances', type: 'textarea', fullWidth: true },
                { key: 'assigned_to', label: 'Assigned To', type: 'text' },
                { key: 'status', label: 'Status', type: 'select', options: ['new', 'in_progress', 'arrangements_made', 'completed'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        grief: {
            name: 'Grief Support',
            endpoint: '/grief-support',
            tableColumns: [
                { key: 'resource_name', label: 'Resource Name' },
                { key: 'resource_type', label: 'Type', type: 'badge' },
                { key: 'provider_name', label: 'Provider' },
                { key: 'cost', label: 'Cost', type: 'currency' },
                { key: 'is_active', label: 'Active', type: 'boolean' }
            ],
            formFields: [
                { key: 'resource_name', label: 'Resource Name', type: 'text', required: true },
                { key: 'resource_type', label: 'Resource Type', type: 'select', options: ['counselor', 'support_group', 'book', 'website', 'hotline', 'workshop'], required: true },
                { key: 'provider_name', label: 'Provider Name', type: 'text' },
                { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
                { key: 'contact_info', label: 'Contact Info', type: 'text' },
                { key: 'website_url', label: 'Website URL', type: 'text' },
                { key: 'availability', label: 'Availability', type: 'text' },
                { key: 'cost', label: 'Cost', type: 'number' },
                { key: 'is_free', label: 'Is Free', type: 'select', options: ['true', 'false'] },
                { key: 'specialization', label: 'Specialization', type: 'text' },
                { key: 'rating', label: 'Rating', type: 'number' },
                { key: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'] }
            ]
        },
        inventory: {
            name: 'Inventory Management',
            endpoint: '/inventory',
            tableColumns: [
                { key: 'item_name', label: 'Item' },
                { key: 'category', label: 'Category', type: 'badge' },
                { key: 'sku', label: 'SKU' },
                { key: 'quantity_on_hand', label: 'Qty' },
                { key: 'unit_price', label: 'Price', type: 'currency' }
            ],
            formFields: [
                { key: 'item_name', label: 'Item Name', type: 'text', required: true },
                { key: 'category', label: 'Category', type: 'select', options: ['caskets', 'urns', 'vaults', 'clothing', 'keepsakes', 'supplies', 'chemicals'], required: true },
                { key: 'sku', label: 'SKU', type: 'text' },
                { key: 'supplier', label: 'Supplier', type: 'text' },
                { key: 'quantity_on_hand', label: 'Quantity on Hand', type: 'number' },
                { key: 'reorder_level', label: 'Reorder Level', type: 'number' },
                { key: 'unit_cost', label: 'Unit Cost', type: 'number' },
                { key: 'retail_price', label: 'Retail Price', type: 'number' },
                { key: 'location_in_facility', label: 'Storage Location', type: 'text' },
                { key: 'last_restocked', label: 'Last Restocked', type: 'date' },
                { key: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        staff: {
            name: 'Staff Management',
            endpoint: '/staff',
            tableColumns: [
                { key: 'full_name', label: 'Name' },
                { key: 'role', label: 'Role', type: 'badge' },
                { key: 'license_number', label: 'License #' },
                { key: 'is_active', label: 'Status', type: 'boolean' },
                { key: 'hire_date', label: 'Hire Date', type: 'date' }
            ],
            formFields: [
                { key: 'first_name', label: 'First Name', type: 'text', required: true },
                { key: 'last_name', label: 'Last Name', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'Phone', type: 'text' },
                { key: 'role', label: 'Role', type: 'select', options: ['director', 'embalmer', 'attendant', 'driver', 'office_admin', 'grief_counselor'], required: true },
                { key: 'license_number', label: 'License Number', type: 'text' },
                { key: 'license_expiry', label: 'License Expiry', type: 'date' },
                { key: 'hire_date', label: 'Hire Date', type: 'date' },
                { key: 'hourly_rate', label: 'Hourly Rate', type: 'number' },
                { key: 'is_full_time', label: 'Full Time', type: 'select', options: ['true', 'false'] },
                { key: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'] },
                { key: 'certifications', label: 'Certifications', type: 'textarea', fullWidth: true },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        documents: {
            name: 'Document Management',
            endpoint: '/documents',
            tableColumns: [
                { key: 'document_name', label: 'Name' },
                { key: 'document_type', label: 'Type', type: 'badge' },
                { key: 'case_id', label: 'Case #' },
                { key: 'status', label: 'Status', type: 'badge' },
                { key: 'created_at', label: 'Date', type: 'date' }
            ],
            formFields: [
                { key: 'case_id', label: 'Case ID', type: 'number' },
                { key: 'document_type', label: 'Document Type', type: 'select', options: ['death_certificate', 'burial_permit', 'cremation_authorization', 'embalming_authorization', 'general_price_list', 'contract', 'insurance_claim', 'obituary', 'veteran_discharge'], required: true },
                { key: 'document_name', label: 'Document Name', type: 'text', required: true },
                { key: 'file_path', label: 'File Path', type: 'text' },
                { key: 'issued_by', label: 'Issued By', type: 'text' },
                { key: 'issued_date', label: 'Issued Date', type: 'date' },
                { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
                { key: 'status', label: 'Status', type: 'select', options: ['draft', 'pending', 'approved', 'filed', 'expired'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        cremation: {
            name: 'Cremation Services',
            endpoint: '/cremation',
            tableColumns: [
                { key: 'cremation_number', label: 'Cremation #' },
                { key: 'case_id', label: 'Case' },
                { key: 'scheduled_date', label: 'Scheduled', type: 'date' },
                { key: 'status', label: 'Status', type: 'badge' },
                { key: 'disposition_method', label: 'Method', type: 'badge' }
            ],
            formFields: [
                { key: 'cremation_number', label: 'Cremation Number', type: 'text' },
                { key: 'case_id', label: 'Case ID', type: 'number', required: true },
                { key: 'authorization_received', label: 'Authorization Received', type: 'select', options: ['true', 'false'] },
                { key: 'authorization_date', label: 'Authorization Date', type: 'date' },
                { key: 'medical_examiner_approval', label: 'Medical Examiner Approval', type: 'select', options: ['true', 'false'] },
                { key: 'pacemaker_check', label: 'Pacemaker Check', type: 'select', options: ['true', 'false'] },
                { key: 'pacemaker_removed', label: 'Pacemaker Removed', type: 'select', options: ['true', 'false'] },
                { key: 'scheduled_date', label: 'Scheduled Date', type: 'date' },
                { key: 'scheduled_time', label: 'Scheduled Time', type: 'text' },
                { key: 'crematory_name', label: 'Crematory Name', type: 'text' },
                { key: 'operator_name', label: 'Operator Name', type: 'text' },
                { key: 'temperature', label: 'Temperature', type: 'number' },
                { key: 'duration_minutes', label: 'Duration (Minutes)', type: 'number' },
                { key: 'disposition_method', label: 'Disposition Method', type: 'select', options: ['family_pickup', 'mailing', 'scattering', 'interment', 'columbarium'] },
                { key: 'disposition_date', label: 'Disposition Date', type: 'date' },
                { key: 'status', label: 'Status', type: 'select', options: ['pending', 'authorized', 'scheduled', 'in_progress', 'completed', 'delivered'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        fleet: {
            name: 'Fleet Management',
            endpoint: '/fleet',
            tableColumns: [
                { key: 'vehicle_name', label: 'Vehicle' },
                { key: 'vehicle_type', label: 'Type', type: 'badge' },
                { key: 'license_plate', label: 'Plate' },
                { key: 'mileage', label: 'Mileage' },
                { key: 'status', label: 'Status', type: 'badge' }
            ],
            formFields: [
                { key: 'vehicle_name', label: 'Vehicle Name', type: 'text', required: true },
                { key: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: ['hearse', 'limousine', 'flower_car', 'utility_van', 'removal_van', 'family_car'], required: true },
                { key: 'make', label: 'Make', type: 'text' },
                { key: 'model', label: 'Model', type: 'text' },
                { key: 'year', label: 'Year', type: 'number' },
                { key: 'color', label: 'Color', type: 'text' },
                { key: 'vin', label: 'VIN', type: 'text' },
                { key: 'license_plate', label: 'License Plate', type: 'text' },
                { key: 'mileage', label: 'Mileage', type: 'number' },
                { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['gasoline', 'diesel', 'electric', 'hybrid'] },
                { key: 'insurance_expiry', label: 'Insurance Expiry', type: 'date' },
                { key: 'daily_rate', label: 'Daily Rate', type: 'number' },
                { key: 'last_service_date', label: 'Last Service Date', type: 'date' },
                { key: 'next_service_date', label: 'Next Service Date', type: 'date' },
                { key: 'status', label: 'Status', type: 'select', options: ['available', 'in_use', 'maintenance', 'retired'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        memorial: {
            name: 'Memorial Products',
            endpoint: '/memorial-products',
            tableColumns: [
                { key: 'product_name', label: 'Product' },
                { key: 'category', label: 'Category', type: 'badge' },
                { key: 'price', label: 'Price', type: 'currency' },
                { key: 'quantity_available', label: 'Qty' },
                { key: 'is_active', label: 'Active', type: 'boolean' }
            ],
            formFields: [
                { key: 'product_name', label: 'Product Name', type: 'text', required: true },
                { key: 'category', label: 'Category', type: 'select', options: ['flowers', 'programs', 'register_books', 'prayer_cards', 'candles', 'photo_displays', 'video_tribute', 'jewelry', 'clothing'], required: true },
                { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
                { key: 'supplier', label: 'Supplier', type: 'text' },
                { key: 'unit_cost', label: 'Cost', type: 'number' },
                { key: 'retail_price', label: 'Retail Price', type: 'number' },
                { key: 'quantity_available', label: 'Quantity Available', type: 'number' },
                { key: 'lead_time_days', label: 'Lead Time (Days)', type: 'number' },
                { key: 'image_url', label: 'Image URL', type: 'text' },
                { key: 'customizable', label: 'Customizable', type: 'select', options: ['true', 'false'] },
                { key: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'] }
            ]
        },
        obituaries: {
            name: 'Obituary Management',
            endpoint: '/obituaries',
            tableColumns: [
                { key: 'deceased_name', label: 'Deceased' },
                { key: 'status', label: 'Status', type: 'badge' },
                { key: 'publish_date', label: 'Publish Date', type: 'date' },
                { key: 'ai_generated', label: 'AI Generated', type: 'boolean' }
            ],
            formFields: [
                { key: 'case_id', label: 'Case ID', type: 'number' },
                { key: 'deceased_name', label: 'Deceased Name', type: 'text', required: true },
                { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
                { key: 'date_of_death', label: 'Date of Death', type: 'date' },
                { key: 'city', label: 'City', type: 'text' },
                { key: 'state', label: 'State', type: 'text' },
                { key: 'content', label: 'Obituary Content', type: 'textarea', fullWidth: true },
                { key: 'survived_by', label: 'Survived By', type: 'textarea', fullWidth: true },
                { key: 'predeceased_by', label: 'Predeceased By', type: 'textarea', fullWidth: true },
                { key: 'education', label: 'Education', type: 'textarea' },
                { key: 'career', label: 'Career', type: 'textarea' },
                { key: 'hobbies', label: 'Hobbies/Interests', type: 'textarea' },
                { key: 'charitable_donations', label: 'Charitable Donations', type: 'textarea' },
                { key: 'service_info', label: 'Service Information', type: 'textarea', fullWidth: true },
                { key: 'publication_outlets', label: 'Publication Outlets', type: 'textarea' },
                { key: 'publish_date', label: 'Publish Date', type: 'date' },
                { key: 'status', label: 'Status', type: 'select', options: ['draft', 'review', 'approved', 'published'] },
                { key: 'ai_generated', label: 'AI Generated', type: 'select', options: ['true', 'false'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        embalming: {
            name: 'Embalming Records',
            endpoint: '/embalming',
            tableColumns: [
                { key: 'case_id', label: 'Case' },
                { key: 'embalmer_name', label: 'Embalmer' },
                { key: 'embalming_date', label: 'Date', type: 'date' },
                { key: 'status', label: 'Status', type: 'badge' },
                { key: 'family_viewed', label: 'Viewed', type: 'boolean' }
            ],
            formFields: [
                { key: 'case_id', label: 'Case ID', type: 'number', required: true },
                { key: 'embalmer_name', label: 'Embalmer Name', type: 'text', required: true },
                { key: 'embalming_date', label: 'Embalming Date', type: 'date' },
                { key: 'embalming_time', label: 'Embalming Time', type: 'text' },
                { key: 'chemicals_used', label: 'Chemicals Used', type: 'textarea', fullWidth: true },
                { key: 'procedure_notes', label: 'Procedure Notes', type: 'textarea', fullWidth: true },
                { key: 'arterial_solution', label: 'Arterial Solution', type: 'text' },
                { key: 'cavity_treatment', label: 'Cavity Treatment', type: 'text' },
                { key: 'cosmetic_work', label: 'Cosmetic Work', type: 'textarea', fullWidth: true },
                { key: 'restoration_needed', label: 'Restoration Needed', type: 'select', options: ['true', 'false'] },
                { key: 'restoration_notes', label: 'Restoration Notes', type: 'textarea', fullWidth: true },
                { key: 'condition_on_receipt', label: 'Condition on Receipt', type: 'text' },
                { key: 'refrigeration_date', label: 'Refrigeration Date', type: 'date' },
                { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in_progress', 'completed', 'declined'] },
                { key: 'family_viewed', label: 'Family Viewed', type: 'select', options: ['true', 'false'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        cemetery: {
            name: 'Cemetery Plots',
            endpoint: '/cemetery-plots',
            tableColumns: [
                { key: 'cemetery_name', label: 'Cemetery' },
                { key: 'plot_info', label: 'Section/Plot' },
                { key: 'plot_type', label: 'Type', type: 'badge' },
                { key: 'owner_name', label: 'Owner' },
                { key: 'status', label: 'Status', type: 'badge' }
            ],
            formFields: [
                { key: 'cemetery_name', label: 'Cemetery Name', type: 'text', required: true },
                { key: 'cemetery_address', label: 'Cemetery Address', type: 'textarea' },
                { key: 'section', label: 'Section', type: 'text' },
                { key: 'lot_number', label: 'Lot Number', type: 'text' },
                { key: 'plot_number', label: 'Plot Number', type: 'text' },
                { key: 'plot_type', label: 'Plot Type', type: 'select', options: ['single', 'double', 'family', 'mausoleum', 'columbarium_niche', 'green_burial'] },
                { key: 'owner_name', label: 'Owner Name', type: 'text' },
                { key: 'owner_phone', label: 'Owner Phone', type: 'text' },
                { key: 'owner_email', label: 'Owner Email', type: 'email' },
                { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
                { key: 'purchase_price', label: 'Purchase Price', type: 'number' },
                { key: 'is_occupied', label: 'Occupied', type: 'select', options: ['true', 'false'] },
                { key: 'case_id', label: 'Case ID', type: 'number' },
                { key: 'interment_date', label: 'Interment Date', type: 'date' },
                { key: 'status', label: 'Status', type: 'select', options: ['available', 'reserved', 'occupied', 'maintenance'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        insurance: {
            name: 'Insurance Claims',
            endpoint: '/insurance-claims',
            tableColumns: [
                { key: 'insurance_company', label: 'Company' },
                { key: 'policy_number', label: 'Policy #' },
                { key: 'claim_amount', label: 'Claim Amount', type: 'currency' },
                { key: 'claim_status', label: 'Status', type: 'badge' },
                { key: 'submission_date', label: 'Date', type: 'date' }
            ],
            formFields: [
                { key: 'case_id', label: 'Case ID', type: 'number' },
                { key: 'policy_number', label: 'Policy Number', type: 'text' },
                { key: 'insurance_company', label: 'Insurance Company', type: 'text', required: true },
                { key: 'policy_holder_name', label: 'Policy Holder', type: 'text' },
                { key: 'beneficiary_name', label: 'Beneficiary', type: 'text' },
                { key: 'claim_amount', label: 'Claim Amount', type: 'number' },
                { key: 'approved_amount', label: 'Approved Amount', type: 'number' },
                { key: 'claim_status', label: 'Status', type: 'select', options: ['pending', 'submitted', 'under_review', 'approved', 'denied', 'paid', 'appealed'] },
                { key: 'submission_date', label: 'Submission Date', type: 'date' },
                { key: 'approval_date', label: 'Approval Date', type: 'date' },
                { key: 'payment_date', label: 'Payment Date', type: 'date' },
                { key: 'agent_name', label: 'Agent Name', type: 'text' },
                { key: 'agent_phone', label: 'Agent Phone', type: 'text' },
                { key: 'denial_reason', label: 'Denial Reason', type: 'textarea', fullWidth: true },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        vendors: {
            name: 'Vendor Management',
            endpoint: '/vendors',
            tableColumns: [
                { key: 'vendor_name', label: 'Vendor' },
                { key: 'vendor_type', label: 'Type', type: 'badge' },
                { key: 'contact_name', label: 'Contact' },
                { key: 'rating', label: 'Rating' },
                { key: 'is_active', label: 'Active', type: 'boolean' }
            ],
            formFields: [
                { key: 'vendor_name', label: 'Vendor Name', type: 'text', required: true },
                { key: 'vendor_type', label: 'Vendor Type', type: 'select', options: ['florist', 'caterer', 'musician', 'clergy', 'monument', 'vault_company', 'casket_supplier', 'urn_supplier', 'printing', 'livery', 'cemetery', 'other'], required: true },
                { key: 'contact_name', label: 'Contact Name', type: 'text' },
                { key: 'phone', label: 'Phone', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'address', label: 'Address', type: 'textarea' },
                { key: 'website', label: 'Website', type: 'text' },
                { key: 'tax_id', label: 'Tax ID', type: 'text' },
                { key: 'payment_terms', label: 'Payment Terms', type: 'text' },
                { key: 'rating', label: 'Rating (1-5)', type: 'number' },
                { key: 'is_preferred', label: 'Preferred Vendor', type: 'select', options: ['true', 'false'] },
                { key: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'] },
                { key: 'contract_expiry', label: 'Contract Expiry', type: 'date' },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        appointments: {
            name: 'Appointments',
            endpoint: '/appointments',
            tableColumns: [
                { key: 'title', label: 'Title' },
                { key: 'appointment_type', label: 'Type', type: 'badge' },
                { key: 'appointment_date', label: 'Date', type: 'date' },
                { key: 'client_name', label: 'Client' },
                { key: 'status', label: 'Status', type: 'badge' }
            ],
            formFields: [
                { key: 'appointment_type', label: 'Type', type: 'select', options: ['arrangement_conference', 'viewing', 'visitation', 'consultation', 'preneed_meeting', 'pickup', 'delivery', 'other'], required: true },
                { key: 'title', label: 'Title', type: 'text', required: true },
                { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
                { key: 'case_id', label: 'Case ID', type: 'number' },
                { key: 'client_name', label: 'Client Name', type: 'text' },
                { key: 'client_phone', label: 'Client Phone', type: 'text' },
                { key: 'client_email', label: 'Client Email', type: 'email' },
                { key: 'assigned_staff', label: 'Assigned Staff', type: 'text' },
                { key: 'appointment_date', label: 'Date', type: 'date', required: true },
                { key: 'start_time', label: 'Start Time', type: 'text' },
                { key: 'end_time', label: 'End Time', type: 'text' },
                { key: 'location', label: 'Location', type: 'text' },
                { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'] },
                { key: 'reminder_sent', label: 'Reminder Sent', type: 'select', options: ['true', 'false'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        financial: {
            name: 'Financial Records',
            endpoint: '/financial-records',
            tableColumns: [
                { key: 'transaction_type', label: 'Type', type: 'badge' },
                { key: 'description', label: 'Description' },
                { key: 'amount', label: 'Amount', type: 'currency' },
                { key: 'is_paid', label: 'Paid', type: 'boolean' },
                { key: 'transaction_date', label: 'Date', type: 'date' }
            ],
            formFields: [
                { key: 'case_id', label: 'Case ID', type: 'number' },
                { key: 'transaction_type', label: 'Transaction Type', type: 'select', options: ['invoice', 'payment', 'refund', 'expense', 'deposit', 'adjustment'], required: true },
                { key: 'category', label: 'Category', type: 'text' },
                { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
                { key: 'amount', label: 'Amount', type: 'number', required: true },
                { key: 'payment_method', label: 'Payment Method', type: 'select', options: ['cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'insurance', 'financing', 'other'] },
                { key: 'reference_number', label: 'Reference Number', type: 'text' },
                { key: 'payer_name', label: 'Payer Name', type: 'text' },
                { key: 'transaction_date', label: 'Transaction Date', type: 'date', required: true },
                { key: 'due_date', label: 'Due Date', type: 'date' },
                { key: 'is_paid', label: 'Is Paid', type: 'select', options: ['true', 'false'] },
                { key: 'paid_date', label: 'Paid Date', type: 'date' },
                { key: 'receipt_number', label: 'Receipt Number', type: 'text' },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        communications: {
            name: 'Communications',
            endpoint: '/communications',
            tableColumns: [
                { key: 'contact_name', label: 'Contact' },
                { key: 'communication_type', label: 'Type', type: 'badge' },
                { key: 'subject', label: 'Subject' },
                { key: 'direction', label: 'Direction', type: 'badge' },
                { key: 'communication_date', label: 'Date', type: 'date' }
            ],
            formFields: [
                { key: 'case_id', label: 'Case ID', type: 'number' },
                { key: 'communication_type', label: 'Type', type: 'select', options: ['phone_call', 'email', 'in_person', 'letter', 'text_message', 'video_call'], required: true },
                { key: 'direction', label: 'Direction', type: 'select', options: ['inbound', 'outbound'] },
                { key: 'contact_name', label: 'Contact Name', type: 'text', required: true },
                { key: 'contact_phone', label: 'Contact Phone', type: 'text' },
                { key: 'contact_email', label: 'Contact Email', type: 'email' },
                { key: 'subject', label: 'Subject', type: 'text' },
                { key: 'content', label: 'Content', type: 'textarea', fullWidth: true },
                { key: 'staff_member', label: 'Staff Member', type: 'text' },
                { key: 'communication_date', label: 'Date', type: 'date', required: true },
                { key: 'communication_time', label: 'Time', type: 'text' },
                { key: 'follow_up_needed', label: 'Follow-up Needed', type: 'select', options: ['true', 'false'] },
                { key: 'follow_up_date', label: 'Follow-up Date', type: 'date' },
                { key: 'follow_up_completed', label: 'Follow-up Completed', type: 'select', options: ['true', 'false'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        flowers: {
            name: 'Flower Orders',
            endpoint: '/flower-orders',
            tableColumns: [
                { key: 'sender_name', label: 'Sender' },
                { key: 'arrangement_type', label: 'Type', type: 'badge' },
                { key: 'florist_name', label: 'Florist' },
                { key: 'delivery_date', label: 'Delivery', type: 'date' },
                { key: 'is_received', label: 'Received', type: 'boolean' }
            ],
            formFields: [
                { key: 'case_id', label: 'Case ID', type: 'number', required: true },
                { key: 'sender_name', label: 'Sender Name', type: 'text', required: true },
                { key: 'sender_phone', label: 'Sender Phone', type: 'text' },
                { key: 'sender_relationship', label: 'Relationship', type: 'text' },
                { key: 'florist_name', label: 'Florist Name', type: 'text' },
                { key: 'arrangement_type', label: 'Arrangement Type', type: 'select', options: ['casket_spray', 'standing_spray', 'wreath', 'bouquet', 'basket', 'plant', 'cross', 'heart', 'custom'] },
                { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
                { key: 'ribbon_message', label: 'Ribbon Message', type: 'text' },
                { key: 'delivery_date', label: 'Delivery Date', type: 'date' },
                { key: 'delivery_time', label: 'Delivery Time', type: 'text' },
                { key: 'delivery_location', label: 'Delivery Location', type: 'text' },
                { key: 'price', label: 'Price', type: 'number' },
                { key: 'is_received', label: 'Received', type: 'select', options: ['true', 'false'] },
                { key: 'display_location', label: 'Display Location', type: 'text' },
                { key: 'thank_you_sent', label: 'Thank You Sent', type: 'select', options: ['true', 'false'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        facility: {
            name: 'Facility Rooms',
            endpoint: '/facility-rooms',
            tableColumns: [
                { key: 'room_name', label: 'Room' },
                { key: 'room_type', label: 'Type', type: 'badge' },
                { key: 'capacity', label: 'Capacity' },
                { key: 'hourly_rate', label: 'Rate', type: 'currency' },
                { key: 'booking_status', label: 'Status', type: 'badge' }
            ],
            formFields: [
                { key: 'room_name', label: 'Room Name', type: 'text', required: true },
                { key: 'room_type', label: 'Room Type', type: 'select', options: ['chapel', 'viewing_room', 'arrangement_office', 'preparation_room', 'reception_hall', 'lounge', 'storage', 'parking'], required: true },
                { key: 'capacity', label: 'Capacity', type: 'number' },
                { key: 'floor_level', label: 'Floor Level', type: 'text' },
                { key: 'has_av_equipment', label: 'AV Equipment', type: 'select', options: ['true', 'false'] },
                { key: 'has_wheelchair_access', label: 'Wheelchair Access', type: 'select', options: ['true', 'false'] },
                { key: 'hourly_rate', label: 'Hourly Rate', type: 'number' },
                { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
                { key: 'amenities', label: 'Amenities', type: 'textarea', fullWidth: true },
                { key: 'case_id', label: 'Case ID (Booking)', type: 'number' },
                { key: 'booking_date', label: 'Booking Date', type: 'date' },
                { key: 'start_time', label: 'Start Time', type: 'text' },
                { key: 'end_time', label: 'End Time', type: 'text' },
                { key: 'booking_status', label: 'Status', type: 'select', options: ['available', 'reserved', 'occupied', 'maintenance', 'closed'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        },
        aftercare: {
            name: 'Aftercare Program',
            endpoint: '/aftercare',
            tableColumns: [
                { key: 'family_contact_name', label: 'Contact' },
                { key: 'program_type', label: 'Program', type: 'badge' },
                { key: 'scheduled_date', label: 'Scheduled', type: 'date' },
                { key: 'assigned_staff', label: 'Staff' },
                { key: 'status', label: 'Status', type: 'badge' }
            ],
            formFields: [
                { key: 'case_id', label: 'Case ID', type: 'number', required: true },
                { key: 'family_contact_name', label: 'Family Contact Name', type: 'text', required: true },
                { key: 'family_phone', label: 'Phone', type: 'text' },
                { key: 'family_email', label: 'Email', type: 'email' },
                { key: 'relationship', label: 'Relationship', type: 'text' },
                { key: 'program_type', label: 'Program Type', type: 'select', options: ['phone_follow_up', 'home_visit', 'grief_package', 'anniversary_card', 'holiday_remembrance', 'support_group_referral', 'memorial_event'], required: true },
                { key: 'scheduled_date', label: 'Scheduled Date', type: 'date' },
                { key: 'completed_date', label: 'Completed Date', type: 'date' },
                { key: 'assigned_staff', label: 'Assigned Staff', type: 'text' },
                { key: 'content_notes', label: 'Content Notes', type: 'textarea', fullWidth: true },
                { key: 'family_feedback', label: 'Family Feedback', type: 'textarea', fullWidth: true },
                { key: 'emotional_status', label: 'Emotional Status', type: 'text' },
                { key: 'referrals_made', label: 'Referrals Made', type: 'textarea' },
                { key: 'next_contact_date', label: 'Next Contact Date', type: 'date' },
                { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'completed', 'cancelled', 'overdue', 'declined'] },
                { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true }
            ]
        }
    };

    // ==========================================
    // STATE
    // ==========================================

    let state = {
        token: localStorage.getItem('eh_token') || null,
        user: null,
        currentFeature: 'dashboard',
        currentData: {},
        currentRecord: null,
        currentAction: null, // 'add' or 'edit'
        selectedAiAction: null,
        pagination: {} // keyed by feature: { page, limit, total, totalPages }
    };

    // ==========================================
    // API HELPER
    // ==========================================

    async function api(method, path, body) {
        const headers = { 'Content-Type': 'application/json' };
        if (state.token) {
            headers['Authorization'] = 'Bearer ' + state.token;
        }
        const opts = { method, headers };
        if (body && (method === 'POST' || method === 'PUT')) {
            opts.body = JSON.stringify(body);
        }
        try {
            const res = await fetch(API_BASE + path, opts);
            if (res.status === 401) {
                logout();
                throw new Error('Session expired. Please log in again.');
            }
            if (res.status === 429) {
                showToast('AI rate limit reached. Please wait before making more AI requests.', 'warning');
                throw new Error('AI rate limit reached. Please wait before making more AI requests.');
            }
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }
            return data;
        } catch (err) {
            if (err.message === 'Session expired. Please log in again.') throw err;
            throw err;
        }
    }

    // Returns the role from the current JWT without verifying (client-side check only)
    function getUserRole() {
        if (state.user && state.user.role) return state.user.role;
        if (!state.token) return null;
        try {
            var parts = state.token.split('.');
            if (parts.length !== 3) return null;
            var payload = JSON.parse(atob(parts[1]));
            return payload.role || null;
        } catch (e) {
            return null;
        }
    }

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================

    function showToast(message, type) {
        type = type || 'info';
        var container = document.getElementById('toast-container');
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(function () {
            toast.classList.add('toast-exit');
            setTimeout(function () { toast.remove(); }, 300);
        }, 3500);
    }

    // ==========================================
    // LOADING
    // ==========================================

    function showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    function hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    // ==========================================
    // AUTH
    // ==========================================

    function initAuth() {
        var loginForm = document.getElementById('login-form');
        var demoBtn = document.getElementById('demo-login-btn');
        var logoutBtn = document.getElementById('logout-btn');

        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = document.getElementById('login-email').value;
            var password = document.getElementById('login-password').value;
            doLogin(email, password);
        });

        demoBtn.addEventListener('click', function () {
            var credentials = window.DEMO_CREDENTIALS;
            if (!credentials) {
                toast('Demo credentials are unavailable.', 'error');
                return;
            }
            document.getElementById('login-email').value = credentials.email;
            document.getElementById('login-password').value = credentials.password;
            doLogin(credentials.email, credentials.password);
        });

        logoutBtn.addEventListener('click', logout);

        // Check for existing session
        if (state.token) {
            showApp();
        }
    }

    async function doLogin(email, password) {
        showLoading();
        try {
            var data = await api('POST', '/auth/login', { email: email, password: password });
            state.token = data.token;
            state.user = data.user;
            localStorage.setItem('eh_token', data.token);
            if (data.user && data.user.name) {
                document.getElementById('user-info').textContent = data.user.name;
            }
            showApp();
            showToast('Welcome to Eternal Haven', 'success');
        } catch (err) {
            showToast(err.message || 'Login failed', 'error');
        } finally {
            hideLoading();
        }
    }

    function logout() {
        state.token = null;
        state.user = null;
        localStorage.removeItem('eh_token');
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
    }

    function showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        navigateTo('dashboard');
        loadDashboardCounts();
    }

    // ==========================================
    // NAVIGATION
    // ==========================================

    function initNavigation() {
        // Sidebar items
        document.querySelectorAll('.sidebar-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var feature = this.getAttribute('data-feature');
                navigateTo(feature);
            });
        });

        // Dashboard cards
        document.querySelectorAll('.dashboard-card').forEach(function (card) {
            card.addEventListener('click', function () {
                var feature = this.getAttribute('data-feature');
                navigateTo(feature);
            });
        });

        // Sidebar toggle (mobile)
        document.getElementById('sidebar-toggle').addEventListener('click', function () {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Close sidebar on content click (mobile)
        document.getElementById('main-content').addEventListener('click', function () {
            document.getElementById('sidebar').classList.remove('open');
        });
    }

    function navigateTo(feature) {
        state.currentFeature = feature;

        // Update sidebar active state
        document.querySelectorAll('.sidebar-item').forEach(function (item) {
            item.classList.toggle('active', item.getAttribute('data-feature') === feature);
        });

        // Update views
        document.querySelectorAll('.view').forEach(function (view) {
            view.classList.remove('active');
        });
        var viewEl = document.getElementById('view-' + feature);
        if (viewEl) {
            viewEl.classList.add('active');
        }

        // Load data based on feature type
        if (feature === 'alerts') {
            loadAlerts();
        } else if (feature === 'calendar') {
            loadCalendar();
        } else if (feature === 'pipeline') {
            loadPipeline();
        } else if (feature === 'reports') {
            loadFinancialReport();
        } else if (feature !== 'dashboard' && feature !== 'ai' && FEATURES[feature]) {
            loadFeatureData(feature);
        }
    }

    // ==========================================
    // DASHBOARD
    // ==========================================

    async function loadDashboardCounts() {
        // Load KPIs
        loadDashboardKPIs();
        // Load upcoming events
        loadDashboardUpcomingEvents();

        var featureKeys = Object.keys(FEATURES);
        for (var i = 0; i < featureKeys.length; i++) {
            var key = featureKeys[i];
            var countEl = document.getElementById('count-' + key);
            if (countEl) {
                try {
                    var data = await api('GET', FEATURES[key].endpoint + '?page=1&limit=1');
                    var total = data && data.pagination ? data.pagination.total : (Array.isArray(data) ? data.length : (data.data ? data.data.length : 0));
                    countEl.textContent = total + ' records';
                } catch (e) {
                    countEl.textContent = '--';
                }
            }
        }
    }

    async function loadDashboardKPIs() {
        try {
            var stats = await api('GET', '/dashboard/stats');
            document.getElementById('kpi-active-cases').textContent = stats.active_cases;
            document.getElementById('kpi-monthly-revenue').textContent = '$' + stats.monthly_revenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            document.getElementById('kpi-unpaid').textContent = '$' + stats.unpaid_invoices.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            document.getElementById('kpi-appointments').textContent = stats.pending_appointments;
            document.getElementById('kpi-staff').textContent = stats.active_staff;

            // Load alerts count
            var alerts = await api('GET', '/alerts');
            document.getElementById('kpi-alerts-count').textContent = alerts.length;
        } catch (e) {
            console.error('KPI load error:', e);
        }
    }

    async function loadDashboardUpcomingEvents() {
        try {
            var today = new Date();
            var start = today.toISOString().split('T')[0];
            var endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 14);
            var end = endDate.toISOString().split('T')[0];

            var events = await api('GET', '/calendar/events?start=' + start + '&end=' + end);
            var container = document.getElementById('dashboard-upcoming-events');

            if (!events || events.length === 0) {
                container.innerHTML = '<p class="text-muted" style="padding:20px;text-align:center;">No upcoming events in the next 14 days</p>';
                return;
            }

            var html = '';
            var shown = events.slice(0, 8);
            shown.forEach(function (ev) {
                var d = new Date(ev.date);
                var day = d.getDate();
                var month = d.toLocaleString('en-US', { month: 'short' });
                var timeStr = ev.start_time ? ' at ' + ev.start_time : '';
                html += '<div class="event-row">';
                html += '<div class="event-date-badge"><span class="day">' + day + '</span><span class="month">' + month + '</span></div>';
                html += '<span class="event-type-dot ' + ev.type + '"></span>';
                html += '<div class="event-info"><div class="event-title">' + escapeHtml(ev.title) + '</div>';
                html += '<div class="event-detail">' + escapeHtml(formatValue(ev.type)) + timeStr + (ev.location ? ' - ' + escapeHtml(ev.location) : '') + '</div></div>';
                if (ev.status) html += '<span class="badge badge-' + ev.status + '">' + formatValue(ev.status) + '</span>';
                html += '</div>';
            });
            container.innerHTML = html;
        } catch (e) {
            console.error('Upcoming events error:', e);
            document.getElementById('dashboard-upcoming-events').innerHTML = '<p class="text-muted">Unable to load events</p>';
        }
    }

    // ==========================================
    // ALERTS CENTER
    // ==========================================

    async function loadAlerts() {
        try {
            var alerts = await api('GET', '/alerts');
            var listEl = document.getElementById('alerts-list');
            var summaryEl = document.getElementById('alerts-summary');

            // Summary counts
            var dangerCount = alerts.filter(function(a) { return a.type === 'danger'; }).length;
            var warningCount = alerts.filter(function(a) { return a.type === 'warning'; }).length;
            var infoCount = alerts.filter(function(a) { return a.type === 'info'; }).length;

            summaryEl.innerHTML =
                '<div class="alert-summary-card danger"><div class="count">' + dangerCount + '</div><div class="label">Critical</div></div>' +
                '<div class="alert-summary-card warning"><div class="count">' + warningCount + '</div><div class="label">Warnings</div></div>' +
                '<div class="alert-summary-card info"><div class="count">' + infoCount + '</div><div class="label">Info</div></div>';

            if (alerts.length === 0) {
                listEl.innerHTML = '<p class="text-muted" style="padding:30px;text-align:center;">No active alerts. Everything looks good!</p>';
                return;
            }

            var html = '';
            alerts.forEach(function (alert) {
                var icon = alert.type === 'danger' ? '&#9888;' : alert.type === 'warning' ? '&#9888;' : '&#8505;';
                html += '<div class="alert-item ' + alert.type + '">';
                html += '<div class="alert-icon">' + icon + '</div>';
                html += '<div class="alert-content"><div class="alert-category">' + escapeHtml(alert.category) + '</div>';
                html += '<div class="alert-message">' + escapeHtml(alert.message) + '</div></div>';
                html += '</div>';
            });
            listEl.innerHTML = html;
        } catch (e) {
            document.getElementById('alerts-list').innerHTML = '<p class="text-muted">Failed to load alerts</p>';
        }
    }

    // ==========================================
    // CALENDAR
    // ==========================================

    var calendarState = {
        year: new Date().getFullYear(),
        month: new Date().getMonth(),
        events: []
    };

    function initCalendar() {
        document.getElementById('cal-prev').addEventListener('click', function () {
            calendarState.month--;
            if (calendarState.month < 0) { calendarState.month = 11; calendarState.year--; }
            loadCalendar();
        });
        document.getElementById('cal-next').addEventListener('click', function () {
            calendarState.month++;
            if (calendarState.month > 11) { calendarState.month = 0; calendarState.year++; }
            loadCalendar();
        });
        document.getElementById('cal-today').addEventListener('click', function () {
            calendarState.year = new Date().getFullYear();
            calendarState.month = new Date().getMonth();
            loadCalendar();
        });
    }

    async function loadCalendar() {
        var year = calendarState.year;
        var month = calendarState.month;
        var start = new Date(year, month, 1);
        var end = new Date(year, month + 1, 0);
        var startStr = start.toISOString().split('T')[0];
        var endStr = end.toISOString().split('T')[0];

        var label = start.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        document.getElementById('cal-month-label').textContent = label;

        try {
            calendarState.events = await api('GET', '/calendar/events?start=' + startStr + '&end=' + endStr);
        } catch (e) {
            calendarState.events = [];
        }

        renderCalendar();
    }

    function renderCalendar() {
        var year = calendarState.year;
        var month = calendarState.month;
        var container = document.getElementById('calendar-container');

        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var daysInPrev = new Date(year, month, 0).getDate();
        var today = new Date();
        var todayStr = today.toISOString().split('T')[0];

        var html = '<div class="calendar-grid">';
        var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(function (d) {
            html += '<div class="calendar-header-cell">' + d + '</div>';
        });

        // Previous month days
        for (var i = firstDay - 1; i >= 0; i--) {
            html += '<div class="calendar-cell other-month"><div class="calendar-day-number">' + (daysInPrev - i) + '</div></div>';
        }

        // Current month days
        for (var d = 1; d <= daysInMonth; d++) {
            var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            var isToday = dateStr === todayStr;
            html += '<div class="calendar-cell' + (isToday ? ' today' : '') + '">';
            html += '<div class="calendar-day-number">' + d + '</div>';

            // Add events for this day
            var dayEvents = calendarState.events.filter(function (ev) {
                var evDate = ev.date ? ev.date.split('T')[0] : '';
                return evDate === dateStr;
            });
            dayEvents.forEach(function (ev) {
                html += '<div class="calendar-event ' + ev.type + '" title="' + escapeHtml(ev.title) + '">' + escapeHtml(ev.title) + '</div>';
            });

            html += '</div>';
        }

        // Next month days to fill grid
        var totalCells = firstDay + daysInMonth;
        var remaining = (7 - (totalCells % 7)) % 7;
        for (var n = 1; n <= remaining; n++) {
            html += '<div class="calendar-cell other-month"><div class="calendar-day-number">' + n + '</div></div>';
        }

        html += '</div>';
        container.innerHTML = html;
    }

    // ==========================================
    // CASE PIPELINE
    // ==========================================

    async function loadPipeline() {
        try {
            var pipeline = await api('GET', '/cases/pipeline');
            var container = document.getElementById('pipeline-container');

            var statuses = ['pending', 'active', 'completed'];
            var statusLabels = { pending: 'Pending', active: 'Active', completed: 'Completed' };

            // Add any other statuses found in data
            Object.keys(pipeline).forEach(function (s) {
                if (statuses.indexOf(s) === -1) {
                    statuses.push(s);
                    statusLabels[s] = formatValue(s);
                }
            });

            var html = '';
            statuses.forEach(function (status) {
                var cases = pipeline[status] || [];
                html += '<div class="pipeline-column">';
                html += '<div class="pipeline-header ' + status + '">' + (statusLabels[status] || formatValue(status));
                html += '<span class="count-badge">' + cases.length + '</span></div>';
                html += '<div class="pipeline-cards">';

                if (cases.length === 0) {
                    html += '<p class="text-muted" style="font-size:0.82rem;text-align:center;">No cases</p>';
                } else {
                    cases.forEach(function (c) {
                        html += '<div class="pipeline-card" onclick="document.querySelector(\'[data-feature=cases]\').click()">';
                        html += '<div class="pipeline-card-title">' + escapeHtml(c.deceased_name) + '</div>';
                        html += '<div class="pipeline-card-detail">Case #' + escapeHtml(c.case_number || '--') + '</div>';
                        html += '<div class="pipeline-card-meta"><span>' + (c.assigned_staff ? escapeHtml(c.assigned_staff) : 'Unassigned') + '</span>';
                        html += '<span>' + formatDate(c.date_of_death) + '</span></div>';
                        html += '</div>';
                    });
                }

                html += '</div></div>';
            });

            container.innerHTML = html;
        } catch (e) {
            document.getElementById('pipeline-container').innerHTML = '<p class="text-muted">Failed to load pipeline</p>';
        }
    }

    // ==========================================
    // FINANCIAL REPORTS
    // ==========================================

    function initReports() {
        // Set default dates
        var today = new Date();
        var firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        document.getElementById('report-start').value = firstOfMonth.toISOString().split('T')[0];
        document.getElementById('report-end').value = today.toISOString().split('T')[0];

        document.getElementById('report-generate').addEventListener('click', loadFinancialReport);
    }

    async function loadFinancialReport() {
        var startDate = document.getElementById('report-start').value;
        var endDate = document.getElementById('report-end').value;
        var container = document.getElementById('report-content');

        container.innerHTML = '<p class="text-muted">Loading report...</p>';

        try {
            var url = '/reports/financial';
            if (startDate && endDate) {
                url += '?start_date=' + startDate + '&end_date=' + endDate;
            }
            var report = await api('GET', url);

            var html = '';

            // Summary cards
            html += '<div class="report-summary-grid">';
            html += '<div class="report-summary-card positive"><div class="value">$' + report.total_revenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '</div><div class="label">Total Revenue</div></div>';
            html += '<div class="report-summary-card negative"><div class="value">$' + report.total_expenses.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '</div><div class="label">Total Expenses</div></div>';
            html += '<div class="report-summary-card ' + (report.net_income >= 0 ? 'positive' : 'negative') + '"><div class="value">$' + report.net_income.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '</div><div class="label">Net Income</div></div>';
            html += '</div>';

            // By Transaction Type
            if (report.by_type && report.by_type.length > 0) {
                var maxAmount = Math.max.apply(null, report.by_type.map(function(t) { return t.total; }));
                html += '<div class="report-chart"><h4>By Transaction Type</h4><div class="bar-chart">';
                report.by_type.forEach(function (t) {
                    var pct = maxAmount > 0 ? (t.total / maxAmount * 100) : 0;
                    var barClass = t.type === 'payment' ? 'payment' : t.type === 'expense' ? 'expense' : t.type === 'invoice' ? 'invoice' : 'revenue';
                    html += '<div class="bar-row">';
                    html += '<div class="bar-label">' + formatValue(t.type) + ' (' + t.count + ')</div>';
                    html += '<div class="bar-track"><div class="bar-fill ' + barClass + '" style="width:' + Math.max(pct, 5) + '%"></div></div>';
                    html += '<div class="bar-value">$' + t.total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '</div>';
                    html += '</div>';
                });
                html += '</div></div>';
            }

            // By Payment Method
            if (report.by_payment_method && report.by_payment_method.length > 0) {
                var maxPm = Math.max.apply(null, report.by_payment_method.map(function(m) { return m.total; }));
                html += '<div class="report-chart"><h4>By Payment Method</h4><div class="bar-chart">';
                report.by_payment_method.forEach(function (m) {
                    var pct = maxPm > 0 ? (m.total / maxPm * 100) : 0;
                    html += '<div class="bar-row">';
                    html += '<div class="bar-label">' + formatValue(m.method) + ' (' + m.count + ')</div>';
                    html += '<div class="bar-track"><div class="bar-fill payment" style="width:' + Math.max(pct, 5) + '%"></div></div>';
                    html += '<div class="bar-value">$' + m.total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '</div>';
                    html += '</div>';
                });
                html += '</div></div>';
            }

            // Monthly Trend
            if (report.monthly_trend && report.monthly_trend.length > 0) {
                var maxTrend = Math.max.apply(null, report.monthly_trend.map(function(m) { return Math.max(m.revenue, m.expenses); }));
                html += '<div class="report-chart"><h4>Monthly Trend (Last 6 Months)</h4><div class="bar-chart">';
                report.monthly_trend.forEach(function (m) {
                    var revPct = maxTrend > 0 ? (m.revenue / maxTrend * 100) : 0;
                    var expPct = maxTrend > 0 ? (m.expenses / maxTrend * 100) : 0;
                    html += '<div class="bar-row">';
                    html += '<div class="bar-label">' + m.month + '</div>';
                    html += '<div class="bar-track">';
                    html += '<div class="bar-fill revenue" style="width:' + Math.max(revPct, 2) + '%"></div>';
                    html += '</div>';
                    html += '<div class="bar-value" style="color:var(--success)">$' + m.revenue.toFixed(0) + '</div>';
                    html += '</div>';
                    html += '<div class="bar-row">';
                    html += '<div class="bar-label" style="opacity:0.5">expenses</div>';
                    html += '<div class="bar-track">';
                    html += '<div class="bar-fill expense" style="width:' + Math.max(expPct, 2) + '%"></div>';
                    html += '</div>';
                    html += '<div class="bar-value" style="color:var(--danger)">$' + m.expenses.toFixed(0) + '</div>';
                    html += '</div>';
                });
                html += '</div></div>';
            }

            // Recent Transactions Table
            if (report.recent_transactions && report.recent_transactions.length > 0) {
                html += '<div class="table-container"><table class="data-table"><thead><tr>';
                html += '<th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Paid</th><th>Method</th>';
                html += '</tr></thead><tbody>';
                report.recent_transactions.forEach(function (t) {
                    html += '<tr>';
                    html += '<td>' + formatDate(t.transaction_date) + '</td>';
                    html += '<td><span class="badge badge-' + (t.transaction_type || 'pending') + '">' + formatValue(t.transaction_type) + '</span></td>';
                    html += '<td>' + escapeHtml(t.description || '--') + '</td>';
                    html += '<td>' + formatCurrency(t.amount) + '</td>';
                    html += '<td><span class="badge ' + (t.is_paid ? 'badge-active' : 'badge-pending') + '">' + (t.is_paid ? 'Yes' : 'No') + '</span></td>';
                    html += '<td>' + formatValue(t.payment_method || '--') + '</td>';
                    html += '</tr>';
                });
                html += '</tbody></table></div>';
            }

            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<p class="text-muted">Failed to load report: ' + escapeHtml(e.message) + '</p>';
        }
    }

    // ==========================================
    // CSV EXPORT
    // ==========================================

    function exportFeature(feature) {
        var config = FEATURES[feature];
        if (!config) return;
        var resourceMap = {
            cases: 'cases', services: 'services', compliance: 'compliance', pricing: 'pricing',
            preneed: 'preneed', atneed: 'atneed', grief: 'grief-support', inventory: 'inventory',
            staff: 'staff', documents: 'documents', cremation: 'cremation', fleet: 'fleet',
            memorial: 'memorial-products', obituaries: 'obituaries', embalming: 'embalming',
            cemetery: 'cemetery-plots', insurance: 'insurance-claims', vendors: 'vendors',
            appointments: 'appointments', financial: 'financial-records', communications: 'communications',
            flowers: 'flower-orders', facility: 'facility-rooms', aftercare: 'aftercare'
        };
        var resource = resourceMap[feature] || feature;
        window.open(API_BASE + '/export/' + resource + '?token=' + state.token, '_blank');
    }

    function addExportButtons() {
        document.querySelectorAll('.btn-add-new').forEach(function (btn) {
            var feature = btn.getAttribute('data-feature');
            if (feature && !btn.parentElement.querySelector('.btn-export')) {
                var exportBtn = document.createElement('button');
                exportBtn.className = 'btn btn-sm btn-export';
                exportBtn.textContent = 'Export CSV';
                exportBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    exportFeature(feature);
                });
                btn.parentElement.appendChild(exportBtn);
            }
        });
    }

    // ==========================================
    // FEATURE DATA LOADING
    // ==========================================

    function transformData(feature, items) {
        return items.map(function (item) {
            switch (feature) {
                case 'cases':
                    item.deceased_name = ((item.deceased_first_name || '') + ' ' + (item.deceased_last_name || '')).trim();
                    break;
                case 'preneed':
                    item.client_name = ((item.client_first_name || '') + ' ' + (item.client_last_name || '')).trim();
                    break;
                case 'atneed':
                    item.contact_name = ((item.contact_first_name || '') + ' ' + (item.contact_last_name || '')).trim();
                    item.assigned_staff = item.assigned_to;
                    item.received_date = item.initial_call_date;
                    break;
                case 'staff':
                    item.full_name = ((item.first_name || '') + ' ' + (item.last_name || '')).trim();
                    break;
                case 'pricing':
                    item.price = item.unit_price;
                    break;
                case 'inventory':
                    item.unit_price = item.retail_price;
                    break;
                case 'memorial':
                    item.price = item.retail_price;
                    item.quantity_available = item.quantity_available;
                    item.is_customizable = item.customizable;
                    break;
                case 'compliance':
                    item.deadline = item.last_reviewed;
                    break;
                case 'cemetery':
                    item.plot_info = ((item.section || '') + ' / ' + (item.plot_number || item.lot_number || '')).trim();
                    break;
            }
            return item;
        });
    }

    async function loadFeatureData(feature, page) {
        var config = FEATURES[feature];
        if (!config) return;

        // Determine page and limit
        var currentPage = page || (state.pagination[feature] ? state.pagination[feature].page : 1);
        var limit = 20;

        try {
            var url = config.endpoint + '?page=' + currentPage + '&limit=' + limit;
            var data = await api('GET', url);

            var items, pagination;
            if (data && data.pagination) {
                // Paginated response
                items = data.data || [];
                pagination = data.pagination;
            } else {
                // Legacy array response (fallback)
                items = Array.isArray(data) ? data : (data.data || data.items || []);
                pagination = { page: 1, limit: items.length, total: items.length, totalPages: 1 };
            }

            items = transformData(feature, items);
            state.currentData[feature] = items;
            state.pagination[feature] = pagination;
            renderTable(feature, items);
            renderPagination(feature, pagination);
        } catch (err) {
            showToast('Failed to load ' + config.name + ': ' + err.message, 'error');
            state.currentData[feature] = [];
            renderTable(feature, []);
        }
    }

    function renderPagination(feature, pagination) {
        var containerId = 'pagination-' + feature;
        var container = document.getElementById(containerId);
        if (!container) return;

        if (!pagination || pagination.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        var html = '<div class="pagination-controls">';
        html += '<button class="btn btn-sm btn-outline" ' + (pagination.page <= 1 ? 'disabled' : '') + ' onclick="window.__goToPage(\'' + feature + '\',' + (pagination.page - 1) + ')">&#8592; Previous</button>';
        html += '<span class="pagination-info">Page ' + pagination.page + ' of ' + pagination.totalPages + ' (' + pagination.total + ' records)</span>';
        html += '<button class="btn btn-sm btn-outline" ' + (pagination.page >= pagination.totalPages ? 'disabled' : '') + ' onclick="window.__goToPage(\'' + feature + '\',' + (pagination.page + 1) + ')">Next &#8594;</button>';
        html += '</div>';
        container.innerHTML = html;
    }

    // Expose pagination navigation to inline onclick handlers
    window.__goToPage = function(feature, page) {
        loadFeatureData(feature, page);
    };

    // ==========================================
    // TABLE RENDERING
    // ==========================================

    function renderTable(feature, items) {
        var config = FEATURES[feature];
        var table = document.getElementById('table-' + feature);
        if (!table) return;

        var tbody = table.querySelector('tbody');
        tbody.innerHTML = '';

        if (!items || items.length === 0) {
            var row = document.createElement('tr');
            row.className = 'empty-row';
            row.innerHTML = '<td colspan="' + config.tableColumns.length + '">No records found</td>';
            tbody.appendChild(row);
            return;
        }

        items.forEach(function (item) {
            var row = document.createElement('tr');
            row.addEventListener('click', function () {
                showDetail(feature, item);
            });

            config.tableColumns.forEach(function (col) {
                var td = document.createElement('td');
                var val = item[col.key];

                if (col.type === 'badge') {
                    td.innerHTML = '<span class="badge badge-' + (val || 'pending') + '">' + formatValue(val) + '</span>';
                } else if (col.type === 'currency') {
                    td.textContent = formatCurrency(val);
                } else if (col.type === 'date') {
                    td.textContent = formatDate(val);
                } else if (col.type === 'boolean') {
                    td.innerHTML = '<span class="badge ' + (val === true || val === 'true' ? 'badge-active' : 'badge-pending') + '">' + (val === true || val === 'true' ? 'Yes' : 'No') + '</span>';
                } else {
                    td.textContent = val != null ? val : '--';
                }
                row.appendChild(td);
            });

            tbody.appendChild(row);
        });
    }

    // ==========================================
    // SEARCH / FILTER
    // ==========================================

    function initSearch() {
        document.querySelectorAll('.search-input').forEach(function (input) {
            input.addEventListener('input', function () {
                var feature = this.getAttribute('data-feature');
                var query = this.value.toLowerCase().trim();
                var allItems = state.currentData[feature] || [];

                if (!query) {
                    renderTable(feature, allItems);
                    return;
                }

                var filtered = allItems.filter(function (item) {
                    return Object.values(item).some(function (v) {
                        return v != null && String(v).toLowerCase().indexOf(query) !== -1;
                    });
                });
                renderTable(feature, filtered);
            });
        });
    }

    // ==========================================
    // DETAIL MODAL
    // ==========================================

    function showDetail(feature, record) {
        state.currentRecord = record;
        state.currentFeature = feature;

        var config = FEATURES[feature];
        var title = document.getElementById('detail-modal-title');
        title.textContent = config.name + ' - Details';

        var body = document.getElementById('detail-modal-body');
        body.innerHTML = '';

        var grid = document.createElement('div');
        grid.className = 'detail-grid';

        // Show ALL fields from form config plus any extra keys
        var shownKeys = new Set();
        config.formFields.forEach(function (field) {
            shownKeys.add(field.key);
            var div = document.createElement('div');
            div.className = 'detail-field' + (field.fullWidth ? ' full-width' : '');
            var label = document.createElement('div');
            label.className = 'detail-label';
            label.textContent = field.label;
            var value = document.createElement('div');
            value.className = 'detail-value';

            var val = record[field.key];
            if (field.type === 'select' && (val === true || val === false)) {
                value.textContent = val ? 'Yes' : 'No';
            } else if (val == null || val === '') {
                value.textContent = '--';
            } else {
                value.textContent = val;
            }

            div.appendChild(label);
            div.appendChild(value);
            grid.appendChild(div);
        });

        // Show any extra keys not in form config
        Object.keys(record).forEach(function (key) {
            if (!shownKeys.has(key) && key !== 'id' && key !== '_id') {
                var div = document.createElement('div');
                div.className = 'detail-field';
                var label = document.createElement('div');
                label.className = 'detail-label';
                label.textContent = formatLabel(key);
                var value = document.createElement('div');
                value.className = 'detail-value';
                value.textContent = record[key] != null ? record[key] : '--';
                div.appendChild(label);
                div.appendChild(value);
                grid.appendChild(div);
            }
        });

        body.appendChild(grid);

        // Role-aware: hide Delete button on financial records for staff role
        var deleteBtn = document.getElementById('detail-delete-btn');
        if (deleteBtn) {
            if (feature === 'financial' && getUserRole() === 'staff') {
                deleteBtn.style.display = 'none';
            } else {
                deleteBtn.style.display = '';
            }
        }

        document.getElementById('detail-modal').classList.remove('hidden');
    }

    function initDetailModal() {
        document.getElementById('detail-modal-close').addEventListener('click', closeDetailModal);
        document.getElementById('detail-close-btn').addEventListener('click', closeDetailModal);

        document.getElementById('detail-edit-btn').addEventListener('click', function () {
            closeDetailModal();
            openEditForm(state.currentFeature, state.currentRecord);
        });

        document.getElementById('detail-delete-btn').addEventListener('click', function () {
            closeDetailModal();
            confirmDelete(state.currentFeature, state.currentRecord);
        });

        // Close on overlay click
        document.getElementById('detail-modal').addEventListener('click', function (e) {
            if (e.target === this) closeDetailModal();
        });
    }

    function closeDetailModal() {
        document.getElementById('detail-modal').classList.add('hidden');
    }

    // ==========================================
    // FORM MODAL (ADD / EDIT)
    // ==========================================

    function initFormModal() {
        // Add New buttons
        document.querySelectorAll('.btn-add-new').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var feature = this.getAttribute('data-feature');
                openAddForm(feature);
            });
        });

        document.getElementById('form-modal-close').addEventListener('click', closeFormModal);
        document.getElementById('form-cancel-btn').addEventListener('click', closeFormModal);

        document.getElementById('form-save-btn').addEventListener('click', function () {
            saveForm();
        });

        document.getElementById('form-modal').addEventListener('click', function (e) {
            if (e.target === this) closeFormModal();
        });
    }

    function openAddForm(feature) {
        state.currentAction = 'add';
        state.currentFeature = feature;
        state.currentRecord = null;

        var config = FEATURES[feature];
        document.getElementById('form-modal-title').textContent = 'Add New - ' + config.name;
        renderFormFields(feature, {});
        document.getElementById('form-modal').classList.remove('hidden');
    }

    function openEditForm(feature, record) {
        state.currentAction = 'edit';
        state.currentFeature = feature;
        state.currentRecord = record;

        var config = FEATURES[feature];
        document.getElementById('form-modal-title').textContent = 'Edit - ' + config.name;
        renderFormFields(feature, record);
        document.getElementById('form-modal').classList.remove('hidden');
    }

    function renderFormFields(feature, record) {
        var config = FEATURES[feature];
        var container = document.getElementById('form-fields-container');
        container.innerHTML = '';

        var grid = document.createElement('div');
        grid.className = 'form-grid';

        config.formFields.forEach(function (field) {
            var group = document.createElement('div');
            group.className = 'form-group' + (field.fullWidth ? ' full-width' : '');

            var label = document.createElement('label');
            label.setAttribute('for', 'field-' + field.key);
            label.textContent = field.label + (field.required ? ' *' : '');

            var input;
            if (field.type === 'select') {
                input = document.createElement('select');
                var emptyOpt = document.createElement('option');
                emptyOpt.value = '';
                emptyOpt.textContent = '-- Select --';
                input.appendChild(emptyOpt);
                field.options.forEach(function (opt) {
                    var option = document.createElement('option');
                    option.value = opt;
                    option.textContent = formatValue(opt);
                    if (String(record[field.key]) === String(opt)) {
                        option.selected = true;
                    }
                    input.appendChild(option);
                });
            } else if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = 3;
                input.value = record[field.key] || '';
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';
                input.value = record[field.key] != null ? record[field.key] : '';
            }

            input.id = 'field-' + field.key;
            input.name = field.key;
            if (field.required) input.required = true;

            group.appendChild(label);
            group.appendChild(input);
            grid.appendChild(group);
        });

        container.appendChild(grid);
    }

    async function saveForm() {
        var feature = state.currentFeature;
        var config = FEATURES[feature];
        var formData = {};

        config.formFields.forEach(function (field) {
            var el = document.getElementById('field-' + field.key);
            if (el) {
                var val = el.value;
                if (field.type === 'number' && val !== '') {
                    val = parseFloat(val);
                }
                if (val !== '') {
                    formData[field.key] = val;
                }
            }
        });

        showLoading();
        try {
            if (state.currentAction === 'add') {
                await api('POST', config.endpoint, formData);
                showToast('Record created successfully', 'success');
            } else {
                var id = state.currentRecord.id || state.currentRecord._id;
                await api('PUT', config.endpoint + '/' + id, formData);
                showToast('Record updated successfully', 'success');
            }
            closeFormModal();
            loadFeatureData(feature);
        } catch (err) {
            showToast('Save failed: ' + err.message, 'error');
        } finally {
            hideLoading();
        }
    }

    function closeFormModal() {
        document.getElementById('form-modal').classList.add('hidden');
    }

    // ==========================================
    // DELETE CONFIRMATION
    // ==========================================

    function initConfirmModal() {
        document.getElementById('confirm-modal-close').addEventListener('click', closeConfirmModal);
        document.getElementById('confirm-cancel-btn').addEventListener('click', closeConfirmModal);

        document.getElementById('confirm-delete-btn').addEventListener('click', function () {
            doDelete();
        });

        document.getElementById('confirm-modal').addEventListener('click', function (e) {
            if (e.target === this) closeConfirmModal();
        });
    }

    function confirmDelete(feature, record) {
        state.currentFeature = feature;
        state.currentRecord = record;
        document.getElementById('confirm-modal').classList.remove('hidden');
    }

    async function doDelete() {
        var feature = state.currentFeature;
        var config = FEATURES[feature];
        var id = state.currentRecord.id || state.currentRecord._id;

        showLoading();
        try {
            await api('DELETE', config.endpoint + '/' + id);
            showToast('Record deleted successfully', 'success');
            closeConfirmModal();
            loadFeatureData(feature);
        } catch (err) {
            showToast('Delete failed: ' + err.message, 'error');
        } finally {
            hideLoading();
        }
    }

    function closeConfirmModal() {
        document.getElementById('confirm-modal').classList.add('hidden');
    }

    // ==========================================
    // AI ASSISTANT
    // ==========================================

    function initAI() {
        // AI action buttons
        document.querySelectorAll('.btn-ai').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.btn-ai').forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');
                state.selectedAiAction = this.getAttribute('data-action');

                // Set placeholder based on action
                var prompt = document.getElementById('ai-prompt');
                switch (state.selectedAiAction) {
                    case 'generate-obituary':
                        prompt.placeholder = 'Provide details about the deceased: full name, dates, family members, career, hobbies, accomplishments... (or enter a Case ID to load from database)';
                        break;
                    case 'compliance-check':
                        prompt.placeholder = 'Enter the state code and describe the case details to check compliance requirements...';
                        break;
                    case 'grief-recommendation':
                        prompt.placeholder = 'Describe the situation: who needs support, type of loss, any special circumstances...';
                        break;
                    case 'pricing-estimate':
                        prompt.placeholder = 'Describe the services and merchandise needed for a pricing estimate...';
                        break;
                    case 'embalming-report':
                        prompt.placeholder = 'Enter the Embalming Record ID (numeric) to generate a state-format mortuary report...';
                        break;
                    case 'aftercare-email-2':
                        prompt.placeholder = 'Enter the Case ID to generate a 2-week aftercare follow-up email...';
                        break;
                    case 'aftercare-email-4':
                        prompt.placeholder = 'Enter the Case ID to generate a 1-month aftercare follow-up email...';
                        break;
                    case 'aftercare-email-26':
                        prompt.placeholder = 'Enter the Case ID to generate a 6-month aftercare follow-up email...';
                        break;
                    case 'preneed-conversion':
                        prompt.placeholder = 'Enter the Pre-Need Plan ID to generate a case handoff summary for at-need conversion...';
                        break;
                    case 'grief-stage-classifier':
                        prompt.placeholder = 'Format: <aftercare_id>|<optional family response text>. Example: 5|My family is still struggling.';
                        break;
                    case 'permit-checklist':
                        prompt.placeholder = 'Format: <case_id>|<state_code>|<service_type>. Example: 12|CA|traditional_funeral';
                        break;
                    case 'preneed-at-risk':
                        prompt.placeholder = 'No input required — click Submit to scan all pre-need contracts and surface delinquent ones with AI-drafted outreach.';
                        break;
                    case 'memorial-upsell':
                        prompt.placeholder = 'Format: <case_id>|<family_budget>. Example: 7|5000';
                        break;
                    case 'chemical-lot-provenance':
                        prompt.placeholder = 'No input required — click Submit to view low-stock embalming chemicals with the decedents who consumed each lot.';
                        break;
                    default:
                        prompt.placeholder = 'Describe what you need help with...';
                }
            });
        });

        // Submit button
        document.getElementById('ai-submit-btn').addEventListener('click', submitAI);
    }

    async function submitAI() {
        var promptText = document.getElementById('ai-prompt').value.trim();
        var selectedFeature = document.getElementById('ai-feature-select').value;
        var action = state.selectedAiAction || 'analyze';

        // The two prompt-less tools should be allowed to submit with empty input
        var promptOptional = (action === 'preneed-at-risk' || action === 'chemical-lot-provenance');
        if (!promptText && !promptOptional) {
            showToast('Please enter a prompt', 'warning');
            return;
        }

        var outputArea = document.getElementById('ai-output');
        outputArea.innerHTML = '<div class="ai-loading"><div class="spinner"></div><p>AI is processing your request...</p></div>';

        var endpoint, body, method = 'POST';
        switch (action) {
            case 'generate-obituary':
                endpoint = '/ai/generate-obituary';
                body = { details: promptText, case_id: null };
                break;
            case 'compliance-check':
                endpoint = '/ai/compliance-check';
                body = { state_code: promptText.substring(0, 2).toUpperCase(), case_data: promptText };
                break;
            case 'grief-recommendation':
                endpoint = '/ai/grief-recommendation';
                body = { situation: promptText };
                break;
            case 'pricing-estimate':
                endpoint = '/ai/pricing-estimate';
                body = { services: promptText, merchandise: '' };
                break;
            case 'embalming-report':
                endpoint = '/ai/embalming-report';
                body = { embalming_id: promptText };
                break;
            case 'aftercare-email-2':
                endpoint = '/ai/aftercare-email';
                body = { case_id: promptText, weeks_since_service: 2 };
                break;
            case 'aftercare-email-4':
                endpoint = '/ai/aftercare-email';
                body = { case_id: promptText, weeks_since_service: 4 };
                break;
            case 'aftercare-email-26':
                endpoint = '/ai/aftercare-email';
                body = { case_id: promptText, weeks_since_service: 26 };
                break;
            case 'preneed-conversion':
                endpoint = '/ai/preneed-conversion-summary';
                body = { preneed_id: promptText };
                break;
            case 'grief-stage-classifier': {
                var parts = promptText.split('|');
                endpoint = '/ai/grief-stage-classifier';
                body = { aftercare_id: (parts[0] || '').trim(), family_response_text: (parts[1] || '').trim() };
                break;
            }
            case 'permit-checklist': {
                var pParts = promptText.split('|');
                endpoint = '/ai/permit-checklist';
                body = {
                    case_id: (pParts[0] || '').trim(),
                    state_code: (pParts[1] || '').trim(),
                    service_type: (pParts[2] || '').trim(),
                };
                break;
            }
            case 'preneed-at-risk':
                endpoint = '/ai/preneed-at-risk';
                body = {};
                break;
            case 'memorial-upsell': {
                var mParts = promptText.split('|');
                endpoint = '/ai/memorial-upsell';
                body = { case_id: (mParts[0] || '').trim(), family_budget: (mParts[1] || '').trim() };
                break;
            }
            case 'chemical-lot-provenance':
                endpoint = '/embalming-chemical-lots/low-stock-provenance';
                method = 'GET';
                body = null;
                break;
            default:
                endpoint = '/ai/analyze';
                body = { feature: selectedFeature, data: {}, prompt: promptText };
        }

        try {
            var data = method === 'GET' ? await api('GET', endpoint) : await api('POST', endpoint, body);
            renderAIOutput(data);

            // Show auto-save notice for obituaries
            if (action === 'generate-obituary' && data.saved) {
                showToast('Obituary auto-saved to Obituary Management (ID: ' + data.obituary_id + ')', 'success');
            }
        } catch (err) {
            if (!err.message.includes('rate limit')) {
                outputArea.innerHTML = '<div class="ai-result-card"><h4>Error</h4><p>' + escapeHtml(err.message) + '</p></div>';
            }
            showToast('AI request failed: ' + err.message, 'error');
        }
    }

    // Called from inline AI tool buttons inside module views
    window.__submitCaseAI = function(action, idValue) {
        var promptInput = document.getElementById('ai-case-id-input');
        var idToUse = idValue || (promptInput ? promptInput.value.trim() : '');
        if (!idToUse) {
            showToast('Please enter the Case ID first', 'warning');
            return;
        }
        state.selectedAiAction = action;
        // Navigate to AI view and pre-fill
        navigateTo('ai');
        setTimeout(function() {
            document.getElementById('ai-prompt').value = idToUse;
            // Highlight the corresponding action button
            document.querySelectorAll('.btn-ai').forEach(function(b) {
                b.classList.toggle('active', b.getAttribute('data-action') === action);
            });
            submitAI();
        }, 100);
    };

    window.__submitEmbalmingReport = function(embId) {
        if (!embId) {
            showToast('Please enter the Embalming Record ID', 'warning');
            return;
        }
        state.selectedAiAction = 'embalming-report';
        navigateTo('ai');
        setTimeout(function() {
            document.getElementById('ai-prompt').value = embId;
            document.querySelectorAll('.btn-ai').forEach(function(b) {
                b.classList.toggle('active', b.getAttribute('data-action') === 'embalming-report');
            });
            submitAI();
        }, 100);
    };

    // Compliance check: navigate to AI, pre-fill prompt with a note, let user add state code
    window.__submitComplianceCheck = function(caseId) {
        state.selectedAiAction = 'compliance-check';
        navigateTo('ai');
        setTimeout(function() {
            document.getElementById('ai-prompt').value = 'CA Case ID: ' + caseId;
            document.querySelectorAll('.btn-ai').forEach(function(b) {
                b.classList.toggle('active', b.getAttribute('data-action') === 'compliance-check');
            });
            // Update placeholder to guide user
            document.getElementById('ai-prompt').placeholder = 'Edit the state code above (e.g. CA, TX, NY) and add case details, then submit...';
            showToast('Edit the state code prefix and click Submit to AI', 'info');
        }, 100);
    };

    window.__submitPreneedConversion = function(preneedId) {
        if (!preneedId) {
            showToast('Please enter the Pre-Need Plan ID', 'warning');
            return;
        }
        state.selectedAiAction = 'preneed-conversion';
        navigateTo('ai');
        setTimeout(function() {
            document.getElementById('ai-prompt').value = preneedId;
            document.querySelectorAll('.btn-ai').forEach(function(b) {
                b.classList.toggle('active', b.getAttribute('data-action') === 'preneed-conversion');
            });
            submitAI();
        }, 100);
    };

    function renderAIOutput(data) {
        var outputArea = document.getElementById('ai-output');
        outputArea.innerHTML = '';

        // Extract the main response text
        var responseText = '';
        if (typeof data === 'string') {
            responseText = data;
        } else if (data.response) {
            responseText = data.response;
        } else if (data.result) {
            responseText = typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2);
        } else if (data.text) {
            responseText = data.text;
        } else if (data.content) {
            responseText = data.content;
        } else if (data.obituary) {
            responseText = data.obituary;
        } else if (data.recommendations) {
            responseText = typeof data.recommendations === 'string' ? data.recommendations : JSON.stringify(data.recommendations, null, 2);
        } else if (data.estimate) {
            responseText = typeof data.estimate === 'string' ? data.estimate : JSON.stringify(data.estimate, null, 2);
        } else if (data.analysis) {
            responseText = typeof data.analysis === 'string' ? data.analysis : JSON.stringify(data.analysis, null, 2);
        } else if (data.data) {
            responseText = typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2);
        } else {
            responseText = JSON.stringify(data, null, 2);
        }

        // Parse and render beautifully
        var formatted = formatAIResponse(responseText);
        outputArea.innerHTML = formatted;
    }

    function formatAIResponse(text) {
        if (!text) return '<div class="ai-result-card"><p>No response received.</p></div>';

        // Split by double newlines into sections
        var sections = text.split(/\n\n+/);
        var html = '';

        sections.forEach(function (section) {
            section = section.trim();
            if (!section) return;

            var card = '<div class="ai-result-card"><div class="ai-result-section">';

            // Check for headings (lines starting with # or **heading**)
            var lines = section.split('\n');
            var processed = [];

            lines.forEach(function (line) {
                line = line.trim();
                if (!line) return;

                // Markdown headings
                if (line.match(/^#{1,3}\s/)) {
                    var headingText = line.replace(/^#{1,3}\s*/, '');
                    processed.push('<h4>' + escapeHtml(headingText) + '</h4>');
                }
                // Bold headings (**text**)
                else if (line.match(/^\*\*.*\*\*$/)) {
                    var boldText = line.replace(/^\*\*/, '').replace(/\*\*$/, '');
                    processed.push('<h4>' + escapeHtml(boldText) + '</h4>');
                }
                // Bullet points
                else if (line.match(/^[-*]\s/)) {
                    var bulletText = line.replace(/^[-*]\s*/, '');
                    // Handle inline bold
                    bulletText = bulletText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    processed.push('<li>' + bulletText + '</li>');
                }
                // Numbered lists
                else if (line.match(/^\d+\.\s/)) {
                    var numText = line.replace(/^\d+\.\s*/, '');
                    numText = numText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    processed.push('<li>' + numText + '</li>');
                }
                // Regular paragraph
                else {
                    var pText = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    processed.push('<p>' + pText + '</p>');
                }
            });

            // Wrap consecutive <li> items in <ul>
            var finalHtml = '';
            var inList = false;
            processed.forEach(function (item) {
                if (item.startsWith('<li>')) {
                    if (!inList) {
                        finalHtml += '<ul>';
                        inList = true;
                    }
                    finalHtml += item;
                } else {
                    if (inList) {
                        finalHtml += '</ul>';
                        inList = false;
                    }
                    finalHtml += item;
                }
            });
            if (inList) finalHtml += '</ul>';

            card += finalHtml + '</div></div>';
            html += card;
        });

        return html || '<div class="ai-result-card"><p>' + escapeHtml(text) + '</p></div>';
    }

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    function formatValue(val) {
        if (val == null) return '--';
        return String(val).replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    function formatCurrency(val) {
        if (val == null || val === '') return '--';
        return '$' + parseFloat(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function formatDate(val) {
        if (!val) return '--';
        try {
            var d = new Date(val);
            if (isNaN(d.getTime())) return val;
            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            return val;
        }
    }

    function formatLabel(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    function init() {
        initAuth();
        initNavigation();
        initSearch();
        initDetailModal();
        initFormModal();
        initConfirmModal();
        initAI();
        initCalendar();
        initReports();
        addExportButtons();

        // KPI alerts card click navigates to alerts
        var alertsCard = document.getElementById('kpi-alerts-card');
        if (alertsCard) {
            alertsCard.addEventListener('click', function () {
                navigateTo('alerts');
            });
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
