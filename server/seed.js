const db = require('./db');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('Starting database seed...');

    // ─── DROP ALL TABLES ───────────────────────────────────────────────
    console.log('Dropping existing tables...');
    await db.query(`
      DROP TABLE IF EXISTS aftercare CASCADE;
      DROP TABLE IF EXISTS facility_rooms CASCADE;
      DROP TABLE IF EXISTS flower_orders CASCADE;
      DROP TABLE IF EXISTS communications CASCADE;
      DROP TABLE IF EXISTS financial_records CASCADE;
      DROP TABLE IF EXISTS appointments CASCADE;
      DROP TABLE IF EXISTS vendors CASCADE;
      DROP TABLE IF EXISTS insurance_claims CASCADE;
      DROP TABLE IF EXISTS cemetery_plots CASCADE;
      DROP TABLE IF EXISTS embalming CASCADE;
      DROP TABLE IF EXISTS obituaries CASCADE;
      DROP TABLE IF EXISTS memorial_products CASCADE;
      DROP TABLE IF EXISTS fleet CASCADE;
      DROP TABLE IF EXISTS cremation CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS staff CASCADE;
      DROP TABLE IF EXISTS inventory CASCADE;
      DROP TABLE IF EXISTS grief_support CASCADE;
      DROP TABLE IF EXISTS atneed CASCADE;
      DROP TABLE IF EXISTS preneed CASCADE;
      DROP TABLE IF EXISTS pricing CASCADE;
      DROP TABLE IF EXISTS compliance CASCADE;
      DROP TABLE IF EXISTS services CASCADE;
      DROP TABLE IF EXISTS cases CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('All tables dropped.');

    // ─── CREATE TABLES ─────────────────────────────────────────────────
    console.log('Creating tables...');

    await db.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - users table created');

    await db.query(`
      CREATE TABLE cases (
        id SERIAL PRIMARY KEY,
        case_number VARCHAR(50) UNIQUE NOT NULL,
        deceased_first_name VARCHAR(100) NOT NULL,
        deceased_last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        date_of_death DATE,
        cause_of_death VARCHAR(255),
        next_of_kin_name VARCHAR(255),
        next_of_kin_phone VARCHAR(30),
        next_of_kin_email VARCHAR(255),
        next_of_kin_relationship VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','completed','pending')),
        assigned_staff VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - cases table created');

    await db.query(`
      CREATE TABLE services (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
        service_type VARCHAR(50) CHECK (service_type IN (
          'traditional_funeral','memorial','graveside','celebration_of_life',
          'direct_burial','direct_cremation','viewing_only','military_honors'
        )),
        service_date DATE,
        service_time TIME,
        location VARCHAR(255),
        officiant VARCHAR(255),
        music_selections TEXT,
        floral_arrangements TEXT,
        special_requests TEXT,
        estimated_attendees INTEGER,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
        total_cost NUMERIC(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - services table created');

    await db.query(`
      CREATE TABLE compliance (
        id SERIAL PRIMARY KEY,
        state_code VARCHAR(5) NOT NULL,
        state_name VARCHAR(100) NOT NULL,
        requirement_type VARCHAR(30) CHECK (requirement_type IN ('license','permit','regulation','reporting')),
        requirement_name VARCHAR(255) NOT NULL,
        description TEXT,
        deadline_days INTEGER,
        penalty_amount NUMERIC(10,2),
        is_active BOOLEAN DEFAULT TRUE,
        last_reviewed DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - compliance table created');

    await db.query(`
      CREATE TABLE pricing (
        id SERIAL PRIMARY KEY,
        item_category VARCHAR(50) CHECK (item_category IN (
          'professional_services','facilities','transportation','merchandise','cash_advances'
        )),
        item_name VARCHAR(255) NOT NULL,
        item_description TEXT,
        unit_price NUMERIC(10,2) NOT NULL,
        is_package BOOLEAN DEFAULT FALSE,
        package_includes TEXT,
        is_required BOOLEAN DEFAULT FALSE,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - pricing table created');

    await db.query(`
      CREATE TABLE preneed (
        id SERIAL PRIMARY KEY,
        plan_name VARCHAR(255) NOT NULL,
        client_first_name VARCHAR(100) NOT NULL,
        client_last_name VARCHAR(100) NOT NULL,
        client_email VARCHAR(255),
        client_phone VARCHAR(30),
        client_dob DATE,
        plan_type VARCHAR(20) CHECK (plan_type IN ('basic','standard','premium','custom')),
        payment_method VARCHAR(20) CHECK (payment_method IN ('lump_sum','installment','insurance')),
        total_amount NUMERIC(10,2),
        amount_paid NUMERIC(10,2) DEFAULT 0,
        monthly_payment NUMERIC(10,2),
        service_preferences TEXT,
        merchandise_selections TEXT,
        special_instructions TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','paid_in_full','cancelled','claimed')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - preneed table created');

    await db.query(`
      CREATE TABLE atneed (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
        contact_first_name VARCHAR(100) NOT NULL,
        contact_last_name VARCHAR(100) NOT NULL,
        contact_phone VARCHAR(30),
        contact_email VARCHAR(255),
        contact_relationship VARCHAR(100),
        urgency_level VARCHAR(20) CHECK (urgency_level IN ('immediate','standard','planned')),
        initial_call_date DATE,
        initial_call_time TIME,
        location_of_death VARCHAR(255),
        removal_needed BOOLEAN DEFAULT FALSE,
        removal_address TEXT,
        medical_examiner_required BOOLEAN DEFAULT FALSE,
        special_circumstances TEXT,
        status VARCHAR(30) DEFAULT 'new' CHECK (status IN ('new','in_progress','arrangements_made','completed')),
        assigned_to VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - atneed table created');

    await db.query(`
      CREATE TABLE grief_support (
        id SERIAL PRIMARY KEY,
        resource_type VARCHAR(30) CHECK (resource_type IN (
          'counselor','support_group','book','website','hotline','workshop'
        )),
        resource_name VARCHAR(255) NOT NULL,
        provider_name VARCHAR(255),
        description TEXT,
        contact_info VARCHAR(255),
        website_url VARCHAR(500),
        availability VARCHAR(255),
        cost NUMERIC(10,2),
        is_free BOOLEAN DEFAULT FALSE,
        specialization VARCHAR(255),
        rating NUMERIC(3,1),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - grief_support table created');

    await db.query(`
      CREATE TABLE inventory (
        id SERIAL PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(30) CHECK (category IN (
          'caskets','urns','vaults','clothing','keepsakes','supplies','chemicals'
        )),
        sku VARCHAR(50) UNIQUE,
        supplier VARCHAR(255),
        quantity_on_hand INTEGER DEFAULT 0,
        reorder_level INTEGER DEFAULT 5,
        unit_cost NUMERIC(10,2),
        retail_price NUMERIC(10,2),
        location_in_facility VARCHAR(255),
        last_restocked DATE,
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - inventory table created');

    await db.query(`
      CREATE TABLE staff (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(30),
        role VARCHAR(30) CHECK (role IN (
          'director','embalmer','attendant','driver','office_admin','grief_counselor'
        )),
        license_number VARCHAR(100),
        license_expiry DATE,
        hire_date DATE,
        hourly_rate NUMERIC(8,2),
        is_full_time BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        certifications TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - staff table created');

    await db.query(`
      CREATE TABLE documents (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
        document_type VARCHAR(50) CHECK (document_type IN (
          'death_certificate','burial_permit','cremation_authorization',
          'embalming_authorization','general_price_list','contract',
          'insurance_claim','obituary','veteran_discharge'
        )),
        document_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500),
        issued_by VARCHAR(255),
        issued_date DATE,
        expiry_date DATE,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','filed','expired')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - documents table created');

    await db.query(`
      CREATE TABLE cremation (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
        cremation_number VARCHAR(50) UNIQUE,
        authorization_received BOOLEAN DEFAULT FALSE,
        authorization_date DATE,
        medical_examiner_approval BOOLEAN DEFAULT FALSE,
        pacemaker_check BOOLEAN DEFAULT FALSE,
        pacemaker_removed BOOLEAN DEFAULT FALSE,
        scheduled_date DATE,
        scheduled_time TIME,
        crematory_name VARCHAR(255),
        operator_name VARCHAR(255),
        temperature INTEGER,
        duration_minutes INTEGER,
        completion_time TIMESTAMP,
        urn_id INTEGER,
        disposition_method VARCHAR(30) CHECK (disposition_method IN (
          'family_pickup','mailing','scattering','interment','columbarium'
        )),
        disposition_date DATE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
          'pending','authorized','scheduled','in_progress','completed','delivered'
        )),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - cremation table created');

    await db.query(`
      CREATE TABLE fleet (
        id SERIAL PRIMARY KEY,
        vehicle_type VARCHAR(30) CHECK (vehicle_type IN (
          'hearse','limousine','flower_car','utility_van','removal_van','family_car'
        )),
        vehicle_name VARCHAR(255),
        make VARCHAR(100),
        model VARCHAR(100),
        year INTEGER,
        vin VARCHAR(20),
        license_plate VARCHAR(20),
        mileage INTEGER,
        fuel_type VARCHAR(30),
        last_service_date DATE,
        next_service_date DATE,
        insurance_expiry DATE,
        status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available','in_use','maintenance','retired')),
        daily_rate NUMERIC(8,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - fleet table created');

    await db.query(`
      CREATE TABLE memorial_products (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        category VARCHAR(30) CHECK (category IN (
          'flowers','programs','register_books','prayer_cards','candles',
          'photo_displays','video_tribute','jewelry','clothing'
        )),
        description TEXT,
        supplier VARCHAR(255),
        unit_cost NUMERIC(10,2),
        retail_price NUMERIC(10,2),
        quantity_available INTEGER DEFAULT 0,
        lead_time_days INTEGER DEFAULT 1,
        customizable BOOLEAN DEFAULT FALSE,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - memorial_products table created');

    await db.query(`
      CREATE TABLE obituaries (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
        deceased_name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        date_of_death DATE,
        city VARCHAR(100),
        state VARCHAR(50),
        content TEXT,
        survived_by TEXT,
        predeceased_by TEXT,
        education TEXT,
        career TEXT,
        hobbies TEXT,
        charitable_donations TEXT,
        service_info TEXT,
        publication_outlets TEXT,
        publish_date DATE,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','review','approved','published')),
        ai_generated BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - obituaries table created');

    await db.query(`
      CREATE TABLE embalming (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
        embalmer_name VARCHAR(255),
        embalming_date DATE,
        embalming_time TIME,
        chemicals_used TEXT,
        procedure_notes TEXT,
        arterial_solution VARCHAR(255),
        cavity_treatment VARCHAR(255),
        cosmetic_work TEXT,
        restoration_needed BOOLEAN DEFAULT FALSE,
        restoration_notes TEXT,
        condition_on_receipt VARCHAR(100),
        refrigeration_date DATE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','declined')),
        family_viewed BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - embalming table created');

    await db.query(`
      CREATE TABLE cemetery_plots (
        id SERIAL PRIMARY KEY,
        cemetery_name VARCHAR(255) NOT NULL,
        cemetery_address TEXT,
        section VARCHAR(100),
        lot_number VARCHAR(50),
        plot_number VARCHAR(50),
        plot_type VARCHAR(30) CHECK (plot_type IN ('single','double','family','mausoleum','columbarium_niche','green_burial')),
        owner_name VARCHAR(255),
        owner_phone VARCHAR(30),
        owner_email VARCHAR(255),
        purchase_date DATE,
        purchase_price NUMERIC(10,2),
        is_occupied BOOLEAN DEFAULT FALSE,
        case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
        interment_date DATE,
        status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available','reserved','occupied','maintenance')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - cemetery_plots table created');

    await db.query(`
      CREATE TABLE insurance_claims (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
        policy_number VARCHAR(100),
        insurance_company VARCHAR(255) NOT NULL,
        policy_holder_name VARCHAR(255),
        beneficiary_name VARCHAR(255),
        claim_amount NUMERIC(12,2),
        approved_amount NUMERIC(12,2),
        claim_status VARCHAR(30) DEFAULT 'submitted' CHECK (claim_status IN ('pending','submitted','under_review','approved','denied','paid','appealed')),
        submission_date DATE,
        approval_date DATE,
        payment_date DATE,
        agent_name VARCHAR(255),
        agent_phone VARCHAR(30),
        denial_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - insurance_claims table created');

    await db.query(`
      CREATE TABLE vendors (
        id SERIAL PRIMARY KEY,
        vendor_name VARCHAR(255) NOT NULL,
        vendor_type VARCHAR(50) CHECK (vendor_type IN ('florist','caterer','musician','clergy','monument','vault_company','casket_supplier','urn_supplier','printing','livery','cemetery','other')),
        contact_name VARCHAR(255),
        phone VARCHAR(30),
        email VARCHAR(255),
        address TEXT,
        website VARCHAR(500),
        tax_id VARCHAR(50),
        payment_terms VARCHAR(100),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        is_preferred BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        contract_expiry DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - vendors table created');

    await db.query(`
      CREATE TABLE appointments (
        id SERIAL PRIMARY KEY,
        appointment_type VARCHAR(50) CHECK (appointment_type IN ('arrangement_conference','viewing','visitation','consultation','preneed_meeting','pickup','delivery','other')),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
        client_name VARCHAR(255),
        client_phone VARCHAR(30),
        client_email VARCHAR(255),
        assigned_staff VARCHAR(255),
        appointment_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        location VARCHAR(255),
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show')),
        reminder_sent BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - appointments table created');

    await db.query(`
      CREATE TABLE financial_records (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
        transaction_type VARCHAR(30) CHECK (transaction_type IN ('invoice','payment','refund','expense','deposit','adjustment')),
        category VARCHAR(50),
        description TEXT,
        amount NUMERIC(12,2) NOT NULL,
        payment_method VARCHAR(30) CHECK (payment_method IN ('cash','check','credit_card','debit_card','bank_transfer','insurance','financing','other')),
        reference_number VARCHAR(100),
        payer_name VARCHAR(255),
        transaction_date DATE NOT NULL,
        due_date DATE,
        is_paid BOOLEAN DEFAULT FALSE,
        paid_date DATE,
        receipt_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - financial_records table created');

    await db.query(`
      CREATE TABLE communications (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
        communication_type VARCHAR(30) CHECK (communication_type IN ('phone_call','email','in_person','letter','text_message','video_call')),
        direction VARCHAR(10) CHECK (direction IN ('inbound','outbound')),
        contact_name VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(30),
        contact_email VARCHAR(255),
        subject VARCHAR(255),
        content TEXT,
        staff_member VARCHAR(255),
        communication_date DATE NOT NULL,
        communication_time TIME,
        follow_up_needed BOOLEAN DEFAULT FALSE,
        follow_up_date DATE,
        follow_up_completed BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - communications table created');

    await db.query(`
      CREATE TABLE flower_orders (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
        sender_name VARCHAR(255) NOT NULL,
        sender_phone VARCHAR(30),
        sender_relationship VARCHAR(100),
        florist_name VARCHAR(255),
        arrangement_type VARCHAR(50) CHECK (arrangement_type IN ('casket_spray','standing_spray','wreath','bouquet','basket','plant','cross','heart','custom')),
        description TEXT,
        ribbon_message TEXT,
        delivery_date DATE,
        delivery_time TIME,
        delivery_location VARCHAR(255),
        price NUMERIC(10,2),
        is_received BOOLEAN DEFAULT FALSE,
        display_location VARCHAR(255),
        thank_you_sent BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - flower_orders table created');

    await db.query(`
      CREATE TABLE facility_rooms (
        id SERIAL PRIMARY KEY,
        room_name VARCHAR(255) NOT NULL,
        room_type VARCHAR(50) CHECK (room_type IN ('chapel','viewing_room','arrangement_office','preparation_room','reception_hall','lounge','storage','parking')),
        capacity INTEGER,
        floor_level VARCHAR(20),
        has_av_equipment BOOLEAN DEFAULT FALSE,
        has_wheelchair_access BOOLEAN DEFAULT TRUE,
        hourly_rate NUMERIC(8,2),
        description TEXT,
        amenities TEXT,
        case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
        booking_date DATE,
        start_time TIME,
        end_time TIME,
        booking_status VARCHAR(20) DEFAULT 'available' CHECK (booking_status IN ('available','reserved','occupied','maintenance','closed')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - facility_rooms table created');

    await db.query(`
      CREATE TABLE aftercare (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
        family_contact_name VARCHAR(255) NOT NULL,
        family_phone VARCHAR(30),
        family_email VARCHAR(255),
        relationship VARCHAR(100),
        program_type VARCHAR(50) CHECK (program_type IN ('phone_follow_up','home_visit','grief_package','anniversary_card','holiday_remembrance','support_group_referral','memorial_event')),
        scheduled_date DATE,
        completed_date DATE,
        assigned_staff VARCHAR(255),
        content_notes TEXT,
        family_feedback TEXT,
        emotional_status VARCHAR(50),
        referrals_made TEXT,
        next_contact_date DATE,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','overdue','declined')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - aftercare table created');

    console.log('All tables created successfully.');

    // ─── SEED DATA ─────────────────────────────────────────────────────
    console.log('Seeding data...');

    // --- Users ---
    const passwordHash = await bcrypt.hash('admin123', 10);
    await db.query(`
      INSERT INTO users (email, password_hash, full_name, role) VALUES
        ('admin@eternalhaven.com', $1, 'Robert Thornton', 'admin'),
        ('jmitchell@eternalhaven.com', $1, 'Janet Mitchell', 'director'),
        ('dwilson@eternalhaven.com', $1, 'David Wilson', 'embalmer'),
        ('smartinez@eternalhaven.com', $1, 'Sarah Martinez', 'office_admin'),
        ('kpatel@eternalhaven.com', $1, 'Kiran Patel', 'director')
    `, [passwordHash]);
    console.log('  - users seeded');

    // --- Cases (15) ---
    await db.query(`
      INSERT INTO cases (case_number, deceased_first_name, deceased_last_name, date_of_birth, date_of_death, cause_of_death, next_of_kin_name, next_of_kin_phone, next_of_kin_email, next_of_kin_relationship, status, assigned_staff, notes) VALUES
        ('EH-2026-0001', 'Margaret', 'Sullivan', '1941-03-15', '2026-03-10', 'Natural causes', 'Thomas Sullivan', '(512) 555-0142', 'tsullivan@email.com', 'Son', 'active', 'Janet Mitchell', 'Family requests traditional Catholic funeral mass.'),
        ('EH-2026-0002', 'James', 'Henderson', '1935-11-22', '2026-03-08', 'Cardiac arrest', 'Linda Henderson', '(512) 555-0198', 'lhenderson@email.com', 'Wife', 'active', 'Janet Mitchell', 'Veteran - U.S. Army, Korea. Military honors requested.'),
        ('EH-2026-0003', 'Dorothy', 'Chambers', '1948-07-04', '2026-03-05', 'Cancer', 'Michael Chambers', '(713) 555-0321', 'mchambers@email.com', 'Son', 'completed', 'David Wilson', 'Cremation with memorial service. Ashes to be scattered at sea.'),
        ('EH-2026-0004', 'William', 'Foster', '1952-01-30', '2026-03-12', 'Stroke', 'Rebecca Foster', '(512) 555-0477', 'rfoster@email.com', 'Daughter', 'active', 'Janet Mitchell', 'Celebration of life preferred. No formal religious ceremony.'),
        ('EH-2026-0005', 'Patricia', 'Nguyen', '1960-09-18', '2026-03-11', 'Respiratory failure', 'Huy Nguyen', '(214) 555-0553', 'hnguyen@email.com', 'Husband', 'pending', 'Kiran Patel', 'Buddhist ceremony requested. Family flying in from California.'),
        ('EH-2026-0006', 'Robert', 'Kowalski', '1938-12-25', '2026-03-01', 'Natural causes', 'Anna Kowalski', '(512) 555-0611', 'akowalski@email.com', 'Daughter', 'completed', 'Janet Mitchell', 'Polish Catholic traditions. Vigil service night before.'),
        ('EH-2026-0007', 'Helen', 'Washington', '1944-06-10', '2026-03-13', 'Heart failure', 'Marcus Washington', '(713) 555-0744', 'mwashington@email.com', 'Son', 'active', 'David Wilson', 'Large family. Church service at Greater Hope Baptist.'),
        ('EH-2026-0008', 'Charles', 'O''Brien', '1950-04-02', '2026-03-09', 'Liver disease', 'Kathleen O''Brien', '(512) 555-0829', 'kobrien@email.com', 'Wife', 'active', 'Janet Mitchell', 'Irish wake requested. Bagpiper to be arranged.'),
        ('EH-2026-0009', 'Ruth', 'Yamamoto', '1955-08-14', '2026-03-07', 'Cancer', 'Ken Yamamoto', '(214) 555-0918', 'kyamamoto@email.com', 'Husband', 'completed', 'Kiran Patel', 'Combination of Japanese and American traditions.'),
        ('EH-2026-0010', 'Frank', 'Garcia', '1947-02-28', '2026-03-14', 'Natural causes', 'Maria Garcia', '(512) 555-1005', 'mgarcia@email.com', 'Wife', 'active', 'Janet Mitchell', 'Catholic rosary and funeral mass at St. Mary''s Cathedral.'),
        ('EH-2026-0011', 'Virginia', 'Thompson', '1932-10-08', '2026-02-28', 'Pneumonia', 'Sandra Thompson-Lee', '(713) 555-1122', 'stlee@email.com', 'Granddaughter', 'completed', 'David Wilson', 'Small private graveside service. Lived to 93 years.'),
        ('EH-2026-0012', 'George', 'Petrov', '1958-05-19', '2026-03-15', 'Accident', 'Natasha Petrov', '(512) 555-1234', 'npetrov@email.com', 'Wife', 'pending', 'Janet Mitchell', 'Unexpected death. Medical examiner involved. Orthodox Christian service.'),
        ('EH-2026-0013', 'Evelyn', 'Richardson', '1940-11-30', '2026-03-06', 'Alzheimer''s', 'Paul Richardson', '(214) 555-1348', 'prichardson@email.com', 'Son', 'completed', 'Kiran Patel', 'Memorial service with photo display and video tribute.'),
        ('EH-2026-0014', 'Arthur', 'Johansson', '1945-03-21', '2026-03-16', 'Heart attack', 'Lisa Johansson', '(512) 555-1456', 'ljohansson@email.com', 'Wife', 'active', 'Janet Mitchell', 'Swedish-American traditions. Veteran - U.S. Navy.'),
        ('EH-2026-0015', 'Betty', 'Morales', '1953-07-12', '2026-03-17', 'Kidney failure', 'Carlos Morales', '(713) 555-1567', 'cmorales@email.com', 'Husband', 'pending', 'David Wilson', 'Dia de los Muertos-inspired celebration of life requested.')
    `);
    console.log('  - cases seeded');

    // --- Services (15) ---
    await db.query(`
      INSERT INTO services (case_id, service_type, service_date, service_time, location, officiant, music_selections, floral_arrangements, special_requests, estimated_attendees, status, total_cost, notes) VALUES
        (1, 'traditional_funeral', '2026-03-18', '10:00', 'St. Patrick''s Catholic Church, Austin, TX', 'Father Michael Brennan', 'Ave Maria, Amazing Grace, On Eagle''s Wings', 'White lilies, roses, standing spray', 'Holy water blessing, communion service', 150, 'scheduled', 8500.00, 'Full funeral mass with reception to follow.'),
        (2, 'military_honors', '2026-03-17', '14:00', 'Texas State Veterans Cemetery, Killeen, TX', 'Chaplain David Roberts', 'Taps, Battle Hymn of the Republic', 'Red, white, and blue arrangements', 'Flag folding ceremony, 21-gun salute, honor guard', 200, 'scheduled', 7200.00, 'VFW Post 8787 coordinating honor guard.'),
        (3, 'memorial', '2026-03-12', '11:00', 'Eternal Haven Chapel, Houston, TX', 'Rev. Sarah Kim', 'Somewhere Over the Rainbow, What a Wonderful World', 'Tropical flower arrangements', 'Photo slideshow, open mic for memories', 80, 'completed', 4200.00, 'Cremation already completed. Urn displayed at service.'),
        (4, 'celebration_of_life', '2026-03-20', '15:00', 'Barton Creek Country Club, Austin, TX', 'Non-denominational - Family friend Mark Ellis', 'Jazz selections, client''s favorite Sinatra songs', 'Colorful mixed arrangements, sunflowers', 'Outdoor garden setting, cocktail reception', 120, 'scheduled', 6800.00, 'Casual attire requested. Catering arranged separately.'),
        (5, 'traditional_funeral', '2026-03-22', '09:00', 'Jade Buddha Temple, Houston, TX', 'Venerable Thich Minh Hanh', 'Buddhist chanting, meditation bells', 'White chrysanthemums, orchids', 'Incense ceremony, vegetarian reception', 100, 'scheduled', 5500.00, 'Three-day mourning period observed at family home.'),
        (6, 'traditional_funeral', '2026-03-08', '10:30', 'Our Lady of Czestochowa, Austin, TX', 'Father Andrzej Nowak', 'Pie Jesu, Polish hymns', 'White and red carnations', 'Polish prayers, vigil night before', 175, 'completed', 9200.00, 'Reception at Polish American Cultural Center.'),
        (7, 'traditional_funeral', '2026-03-21', '11:00', 'Greater Hope Baptist Church, Houston, TX', 'Pastor Jerome Williams', 'Gospel choir, His Eye Is on the Sparrow, Going Up Yonder', 'White roses, carnations, gladioli', 'Choir performance, repast at church hall', 300, 'scheduled', 7800.00, 'Family expects large turnout. Additional seating arranged.'),
        (8, 'traditional_funeral', '2026-03-19', '10:00', 'Sacred Heart Catholic Church, Austin, TX', 'Father Seamus Kelly', 'Danny Boy, Be Not Afraid, Irish blessing', 'Green and white arrangements', 'Irish wake evening before, bagpiper at graveside', 125, 'scheduled', 8100.00, 'Pub reception following burial at family request.'),
        (9, 'memorial', '2026-03-14', '13:00', 'Eternal Haven Chapel, Dallas, TX', 'Rev. Thomas Hayashi', 'Sakura, classical violin selections', 'Cherry blossoms, white lilies', 'Japanese incense ceremony, origami cranes display', 65, 'completed', 5100.00, 'Combination ceremony honoring both cultures.'),
        (10, 'traditional_funeral', '2026-03-22', '09:30', 'St. Mary''s Cathedral, Austin, TX', 'Monsignor Ricardo Flores', 'Ave Maria, Panis Angelicus, Rosary', 'White roses, carnations', 'Rosary evening before, mariachi at reception', 200, 'scheduled', 7500.00, 'Bilingual service in English and Spanish.'),
        (11, 'graveside', '2026-03-05', '14:00', 'Austin Memorial Park, Austin, TX', 'Rev. Linda Prescott', 'Abide With Me', 'Single standing spray', 'Brief scripture reading, family prayers', 25, 'completed', 3200.00, 'Small family gathering per decedent''s wishes.'),
        (12, 'traditional_funeral', '2026-03-23', '11:00', 'Holy Trinity Orthodox Church, Austin, TX', 'Father Dimitri Volkov', 'Orthodox chants, Memory Eternal', 'White flowers, candles', 'Open casket, Panikhida service', 90, 'scheduled', 6500.00, 'Awaiting medical examiner release of remains.'),
        (13, 'memorial', '2026-03-13', '15:00', 'Eternal Haven Chapel, Dallas, TX', 'Rev. Mark Andrews', 'Wind Beneath My Wings, Clair de Lune', 'Pastel mixed arrangements', 'Video tribute, memory table, butterfly release', 110, 'completed', 4800.00, 'Family provided extensive photo collection for tribute.'),
        (14, 'military_honors', '2026-03-24', '10:00', 'Fort Sam Houston National Cemetery, San Antonio, TX', 'Navy Chaplain Brian Cox', 'Taps, Eternal Father Strong and Savior', 'Red, white, blue arrangements', 'Flag folding, rifle salute, Navy pallbearers', 150, 'scheduled', 7000.00, 'Navy League chapter assisting with arrangements.'),
        (15, 'celebration_of_life', '2026-03-25', '16:00', 'Eternal Haven Garden Pavilion, Houston, TX', 'Family-led ceremony', 'Cielito Lindo, La Bamba, Remember Me (from Coco)', 'Marigolds, colorful papel picado', 'Altar display, favorite foods, music and dancing', 180, 'scheduled', 5900.00, 'Festive celebration honoring Mexican heritage.')
    `);
    console.log('  - services seeded');

    // --- Compliance (15) ---
    await db.query(`
      INSERT INTO compliance (state_code, state_name, requirement_type, requirement_name, description, deadline_days, penalty_amount, is_active, last_reviewed, notes) VALUES
        ('TX', 'Texas', 'license', 'Funeral Director License', 'Texas Funeral Service Commission requires active funeral director license for all directors.', 365, 5000.00, true, '2026-01-15', 'Renewal due annually. Must complete 16 hours CE credits.'),
        ('TX', 'Texas', 'license', 'Embalmer License', 'Separate embalmer license required under Texas Health and Safety Code.', 365, 5000.00, true, '2026-01-15', 'Must maintain active status with TFSC.'),
        ('TX', 'Texas', 'permit', 'Burial Transit Permit', 'Required before transporting remains across county or state lines.', 3, 1000.00, true, '2026-02-01', 'Must be obtained before transportation begins.'),
        ('TX', 'Texas', 'regulation', 'FTC Funeral Rule Compliance', 'Federal Trade Commission Funeral Rule requires itemized General Price List.', 0, 10000.00, true, '2026-01-01', 'GPL must be provided at beginning of all arrangements conferences.'),
        ('TX', 'Texas', 'regulation', 'Embalming Authorization', 'Written authorization required before embalming. Cannot require embalming as condition of sale.', 0, 2500.00, true, '2026-02-10', 'Must offer alternatives to embalming when applicable.'),
        ('TX', 'Texas', 'reporting', 'Death Certificate Filing', 'Death certificate must be filed with local registrar within specified timeframe.', 10, 500.00, true, '2026-02-15', 'Physician must certify cause of death within 5 days.'),
        ('TX', 'Texas', 'permit', 'Cremation Authorization', 'Cremation requires authorization from next-of-kin and medical examiner clearance.', 2, 2000.00, true, '2026-01-20', '48-hour waiting period after death before cremation.'),
        ('TX', 'Texas', 'regulation', 'Preneed Contract Registration', 'All preneed funeral contracts must be registered with the Texas Department of Banking.', 30, 5000.00, true, '2026-03-01', 'Trust-funded preneed contracts must meet state requirements.'),
        ('CA', 'California', 'license', 'Funeral Establishment License', 'Cemetery and Funeral Bureau license required for all funeral establishments in CA.', 365, 7500.00, true, '2025-12-15', 'Applies to Eternal Haven''s planned California expansion.'),
        ('CA', 'California', 'regulation', 'Cooling Requirement', 'Remains must be embalmed or refrigerated within 24 hours of receipt.', 1, 3000.00, true, '2025-12-15', 'Refrigeration at 40 degrees F or below.'),
        ('FL', 'Florida', 'license', 'Funeral Director License', 'Florida Board of Funeral, Cemetery, and Consumer Services license.', 365, 5000.00, true, '2026-01-10', 'For Eternal Haven Orlando location.'),
        ('FL', 'Florida', 'regulation', 'Consumer Protection Disclosures', 'Florida requires specific consumer protection disclosures beyond FTC Funeral Rule.', 0, 2500.00, true, '2026-01-10', 'State-specific disclosure forms must be used.'),
        ('TX', 'Texas', 'reporting', 'OSHA Formaldehyde Compliance', 'OSHA formaldehyde exposure monitoring and reporting for embalming staff.', 180, 7000.00, true, '2026-02-20', 'Air monitoring required. PEL 0.75 ppm TWA.'),
        ('TX', 'Texas', 'permit', 'Disposition Permit', 'Disposition permit required before final disposition of remains.', 5, 1000.00, true, '2026-02-01', 'Must accompany remains to place of final disposition.'),
        ('TX', 'Texas', 'regulation', 'Price Disclosure Requirements', 'Must provide itemized statement of goods and services before final disposition.', 0, 5000.00, true, '2026-03-05', 'Statement must include all charges and be signed by purchaser.')
    `);
    console.log('  - compliance seeded');

    // --- Pricing (15) ---
    await db.query(`
      INSERT INTO pricing (item_category, item_name, item_description, unit_price, is_package, package_includes, is_required, display_order, is_active) VALUES
        ('professional_services', 'Basic Services of Funeral Director & Staff', 'Includes arrangement conference, coordination with cemetery/crematory, securing permits, and filing death certificate.', 2495.00, false, NULL, true, 1, true),
        ('professional_services', 'Embalming', 'Arterial and cavity embalming, cosmetic restoration, dressing, and casketing.', 895.00, false, NULL, false, 2, true),
        ('professional_services', 'Other Preparation of Remains', 'Washing, setting features, dressing, and casketing without embalming.', 395.00, false, NULL, false, 3, true),
        ('facilities', 'Use of Facilities for Viewing', 'Use of funeral home facilities for viewing/visitation for up to 4 hours.', 595.00, false, NULL, false, 4, true),
        ('facilities', 'Use of Facilities for Funeral Ceremony', 'Use of chapel or ceremony room for funeral service.', 695.00, false, NULL, false, 5, true),
        ('facilities', 'Use of Facilities for Memorial Service', 'Use of chapel or ceremony room for memorial service (no remains present).', 595.00, false, NULL, false, 6, true),
        ('transportation', 'Transfer of Remains to Funeral Home', 'Initial removal and transport of remains to funeral home within 50-mile radius.', 495.00, false, NULL, false, 7, true),
        ('transportation', 'Hearse to Cemetery/Crematory', 'Hearse transportation for funeral procession to cemetery or crematory.', 395.00, false, NULL, false, 8, true),
        ('transportation', 'Limousine Service', 'Limousine service for immediate family, up to 6 passengers.', 350.00, false, NULL, false, 9, true),
        ('merchandise', 'Standard Steel Casket - Brushed Silver', '20-gauge steel casket with white velvet interior and adjustable bed.', 2995.00, false, NULL, false, 10, true),
        ('merchandise', 'Premium Hardwood Casket - Cherry', 'Solid cherry wood casket with champagne satin interior, hand-rubbed finish.', 5495.00, false, NULL, false, 11, true),
        ('merchandise', 'Cremation Urn - Classic Bronze', 'Adult-size bronze cremation urn with engraved nameplate.', 395.00, false, NULL, false, 12, true),
        ('cash_advances', 'Cemetery Charges', 'Opening and closing of grave, grave liner, and cemetery fees (estimated).', 1500.00, false, NULL, false, 13, true),
        ('cash_advances', 'Death Certificates (5 certified copies)', 'Certified copies of death certificate from county clerk.', 105.00, false, NULL, false, 14, true),
        ('professional_services', 'Traditional Funeral Package', 'Complete funeral service including basic services, embalming, viewing, ceremony, hearse, and standard casket.', 8995.00, true, 'Basic services, embalming, viewing (4 hrs), funeral ceremony, hearse, standard steel casket, memorial folders', false, 15, true)
    `);
    console.log('  - pricing seeded');

    // --- Preneed (15) ---
    await db.query(`
      INSERT INTO preneed (plan_name, client_first_name, client_last_name, client_email, client_phone, client_dob, plan_type, payment_method, total_amount, amount_paid, monthly_payment, service_preferences, merchandise_selections, special_instructions, status) VALUES
        ('Eternal Peace Plan', 'Harold', 'Whitfield', 'hwhitfield@email.com', '(512) 555-2001', '1948-04-12', 'premium', 'lump_sum', 12500.00, 12500.00, NULL, 'Traditional funeral with full Catholic mass', 'Premium cherry casket, bronze vault', 'Specific hymns listed in file. Family plot at Holy Cross Cemetery.', 'paid_in_full'),
        ('Serenity Plan', 'Martha', 'Edelstein', 'medelstein@email.com', '(512) 555-2015', '1951-09-03', 'standard', 'installment', 8500.00, 5100.00, 225.00, 'Traditional funeral service', 'Standard steel casket, concrete vault', 'No viewing. Closed casket preferred.', 'active'),
        ('Simple Cremation Plan', 'Donald', 'Yates', 'dyates@email.com', '(713) 555-2028', '1955-11-28', 'basic', 'lump_sum', 3200.00, 3200.00, NULL, 'Direct cremation, no service', 'Basic cremation urn', 'Scatter ashes at Lake Travis per prior arrangement.', 'paid_in_full'),
        ('Heritage Plan', 'Shirley', 'Lundgren', 'slundgren@email.com', '(214) 555-2041', '1943-07-16', 'premium', 'insurance', 14000.00, 14000.00, NULL, 'Full traditional service with military honors', 'Solid mahogany casket, bronze vault', 'Husband is veteran. Coordinate with VA for headstone.', 'paid_in_full'),
        ('Comfort Plan', 'Eugene', 'Park', 'epark@email.com', '(512) 555-2054', '1960-02-20', 'standard', 'installment', 7800.00, 3120.00, 195.00, 'Memorial service after cremation', 'Designer urn, memorial package', 'Korean Presbyterian church for memorial service.', 'active'),
        ('Eternal Rest Plan', 'Dolores', 'Fitzpatrick', 'dfitzpatrick@email.com', '(512) 555-2067', '1946-12-05', 'premium', 'lump_sum', 13200.00, 13200.00, NULL, 'Traditional Irish Catholic funeral', 'Premium casket, granite vault', 'Wake at funeral home. Specific readings chosen.', 'paid_in_full'),
        ('Simplicity Plan', 'Raymond', 'Chow', 'rchow@email.com', '(713) 555-2080', '1958-08-30', 'basic', 'installment', 4500.00, 1800.00, 150.00, 'Direct burial with brief graveside service', 'Standard casket', 'Minimal ceremony per personal preference.', 'active'),
        ('Legacy Plan', 'Frances', 'Blackwell', 'fblackwell@email.com', '(214) 555-2093', '1940-01-14', 'custom', 'insurance', 16000.00, 16000.00, NULL, 'Celebration of life with reception', 'Cherry casket, custom vault, memorial jewelry for family', 'Elaborate photo display. Reception catering included.', 'paid_in_full'),
        ('Garden Memorial Plan', 'Clarence', 'Novak', 'cnovak@email.com', '(512) 555-2106', '1952-06-22', 'standard', 'installment', 8200.00, 6560.00, 205.00, 'Outdoor garden ceremony', 'Standard casket, concrete vault', 'Butterfly release at conclusion of service.', 'active'),
        ('Peaceful Journey Plan', 'Mildred', 'Santos', 'msantos@email.com', '(713) 555-2119', '1949-10-09', 'premium', 'lump_sum', 11800.00, 11800.00, NULL, 'Bilingual funeral mass', 'Premium steel casket, marble vault', 'Service in English and Spanish. Mariachi band at reception.', 'paid_in_full'),
        ('Basic Dignity Plan', 'Leonard', 'Hoffman', 'lhoffman@email.com', '(512) 555-2132', '1963-03-17', 'basic', 'installment', 3800.00, 950.00, 125.00, 'Direct cremation with urn delivery', 'Standard urn', 'No service desired. Urn to be delivered to daughter.', 'active'),
        ('Everlasting Care Plan', 'Gloria', 'Nakamura', 'gnakamura@email.com', '(214) 555-2145', '1945-05-25', 'custom', 'insurance', 15500.00, 15500.00, NULL, 'Japanese-American blended ceremony', 'Custom cherry casket, bronze vault, memorial keepsakes', 'Incense ceremony, origami crane display, Buddhist chants.', 'paid_in_full'),
        ('Horizon Plan', 'Ralph', 'Gutierrez', 'rgutierrez@email.com', '(512) 555-2158', '1957-09-11', 'standard', 'installment', 7500.00, 4500.00, 187.50, 'Traditional Catholic funeral', 'Standard hardwood casket, vault', 'Rosary night before. Burial at Assumption Cemetery.', 'active'),
        ('Twilight Comfort Plan', 'Edith', 'O''Malley', 'eomalley@email.com', '(713) 555-2171', '1942-08-02', 'premium', 'lump_sum', 13000.00, 13000.00, NULL, 'Traditional funeral with choir', 'Mahogany casket, granite vault', 'St. Brigid''s Church choir committed. Reception at parish hall.', 'paid_in_full'),
        ('Meadow Plan', 'Vernon', 'Duval', 'vduval@email.com', '(512) 555-2184', '1961-04-18', 'basic', 'installment', 4200.00, 2100.00, 140.00, 'Graveside service only', 'Standard casket', 'Brief non-denominational reading. Family only.', 'active')
    `);
    console.log('  - preneed seeded');

    // --- Atneed (15) ---
    await db.query(`
      INSERT INTO atneed (case_id, contact_first_name, contact_last_name, contact_phone, contact_email, contact_relationship, urgency_level, initial_call_date, initial_call_time, location_of_death, removal_needed, removal_address, medical_examiner_required, special_circumstances, status, assigned_to, notes) VALUES
        (1, 'Thomas', 'Sullivan', '(512) 555-0142', 'tsullivan@email.com', 'Son', 'standard', '2026-03-10', '08:15', 'Seton Medical Center, Austin, TX', true, '1201 W 38th St, Austin, TX 78705', false, NULL, 'arrangements_made', 'Janet Mitchell', 'Family notified all relatives. Arrangements conference at 2 PM March 11.'),
        (2, 'Linda', 'Henderson', '(512) 555-0198', 'lhenderson@email.com', 'Wife', 'standard', '2026-03-08', '06:30', 'Home - 4521 Oak Lane, Austin, TX', true, '4521 Oak Lane, Austin, TX 78731', false, NULL, 'arrangements_made', 'Janet Mitchell', 'Veteran services coordinator contacted. VA benefits being processed.'),
        (3, 'Michael', 'Chambers', '(713) 555-0321', 'mchambers@email.com', 'Son', 'standard', '2026-03-05', '14:20', 'MD Anderson Cancer Center, Houston, TX', true, '1515 Holcombe Blvd, Houston, TX 77030', false, 'Expected death, hospice involved', 'completed', 'David Wilson', 'Hospice nurse present. Smooth removal. Cremation completed March 10.'),
        (4, 'Rebecca', 'Foster', '(512) 555-0477', 'rfoster@email.com', 'Daughter', 'standard', '2026-03-12', '10:45', 'Brackenridge Hospital, Austin, TX', true, '601 E 15th St, Austin, TX 78701', false, NULL, 'arrangements_made', 'Janet Mitchell', 'Daughter making all arrangements. Non-traditional service planned.'),
        (5, 'Huy', 'Nguyen', '(214) 555-0553', 'hnguyen@email.com', 'Husband', 'immediate', '2026-03-11', '22:00', 'Baylor University Medical Center, Dallas, TX', true, '3500 Gaston Ave, Dallas, TX 75246', false, 'Family members traveling from Vietnam and California', 'in_progress', 'Kiran Patel', 'Late evening call. Removal completed at 11:45 PM. Buddhist temple contacted.'),
        (6, 'Anna', 'Kowalski', '(512) 555-0611', 'akowalski@email.com', 'Daughter', 'standard', '2026-03-01', '09:00', 'Home - 782 Meadow Creek Dr, Austin, TX', true, '782 Meadow Creek Dr, Austin, TX 78745', false, 'Peacefully at home, hospice care', 'completed', 'Janet Mitchell', 'Polish community support. Large extended family involved.'),
        (7, 'Marcus', 'Washington', '(713) 555-0744', 'mwashington@email.com', 'Son', 'standard', '2026-03-13', '11:30', 'Memorial Hermann Hospital, Houston, TX', true, '6411 Fannin St, Houston, TX 77030', false, NULL, 'arrangements_made', 'David Wilson', 'Pastor Jerome Williams at Greater Hope Baptist coordinating.'),
        (8, 'Kathleen', 'O''Brien', '(512) 555-0829', 'kobrien@email.com', 'Wife', 'standard', '2026-03-09', '16:00', 'St. David''s Medical Center, Austin, TX', true, '919 E 32nd St, Austin, TX 78705', false, NULL, 'arrangements_made', 'Janet Mitchell', 'Irish community organizing wake. Bagpiper booked.'),
        (9, 'Ken', 'Yamamoto', '(214) 555-0918', 'kyamamoto@email.com', 'Husband', 'standard', '2026-03-07', '07:45', 'Home - 1205 Sakura Lane, Dallas, TX', true, '1205 Sakura Lane, Dallas, TX 75230', false, 'Expected death, oncology home care', 'completed', 'Kiran Patel', 'Family requested Japanese funeral customs be observed.'),
        (10, 'Maria', 'Garcia', '(512) 555-1005', 'mgarcia@email.com', 'Wife', 'standard', '2026-03-14', '05:15', 'Home - 3340 Riverside Dr, Austin, TX', true, '3340 Riverside Dr, Austin, TX 78741', false, 'Passed in sleep, natural causes', 'arrangements_made', 'Janet Mitchell', 'Large Catholic family. Monsignor Flores at St. Mary''s coordinating.'),
        (11, 'Sandra', 'Thompson-Lee', '(713) 555-1122', 'stlee@email.com', 'Granddaughter', 'planned', '2026-02-28', '13:00', 'Sunrise Senior Living, Houston, TX', true, '8550 Woodway Dr, Houston, TX 77063', false, 'Elderly resident, expected passing', 'completed', 'David Wilson', 'Small family. Granddaughter is sole decision-maker.'),
        (12, 'Natasha', 'Petrov', '(512) 555-1234', 'npetrov@email.com', 'Wife', 'immediate', '2026-03-15', '03:30', 'Scene of accident - IH-35 and Oltorf, Austin, TX', false, NULL, true, 'Motor vehicle accident, medical examiner has jurisdiction', 'in_progress', 'Janet Mitchell', 'ME investigation ongoing. Estimated release in 48-72 hours.'),
        (13, 'Paul', 'Richardson', '(214) 555-1348', 'prichardson@email.com', 'Son', 'standard', '2026-03-06', '09:30', 'Memory Care of North Dallas, Dallas, TX', true, '12700 Preston Rd, Dallas, TX 75230', false, 'Long-term Alzheimer''s patient', 'completed', 'Kiran Patel', 'Family had time to prepare. Preneed-like planning done informally.'),
        (14, 'Lisa', 'Johansson', '(512) 555-1456', 'ljohansson@email.com', 'Wife', 'immediate', '2026-03-16', '07:00', 'Home - 2901 Westlake Dr, Austin, TX', true, '2901 Westlake Dr, Austin, TX 78746', false, 'Sudden cardiac arrest at home', 'arrangements_made', 'Janet Mitchell', 'Navy veteran services being coordinated. Fort Sam Houston confirmed.'),
        (15, 'Carlos', 'Morales', '(713) 555-1567', 'cmorales@email.com', 'Husband', 'standard', '2026-03-17', '12:15', 'Houston Methodist Hospital, Houston, TX', true, '6565 Fannin St, Houston, TX 77030', false, 'On dialysis, expected decline', 'in_progress', 'David Wilson', 'Family planning celebration of life with Dia de los Muertos themes.')
    `);
    console.log('  - atneed seeded');

    // --- Grief Support (15) ---
    await db.query(`
      INSERT INTO grief_support (resource_type, resource_name, provider_name, description, contact_info, website_url, availability, cost, is_free, specialization, rating, is_active) VALUES
        ('counselor', 'Dr. Eleanor Voss, PhD, LPC', 'Austin Grief & Loss Center', 'Licensed professional counselor specializing in bereavement and complicated grief.', '(512) 555-3001', 'https://austingriefcenter.com', 'Mon-Fri 9AM-6PM, Sat by appointment', 150.00, false, 'Complicated grief, traumatic loss', 4.9, true),
        ('counselor', 'Dr. Marcus Boyd, PsyD', 'Houston Bereavement Services', 'Clinical psychologist with 20 years experience in grief therapy.', '(713) 555-3015', 'https://houstonbereavementservices.com', 'Mon-Thu 8AM-7PM', 175.00, false, 'Spousal loss, elderly grief', 4.8, true),
        ('support_group', 'Healing Hearts Widow/Widower Group', 'Eternal Haven Funeral Home', 'Weekly support group for those who have lost a spouse. Facilitated by licensed counselor.', '(512) 555-3028', 'https://eternalhaven.com/grief-support', 'Every Tuesday 6:30-8:00 PM', 0.00, true, 'Spousal loss', 4.7, true),
        ('support_group', 'Parents of Lost Children Support Circle', 'Compassionate Friends - Austin Chapter', 'Monthly meeting for parents grieving the loss of a child of any age.', '(512) 555-3041', 'https://compassionatefriends.org/austin', 'First Saturday of each month 10AM-12PM', 0.00, true, 'Child loss, infant loss', 4.9, true),
        ('hotline', 'National Grief Support Hotline', 'American Foundation for Grief Counseling', '24/7 toll-free hotline staffed by trained grief counselors.', '1-800-555-HOPE (4673)', 'https://griefhotline.org', '24/7/365', 0.00, true, 'General grief, crisis intervention', 4.5, true),
        ('book', 'On Grief and Grieving', 'Elisabeth Kubler-Ross & David Kessler', 'Exploration of the five stages of grief with practical wisdom for navigating loss.', 'Available at local bookstores', 'https://grief.com', 'Available anytime', 16.99, false, 'General grief education', 4.8, true),
        ('book', 'It''s OK That You''re Not OK', 'Megan Devine', 'Radical approach to grief that validates the pain rather than trying to fix it.', 'Available at local bookstores', 'https://refugeingrief.com', 'Available anytime', 17.99, false, 'Modern grief perspectives', 4.7, true),
        ('website', 'GriefShare Online Community', 'GriefShare International', 'Faith-based grief recovery support group program with video seminars and discussion groups.', 'info@griefshare.org', 'https://griefshare.org', 'Online 24/7, local groups weekly', 20.00, false, 'Faith-based grief recovery', 4.6, true),
        ('workshop', 'Navigating the First Year After Loss', 'Austin Hospice & Palliative Care', '8-week workshop series helping bereaved individuals through the first year milestones.', '(512) 555-3054', 'https://austinhospice.org/workshops', 'Quarterly sessions, evenings 7-9 PM', 0.00, true, 'First-year grief, milestone coping', 4.8, true),
        ('counselor', 'Maria Elena Garza, LCSW', 'Bilingual Counseling Associates', 'Bilingual (English/Spanish) grief counselor specializing in culturally sensitive bereavement care.', '(512) 555-3067', 'https://bilingualcounselingaustin.com', 'Mon-Fri 10AM-7PM', 125.00, false, 'Hispanic/Latino families, bilingual services', 4.9, true),
        ('support_group', 'Survivors of Suicide Loss', 'AFSP - Austin Chapter', 'Monthly support group for those who have lost loved ones to suicide.', '(512) 555-3080', 'https://afsp.org/austin', 'Third Wednesday of each month 7-8:30 PM', 0.00, true, 'Suicide loss, survivor guilt', 4.7, true),
        ('workshop', 'Children and Grief: A Parent''s Guide', 'Dell Children''s Medical Center', 'Workshop for parents and caregivers on helping children cope with death and loss.', '(512) 555-3093', 'https://dellchildrens.org/grief', 'Monthly Saturday mornings 9-11 AM', 0.00, true, 'Childhood grief, parenting through loss', 4.6, true),
        ('hotline', 'Veterans Crisis Line - Bereavement', 'U.S. Department of Veterans Affairs', 'Specialized support for those grieving the loss of a veteran or military family member.', '1-800-273-8255 Press 1', 'https://veteranscrisisline.net', '24/7/365', 0.00, true, 'Military families, veteran loss', 4.5, true),
        ('website', 'What''s Your Grief', 'Eleanor Haley & Litsa Williams', 'Educational website with articles, podcasts, and e-courses on understanding and coping with grief.', 'hello@whatsyourgrief.com', 'https://whatsyourgrief.com', 'Online 24/7', 0.00, true, 'Grief education, self-help resources', 4.8, true),
        ('counselor', 'Dr. James Chen, PhD', 'Dallas Center for Grief & Trauma', 'Specialist in trauma-related grief, EMDR-trained, serving multicultural communities.', '(214) 555-3106', 'https://dallasgriefcenter.com', 'Mon-Fri 8AM-6PM, evenings available', 185.00, false, 'Traumatic loss, PTSD-related grief', 4.9, true)
    `);
    console.log('  - grief_support seeded');

    // --- Inventory (15) ---
    await db.query(`
      INSERT INTO inventory (item_name, category, sku, supplier, quantity_on_hand, reorder_level, unit_cost, retail_price, location_in_facility, last_restocked, is_active, notes) VALUES
        ('Brushed Silver 20-Gauge Steel Casket', 'caskets', 'CSK-STL-001', 'Batesville Casket Company', 8, 3, 1200.00, 2995.00, 'Showroom A - Display Row 1', '2026-02-15', true, 'Best seller. White velvet interior, adjustable mattress.'),
        ('Solid Cherry Hardwood Casket', 'caskets', 'CSK-WD-002', 'Batesville Casket Company', 4, 2, 2200.00, 5495.00, 'Showroom A - Display Row 2', '2026-01-20', true, 'Premium line. Champagne satin interior, hand-rubbed finish.'),
        ('Mahogany Estate Casket', 'caskets', 'CSK-WD-003', 'Aurora Casket Company', 3, 2, 3100.00, 7495.00, 'Showroom A - Display Row 2', '2026-02-01', true, 'Top-tier casket. Full couch, memory drawer.'),
        ('Poplar Cremation Casket', 'caskets', 'CSK-CRM-004', 'Batesville Casket Company', 6, 3, 450.00, 1195.00, 'Storage Room B', '2026-03-01', true, 'For cremation services requiring a casket for viewing.'),
        ('Classic Bronze Cremation Urn', 'urns', 'URN-BRZ-001', 'Stardust Memorials', 12, 5, 95.00, 395.00, 'Display Cabinet - Main Hall', '2026-03-05', true, 'Engraved nameplate included. Holds standard adult remains.'),
        ('Marble Companion Urn', 'urns', 'URN-MRB-002', 'Stardust Memorials', 4, 2, 180.00, 595.00, 'Display Cabinet - Main Hall', '2026-02-10', true, 'For couples. Two compartments with individual nameplates.'),
        ('Keepsake Mini Urn Set (4-pack)', 'urns', 'URN-KS-003', 'Stardust Memorials', 15, 5, 35.00, 149.00, 'Display Cabinet - Main Hall', '2026-03-10', true, 'Set of 4 small urns for sharing remains among family.'),
        ('Standard Concrete Burial Vault', 'vaults', 'VLT-CON-001', 'Wilbert Burial Vault', 10, 4, 400.00, 1295.00, 'Warehouse - Bay 3', '2026-02-20', true, 'Standard protection. Meets most cemetery requirements.'),
        ('Premium Bronze-Lined Vault', 'vaults', 'VLT-BRZ-002', 'Wilbert Burial Vault', 3, 2, 1800.00, 4995.00, 'Warehouse - Bay 3', '2026-01-15', true, 'Maximum protection. Bronze inner liner, stainless steel.'),
        ('Embalming Fluid - Arterial (case of 24)', 'chemicals', 'CHM-ART-001', 'Dodge Chemical Company', 5, 2, 320.00, NULL, 'Prep Room - Chemical Cabinet', '2026-03-08', true, 'Index 25. Standard formaldehyde-based arterial fluid.'),
        ('Cavity Fluid (case of 24)', 'chemicals', 'CHM-CAV-002', 'Dodge Chemical Company', 4, 2, 280.00, NULL, 'Prep Room - Chemical Cabinet', '2026-03-08', true, 'High-index cavity treatment chemical.'),
        ('Men''s Burial Suit - Navy (assorted sizes)', 'clothing', 'CLO-MST-001', 'Final Embrace Garments', 8, 4, 85.00, 295.00, 'Dressing Room - Closet A', '2026-02-25', true, 'Sizes S through XXL. Velcro closure back.'),
        ('Women''s Burial Dress - Lilac (assorted sizes)', 'clothing', 'CLO-WDR-002', 'Final Embrace Garments', 7, 4, 90.00, 295.00, 'Dressing Room - Closet B', '2026-02-25', true, 'Sizes S through XXL. Lace trim, modesty panel.'),
        ('Fingerprint Memorial Pendant - Sterling Silver', 'keepsakes', 'KSK-FPR-001', 'Legacy Touch', 20, 8, 45.00, 149.00, 'Display Cabinet - Keepsakes', '2026-03-01', true, 'Custom fingerprint engraving. Chain included.'),
        ('Preparation Room Supply Kit', 'supplies', 'SUP-PRK-001', 'Kelco Supply Company', 6, 3, 175.00, NULL, 'Prep Room - Supply Shelf', '2026-03-05', true, 'Includes trocar buttons, eye caps, mouth formers, needle injectors.')
    `);
    console.log('  - inventory seeded');

    // --- Staff (15) ---
    await db.query(`
      INSERT INTO staff (first_name, last_name, email, phone, role, license_number, license_expiry, hire_date, hourly_rate, is_full_time, is_active, certifications, notes) VALUES
        ('Robert', 'Thornton', 'rthornton@eternalhaven.com', '(512) 555-4001', 'director', 'TX-FD-2018-4412', '2027-01-31', '2015-03-01', 52.00, true, true, 'Licensed Funeral Director, Certified Crematory Operator, OSHA Formaldehyde Certified', 'Owner and General Manager. 25+ years experience.'),
        ('Janet', 'Mitchell', 'jmitchell@eternalhaven.com', '(512) 555-4015', 'director', 'TX-FD-2019-5587', '2027-03-31', '2017-06-15', 45.00, true, true, 'Licensed Funeral Director, Certified Preplanning Consultant', 'Senior Funeral Director. Handles majority of arrangement conferences.'),
        ('David', 'Wilson', 'dwilson@eternalhaven.com', '(713) 555-4028', 'embalmer', 'TX-EMB-2016-3321', '2026-12-31', '2016-09-01', 42.00, true, true, 'Licensed Embalmer, Restorative Art Certification, OSHA Certified', 'Chief Embalmer. Houston location primary. Expert in restorative art.'),
        ('Kiran', 'Patel', 'kpatel@eternalhaven.com', '(214) 555-4041', 'director', 'TX-FD-2020-6743', '2027-06-30', '2020-01-10', 40.00, true, true, 'Licensed Funeral Director, Multicultural Funeral Services Cert', 'Dallas location director. Specializes in multicultural services.'),
        ('Sarah', 'Martinez', 'smartinez@eternalhaven.com', '(512) 555-4054', 'office_admin', NULL, NULL, '2018-04-20', 28.00, true, true, 'QuickBooks Certified, Notary Public', 'Office Manager. Handles billing, insurance claims, scheduling.'),
        ('Thomas', 'Grant', 'tgrant@eternalhaven.com', '(512) 555-4067', 'embalmer', 'TX-EMB-2021-7891', '2027-09-30', '2021-05-01', 38.00, true, true, 'Licensed Embalmer, OSHA Certified', 'Austin location embalmer. Trained in eco-friendly embalming.'),
        ('Patricia', 'Coleman', 'pcoleman@eternalhaven.com', '(512) 555-4080', 'grief_counselor', NULL, NULL, '2019-08-15', 35.00, true, true, 'LPC, Certified Grief Counselor, Trauma-Informed Care', 'Leads bereavement support groups. Individual counseling available.'),
        ('Michael', 'Reeves', 'mreeves@eternalhaven.com', '(512) 555-4093', 'attendant', NULL, NULL, '2022-02-01', 22.00, true, true, 'CPR/First Aid, Pallbearer Training', 'Senior funeral attendant. Coordinates visitations and services.'),
        ('Angela', 'Brooks', 'abrooks@eternalhaven.com', '(713) 555-4106', 'attendant', NULL, NULL, '2023-07-10', 20.00, true, true, 'CPR/First Aid', 'Houston location attendant. Evening and weekend availability.'),
        ('James', 'Hawkins', 'jhawkins@eternalhaven.com', '(512) 555-4119', 'driver', 'CDL-TX-HWK-9912', '2027-05-31', '2020-11-01', 24.00, true, true, 'CDL Class B, Defensive Driving', 'Primary hearse and limousine driver. Vehicle maintenance oversight.'),
        ('Carlos', 'Rivera', 'crivera@eternalhaven.com', '(713) 555-4132', 'driver', 'CDL-TX-RVR-8834', '2027-02-28', '2021-03-15', 22.00, true, true, 'CDL Class B', 'Houston location driver. Removal and transport specialist.'),
        ('Linda', 'Nakamura', 'lnakamura@eternalhaven.com', '(214) 555-4145', 'office_admin', NULL, NULL, '2022-09-01', 25.00, true, true, 'QuickBooks Certified, Bilingual Japanese/English', 'Dallas office administrator. Assists with multicultural families.'),
        ('Raymond', 'Foster', 'rfoster@eternalhaven.com', '(512) 555-4158', 'attendant', NULL, NULL, '2024-01-15', 19.00, false, true, 'CPR/First Aid', 'Part-time weekend attendant. College student.'),
        ('Diane', 'Prescott', 'dprescott@eternalhaven.com', '(512) 555-4171', 'office_admin', NULL, NULL, '2023-05-01', 26.00, true, true, 'Notary Public, Preneed Contract Administration', 'Preneed contracts administrator. Handles all preneed paperwork.'),
        ('William', 'Chen', 'wchen@eternalhaven.com', '(214) 555-4184', 'embalmer', 'TX-EMB-2022-8456', '2027-11-30', '2022-06-01', 36.00, true, true, 'Licensed Embalmer, OSHA Certified', 'Dallas location embalmer. Bilingual Mandarin/English.')
    `);
    console.log('  - staff seeded');

    // --- Documents (15) ---
    await db.query(`
      INSERT INTO documents (case_id, document_type, document_name, file_path, issued_by, issued_date, expiry_date, status, notes) VALUES
        (1, 'death_certificate', 'Sullivan_Margaret_DeathCert.pdf', '/documents/cases/EH-2026-0001/death_certificate.pdf', 'Travis County Vital Records', '2026-03-11', NULL, 'filed', 'Five certified copies obtained.'),
        (1, 'embalming_authorization', 'Sullivan_Margaret_EmbalmAuth.pdf', '/documents/cases/EH-2026-0001/embalming_auth.pdf', 'Eternal Haven Funeral Home', '2026-03-10', NULL, 'approved', 'Signed by Thomas Sullivan, son.'),
        (2, 'death_certificate', 'Henderson_James_DeathCert.pdf', '/documents/cases/EH-2026-0002/death_certificate.pdf', 'Travis County Vital Records', '2026-03-09', NULL, 'filed', 'Five certified copies obtained.'),
        (2, 'veteran_discharge', 'Henderson_James_DD214.pdf', '/documents/cases/EH-2026-0002/dd214.pdf', 'U.S. Department of Defense', '1957-06-15', NULL, 'filed', 'Honorable discharge. Korea veteran. Needed for VA burial benefits.'),
        (3, 'cremation_authorization', 'Chambers_Dorothy_CremAuth.pdf', '/documents/cases/EH-2026-0003/cremation_auth.pdf', 'Eternal Haven Funeral Home', '2026-03-06', NULL, 'approved', 'Signed by Michael Chambers, son. 48-hour waiting period observed.'),
        (3, 'death_certificate', 'Chambers_Dorothy_DeathCert.pdf', '/documents/cases/EH-2026-0003/death_certificate.pdf', 'Harris County Vital Records', '2026-03-06', NULL, 'filed', 'Three certified copies.'),
        (4, 'death_certificate', 'Foster_William_DeathCert.pdf', '/documents/cases/EH-2026-0004/death_certificate.pdf', 'Travis County Vital Records', '2026-03-13', NULL, 'pending', 'Awaiting physician signature on cause of death.'),
        (5, 'death_certificate', 'Nguyen_Patricia_DeathCert.pdf', '/documents/cases/EH-2026-0005/death_certificate.pdf', 'Dallas County Vital Records', '2026-03-12', NULL, 'draft', 'Pending medical records from Baylor.'),
        (6, 'death_certificate', 'Kowalski_Robert_DeathCert.pdf', '/documents/cases/EH-2026-0006/death_certificate.pdf', 'Travis County Vital Records', '2026-03-02', NULL, 'filed', 'Five certified copies. All insurance claims filed.'),
        (6, 'burial_permit', 'Kowalski_Robert_BurialPermit.pdf', '/documents/cases/EH-2026-0006/burial_permit.pdf', 'Travis County Clerk', '2026-03-03', NULL, 'filed', 'Burial at Holy Cross Cemetery, Austin.'),
        (7, 'embalming_authorization', 'Washington_Helen_EmbalmAuth.pdf', '/documents/cases/EH-2026-0007/embalming_auth.pdf', 'Eternal Haven Funeral Home', '2026-03-13', NULL, 'approved', 'Signed by Marcus Washington, son.'),
        (8, 'general_price_list', 'OBrien_Charles_GPL.pdf', '/documents/cases/EH-2026-0008/gpl.pdf', 'Eternal Haven Funeral Home', '2026-03-09', NULL, 'approved', 'GPL provided at arrangement conference per FTC Funeral Rule.'),
        (10, 'contract', 'Garcia_Frank_ServiceContract.pdf', '/documents/cases/EH-2026-0010/service_contract.pdf', 'Eternal Haven Funeral Home', '2026-03-14', NULL, 'approved', 'Full traditional funeral package. Signed by Maria Garcia.'),
        (12, 'death_certificate', 'Petrov_George_DeathCert.pdf', '/documents/cases/EH-2026-0012/death_certificate.pdf', 'Travis County Medical Examiner', '2026-03-16', NULL, 'draft', 'ME investigation pending. Certificate not yet signed.'),
        (14, 'veteran_discharge', 'Johansson_Arthur_DD214.pdf', '/documents/cases/EH-2026-0014/dd214.pdf', 'U.S. Department of Defense', '1973-08-20', NULL, 'filed', 'Honorable discharge, U.S. Navy. Vietnam era. VA benefits eligible.')
    `);
    console.log('  - documents seeded');

    // --- Cremation (15) ---
    await db.query(`
      INSERT INTO cremation (case_id, cremation_number, authorization_received, authorization_date, medical_examiner_approval, pacemaker_check, pacemaker_removed, scheduled_date, scheduled_time, crematory_name, operator_name, temperature, duration_minutes, completion_time, urn_id, disposition_method, disposition_date, status, notes) VALUES
        (3, 'CR-2026-001', true, '2026-03-06', true, true, false, '2026-03-09', '08:00', 'Austin Memorial Crematory', 'Richard Harmon', 1800, 150, '2026-03-09 10:30:00', 5, 'scattering', '2026-03-20', 'completed', 'Cremation completed without incident. Ashes in bronze urn for family.'),
        (9, 'CR-2026-002', true, '2026-03-08', true, true, false, '2026-03-10', '09:00', 'Dallas Cremation Services', 'Anthony Miller', 1800, 140, '2026-03-10 11:20:00', 7, 'family_pickup', '2026-03-14', 'delivered', 'Family picked up keepsake urn set after memorial service.'),
        (11, 'CR-2026-003', true, '2026-03-01', true, true, true, '2026-03-03', '08:00', 'Houston Eternal Flame Crematory', 'Samuel Greene', 1800, 160, '2026-03-03 10:40:00', 5, 'interment', '2026-03-05', 'delivered', 'Pacemaker removed by embalmer prior. Urn interred at Glenwood Cemetery.'),
        (13, 'CR-2026-004', true, '2026-03-07', true, true, false, '2026-03-09', '10:00', 'Dallas Cremation Services', 'Anthony Miller', 1800, 145, '2026-03-09 12:25:00', 6, 'columbarium', '2026-03-15', 'delivered', 'Marble companion urn. Husband''s ashes to be added later.'),
        (5, 'CR-2026-005', false, NULL, false, false, false, NULL, NULL, 'Austin Memorial Crematory', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', 'Family still deciding between cremation and burial. Buddhist traditions allow both.'),
        (15, 'CR-2026-006', false, NULL, false, false, false, NULL, NULL, 'Houston Eternal Flame Crematory', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', 'Pending family decision on cremation vs. burial.'),
        (4, 'CR-2026-007', true, '2026-03-14', true, true, false, '2026-03-18', '08:00', 'Austin Memorial Crematory', 'Richard Harmon', NULL, NULL, NULL, 5, 'family_pickup', NULL, 'authorized', 'Authorization received. Celebration of life before cremation.'),
        (6, 'CR-2026-008', true, '2026-03-02', true, true, false, '2026-03-07', '14:00', 'Austin Memorial Crematory', 'Richard Harmon', 1800, 155, '2026-03-07 16:35:00', NULL, NULL, NULL, 'completed', 'Burial selected, not cremation. Record voided - keeping for audit.'),
        (1, 'CR-2026-009', false, NULL, false, false, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', 'Family chose traditional burial. No cremation needed.'),
        (7, 'CR-2026-010', false, NULL, false, false, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', 'Traditional burial selected.'),
        (8, 'CR-2026-011', false, NULL, false, false, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', 'Traditional burial selected with interment at Holy Cross Cemetery.'),
        (10, 'CR-2026-012', false, NULL, false, false, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', 'Traditional Catholic burial planned.'),
        (12, 'CR-2026-013', false, NULL, false, false, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', 'Awaiting ME release. Family prefers burial per Orthodox tradition.'),
        (14, 'CR-2026-014', false, NULL, false, false, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', 'Military burial at Fort Sam Houston National Cemetery.'),
        (2, 'CR-2026-015', false, NULL, false, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', 'Veteran burial selected. Pacemaker check completed - none found.')
    `);
    console.log('  - cremation seeded');

    // --- Fleet (15) ---
    await db.query(`
      INSERT INTO fleet (vehicle_type, vehicle_name, make, model, year, vin, license_plate, mileage, fuel_type, last_service_date, next_service_date, insurance_expiry, status, daily_rate, notes) VALUES
        ('hearse', 'Eternal Coach I', 'Cadillac', 'XTS Professional', 2023, '1G6DK8E33P0100001', 'EH-HRS-01', 28500, 'Gasoline', '2026-02-15', '2026-05-15', '2026-12-31', 'available', 450.00, 'Primary hearse, Austin location. Excellent condition.'),
        ('hearse', 'Eternal Coach II', 'Lincoln', 'MKT Hearse', 2021, '2LMHJ5AT2M0100002', 'EH-HRS-02', 41200, 'Gasoline', '2026-01-20', '2026-04-20', '2026-12-31', 'available', 400.00, 'Secondary hearse, Houston location.'),
        ('limousine', 'Family Comfort I', 'Lincoln', 'MKT Limousine', 2022, '2LMHJ5AT4N0200001', 'EH-LIM-01', 35600, 'Gasoline', '2026-03-01', '2026-06-01', '2026-12-31', 'in_use', 350.00, 'Six-passenger family limousine. Austin location.'),
        ('limousine', 'Family Comfort II', 'Cadillac', 'Escalade ESV', 2023, '1GYS4HKJ5P0200002', 'EH-LIM-02', 22100, 'Gasoline', '2026-02-10', '2026-05-10', '2026-12-31', 'available', 375.00, 'Premium eight-passenger SUV limousine. Houston location.'),
        ('flower_car', 'Garden Express', 'Cadillac', 'XTS Flower Car', 2020, '1G6DK8E37L0300001', 'EH-FLR-01', 18900, 'Gasoline', '2025-12-15', '2026-03-15', '2026-12-31', 'maintenance', 200.00, 'Due for scheduled maintenance. Brake inspection needed.'),
        ('removal_van', 'Quiet Passage I', 'Mercedes-Benz', 'Sprinter 2500', 2022, 'WD4PE8CD7N0400001', 'EH-RMV-01', 52300, 'Diesel', '2026-02-20', '2026-05-20', '2026-12-31', 'available', 250.00, 'Primary removal vehicle, Austin. Discreet white exterior.'),
        ('removal_van', 'Quiet Passage II', 'Ford', 'Transit 250', 2023, '1FTBR2CM5P0400002', 'EH-RMV-02', 31500, 'Gasoline', '2026-03-05', '2026-06-05', '2026-12-31', 'in_use', 225.00, 'Houston removal vehicle. Currently on removal call.'),
        ('utility_van', 'Service Support', 'Ford', 'E-350 Cargo', 2021, '1FTSE3EL3M0500001', 'EH-UTL-01', 47800, 'Gasoline', '2026-01-10', '2026-04-10', '2026-12-31', 'available', 175.00, 'Equipment and supply transport. Tent/chair delivery.'),
        ('family_car', 'Family Sedan I', 'Lincoln', 'Continental', 2022, '1LN6L9RP4N0600001', 'EH-FAM-01', 29400, 'Gasoline', '2026-02-28', '2026-05-28', '2026-12-31', 'available', 200.00, 'Four-passenger sedan for family transport. Austin.'),
        ('family_car', 'Family Sedan II', 'Cadillac', 'CT5 Premium', 2023, '1G6DT5RK7P0600002', 'EH-FAM-02', 15200, 'Gasoline', '2026-03-10', '2026-06-10', '2026-12-31', 'available', 225.00, 'Four-passenger sedan for family transport. Dallas.'),
        ('hearse', 'Eternal Coach III', 'Cadillac', 'XTS Professional', 2024, '1G6DK8E35R0100003', 'EH-HRS-03', 8700, 'Gasoline', '2026-03-12', '2026-06-12', '2027-06-30', 'available', 475.00, 'Newest hearse, Dallas location. Under manufacturer warranty.'),
        ('limousine', 'Family Comfort III', 'Lincoln', 'Navigator L', 2024, '5LMJJ3LT8R0200003', 'EH-LIM-03', 11200, 'Gasoline', '2026-03-08', '2026-06-08', '2027-06-30', 'available', 400.00, 'Premium SUV limousine, Dallas location. 8 passengers.'),
        ('removal_van', 'Quiet Passage III', 'Mercedes-Benz', 'Sprinter 2500', 2024, 'WD4PE8CD9R0400003', 'EH-RMV-03', 9800, 'Diesel', '2026-03-01', '2026-06-01', '2027-06-30', 'available', 275.00, 'Dallas removal vehicle. Climate-controlled rear compartment.'),
        ('utility_van', 'Supply Runner', 'Ram', 'ProMaster 2500', 2022, '3C6MRVHG4N0500002', 'EH-UTL-02', 38500, 'Gasoline', '2026-02-05', '2026-05-05', '2026-12-31', 'available', 150.00, 'Houston utility vehicle. Inter-location supply transport.'),
        ('hearse', 'Heritage Coach', 'Buick', 'GL8 Coach', 2019, '1G4PP5SK1K0100004', 'EH-HRS-04', 62000, 'Gasoline', '2025-11-20', '2026-02-20', '2026-12-31', 'retired', 300.00, 'Retired from active service. Backup vehicle only.')
    `);
    console.log('  - fleet seeded');

    // --- Memorial Products (15) ---
    await db.query(`
      INSERT INTO memorial_products (product_name, category, description, supplier, unit_cost, retail_price, quantity_available, lead_time_days, customizable, image_url, is_active) VALUES
        ('Standing Sympathy Spray - White Roses', 'flowers', 'Elegant standing spray featuring 48 long-stem white roses with greenery. Displayed on an easel.', 'Austin Floral Wholesale', 85.00, 249.00, 0, 1, false, '/images/products/standing-spray-white-roses.jpg', true),
        ('Casket Blanket - Mixed Seasonal Flowers', 'flowers', 'Full casket blanket arrangement with seasonal mixed flowers including roses, lilies, and carnations.', 'Austin Floral Wholesale', 120.00, 395.00, 0, 1, true, '/images/products/casket-blanket-mixed.jpg', true),
        ('Custom Printed Funeral Program (100 ct)', 'programs', 'Full-color tri-fold funeral program with custom photo, obituary, and order of service. 100 copies.', 'Heritage Print Solutions', 45.00, 175.00, 50, 2, true, '/images/products/funeral-program-trifold.jpg', true),
        ('Leather-Bound Memorial Register Book', 'register_books', 'Premium leather-bound guest register with gold-embossed cover. Includes matching pen. 500 entry capacity.', 'Legacy Stationery', 28.00, 89.00, 25, 1, true, '/images/products/register-book-leather.jpg', true),
        ('Personalized Prayer Cards (100 ct)', 'prayer_cards', 'Laminated prayer cards with custom photo, scripture, and dates. Standard size 2.5" x 4.5". 100 cards.', 'Heritage Print Solutions', 22.00, 85.00, 40, 2, true, '/images/products/prayer-cards-custom.jpg', true),
        ('Unity Candle Set - Ivory Pillar', 'candles', 'Three-piece unity candle set. Large center pillar with two taper candles. Ivory with gold accents.', 'Sacred Light Candle Co.', 18.00, 59.00, 30, 1, false, '/images/products/unity-candle-ivory.jpg', true),
        ('Memorial Vigil Candles (12-pack)', 'candles', 'Glass-enclosed vigil candles with memorial label. 72-hour burn time. Pack of 12.', 'Sacred Light Candle Co.', 15.00, 45.00, 50, 1, false, '/images/products/vigil-candles-12pack.jpg', true),
        ('Digital Photo Display Frame - 15 inch', 'photo_displays', '15-inch digital photo frame with slideshow capability. Preloaded with up to 500 photos. Oak frame.', 'TechMemorial Inc.', 95.00, 249.00, 8, 3, false, '/images/products/digital-frame-15in.jpg', true),
        ('Photo Memorial Collage Board - 30x40', 'photo_displays', 'Professional photo collage board featuring up to 30 photos arranged on a 30"x40" foam board with custom design.', 'Heritage Print Solutions', 35.00, 125.00, 15, 2, true, '/images/products/photo-collage-board.jpg', true),
        ('Video Tribute Package', 'video_tribute', 'Professional video tribute with photos, video clips, music, and transitions. Up to 10 minutes. Delivered on USB and DVD.', 'Eternal Memories Productions', 150.00, 495.00, 0, 3, true, '/images/products/video-tribute-package.jpg', true),
        ('Thumbprint Heart Pendant - Gold', 'jewelry', '14K gold-plated heart pendant with custom thumbprint engraving. Includes 18" chain and gift box.', 'Legacy Touch', 55.00, 189.00, 15, 5, true, '/images/products/thumbprint-pendant-gold.jpg', true),
        ('Cremation Ash Bracelet - Sterling Silver', 'jewelry', 'Sterling silver bangle bracelet with sealed compartment for a small amount of cremation ash. Gift boxed.', 'Legacy Touch', 42.00, 159.00, 12, 5, true, '/images/products/ash-bracelet-silver.jpg', true),
        ('Memorial Garden Stone - Engraved', 'photo_displays', 'Natural river stone with custom laser engraving. Name, dates, and short sentiment. Approximately 12"x8".', 'StoneWorks Memorials', 35.00, 129.00, 10, 7, true, '/images/products/garden-stone-engraved.jpg', true),
        ('Comfort Shawl - Woven Memorial Blanket', 'clothing', 'Soft woven memorial blanket with comforting message. 50"x60". Machine washable. Gift boxed.', 'Comfort Keepsakes LLC', 25.00, 79.00, 20, 3, false, '/images/products/comfort-shawl.jpg', true),
        ('Memorial Seed Packet Favors (50 ct)', 'flowers', 'Custom-labeled wildflower seed packets as service favors. "In loving memory" design with photo. 50 packets.', 'Botanical Memories', 30.00, 95.00, 35, 5, true, '/images/products/seed-packet-favors.jpg', true)
    `);
    console.log('  - memorial_products seeded');

    // --- Obituaries (15) ---
    await db.query(`
      INSERT INTO obituaries (case_id, deceased_name, date_of_birth, date_of_death, city, state, content, survived_by, predeceased_by, education, career, hobbies, charitable_donations, service_info, publication_outlets, publish_date, status, ai_generated, notes) VALUES
        (1, 'Margaret Ann Sullivan', '1941-03-15', '2026-03-10', 'Austin', 'Texas', 'Margaret Ann Sullivan, 84, of Austin, Texas, passed away peacefully on March 10, 2026, surrounded by her loving family. Born in Boston, Massachusetts, Margaret moved to Texas in 1965 and made Austin her beloved home for over six decades. Known for her warm smile, generous spirit, and legendary Irish soda bread, Margaret touched countless lives through her volunteer work and devotion to her community.', 'Son Thomas Sullivan and wife Karen of Austin; daughter Mary Catherine Doyle and husband Patrick of San Antonio; five grandchildren: Sean, Bridget, Connor, Maeve, and Liam; two great-grandchildren.', 'Husband John Patrick Sullivan (2019); parents Patrick and Rose Flanagan.', 'St. Mary''s Academy, Boston; BA in Education, Boston College, 1963.', 'Elementary school teacher at St. Austin''s Catholic School for 32 years. Retired 1998.', 'Gardening, baking, reading, Irish step dancing, volunteering at St. Patrick''s Church.', 'In lieu of flowers, donations may be made to St. Vincent de Paul Society or the Alzheimer''s Association.', 'Funeral mass at St. Patrick''s Catholic Church, March 18 at 10 AM. Burial at Holy Cross Cemetery. Reception at parish hall following.', 'Austin American-Statesman, Boston Globe, Legacy.com', '2026-03-14', 'published', false, 'Family provided most content. Minor edits for formatting.'),
        (2, 'James Robert Henderson', '1935-11-22', '2026-03-08', 'Austin', 'Texas', 'James Robert Henderson, 90, of Austin, Texas, a decorated Korean War veteran and beloved patriarch, passed away on March 8, 2026. Jim served his country with distinction as a Sergeant in the U.S. Army from 1953 to 1957, earning the Bronze Star Medal. After his military service, he built a successful career in civil engineering, helping shape the infrastructure of modern Austin.', 'Wife of 65 years, Linda Mae Henderson; children Robert (Susan) Henderson, Patricia (David) Moore, and James Jr. (Michelle) Henderson; eight grandchildren and six great-grandchildren.', 'Parents Robert and Mildred Henderson; brother William Henderson (2020).', 'Austin High School, 1953; BS Civil Engineering, University of Texas at Austin, 1961 (on GI Bill).', 'Civil engineer with Texas Department of Transportation for 35 years. Project manager for IH-35 expansion.', 'Fishing, woodworking, VFW Post activities, mentoring young veterans, Texas Longhorns football.', 'Donations may be made to the Wounded Warrior Project or VFW Post 8787 Scholarship Fund.', 'Military funeral with honors at Texas State Veterans Cemetery, Killeen, March 17 at 2 PM. Visitation at Eternal Haven Funeral Home, March 16, 5-8 PM.', 'Austin American-Statesman, Military Times, Legacy.com', '2026-03-12', 'published', false, 'Family emphasized military service prominently.'),
        (3, 'Dorothy Louise Chambers', '1948-07-04', '2026-03-05', 'Houston', 'Texas', 'Dorothy Louise Chambers, 77, of Houston, Texas, departed this life on March 5, 2026, after a courageous battle with cancer. Dorothy lived life with fierce independence and infectious optimism. A pioneering businesswoman, she founded Chambers Catering in 1982, growing it into one of Houston''s premier catering companies serving events from intimate gatherings to galas of 2,000 guests.', 'Son Michael Chambers and wife Jennifer of Houston; daughter Lisa Chambers-Wright and husband Devon of Los Angeles; three grandchildren: Olivia, Noah, and Ava.', 'Husband Richard Chambers (2022); parents Louis and Evelyn Brooks.', 'Jack Yates High School; BA Business Administration, Texas Southern University, 1970.', 'Founder and CEO of Chambers Catering, Houston, 1982-2018. Former manager at Hilton Hotels.', 'Cooking, traveling, jazz music, theater, mentoring young entrepreneurs, gardening.', 'Memorial contributions to MD Anderson Cancer Center or Texas Southern University Scholarship Fund.', 'Memorial service at Eternal Haven Chapel, Houston, March 12 at 11 AM. Private family scattering of ashes at a later date.', 'Houston Chronicle, Texas Southern University Alumni Newsletter, Legacy.com', '2026-03-08', 'published', true, 'AI-generated first draft, family reviewed and approved with minor edits.'),
        (4, 'William Edward Foster', '1952-01-30', '2026-03-12', 'Austin', 'Texas', 'William "Bill" Edward Foster, 74, of Austin, Texas, passed away on March 12, 2026, following a stroke. Bill was a free spirit who believed every day was a celebration. A jazz musician turned software entrepreneur, he co-founded FosterTech Solutions in 1995, which grew to employ over 200 people before its acquisition in 2015.', 'Daughter Rebecca Foster of Austin; son William Foster Jr. and wife Amy of Denver; sister Charlotte Foster-Hughes of Portland; four grandchildren.', 'Parents Edward and Martha Foster; brother Daniel Foster (2023).', 'Austin High School; studied Music at Berklee College of Music, 1970-72; self-taught programmer.', 'Professional jazz saxophonist 1972-1990; co-founder FosterTech Solutions 1995-2015; tech mentor and angel investor.', 'Playing saxophone, sailing on Lake Travis, cooking Italian food, tech startups, live music on 6th Street.', 'In lieu of flowers, contributions to SXSW Music Foundation or Austin Jazz Society.', 'Celebration of life at Barton Creek Country Club, March 20 at 3 PM. Casual attire. Jazz music. No formal religious ceremony per Bill''s wishes.', 'Austin American-Statesman, Austin Chronicle, Legacy.com', '2026-03-15', 'approved', true, 'AI-generated. Daughter Rebecca approved with enthusiasm.'),
        (5, 'Patricia Thanh Nguyen', '1960-09-18', '2026-03-11', 'Dallas', 'Texas', 'Patricia Thanh Nguyen, 65, of Dallas, Texas, passed away on March 11, 2026, from respiratory failure. Born in Saigon, Vietnam, Patricia came to the United States in 1975 as a refugee and built a remarkable life defined by resilience, education, and service to her community.', 'Husband Huy Nguyen of Dallas; children David (Linda) Nguyen of Austin, Christine (James) Park of Los Angeles; mother Lan Tran of Dallas; five grandchildren.', 'Father Minh Tran (2018).', 'University of Dallas, BA Chemistry, 1984; UT Southwestern, PharmD, 1988.', 'Licensed pharmacist for 35 years. Owner of Nguyen Family Pharmacy, Dallas, 1995-2024.', 'Buddhist meditation, Vietnamese cooking, community health education, gardening, calligraphy.', 'Donations to Vietnamese American Community Foundation or Jade Buddha Temple Building Fund.', 'Buddhist funeral ceremony at Jade Buddha Temple, Houston, March 22 at 9 AM. Three-day mourning period at family home.', 'Dallas Morning News, Nguoi Viet Daily, Legacy.com', NULL, 'review', true, 'AI-generated draft. Family reviewing for cultural accuracy.'),
        (6, 'Robert Stefan Kowalski', '1938-12-25', '2026-03-01', 'Austin', 'Texas', 'Robert Stefan Kowalski, 87, of Austin, Texas, passed away peacefully at home on March 1, 2026. Born on Christmas Day in Chicago, Illinois, to Polish immigrant parents, Robert carried his heritage proudly throughout his life. A master carpenter and skilled craftsman, he built custom furniture that graces homes across Texas.', 'Daughter Anna Kowalski of Austin; son Peter Kowalski and wife Magda of Chicago; daughter Katarzyna (Christopher) Walsh of Dallas; seven grandchildren and four great-grandchildren.', 'Wife Jadwiga Kowalski (2021); parents Stefan and Maria Kowalski; brother Tadeusz Kowalski (2015).', 'St. Stanislaus Grammar School, Chicago; Lane Technical High School; Apprenticeship in Fine Woodworking.', 'Master carpenter and furniture maker. Owner of Kowalski Custom Woodworks, Austin, 1968-2005.', 'Woodworking, polka dancing, Polish cooking, Knights of Columbus, coaching youth baseball.', 'Memorial gifts to Our Lady of Czestochowa Building Fund or Polish American Association of Texas.', 'Funeral mass at Our Lady of Czestochowa, Austin, March 8 at 10:30 AM. Vigil March 7, 6 PM. Burial at Holy Cross Cemetery.', 'Austin American-Statesman, Dziennik Zwiazkowy (Chicago), Legacy.com', '2026-03-04', 'published', false, 'Family provided detailed life history.'),
        (7, 'Helen Marie Washington', '1944-06-10', '2026-03-13', 'Houston', 'Texas', 'Helen Marie Washington, 81, of Houston, Texas, was called home to glory on March 13, 2026. A pillar of her community and the Greater Hope Baptist Church family, Helen dedicated her life to service, faith, and education. She served as the church choir director for 40 years and touched the lives of thousands of students as a high school English teacher.', 'Sons Marcus (Denise) Washington and Jerome (Patricia) Washington of Houston; daughter Angela Washington-Harris (Robert) of Atlanta; mother Lillian Brooks, 102, of Houston; nine grandchildren; three great-grandchildren.', 'Husband Deacon Walter Washington (2023); father Samuel Brooks (1998).', 'Phyllis Wheatley High School; BA English Literature, Prairie View A&M, 1966; MEd, University of Houston, 1975.', 'English teacher at Kashmere High School, Houston ISD, 1966-2004. Choir director, Greater Hope Baptist Church, 1980-2020.', 'Gospel music, reading, quilting, cooking for church suppers, mentoring youth, gardening.', 'In lieu of flowers, donations to Greater Hope Baptist Church Youth Scholarship Fund.', 'Homegoing celebration at Greater Hope Baptist Church, Houston, March 21 at 11 AM. Visitation March 20, 5-8 PM at Eternal Haven, Houston.', 'Houston Chronicle, Houston Defender, Legacy.com', '2026-03-17', 'published', false, 'Pastor Williams and family collaborated on content.'),
        (8, 'Charles Patrick O''Brien', '1950-04-02', '2026-03-09', 'Austin', 'Texas', 'Charles "Charlie" Patrick O''Brien, 75, of Austin, Texas, passed away on March 9, 2026. Charlie was a larger-than-life character whose Irish wit, generous heart, and booming laugh could fill any room. A retired Austin firefighter with 30 years of service, he was known citywide as the fireman who always had a joke ready and a helping hand extended.', 'Wife of 50 years Kathleen Mary O''Brien; children Sean (Maria) O''Brien, Siobhan O''Brien-Kelly (Patrick), and Declan O''Brien; sister Maureen O''Brien-Doyle of Boston; six grandchildren.', 'Parents Patrick and Brigid O''Brien; brother Michael O''Brien (2019).', 'O''Connell High School, Boston; Austin Community College Fire Science program.', 'Austin Fire Department, 1975-2005. Rose to rank of Battalion Chief. AFD Firefighter of the Year, 1992.', 'Gaelic football, Irish music sessions, coaching youth sports, grilling, fishing, storytelling.', 'Donations may be made to the Austin Firefighters Benevolent Fund or Irish Cultural Center of Austin.', 'Funeral mass at Sacred Heart Catholic Church, March 19 at 10 AM. Irish wake at Eternal Haven, March 18, 4-9 PM. Bagpiper at graveside. Pub reception following burial.', 'Austin American-Statesman, Irish Echo, Legacy.com', '2026-03-14', 'published', false, 'Kathleen and family wrote a beautiful tribute. Minimal editing needed.'),
        (9, 'Ruth Akiko Yamamoto', '1955-08-14', '2026-03-07', 'Dallas', 'Texas', 'Ruth Akiko Yamamoto, 70, of Dallas, Texas, passed away on March 7, 2026, after a courageous battle with cancer. Born to a Japanese-American family in San Francisco, Ruth seamlessly blended the best of two cultures in everything she did, from her acclaimed floral design business to her community leadership.', 'Husband Ken Yamamoto of Dallas; children Emily (Brian) Yamamoto-Scott of Austin and Daniel Yamamoto of San Francisco; mother Yuki Tanaka of San Francisco; three grandchildren.', 'Father Hiroshi Tanaka (2020).', 'Lowell High School, San Francisco; BFA Design, California College of the Arts, 1977.', 'Founder and lead designer, Yamamoto Floral Arts, Dallas, 1985-2024. Award-winning ikebana instructor.', 'Ikebana, watercolor painting, tea ceremony, hiking, volunteering at Dallas Arboretum.', 'Memorial contributions to American Cancer Society or Dallas Arboretum Education Fund.', 'Memorial service at Eternal Haven Chapel, Dallas, March 14 at 1 PM. Japanese incense ceremony included.', 'Dallas Morning News, Rafu Shimpo, Legacy.com', '2026-03-10', 'published', true, 'AI-generated with cultural sensitivity review by family.'),
        (10, 'Francisco ''Frank'' Antonio Garcia', '1947-02-28', '2026-03-14', 'Austin', 'Texas', 'Francisco "Frank" Antonio Garcia, 79, of Austin, Texas, passed away peacefully on March 14, 2026, surrounded by family. Born in Laredo, Texas, Frank was a beloved husband, father, grandfather, and community leader who spent his life building bridges between cultures and generations.', 'Wife of 55 years Maria Elena Garcia; children Roberto (Ana) Garcia, Isabella (Mark) Garcia-Thompson, and Francisco Jr. (Sandra) Garcia; 12 grandchildren; three great-grandchildren.', 'Parents Antonio and Rosa Garcia; brother Miguel Garcia (2022).', 'Martin High School, Laredo; BA Political Science, St. Edward''s University, 1970.', 'Austin City Council member, 1985-1997. Executive Director, Hispanic Chamber of Commerce, 1997-2015.', 'Mariachi music, cooking carne asada, dominoes, coaching youth soccer, community organizing.', 'Donations to Hispanic Scholarship Fund or St. Mary''s Cathedral Building Fund.', 'Rosary at Eternal Haven Chapel, March 21 at 7 PM. Funeral mass at St. Mary''s Cathedral, March 22 at 9:30 AM. Burial at Assumption Cemetery.', 'Austin American-Statesman, La Prensa, Legacy.com', '2026-03-18', 'approved', false, 'Family provided extensive history. Bilingual obituary also prepared.'),
        (11, 'Virginia Rose Thompson', '1932-10-08', '2026-02-28', 'Houston', 'Texas', 'Virginia Rose Thompson, 93, of Houston, Texas, passed away on February 28, 2026. Virginia lived a long, full life marked by grace, kindness, and an unwavering devotion to her family. One of the last of her generation, she witnessed nearly a century of American history and met every challenge with quiet strength.', 'Granddaughter Sandra Thompson-Lee (Michael) of Houston; grandson David Thompson of Chicago; four great-grandchildren.', 'Husband Walter Thompson (2010); son Walter Thompson Jr. (2018); daughter Carol Thompson (2021); parents James and Rose Mitchell.', 'Booker T. Washington High School, Houston, 1950.', 'Homemaker and community volunteer. Part-time seamstress for Foley''s Department Store, 1965-1985.', 'Sewing, church activities, cooking Sunday dinners, watching Astros baseball, jigsaw puzzles.', 'Contributions to Meals on Wheels or Sunrise Senior Living Activities Fund.', 'Private graveside service at Houston Memorial Gardens, March 5 at 2 PM. Family only per Virginia''s wishes.', 'Houston Chronicle, Legacy.com', '2026-03-02', 'published', false, 'Granddaughter Sandra provided all information. Brief, dignified per Virginia''s wishes.'),
        (12, 'George Aleksandr Petrov', '1958-05-19', '2026-03-15', 'Austin', 'Texas', 'George Aleksandr Petrov, 67, of Austin, Texas, died unexpectedly on March 15, 2026, as the result of a motor vehicle accident. Born in Moscow, Russia, George immigrated to the United States in 1990 and became a proud American citizen in 1997. A brilliant software architect, he contributed to numerous technology innovations during Austin''s tech boom.', 'Wife Natasha Petrov; children Alexei (Sarah) Petrov and Katrina Petrov; mother Olga Petrov of Austin; two grandchildren.', 'Father Aleksandr Petrov (2015).', 'Moscow State University, MS Computer Science, 1981; Additional studies at UT Austin, 1992.', 'Software architect at Dell Technologies, 1993-2005; Senior VP Engineering at TechStar Inc., 2005-2024.', 'Chess, classical piano, Russian literature, hiking, Austin tech community mentoring.', 'Donations to Austin Russian-American Cultural Association or Dell Medical School.', 'Orthodox Christian funeral at Holy Trinity Orthodox Church, Austin, March 23 at 11 AM. Panikhida (memorial prayer) March 22 at 6 PM.', 'Austin American-Statesman, Legacy.com', NULL, 'draft', true, 'AI-generated draft. Awaiting ME release and family final review.'),
        (13, 'Evelyn Grace Richardson', '1940-11-30', '2026-03-06', 'Dallas', 'Texas', 'Evelyn Grace Richardson, 85, of Dallas, Texas, passed away on March 6, 2026, after a long journey with Alzheimer''s disease. Before her illness, Evelyn was a vibrant, creative force - an interior designer whose elegant work graced some of Dallas''s finest homes, a devoted mother, and a generous philanthropist.', 'Son Paul (Margaret) Richardson of Dallas; daughter Christine (Robert) Blackwood of Houston; six grandchildren; two great-grandchildren.', 'Husband Thomas Richardson (2017); parents William and Grace Montgomery.', 'Hockaday School, Dallas; BFA Interior Design, Parsons School of Design, New York, 1962.', 'Founder, Richardson Interiors, Dallas, 1968-2005. Featured in Architectural Digest, D Magazine.', 'Interior design, painting, garden club, Dallas Museum of Art docent, bridge, travel.', 'In lieu of flowers, donations to Alzheimer''s Association North Texas Chapter.', 'Memorial service at Eternal Haven Chapel, Dallas, March 13 at 3 PM. Private family interment.', 'Dallas Morning News, D Magazine, Legacy.com', '2026-03-10', 'published', true, 'AI-generated with son Paul''s extensive input. Beautiful tribute.'),
        (14, 'Arthur Erik Johansson', '1945-03-21', '2026-03-16', 'Austin', 'Texas', 'Arthur Erik Johansson, 80, of Austin, Texas, passed away suddenly on March 16, 2026, from a heart attack. A decorated U.S. Navy veteran of the Vietnam War, Arthur served aboard the USS Constellation from 1964 to 1970, earning the Navy Commendation Medal. He later built a distinguished career in marine engineering.', 'Wife of 52 years Lisa Johansson; children Erik (Amy) Johansson of San Diego and Kristina Johansson of Austin; sister Ingrid Johansson-Blake of Minneapolis; five grandchildren.', 'Parents Erik and Astrid Johansson; brother Lars Johansson (2024).', 'Anderson High School, Minneapolis; BS Marine Engineering, U.S. Naval Academy, 1967.', 'U.S. Navy, 1964-1970, Lieutenant Commander; Marine engineer, Todd Shipyards, 1970-1985; Consultant, Gulf Coast Engineering, 1985-2010.', 'Sailing, Swedish folk music, woodworking, model shipbuilding, Naval Academy alumni events.', 'Donations may be made to Navy-Marine Corps Relief Society or Naval Academy Foundation.', 'Military funeral with Navy honors at Fort Sam Houston National Cemetery, San Antonio, March 24 at 10 AM. Visitation at Eternal Haven, Austin, March 23, 4-8 PM.', 'Austin American-Statesman, Naval Academy Alumni Magazine, Legacy.com', NULL, 'review', false, 'Lisa Johansson and Navy League chapter providing details. Service being coordinated.'),
        (15, 'Betty Esperanza Morales', '1953-07-12', '2026-03-17', 'Houston', 'Texas', 'Betty Esperanza Morales, 72, of Houston, Texas, passed away on March 17, 2026, following a long battle with kidney disease. Betty was a beloved community matriarch whose warmth, creativity, and cultural pride inspired everyone around her. A talented artist and muralist, her vibrant works depicting Mexican-American life adorn buildings throughout Houston''s East End.', 'Husband of 48 years Carlos Morales; children Sofia (Miguel) Morales-Cruz of Houston, Alejandro Morales of Austin, and Esperanza (Kevin) Morales-Chen of San Francisco; mother Guadalupe Torres, 95, of Houston; eight grandchildren.', 'Father Ernesto Torres (2008).', 'Milby High School, Houston; BFA Painting, University of Houston, 1976; MFA, School of the Art Institute of Chicago, 1979.', 'Muralist and community artist, 1979-2024. Art teacher, HISD, 1980-2010. Founded East End Arts Collective, 1995.', 'Painting murals, Dia de los Muertos celebrations, teaching art to children, cooking, folk dancing.', 'In lieu of flowers, contributions to East End Arts Collective or National Kidney Foundation.', 'Celebration of life at Eternal Haven Garden Pavilion, Houston, March 25 at 4 PM. Dia de los Muertos-inspired celebration with altar, music, and dancing.', 'Houston Chronicle, La Voz de Houston, Legacy.com', NULL, 'draft', true, 'AI-generated draft. Family adding cultural details and altar plan.')
    `);
    console.log('  - obituaries seeded');

    // --- Embalming ---
    await db.query(`
      INSERT INTO embalming (case_id, embalmer_name, embalming_date, embalming_time, chemicals_used, procedure_notes, arterial_solution, cavity_treatment, cosmetic_work, restoration_needed, restoration_notes, condition_on_receipt, refrigeration_date, status, family_viewed, notes) VALUES
        (1, 'Robert Chen', '2026-03-02', '08:00', 'Formaldehyde 2.5%, Methanol, Phenol', 'Standard arterial injection, cavity aspiration complete', 'Champion Enigma 35-index', 'Cavity fluid injection - Champion Dis-Spray', 'Natural lip color, light foundation', false, NULL, 'Good', '2026-03-01', 'completed', true, 'Family pleased with presentation'),
        (2, 'Maria Santos', '2026-03-04', '09:30', 'Formaldehyde 2.0%, Glutaraldehyde', 'Careful attention to facial features per family request', 'Dodge Permaglo 25-index', 'Standard cavity treatment', 'Full cosmetics per family photo', false, NULL, 'Good', '2026-03-03', 'completed', true, NULL),
        (3, 'Robert Chen', '2026-03-06', '07:00', 'Formaldehyde 3.0%, Methanol, Phenol', 'Extended procedure due to autopsied remains', 'Champion Enigma 45-index', 'Cavity fluid and pack', 'Extensive reconstruction and cosmetics', true, 'Autopsy sutures concealed, facial reconstruction required', 'Fair - post autopsy', '2026-03-05', 'completed', true, 'Additional restoration time needed'),
        (4, 'James Wilson', '2026-03-08', '10:00', 'Formaldehyde 2.0%, Eosin dye', 'Standard preparation, good results', 'Dodge Chromatech 20-index', 'Standard cavity treatment', 'Light cosmetics only', false, NULL, 'Good', '2026-03-07', 'completed', true, NULL),
        (5, 'Maria Santos', '2026-03-10', '08:30', 'Formaldehyde 2.5%, Methanol', 'Careful preparation per Buddhist tradition', 'Champion Enigma 30-index', 'Minimal cavity treatment', 'Very natural look per family wishes', false, NULL, 'Good', '2026-03-09', 'completed', false, 'Family declined viewing before cremation'),
        (6, 'Robert Chen', '2026-03-11', '14:00', 'Formaldehyde 2.0%', 'Quick preparation for direct cremation', 'Basic arterial', 'Standard', 'None requested', false, NULL, 'Good', '2026-03-10', 'completed', false, 'Direct cremation - minimal preparation'),
        (7, 'James Wilson', '2026-03-12', '09:00', 'Formaldehyde 2.5%, Phenol, Methanol', 'Full preparation with military dress uniform', 'Champion Enigma 35-index', 'Full cavity treatment', 'Full cosmetics, medal placement', false, NULL, 'Good', '2026-03-11', 'completed', true, 'Military honors preparation'),
        (8, 'Maria Santos', '2026-03-13', '08:00', 'Formaldehyde 2.0%, Glutaraldehyde', 'Standard procedure', 'Dodge Permaglo 25-index', 'Standard cavity treatment', 'Natural cosmetics', false, NULL, 'Good', '2026-03-12', 'completed', true, NULL),
        (9, 'Robert Chen', '2026-03-14', '11:00', 'Formaldehyde 3.0%, Phenol', 'Complex case requiring additional attention', 'Champion Enigma 45-index', 'Extended cavity treatment', 'Extensive cosmetic work needed', true, 'Trauma repair to facial area', 'Poor - trauma', '2026-03-13', 'completed', true, 'Excellent results despite challenges'),
        (10, 'James Wilson', '2026-03-15', '07:30', 'Formaldehyde 2.5%', 'Standard preparation', 'Dodge Chromatech 30-index', 'Standard cavity', 'Light cosmetics', false, NULL, 'Good', '2026-03-14', 'completed', true, NULL),
        (11, 'Maria Santos', '2026-03-16', '09:00', 'Formaldehyde 2.0%', 'Preparation for green burial - eco-friendly chemicals', 'Eco-friendly arterial solution', 'Minimal cavity treatment', 'Natural look only', false, NULL, 'Good', '2026-03-15', 'completed', true, 'Green burial preparation'),
        (12, 'Robert Chen', '2026-03-17', '08:00', 'Formaldehyde 2.5%, Methanol', 'Standard full preparation', 'Champion Enigma 30-index', 'Full cavity treatment', 'Full cosmetics per family photo', false, NULL, 'Good', '2026-03-16', 'completed', true, NULL),
        (13, 'James Wilson', '2026-03-18', '10:30', 'Formaldehyde 2.0%', 'Preparation for Orthodox ceremony', 'Basic arterial 20-index', 'Standard', 'Minimal per religious tradition', false, NULL, 'Good', '2026-03-17', 'in_progress', false, 'Coordinating with Orthodox clergy'),
        (14, 'Maria Santos', '2026-03-19', '08:00', 'Formaldehyde 2.5%', 'Standard preparation', 'Dodge Permaglo 30-index', 'Standard cavity', 'Full cosmetics', false, NULL, 'Good', '2026-03-18', 'pending', false, 'Scheduled for tomorrow'),
        (15, 'Robert Chen', '2026-03-20', '09:00', NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, '2026-03-19', 'pending', false, 'Awaiting family authorization')
    `);
    console.log('  - embalming seeded');

    // --- Cemetery Plots ---
    await db.query(`
      INSERT INTO cemetery_plots (cemetery_name, cemetery_address, section, lot_number, plot_number, plot_type, owner_name, owner_phone, owner_email, purchase_date, purchase_price, is_occupied, case_id, interment_date, status, notes) VALUES
        ('Austin Memorial Park', '2800 Hancock Dr, Austin, TX 78731', 'Garden of Peace', 'A-12', 'P-001', 'single', 'Margaret Thompson', '512-555-0101', 'mthompson@email.com', '2020-05-15', 3500.00, true, 1, '2026-03-05', 'occupied', 'Well-maintained plot near oak tree'),
        ('Austin Memorial Park', '2800 Hancock Dr, Austin, TX 78731', 'Garden of Peace', 'A-12', 'P-002', 'single', 'Margaret Thompson', '512-555-0101', 'mthompson@email.com', '2020-05-15', 3500.00, false, NULL, NULL, 'reserved', 'Reserved for spouse'),
        ('Houston National Cemetery', '10410 Veterans Memorial Dr, Houston, TX 77038', 'Section 4', 'V-088', 'P-177', 'single', 'US Government', '713-555-0200', NULL, NULL, 0.00, true, 7, '2026-03-15', 'occupied', 'Veterans section - military honors'),
        ('Oakwood Cemetery', '1601 Navasota St, Austin, TX 78702', 'Heritage Section', 'H-05', 'P-012', 'double', 'Robert and Linda Nakamura', '512-555-0303', 'rnakamura@email.com', '2018-09-10', 7200.00, true, 5, '2026-03-12', 'occupied', 'Japanese garden area'),
        ('Dallas-Fort Worth National Cemetery', '2000 Mountain Creek Pkwy, Dallas, TX 75211', 'Section 12', 'M-220', 'P-440', 'single', 'US Government', '214-555-0400', NULL, NULL, 0.00, false, NULL, NULL, 'available', 'Veterans eligible plot'),
        ('Forest Park Lawndale', '6900 Lawndale St, Houston, TX 77023', 'Serenity Garden', 'S-08', 'P-033', 'family', 'The Kowalski Family', '713-555-0500', 'kowalski@email.com', '2015-03-22', 15000.00, true, 10, '2026-03-18', 'occupied', 'Family plot - 4 spaces, 1 used'),
        ('Austin Memorial Park', '2800 Hancock Dr, Austin, TX 78731', 'Mausoleum', 'M-02', 'N-015', 'mausoleum', 'William Chen Estate', '512-555-0600', 'chen.estate@email.com', '2019-11-01', 12000.00, false, NULL, NULL, 'reserved', 'Premium mausoleum niche'),
        ('Calvary Catholic Cemetery', '3235 Lometa Dr, Dallas, TX 75220', 'St. Michael', 'C-14', 'P-089', 'single', 'Patricia OBrien', '214-555-0700', 'pobrien@email.com', '2026-03-10', 4200.00, true, 8, '2026-03-16', 'occupied', 'Catholic section'),
        ('Green Meadows Natural Burial', '445 Country Rd 200, Austin, TX 78737', 'Wildflower Meadow', 'W-03', 'P-007', 'green_burial', 'Sarah Greenfield', '512-555-0800', 'sgreenfield@email.com', '2026-03-08', 2800.00, true, 11, '2026-03-19', 'occupied', 'Eco-friendly natural burial'),
        ('Houston Memorial Gardens', '7901 Memorial Blvd, Houston, TX 77024', 'Rose Garden', 'R-06', 'P-024', 'double', 'James and Mary Sullivan', '713-555-0900', 'sullivan@email.com', '2022-07-14', 8500.00, false, NULL, NULL, 'reserved', 'Pre-need purchase'),
        ('Austin Memorial Park', '2800 Hancock Dr, Austin, TX 78731', 'Columbarium', 'COL-1', 'N-042', 'columbarium_niche', 'Available', NULL, NULL, NULL, 4500.00, false, NULL, NULL, 'available', 'Upper level niche with view'),
        ('Restland Memorial Park', '9220 Restland Rd, Dallas, TX 75243', 'Sunset Terrace', 'T-09', 'P-156', 'single', 'Available', NULL, NULL, NULL, 3800.00, false, NULL, NULL, 'available', 'Newly developed section'),
        ('Forest Park Lawndale', '6900 Lawndale St, Houston, TX 77023', 'Veterans Honor', 'V-02', 'P-078', 'single', 'Maria Gonzalez', '713-555-1100', 'mgonzalez@email.com', '2026-02-20', 3500.00, false, NULL, NULL, 'reserved', 'For pre-need client'),
        ('Austin Memorial Park', '2800 Hancock Dr, Austin, TX 78731', 'Garden of Peace', 'A-15', 'P-045', 'single', NULL, NULL, NULL, NULL, 3500.00, false, NULL, NULL, 'maintenance', 'Headstone repair in progress'),
        ('Oakwood Cemetery', '1601 Navasota St, Austin, TX 78702', 'Modern Section', 'M-12', 'P-200', 'family', 'The Martinez Family', '512-555-1300', 'martinez.family@email.com', '2023-01-15', 14000.00, false, NULL, NULL, 'reserved', 'Family plot - 6 spaces')
    `);
    console.log('  - cemetery_plots seeded');

    // --- Insurance Claims ---
    await db.query(`
      INSERT INTO insurance_claims (case_id, policy_number, insurance_company, policy_holder_name, beneficiary_name, claim_amount, approved_amount, claim_status, submission_date, approval_date, payment_date, agent_name, agent_phone, denial_reason, notes) VALUES
        (1, 'POL-2024-88901', 'State Farm Life Insurance', 'Robert Thompson', 'Margaret Thompson', 25000.00, 25000.00, 'paid', '2026-03-03', '2026-03-10', '2026-03-15', 'Jennifer Adams', '512-555-2001', NULL, 'Full policy payout received'),
        (2, 'POL-2023-55432', 'MetLife', 'James Mitchell', 'Susan Mitchell', 50000.00, 50000.00, 'approved', '2026-03-05', '2026-03-14', NULL, 'David Park', '512-555-2002', NULL, 'Awaiting payment processing'),
        (3, 'POL-2025-12345', 'Prudential Financial', 'Michael Sullivan', 'Family Trust', 100000.00, NULL, 'under_review', '2026-03-08', NULL, NULL, 'Sarah Connor', '214-555-2003', NULL, 'Large policy - additional documentation requested'),
        (4, 'POL-2022-67890', 'New York Life', 'Dorothy Williams', 'Estate of Dorothy Williams', 35000.00, 35000.00, 'paid', '2026-03-09', '2026-03-13', '2026-03-17', 'Mark Johnson', '713-555-2004', NULL, 'Quick processing'),
        (5, 'POL-2024-11223', 'Northwestern Mutual', 'Takeshi Nakamura', 'Linda Nakamura', 75000.00, 75000.00, 'approved', '2026-03-11', '2026-03-18', NULL, 'Ken Tanaka', '512-555-2005', NULL, 'Payment expected within 5 business days'),
        (6, 'POL-2020-99887', 'Lincoln Financial', 'Carlos Ramirez', 'Maria Ramirez', 15000.00, 15000.00, 'paid', '2026-03-12', '2026-03-14', '2026-03-16', 'Rosa Hernandez', '512-555-2006', NULL, 'Direct cremation - lower claim amount'),
        (7, 'SGLI-2026-44556', 'SGLI / Veterans Affairs', 'James OConnor', 'Patricia OConnor', 400000.00, 400000.00, 'approved', '2026-03-13', '2026-03-19', NULL, 'VA Claims Office', '800-555-2007', NULL, 'SGLI maximum benefit - veteran'),
        (8, 'POL-2021-33445', 'Allstate Life Insurance', 'Margaret OBrien', 'Patrick OBrien', 30000.00, NULL, 'submitted', '2026-03-14', NULL, NULL, 'Brian Kelly', '214-555-2008', NULL, 'Submitted, awaiting acknowledgment'),
        (9, 'POL-2023-77889', 'Transamerica', 'Earl Washington', 'Family of Earl Washington', 45000.00, 40000.00, 'approved', '2026-03-15', '2026-03-19', NULL, 'Angela Davis', '713-555-2009', NULL, 'Partial approval - contested rider'),
        (10, 'POL-2019-22334', 'MassMutual', 'Stefan Kowalski', 'Anna Kowalski', 60000.00, NULL, 'denied', '2026-03-16', NULL, NULL, 'Thomas Wright', '512-555-2010', 'Policy lapsed 60 days prior to death. Premium not current.', 'Family plans to appeal'),
        (11, 'POL-2025-55667', 'Pacific Life', 'Forest Reynolds', 'Green Earth Trust', 20000.00, 20000.00, 'paid', '2026-03-17', '2026-03-19', '2026-03-20', 'Lisa Green', '512-555-2011', NULL, 'Green burial - lower cost claim'),
        (12, 'POL-2024-88990', 'Guardian Life', 'Helen Papadopoulos', 'George Papadopoulos', 55000.00, NULL, 'submitted', '2026-03-18', NULL, NULL, 'Nick Stavros', '713-555-2012', NULL, 'Just submitted'),
        (13, 'POL-2022-11234', 'Mutual of Omaha', 'Yuki Tanaka', 'Haruki Tanaka', 40000.00, NULL, 'pending', '2026-03-19', NULL, NULL, 'Amy Suzuki', '214-555-2013', NULL, 'Documentation being gathered'),
        (14, 'POL-2023-44567', 'AIG Life', 'Sean Murphy', 'Colleen Murphy', 80000.00, NULL, 'under_review', '2026-03-19', NULL, NULL, 'Patrick Brennan', '512-555-2014', NULL, 'Under review - large policy'),
        (15, 'POL-2021-77890', 'John Hancock', 'Betty Morales', 'Carlos Morales', 50000.00, NULL, 'pending', '2026-03-20', NULL, NULL, 'Maria Lopez', '713-555-2015', NULL, 'Claim being prepared')
    `);
    console.log('  - insurance_claims seeded');

    // --- Vendors ---
    await db.query(`
      INSERT INTO vendors (vendor_name, vendor_type, contact_name, phone, email, address, website, tax_id, payment_terms, rating, is_preferred, is_active, contract_expiry, notes) VALUES
        ('Bella Flora Designs', 'florist', 'Isabella Rossi', '512-555-3001', 'isabella@bellaflora.com', '1200 S Congress Ave, Austin, TX 78704', 'www.bellafloradesigns.com', '74-1234567', 'Net 30', 5, true, true, '2027-01-15', 'Premium florist - excellent work'),
        ('Heritage Casket Company', 'casket_supplier', 'William Heritage III', '800-555-3002', 'orders@heritagecasket.com', '5500 Industrial Blvd, Dallas, TX 75247', 'www.heritagecasket.com', '75-2345678', 'Net 45', 4, true, true, '2026-12-31', 'Primary casket supplier'),
        ('Eternal Monuments', 'monument', 'Giuseppe Mariani', '512-555-3003', 'info@eternalmonuments.com', '890 Cemetery Rd, Austin, TX 78745', 'www.eternalmonuments.com', '74-3456789', 'Net 60', 5, true, true, '2027-03-01', 'Finest granite work in Texas'),
        ('Grace Notes Music', 'musician', 'Dr. Sarah Harmony', '512-555-3004', 'sarah@gracenotesmusic.com', '340 W 6th St, Austin, TX 78701', 'www.gracenotesmusic.com', '74-4567890', 'Due on service', 5, true, true, NULL, 'Organist, vocalist, harpist available'),
        ('Rev. Michael Brooks', 'clergy', 'Rev. Michael Brooks', '512-555-3005', 'rev.brooks@faithchurch.org', 'Faith Community Church, 2100 Oak Hill Dr, Austin, TX 78749', NULL, NULL, 'Honorarium', 5, true, true, NULL, 'Non-denominational minister'),
        ('Texas Vault Company', 'vault_company', 'Tom Keller', '800-555-3006', 'orders@texasvault.com', '7700 Commerce St, Houston, TX 77011', 'www.texasvault.com', '76-5678901', 'Net 30', 4, false, true, '2026-09-30', 'Concrete and steel vaults'),
        ('Lasting Impressions Printing', 'printing', 'Karen Cho', '512-555-3007', 'karen@lastingprint.com', '4500 S Lamar Blvd, Austin, TX 78745', 'www.lastingimpressions.com', '74-6789012', 'Net 15', 4, true, true, '2027-06-15', 'Programs, prayer cards, register books'),
        ('Heavenly Urns', 'urn_supplier', 'Amanda Sterling', '888-555-3008', 'sales@heavenlyurns.com', '2200 Manufacturing Dr, San Antonio, TX 78219', 'www.heavenlyurns.com', '74-7890123', 'Net 30', 3, false, true, '2026-08-31', 'Wide selection of urns'),
        ('Comfort Catering', 'caterer', 'Chef Maria Gonzalez', '512-555-3009', 'maria@comfortcatering.com', '1800 E Cesar Chavez, Austin, TX 78702', 'www.comfortcatering.com', '74-8901234', 'Due on service', 5, true, true, NULL, 'Excellent reception catering'),
        ('Austin Executive Livery', 'livery', 'Richard Stone', '512-555-3010', 'dispatch@austinlivery.com', '6000 Airport Blvd, Austin, TX 78752', 'www.austinlivery.com', '74-9012345', 'Net 15', 4, true, true, '2026-12-15', 'Luxury family transportation'),
        ('Rabbi David Goldstein', 'clergy', 'Rabbi David Goldstein', '512-555-3011', 'rabbi.goldstein@bethshalom.org', 'Beth Shalom Synagogue, 3300 Steck Ave, Austin, TX 78757', NULL, NULL, 'Honorarium', 5, true, true, NULL, 'Jewish funeral officiant'),
        ('Peaceful Gardens Cemetery', 'cemetery', 'Robert Greenfield', '512-555-3012', 'info@peacefulgardens.com', '12000 Ranch Rd 620, Austin, TX 78750', 'www.peacefulgardens.com', '74-0123456', 'Per interment', 4, false, true, NULL, 'Partner cemetery'),
        ('Sacred Heart Flowers', 'florist', 'Rosa Delgado', '713-555-3013', 'rosa@sacredheartflowers.com', '3400 Navigation Blvd, Houston, TX 77003', 'www.sacredheartflowers.com', '76-1234567', 'Net 15', 4, false, true, '2027-02-28', 'Houston area florist'),
        ('Digital Memories Video', 'other', 'Alex Tran', '512-555-3014', 'alex@digitalmemories.com', '800 W 5th St, Austin, TX 78703', 'www.digitalmemories.com', '74-2345678', 'Due on delivery', 5, true, true, NULL, 'Video tributes and photo montages'),
        ('Father Patrick Kelly', 'clergy', 'Father Patrick Kelly', '214-555-3015', 'fr.kelly@stpatricks.org', 'St Patricks Cathedral, 1000 Main St, Dallas, TX 75201', NULL, NULL, 'Honorarium', 4, false, true, NULL, 'Catholic priest - Dallas area')
    `);
    console.log('  - vendors seeded');

    // --- Appointments ---
    await db.query(`
      INSERT INTO appointments (appointment_type, title, description, case_id, client_name, client_phone, client_email, assigned_staff, appointment_date, start_time, end_time, location, status, reminder_sent, notes) VALUES
        ('arrangement_conference', 'Thompson Family Arrangements', 'Full funeral arrangement conference', 1, 'Margaret Thompson', '512-555-0101', 'mthompson@email.com', 'Sarah Mitchell', '2026-03-02', '10:00', '12:00', 'Arrangement Office A', 'completed', true, 'Traditional funeral selected'),
        ('viewing', 'Thompson Viewing', 'Family viewing before service', 1, 'Margaret Thompson', '512-555-0101', NULL, 'James Carter', '2026-03-04', '14:00', '16:00', 'Serenity Chapel', 'completed', true, NULL),
        ('arrangement_conference', 'Mitchell Family Arrangements', 'Arrangement conference for memorial', 2, 'Susan Mitchell', '512-555-0102', 'smitchell@email.com', 'Sarah Mitchell', '2026-03-04', '10:00', '11:30', 'Arrangement Office B', 'completed', true, 'Memorial service selected'),
        ('consultation', 'Pre-Need Consultation - Williams', 'Pre-need planning consultation', NULL, 'Patricia Williams', '512-555-4004', 'pwilliams@email.com', 'David Chen', '2026-03-20', '14:00', '15:00', 'Conference Room', 'scheduled', true, 'Interested in premium pre-need plan'),
        ('visitation', 'Sullivan Visitation', 'Public visitation hours', 3, 'Family of Michael Sullivan', '214-555-0103', NULL, 'Emily Rodriguez', '2026-03-08', '17:00', '21:00', 'Heritage Hall', 'completed', true, 'Large attendance expected'),
        ('preneed_meeting', 'Gonzalez Pre-Need Review', 'Annual pre-need plan review', NULL, 'Maria Gonzalez', '713-555-1100', 'mgonzalez@email.com', 'David Chen', '2026-03-21', '09:00', '10:00', 'Arrangement Office A', 'confirmed', true, 'Reviewing payment schedule'),
        ('arrangement_conference', 'OConnor Military Arrangements', 'Military funeral arrangements', 7, 'Patricia OConnor', '512-555-0107', NULL, 'Sarah Mitchell', '2026-03-12', '10:00', '12:00', 'Arrangement Office A', 'completed', true, 'Coordinating with VA and honor guard'),
        ('pickup', 'Remains Pickup - St. Davids', 'Hospital pickup', 14, 'Hospital Staff', '512-555-8000', NULL, 'Transport Team', '2026-03-18', '22:00', '23:00', 'St. Davids Medical Center', 'completed', false, 'After-hours pickup'),
        ('delivery', 'Urn Delivery - Nakamura Family', 'Deliver urn to family home', 5, 'Linda Nakamura', '512-555-0305', NULL, 'James Carter', '2026-03-22', '11:00', '11:30', '4500 Balcones Dr, Austin TX', 'scheduled', true, 'Handle with care'),
        ('consultation', 'Insurance Consultation - Kowalski', 'Discuss insurance claim status', 10, 'Anna Kowalski', '512-555-0110', NULL, 'David Chen', '2026-03-21', '14:00', '14:30', 'Arrangement Office B', 'confirmed', true, 'Discussing appeal of denied claim'),
        ('viewing', 'OBrien Family Viewing', 'Private family viewing', 8, 'Patrick OBrien', '214-555-0108', NULL, 'Emily Rodriguez', '2026-03-15', '10:00', '12:00', 'Tranquility Room', 'completed', true, NULL),
        ('arrangement_conference', 'Morales Family Arrangements', 'Celebration of life arrangements', 15, 'Carlos Morales', '713-555-0115', NULL, 'Sarah Mitchell', '2026-03-20', '10:00', '12:00', 'Arrangement Office A', 'in_progress', true, 'Dia de los Muertos-inspired celebration'),
        ('other', 'Staff Training - CPR Renewal', 'Annual CPR certification renewal for all staff', NULL, 'Red Cross Instructor', '512-555-9000', NULL, 'All Staff', '2026-03-25', '09:00', '12:00', 'Conference Room', 'scheduled', false, 'Mandatory for all staff'),
        ('visitation', 'Washington Visitation', 'Evening visitation', 9, 'Family of Earl Washington', '713-555-0109', NULL, 'James Carter', '2026-03-16', '18:00', '21:00', 'Heritage Hall', 'completed', true, 'Jazz music during visitation'),
        ('consultation', 'New Family Inquiry', 'Walk-in family inquiring about services', NULL, 'Rebecca Martin', '512-555-5555', 'rmartin@email.com', 'David Chen', '2026-03-22', '15:00', '15:30', 'Reception', 'scheduled', false, 'Phone inquiry, wants to visit facility')
    `);
    console.log('  - appointments seeded');

    // --- Financial Records ---
    await db.query(`
      INSERT INTO financial_records (case_id, transaction_type, category, description, amount, payment_method, reference_number, payer_name, transaction_date, due_date, is_paid, paid_date, receipt_number, notes) VALUES
        (1, 'invoice', 'professional_services', 'Traditional funeral service - Thompson', 8500.00, NULL, 'INV-2026-001', 'Margaret Thompson', '2026-03-02', '2026-04-02', true, '2026-03-15', 'REC-001', 'Paid via insurance assignment'),
        (1, 'payment', 'professional_services', 'Insurance payment - Thompson', 8500.00, 'insurance', 'PAY-2026-001', 'State Farm Life Insurance', '2026-03-15', NULL, true, '2026-03-15', 'REC-002', 'Full payment received'),
        (2, 'invoice', 'professional_services', 'Memorial service - Mitchell', 4200.00, NULL, 'INV-2026-002', 'Susan Mitchell', '2026-03-04', '2026-04-04', false, NULL, NULL, 'Payment plan arranged'),
        (2, 'deposit', 'professional_services', 'Deposit - Mitchell memorial', 1500.00, 'credit_card', 'DEP-2026-001', 'Susan Mitchell', '2026-03-04', NULL, true, '2026-03-04', 'REC-003', 'Initial deposit'),
        (3, 'invoice', 'professional_services', 'Full funeral - Sullivan', 12500.00, NULL, 'INV-2026-003', 'Sullivan Family Trust', '2026-03-06', '2026-04-06', false, NULL, NULL, 'Large service with reception'),
        (5, 'invoice', 'professional_services', 'Buddhist ceremony and cremation - Nakamura', 6800.00, NULL, 'INV-2026-004', 'Linda Nakamura', '2026-03-10', '2026-04-10', true, '2026-03-18', 'REC-004', 'Paid in full'),
        (5, 'payment', 'professional_services', 'Full payment - Nakamura', 6800.00, 'check', 'PAY-2026-002', 'Linda Nakamura', '2026-03-18', NULL, true, '2026-03-18', 'REC-005', 'Check #4521'),
        (7, 'invoice', 'professional_services', 'Military funeral - OConnor', 9200.00, NULL, 'INV-2026-005', 'Patricia OConnor', '2026-03-13', '2026-04-13', false, NULL, NULL, 'VA benefits to cover portion'),
        (NULL, 'expense', 'supplies', 'Monthly embalming chemical supply order', 2850.00, 'bank_transfer', 'EXP-2026-001', 'Champion Company', '2026-03-01', NULL, true, '2026-03-01', NULL, 'Monthly standing order'),
        (NULL, 'expense', 'facilities', 'Facility electric bill - March', 1420.00, 'bank_transfer', 'EXP-2026-002', 'Austin Energy', '2026-03-05', '2026-03-20', true, '2026-03-18', NULL, NULL),
        (NULL, 'expense', 'fleet', 'Hearse maintenance - oil change and inspection', 450.00, 'credit_card', 'EXP-2026-003', 'Park Place Auto Service', '2026-03-10', NULL, true, '2026-03-10', NULL, 'Annual inspection'),
        (6, 'invoice', 'professional_services', 'Direct cremation - Ramirez', 1800.00, NULL, 'INV-2026-006', 'Maria Ramirez', '2026-03-11', '2026-04-11', true, '2026-03-16', 'REC-006', 'Paid via insurance'),
        (10, 'invoice', 'professional_services', 'Full funeral - Kowalski', 11000.00, NULL, 'INV-2026-007', 'Anna Kowalski', '2026-03-16', '2026-04-16', false, NULL, NULL, 'Insurance claim denied - family paying directly'),
        (10, 'payment', 'professional_services', 'Partial payment - Kowalski', 5000.00, 'credit_card', 'PAY-2026-003', 'Anna Kowalski', '2026-03-18', NULL, true, '2026-03-18', 'REC-007', 'First installment'),
        (NULL, 'expense', 'insurance', 'Business liability insurance - quarterly', 3200.00, 'bank_transfer', 'EXP-2026-004', 'Hartford Insurance', '2026-03-15', NULL, true, '2026-03-15', NULL, 'Q2 premium')
    `);
    console.log('  - financial_records seeded');

    // --- Communications ---
    await db.query(`
      INSERT INTO communications (case_id, communication_type, direction, contact_name, contact_phone, contact_email, subject, content, staff_member, communication_date, communication_time, follow_up_needed, follow_up_date, follow_up_completed, notes) VALUES
        (1, 'phone_call', 'inbound', 'Margaret Thompson', '512-555-0101', NULL, 'Initial death notification', 'Received call from Mrs. Thompson regarding passing of husband Robert. Expressed need for traditional funeral service.', 'Sarah Mitchell', '2026-03-01', '14:30', true, '2026-03-02', true, 'Arrangement conference scheduled'),
        (1, 'in_person', 'inbound', 'Margaret Thompson', '512-555-0101', NULL, 'Arrangement conference', 'Met with Mrs. Thompson and family. Selected traditional funeral package. Discussed music, readings, and flowers.', 'Sarah Mitchell', '2026-03-02', '10:00', false, NULL, false, NULL),
        (2, 'email', 'outbound', 'Susan Mitchell', NULL, 'smitchell@email.com', 'Memorial Service Confirmation', 'Sent confirmation email with memorial service details, venue, and time.', 'Emily Rodriguez', '2026-03-05', '09:00', false, NULL, false, NULL),
        (3, 'phone_call', 'inbound', 'Kevin Sullivan', '214-555-0103', NULL, 'Obituary approval', 'Kevin called to approve final obituary draft. Requested minor edits to career section.', 'David Chen', '2026-03-07', '16:00', true, '2026-03-08', true, 'Edits made and resubmitted'),
        (5, 'in_person', 'inbound', 'Linda Nakamura', '512-555-0305', NULL, 'Buddhist ceremony planning', 'Met with Mrs. Nakamura and Buddhist monk to plan ceremony details. Discussed altar setup and incense protocols.', 'Sarah Mitchell', '2026-03-10', '11:00', false, NULL, false, NULL),
        (7, 'phone_call', 'outbound', 'VA Benefits Office', '800-555-2007', NULL, 'Military honors coordination', 'Called VA to coordinate honor guard, flag folding, and bugler for OConnor service.', 'James Carter', '2026-03-12', '10:00', true, '2026-03-13', true, 'Honor guard confirmed'),
        (7, 'email', 'outbound', 'Patricia OConnor', NULL, 'poconnor@email.com', 'Service details and timeline', 'Sent detailed timeline for military funeral including procession route, honor guard timing, and reception details.', 'Sarah Mitchell', '2026-03-13', '14:00', false, NULL, false, NULL),
        (10, 'phone_call', 'outbound', 'Anna Kowalski', '512-555-0110', NULL, 'Insurance claim update', 'Called Mrs. Kowalski to inform her of insurance claim denial. Discussed appeal options and payment alternatives.', 'David Chen', '2026-03-17', '11:00', true, '2026-03-21', false, 'Scheduled follow-up to discuss appeal'),
        (NULL, 'email', 'outbound', 'All Families', NULL, NULL, 'Easter remembrance invitation', 'Sent annual Easter remembrance ceremony invitation to all families served in past 12 months.', 'Emily Rodriguez', '2026-03-15', '08:00', false, NULL, false, 'Bulk email - 145 families'),
        (9, 'phone_call', 'inbound', 'Rev. James Washington', '713-555-4444', NULL, 'Jazz tribute details', 'Pastor called to confirm jazz musicians for celebration of life. Discussed song selections and timing.', 'James Carter', '2026-03-15', '13:00', false, NULL, false, NULL),
        (15, 'phone_call', 'inbound', 'Carlos Morales', '713-555-0115', NULL, 'Initial call - Morales', 'Received call from Mr. Morales regarding passing of wife Betty. Discussed celebration of life with Dia de los Muertos elements.', 'Sarah Mitchell', '2026-03-17', '19:00', true, '2026-03-20', false, 'Arrangement conference scheduled'),
        (11, 'letter', 'outbound', 'Sarah Greenfield', NULL, NULL, 'Green burial confirmation', 'Sent formal confirmation letter for natural burial at Green Meadows, including biodegradable casket details.', 'David Chen', '2026-03-18', '09:00', false, NULL, false, 'Mailed via certified mail'),
        (NULL, 'phone_call', 'inbound', 'Rebecca Martin', '512-555-5555', 'rmartin@email.com', 'Service inquiry', 'New inquiry about funeral planning services. Interested in pre-need planning for parents.', 'David Chen', '2026-03-19', '15:00', true, '2026-03-22', false, 'Consultation appointment scheduled'),
        (8, 'text_message', 'outbound', 'Patrick OBrien', '214-555-0108', NULL, 'Document reminder', 'Sent reminder about outstanding death certificate copies needed for insurance claim.', 'Emily Rodriguez', '2026-03-18', '10:00', true, '2026-03-20', false, NULL),
        (12, 'video_call', 'outbound', 'George Papadopoulos', '713-555-0112', NULL, 'Remote arrangement conference', 'Video call with Mr. Papadopoulos in Houston to discuss Orthodox funeral arrangements. Coordinated with Fr. Dimitri.', 'Sarah Mitchell', '2026-03-19', '14:00', true, '2026-03-20', false, 'Follow up on church availability')
    `);
    console.log('  - communications seeded');

    // --- Flower Orders ---
    await db.query(`
      INSERT INTO flower_orders (case_id, sender_name, sender_phone, sender_relationship, florist_name, arrangement_type, description, ribbon_message, delivery_date, delivery_time, delivery_location, price, is_received, display_location, thank_you_sent, notes) VALUES
        (1, 'Margaret Thompson', '512-555-0101', 'Wife', 'Bella Flora Designs', 'casket_spray', 'Red and white roses casket spray', 'Beloved Husband', '2026-03-04', '08:00', 'Serenity Chapel', 450.00, true, 'On casket', false, 'Premium arrangement'),
        (1, 'Johnson Family', '512-555-8001', 'Neighbors', 'Bella Flora Designs', 'standing_spray', 'White lilies and greenery standing spray', 'With Deepest Sympathy', '2026-03-04', '09:00', 'Serenity Chapel', 185.00, true, 'Left of altar', true, NULL),
        (1, 'Austin Rotary Club', '512-555-8002', 'Organization', 'Sacred Heart Flowers', 'wreath', 'Large green and white wreath', 'In Loving Memory - Austin Rotary', '2026-03-04', '08:30', 'Serenity Chapel', 225.00, true, 'Entrance', true, NULL),
        (3, 'Sullivan Law Partners', '214-555-8003', 'Colleagues', 'Bella Flora Designs', 'standing_spray', 'White roses and blue delphinium', 'In Memory of Our Partner', '2026-03-09', '10:00', 'Heritage Hall', 275.00, true, 'Right of podium', true, NULL),
        (3, 'Dallas Bar Association', '214-555-8004', 'Professional', 'Sacred Heart Flowers', 'wreath', 'Large formal wreath', 'With Respect - Dallas Bar Association', '2026-03-09', '09:00', 'Heritage Hall', 300.00, true, 'Entrance foyer', true, NULL),
        (5, 'Linda Nakamura', '512-555-0305', 'Wife', 'Bella Flora Designs', 'bouquet', 'White chrysanthemums - traditional Japanese', 'In eternal peace', '2026-03-12', '07:00', 'Buddhist Temple Room', 120.00, true, 'Near altar', false, 'Traditional Buddhist flowers'),
        (7, 'Veterans of Foreign Wars Post 89', '512-555-8005', 'Organization', 'Bella Flora Designs', 'cross', 'Red, white, and blue cross arrangement', 'Semper Fi - VFW Post 89', '2026-03-14', '08:00', 'Serenity Chapel', 195.00, true, 'Near flag display', true, NULL),
        (7, 'Patricia OConnor', '512-555-0107', 'Wife', 'Bella Flora Designs', 'casket_spray', 'American flag-themed casket spray', 'Forever My Hero', '2026-03-14', '07:00', 'Serenity Chapel', 525.00, true, 'On casket', false, 'Special military theme'),
        (8, 'St. Patricks Parish', '214-555-8006', 'Church', 'Sacred Heart Flowers', 'standing_spray', 'White and green arrangement', 'Rest in Peace - St. Patricks Parish', '2026-03-16', '09:00', 'Tranquility Room', 200.00, true, 'Altar area', true, NULL),
        (9, 'Washington Family Reunion Committee', '713-555-8007', 'Family', 'Sacred Heart Flowers', 'heart', 'Red roses heart arrangement', 'Forever in Our Hearts', '2026-03-17', '14:00', 'Heritage Hall', 350.00, true, 'Stage center', false, NULL),
        (10, 'Polish American Society of Austin', '512-555-8008', 'Organization', 'Bella Flora Designs', 'standing_spray', 'White and red arrangement', 'Rest in Peace - Polish American Society', '2026-03-18', '09:00', 'Serenity Chapel', 185.00, true, 'Left side', true, NULL),
        (12, 'Papadopoulos Family Greece', '011-30-555-8009', 'Extended Family', 'Bella Flora Designs', 'wreath', 'Olive branch and white lily wreath', 'From Your Family in Athens', '2026-03-20', '08:00', 'Heritage Hall', 275.00, false, NULL, false, 'International order - confirmed'),
        (15, 'Houston Arts Council', '713-555-8010', 'Organization', 'Sacred Heart Flowers', 'basket', 'Colorful garden basket', 'In Memory of Betty - Houston Arts Council', '2026-03-24', '09:00', 'Garden Pavilion', 165.00, false, NULL, false, 'Delivery scheduled for service day'),
        (15, 'Carlos Morales', '713-555-0115', 'Husband', 'Bella Flora Designs', 'custom', 'Custom marigold and rose altar arrangement - Dia de los Muertos theme', 'Mi Amor Eterno', '2026-03-24', '07:00', 'Garden Pavilion', 650.00, false, NULL, false, 'Special cultural arrangement'),
        (14, 'Murphy Family', '512-555-0114', 'Family', 'Bella Flora Designs', 'casket_spray', 'Irish green and white casket spray with shamrocks', 'Go n-eiri an bothar leat', '2026-03-22', '08:00', 'Serenity Chapel', 475.00, false, NULL, false, 'Irish blessing on ribbon')
    `);
    console.log('  - flower_orders seeded');

    // --- Facility Rooms ---
    await db.query(`
      INSERT INTO facility_rooms (room_name, room_type, capacity, floor_level, has_av_equipment, has_wheelchair_access, hourly_rate, description, amenities, case_id, booking_date, start_time, end_time, booking_status, notes) VALUES
        ('Serenity Chapel', 'chapel', 200, '1st Floor', true, true, 150.00, 'Main chapel with stained glass windows and pipe organ', 'Organ, sound system, projector, screen, podium, kneelers', 14, '2026-03-22', '10:00', '12:00', 'reserved', 'Murphy funeral service'),
        ('Heritage Hall', 'reception_hall', 300, '1st Floor', true, true, 200.00, 'Large reception hall with attached kitchen', 'Full kitchen, tables, chairs, sound system, projector, dance floor', 15, '2026-03-25', '16:00', '22:00', 'reserved', 'Morales celebration of life'),
        ('Tranquility Room', 'viewing_room', 75, '1st Floor', true, true, 75.00, 'Intimate viewing room with warm lighting', 'Adjustable lighting, sound system, guest book stand, tissue stations', NULL, NULL, NULL, NULL, 'available', NULL),
        ('Peace Garden Pavilion', 'chapel', 100, 'Outdoor', true, true, 125.00, 'Covered outdoor pavilion surrounded by gardens', 'Sound system, string lights, portable podium, garden seating', NULL, NULL, NULL, NULL, 'available', 'Weather dependent'),
        ('Arrangement Office A', 'arrangement_office', 8, '2nd Floor', false, true, 0.00, 'Primary arrangement conference room', 'Conference table, display materials, beverage station, tissue box', 15, '2026-03-20', '10:00', '12:00', 'occupied', 'Morales family arrangements'),
        ('Arrangement Office B', 'arrangement_office', 6, '2nd Floor', false, true, 0.00, 'Secondary arrangement office', 'Desk, comfortable seating, display catalog, beverage station', NULL, NULL, NULL, NULL, 'available', NULL),
        ('Preparation Room 1', 'preparation_room', 4, 'Lower Level', false, false, 0.00, 'Primary embalming and preparation room', 'Embalming table, ventilation system, chemical storage, instrument cabinet', NULL, NULL, NULL, NULL, 'available', 'Staff only - restricted access'),
        ('Preparation Room 2', 'preparation_room', 4, 'Lower Level', false, false, 0.00, 'Secondary preparation room', 'Embalming table, ventilation, storage', NULL, NULL, NULL, NULL, 'maintenance', 'Ventilation system repair scheduled'),
        ('Family Lounge', 'lounge', 20, '1st Floor', true, true, 0.00, 'Private family waiting and gathering area', 'Comfortable seating, TV, coffee station, refrigerator, private restroom', NULL, NULL, NULL, NULL, 'available', 'Complimentary for families'),
        ('Conference Room', 'arrangement_office', 15, '2nd Floor', true, true, 50.00, 'Large conference room for meetings and training', 'Projector, whiteboard, video conferencing, tables', NULL, '2026-03-25', '09:00', '12:00', 'reserved', 'Staff CPR training'),
        ('Storage Room A', 'storage', 0, 'Lower Level', false, false, 0.00, 'Casket and merchandise display storage', 'Climate controlled, security system', NULL, NULL, NULL, NULL, 'available', NULL),
        ('Storage Room B', 'storage', 0, 'Lower Level', false, false, 0.00, 'Chemical and supply storage', 'Ventilated, hazmat compliant, locked', NULL, NULL, NULL, NULL, 'available', 'OSHA compliant'),
        ('Parking Lot - Main', 'parking', 80, 'Ground', false, true, 0.00, 'Main visitor parking lot', 'Handicap spaces, covered walkway to entrance, lighting', NULL, NULL, NULL, NULL, 'available', '80 spaces including 6 handicap'),
        ('Parking Lot - Overflow', 'parking', 40, 'Ground', false, true, 0.00, 'Overflow parking for large services', 'Additional lighting, shuttle service available', NULL, NULL, NULL, NULL, 'available', 'Used for services over 150 guests'),
        ('Clergy Suite', 'lounge', 4, '1st Floor', false, true, 0.00, 'Private room for officiants to prepare', 'Desk, mirror, closet, private restroom, beverage station', NULL, NULL, NULL, NULL, 'available', 'Adjacent to Serenity Chapel')
    `);
    console.log('  - facility_rooms seeded');

    // --- Aftercare ---
    await db.query(`
      INSERT INTO aftercare (case_id, family_contact_name, family_phone, family_email, relationship, program_type, scheduled_date, completed_date, assigned_staff, content_notes, family_feedback, emotional_status, referrals_made, next_contact_date, status, notes) VALUES
        (1, 'Margaret Thompson', '512-555-0101', 'mthompson@email.com', 'Wife', 'phone_follow_up', '2026-03-15', '2026-03-15', 'Emily Rodriguez', 'Called to check on Mrs. Thompson two weeks after service. She expressed gratitude for the care received.', 'Very appreciative of the beautiful service', 'Grieving but coping', NULL, '2026-04-01', 'completed', 'Mentioned she is staying with daughter'),
        (1, 'Margaret Thompson', '512-555-0101', 'mthompson@email.com', 'Wife', 'grief_package', '2026-03-16', '2026-03-16', 'Emily Rodriguez', 'Sent grief support package with books, journal, and community resources', NULL, NULL, NULL, NULL, 'completed', 'Included When Grief Visits book and grief journal'),
        (2, 'Susan Mitchell', '512-555-0102', 'smitchell@email.com', 'Daughter', 'phone_follow_up', '2026-03-18', '2026-03-18', 'Emily Rodriguez', 'Two-week follow-up call. Susan shared fond memories of her father.', 'Grateful for the memorial service', 'Processing grief, good support system', 'Referred to GriefShare program at local church', '2026-04-05', 'completed', NULL),
        (3, 'Kevin Sullivan', '214-555-0103', 'ksullivan@email.com', 'Son', 'phone_follow_up', '2026-03-20', NULL, 'Emily Rodriguez', NULL, NULL, NULL, NULL, '2026-04-10', 'scheduled', 'Two-week follow-up'),
        (4, 'Family of Dorothy Williams', '713-555-0104', NULL, 'Family', 'grief_package', '2026-03-22', NULL, 'Emily Rodriguez', NULL, NULL, NULL, NULL, NULL, 'scheduled', 'Standard grief package'),
        (5, 'Linda Nakamura', '512-555-0305', 'lnakamura@email.com', 'Wife', 'phone_follow_up', '2026-03-25', NULL, 'Emily Rodriguez', NULL, NULL, NULL, NULL, '2026-04-12', 'scheduled', 'Cultural sensitivity - Buddhist practices'),
        (5, 'Linda Nakamura', '512-555-0305', 'lnakamura@email.com', 'Wife', 'support_group_referral', '2026-03-25', NULL, 'Emily Rodriguez', NULL, NULL, NULL, 'Austin Buddhist Community grief circle', NULL, 'scheduled', 'Connect with Buddhist community support'),
        (7, 'Patricia OConnor', '512-555-0107', 'poconnor@email.com', 'Wife', 'phone_follow_up', '2026-03-28', NULL, 'Emily Rodriguez', NULL, NULL, NULL, NULL, '2026-04-15', 'scheduled', 'Veteran spouse - check on VA benefits'),
        (7, 'Patricia OConnor', '512-555-0107', 'poconnor@email.com', 'Wife', 'support_group_referral', '2026-03-28', NULL, 'Emily Rodriguez', NULL, NULL, NULL, 'TAPS - Tragedy Assistance Program for Survivors', NULL, 'scheduled', 'Military-specific grief support'),
        (9, 'Family of Earl Washington', '713-555-0109', NULL, 'Family', 'home_visit', '2026-04-01', NULL, 'Emily Rodriguez', NULL, NULL, NULL, NULL, '2026-05-01', 'scheduled', 'Home visit to large family'),
        (10, 'Anna Kowalski', '512-555-0110', 'akowalski@email.com', 'Wife', 'phone_follow_up', '2026-04-01', NULL, 'David Chen', NULL, NULL, NULL, NULL, '2026-04-15', 'scheduled', 'Also check on insurance appeal status'),
        (1, 'Margaret Thompson', '512-555-0101', 'mthompson@email.com', 'Wife', 'anniversary_card', '2027-03-01', NULL, 'Emily Rodriguez', NULL, NULL, NULL, NULL, NULL, 'scheduled', 'One-year anniversary remembrance card'),
        (2, 'Susan Mitchell', '512-555-0102', 'smitchell@email.com', 'Daughter', 'holiday_remembrance', '2026-12-15', NULL, 'Emily Rodriguez', NULL, NULL, NULL, NULL, NULL, 'scheduled', 'Holiday season remembrance card'),
        (8, 'Patrick OBrien', '214-555-0108', 'pobrien@email.com', 'Husband', 'memorial_event', '2026-05-15', NULL, 'Sarah Mitchell', NULL, NULL, NULL, NULL, NULL, 'scheduled', 'Invited to annual memorial garden ceremony'),
        (6, 'Maria Ramirez', '512-555-0106', NULL, 'Wife', 'phone_follow_up', '2026-03-26', NULL, 'Emily Rodriguez', NULL, NULL, NULL, NULL, '2026-04-10', 'scheduled', 'Direct cremation - brief follow-up')
    `);
    console.log('  - aftercare seeded');

    console.log('\nDatabase seed completed successfully!');
    console.log('Summary:');
    console.log('  - 5 users (admin: admin@eternalhaven.com / admin123)');
    console.log('  - 15 cases');
    console.log('  - 15 services');
    console.log('  - 15 compliance records');
    console.log('  - 15 pricing items');
    console.log('  - 15 preneed plans');
    console.log('  - 15 at-need records');
    console.log('  - 15 grief support resources');
    console.log('  - 15 inventory items');
    console.log('  - 15 staff members');
    console.log('  - 15 documents');
    console.log('  - 15 cremation records');
    console.log('  - 15 fleet vehicles');
    console.log('  - 15 memorial products');
    console.log('  - 15 obituaries');
    console.log('  - 15 embalming records');
    console.log('  - 15 cemetery plots');
    console.log('  - 15 insurance claims');
    console.log('  - 15 vendors');
    console.log('  - 15 appointments');
    console.log('  - 15 financial records');
    console.log('  - 15 communications');
    console.log('  - 15 flower orders');
    console.log('  - 15 facility rooms');
    console.log('  - 15 aftercare records');

  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await db.pool.end();
    console.log('Database connection closed.');
    process.exit(0);
  }
})();
