-- PRC Rental MSSQL schema for dynamic forms and core tables
-- Run on startup to ensure all required tables exist

IF OBJECT_ID(N'dbo.forms', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.forms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(1000) NULL,
    created_at DATETIME DEFAULT GETDATE()
  );
END

IF OBJECT_ID(N'dbo.form_fields', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.form_fields (
    id INT IDENTITY(1,1) PRIMARY KEY,
    form_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    options NVARCHAR(MAX) NULL,
    required BIT DEFAULT 0,
    meta NVARCHAR(MAX) NULL,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_form_fields_form FOREIGN KEY (form_id) REFERENCES dbo.forms(id)
  );
END

IF OBJECT_ID(N'dbo.form_entries', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.form_entries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    form_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_form_entries_form FOREIGN KEY (form_id) REFERENCES dbo.forms(id)
  );
END

IF OBJECT_ID(N'dbo.form_values', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.form_values (
    id INT IDENTITY(1,1) PRIMARY KEY,
    entry_id INT NOT NULL,
    field_id INT NOT NULL,
    [value] NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_form_values_entry FOREIGN KEY (entry_id) REFERENCES dbo.form_entries(id),
    CONSTRAINT FK_form_values_field FOREIGN KEY (field_id) REFERENCES dbo.form_fields(id)
  );
END

-- Core tables for rentals and users (kept similar to previous inline SQL)
IF OBJECT_ID(N'dbo.prc_rental_table', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.prc_rental_table (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sequence INT NOT NULL,
    building VARCHAR(5) NOT NULL,
    floor INT NOT NULL,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    company NVARCHAR(255) NULL,
    note NVARCHAR(255) NULL,
    move_in_date DATE NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
  );
END

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name NVARCHAR(100) NULL,
    created_at DATETIME DEFAULT GETDATE()
  );
END
