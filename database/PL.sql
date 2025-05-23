-- OSU340 Spring 2025 Group 47
-- Megan Mooers and Synzin Darkpaw
-- Project CUD


DROP PROCEDURE IF EXISTS sp_AddIndividual;
DROP PROCEDURE IF EXISTS sp_DeleteIndividual;
DROP PROCEDURE IF EXISTS sp_UpdateIndividual;
DROP PROCEDURE IF EXISTS sp_UpdateVenue;
DROP PROCEDURE IF EXISTS sp_UpdateEvent;


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



DELIMITER ;