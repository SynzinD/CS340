-- OSU340 Spring 2025 Group 47
-- Megan Mooers and Synzin Darkpaw
-- Project CUD


DROP PROCEDURE IF EXISTS sp_AddIndividual;
DROP PROCEDURE IF EXISTS sp_DeleteIndividual;
DROP PROCEDURE IF EXISTS sp_UpdateIndividual;
DROP PROCEDURE IF EXISTS sp_UpdateVenue;
DROP PROCEDURE IF EXISTS sp_AddVenue;
DROP PROCEDURE IF EXISTS sp_DeleteVenue;
DROP PROCEDURE IF EXISTS sp_UpdateEvent;
DROP PROCEDURE IF EXISTS sp_AddEvent;
DROP PROCEDURE IF EXISTS sp_DeleteEvent;
DROP PROCEDURE IF EXISTS sp_AddRegistration;
DROP PROCEDURE IF EXISTS sp_UpdateRegistration;
DROP PROCEDURE IF EXISTS sp_DeleteRegistration;
DROP PROCEDURE IF EXISTS sp_AddSeatingObject;
DROP PROCEDURE IF EXISTS sp_UpdateSeatingObject;
DROP PROCEDURE IF EXISTS sp_DeleteSeatingObject;




DELIMITER //

-- Stored procedure to Add Individual Attendee
CREATE PROCEDURE sp_AddIndividual(
    IN p_firstName VARCHAR(255),
    IN p_lastName VARCHAR(255),
    IN p_email VARCHAR(255)
)
BEGIN
    INSERT INTO individuals (firstName, lastName, email)
    VALUES (p_firstName, p_lastName, p_email);
END //

-- Delete Individual
CREATE PROCEDURE sp_DeleteIndividual(
    IN p_individualID INT
)
BEGIN
    DELETE FROM individuals
    WHERE individualID = p_individualID;
END //

-- Edit Individual
CREATE PROCEDURE sp_UpdateIndividual(
    IN p_individualID INT,
    IN p_firstName VARCHAR(255),
    IN p_lastName VARCHAR(255),
    IN p_email VARCHAR(255)
)
BEGIN
    UPDATE individuals
    SET
        firstName = p_firstName,
        lastName = p_lastName,
        email = p_email
    WHERE individualID = p_individualID;
END //



-- Edit Venue
CREATE PROCEDURE sp_UpdateVenue(
    IN p_venueID INT,
    IN p_venueName VARCHAR(255),
    IN p_location VARCHAR(255),
    IN p_capacity INT
)
BEGIN
    UPDATE venues
    SET
        venueName = p_venueName,
        location = p_location,
        capacity = p_capacity
    WHERE venueID = p_venueID;
END //

-- Add Venue
CREATE PROCEDURE sp_AddVenue(
    IN p_venueName VARCHAR(255),
    IN p_venueLocation VARCHAR(255),
    IN p_venueCapacity INT
)
BEGIN
    INSERT INTO venues (venueName, location, capacity)
    VALUES (p_venueName, p_venueLocation, p_venueCapacity);

    -- Select the ID of the newly inserted row
    SELECT LAST_INSERT_ID() AS venueID;
END //

-- Delete Venue
CREATE PROCEDURE sp_DeleteVenue(
    IN p_venueID INT
)
BEGIN
    DELETE FROM venues
    WHERE venueID = p_venueID;
END //



-- Edit Event
CREATE PROCEDURE sp_UpdateEvent(
    IN p_eventID INT,
    IN p_eventName VARCHAR(100),
    IN p_eventDateTime DATETIME,
    IN p_venueID INT,
    IN p_eventCapacity INT,
    IN p_seatingType VARCHAR(50),
    IN p_description TEXT
)
BEGIN
    UPDATE events
    SET
        eventName = p_eventName,
        eventDateTime = p_eventDateTime,
        venueID = p_venueID,
        eventCapacity = p_eventCapacity,
        seatingType = p_seatingType,
        Description = p_description
    WHERE eventID = p_eventID;
END //

-- Add Event
CREATE PROCEDURE sp_AddEvent (
    IN p_eventName VARCHAR(255),
    IN p_eventDateTime DATETIME,
    IN p_venueID INT,
    IN p_seatingType VARCHAR(50),
    IN p_description TEXT,
    IN p_eventCapacity INT
)
BEGIN
    INSERT INTO events (eventName, eventDateTime, venueID, seatingType, Description, eventCapacity)
    VALUES (p_eventName, p_eventDateTime, p_venueID, p_seatingType, p_description, p_eventCapacity);

    SELECT LAST_INSERT_ID() AS newEventID; -- IMPORTANT: Returns the ID of the newly inserted row
END //

-- Delete Event
CREATE PROCEDURE sp_DeleteEvent (IN p_eventID INT)
BEGIN
    DELETE FROM events WHERE eventID = p_eventID;
END //



-- Add Event Registration
CREATE PROCEDURE sp_AddRegistration (
    IN p_individualID INT,
    IN p_eventID INT,
    IN p_seating_objectID INT,
    IN p_objectSeat INT
)
BEGIN
    INSERT INTO event_registrations (individualID, eventID, seating_objectID, objectSeat)
    VALUES (p_individualID, p_eventID, p_seating_objectID, p_objectSeat);

    SELECT LAST_INSERT_ID() AS newRegistrationID;
END //

-- Edit Event Registration
CREATE PROCEDURE sp_UpdateRegistration (
    IN p_registrationID INT,
    IN p_individualID INT,
    IN p_eventID INT,
    IN p_seating_objectID INT,
    IN p_objectSeat INT
)
BEGIN
    UPDATE event_registrations
    SET
        individualID = p_individualID,
        eventID = p_eventID,
        seating_objectID = p_seating_objectID,
        objectSeat = p_objectSeat
    WHERE registrationID = p_registrationID;
END //

-- Delete Event Registration
CREATE PROCEDURE sp_DeleteRegistration (IN p_registrationID INT)
BEGIN
    DELETE FROM event_registrations WHERE registrationID = p_registrationID;
END //



-- Add Seating Object
CREATE PROCEDURE sp_AddSeatingObject (
    IN p_eventID INT,
    IN p_objectName VARCHAR(45),
    IN p_objectCapacity INT
)
BEGIN
    INSERT INTO seating_objects (eventID, objectName, objectCapacity)
    VALUES (p_eventID, p_objectName, p_objectCapacity);

    SELECT LAST_INSERT_ID() AS newSeatingObjectID;
END//

-- Edit Seating Object
CREATE PROCEDURE sp_UpdateSeatingObject (
    IN p_seating_objectID INT,
    IN p_eventID INT,
    IN p_objectName VARCHAR(45),
    IN p_objectCapacity INT
)
BEGIN
    UPDATE seating_objects
    SET
        eventID = p_eventID,
        objectName = p_objectName,
        objectCapacity = p_objectCapacity
    WHERE seating_objectID = p_seating_objectID;
END//

-- Delete Seating Object
CREATE PROCEDURE sp_DeleteSeatingObject (IN p_seating_objectID INT)
BEGIN
    DELETE FROM seating_objects WHERE seating_objectID = p_seating_objectID;
END//


DELIMITER ;