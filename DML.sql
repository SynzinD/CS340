/*
CS340 Group 47 Project Step 3 Draft
Megan Mooers and Synzin Darkpaw 
*/

/*
Individuals CRUD
*/

-- To add an individual
INSERT INTO individuals
(`firstName`, `lastName`, `email`)
VALUES 
( @fNameInsert, @lNameInsert, @emailInsert);

-- Select all attributes from the individuals table
SELECT * FROM individuals;

-- Search the individuals table for rows where the first name matches input
SELECT * FROM individuals WHERE firstName LIKE @fNameSearch;
-- Search the individuals table for rows where the last name matche sinput
SELECT * FROM individuals WHERE lastName LIKE @lNameSearch;

-- Update an individual record when the first and last names are supplied.
UPDATE individuals
SET firstName = @fNameUpdate, lastName = @lNameUpdate, email = @emailUpdate
WHERE individualID = (SELECT individualID FROM individuals WHERE firstName = @fNameSelect AND lastName = @lNameSelect);
-- Delete an individual record where the first and last names are supplied. 
DELETE FROM individuals WHERE individualID = (SELECT individualID FROM individuals WHERE firstName = @fNameSelect AND lastName = @lNameSelect);

/*
Venues CRUD
*/

--Add a venue to the database using supplied values.
INSERT INTO venues
  (`venueName`, `location`, `capacity`)
  VALUES
  (@vNameInsert, @vLocationInsert, @vCapacityInsert);

-- Get all values from the venues table for output
SELECT * FROM venues;
-- Return the venueID when the name is supplied. will be used on the events page to convert dropdown value back of name back into venueID
SELECT venueID FROM venues WHERE venueName LIKE @vNameSearch;
-- Return the venueName where ID is supplied, used to display venueName instead of ID 
SELECT venueName FROM venues WHERE venueID = @vVenueID
-- Update venues based on venueName vs. ID
UPDATE venues
SET venueName = @vNameUpdate, location = @vLocationUpdate, capacity = @vCapacityUpdate
WHERE venueID = (SELECT venueID FROM venues WHERE eventName = @vNameSelect);
-- delete venues based on venueName
DELETE FROM venues WHERE venueID = (SELECT venueID FROM venues WHERE eventName = @vNameSelect);

/*
Events CRUD - Used on /events
*/
-- insert into events where venueName is pulled from a picklist and must be subqueried to get the ID
INSERT INTO events 
(`eventName`, `eventDateTime`, `venueID`, `seatingType`, `description`, `eventCapacity`)
VALUES
(@eNameInsert, @eDateTimeInsert, (SELECT venueID from venues WHERE venueName = @vNameInsert), @eSeatingTypeInsert, @eDescriptionInsert, @eCapacityInsert);

-- generic pull all for table fill, may be changed to convert venueID into name
SELECT * FROM events;

-- Used to swap out the VenueID for the VenueName in the display table. 
SELECT
                e.eventID,
                e.eventName,
                e.eventDateTime,
                v.venueName,
                e.seatingType,
                e.description,
                e.eventCapacity,
                e.venueID /* Keep for edit functionality */
            FROM events e
            JOIN venues v ON e.venueID = v.venueID

-- populate the picklist for venues on the Events page
SELECT venueID, venueName FROM venues
	
-- Search for events based on the name. 
SELECT * FROM events WHERE eventName LIKE @eNameSearch;
-- Update events where the name of the event vs the eventID is supplied, and where the venueName vs the venueID is supplied
UPDATE events
SET eventName = @eNameUpdate, eventDateTime = @eDateTimeUpdate, eventID = (SELECT venueID from venues WHERE venueName = @vNameUpdate), seatingType = @eSeatingTypeUpdate, description = @eDescriptionUpdate, eventCapacity = @eCapacityUpdate
WHERE eventID = (SELECT eventID FROM events WHERE eventName = @eNameSelect);
-- Delete events based on a supplied name. 
DELETE FROM events WHERE eventID = (SELECT eventID FROM events WHERE eventName = @eNameSelect);

/*
 seating_objects CRUD
*/

-- Add seating objects where event name will be pulled from a dropdown and subqueried to return the eventID
INSERT INTO seating_objects
(`eventID`, `objectName`, `objectCapacity`)
VALUES
((SELECT eventID FROM events WHERE eventName = @eNameSelect), @oNameInsert, @oCapacityInsert);

-- Pull all values from seating_object to populate unforma--tted list. 
SELECT * FROM seating_objects;

-- Populate the table with more user friendly data, displaying eventName, instead of the FK. 
SELECT
                so.seating_objectID,
                e.eventName,
                so.objectName,
                so.objectCapacity,
                so.eventID /* Keep for edit functionality */
            FROM seating_objects so
            JOIN events e ON so.eventID = e.eventID

-- Used to Populate Events Picklist in Add Seating Object form
SELECT eventID, eventName FROM events
	
-- Get a list of all the seating objects that are named the same thing over all events - possible search function
SELECT * FROM seating_objects WHERE objectName LIKE @oNameSearch;
-- Get a list of all the seating objects at a given event
SELECT objectName FROM seating_objects WHERE eventID = (SELECT eventID FROM events WHERE eventName = @eNameSelect);
-- Edit seating events with supplied values when searching by their name and referring to the venue name rather than ID
UPDATE seating_objects
SET eventID = (SELECT eventID FROM events WHERE eventName = @eNameSelect), objectName = @oNameUpdate, objectCapacity = @oCapacityUpdate
WHERE venueID = (SELECT venueID FROM venues WHERE eventName = @vNameSelect);
-- Delete based on seating object name + eventID
DELETE FROM seating_object WHERE seating_objectID = (SELECT seating_objectID FROM seating_objects WHERE objectName = @oNameSelect and eventID = @eventID);

/*
 event_registrations CRUD
*/

/*
Will be used in conjunction with add registration function where name will be added based on fname/lname combo from a picklist, 
and eventID for eventName, and seating_objectID for the unique combination of eventName and seatingObjectName, with an additional value for the seatNum
*/
INSERT INTO event_registrations
(`individualID`, `eventID`, `seating_objectID`, `objectSeat`)
VALUES
	((SELECT individualID from individuals WHERE firstName = @fNameInsert AND lastName = @lNameInsert),
	(SELECT eventID from events WHERE eventName = @eNameInsert),
	(SELECT seating_objectID from seating_objects WHERE eventID = (select eventID from events WHERE eventName = @eNameInsert) and objectName = @oNameInsert),
    @oSeatInsert);

-- Generic get all values for event_registrations.
SELECT * FROM event_registrations;
/*
Populate event_registrations table in UI, bringing in values from individuals and seating objects,
and handling situations where individual firstname may not be supplied.
*/
SELECT
	r.registrationID,
	e.eventName,
        CASE
            WHEN i.firstName IS NOT NULL AND i.firstName <> '' THEN CONCAT(i.firstName, ' ', i.lastName)
            ELSE i.lastName
        END AS individualName,
        s.objectName AS seatingObjectName,
        r.objectSeat,
        r.individualID,
        r.eventID,    
        r.seating_objectID 
FROM event_registrations r
JOIN events e ON r.eventID = e.eventID
JOIN individuals i ON r.individualID = i.individualID
JOIN seating_objects s ON r.seating_objectID = s.seating_objectID

-- Used to populate the individual picklist on the add registration form
SELECT individualID, firstName, lastName FROM individuals

-- Used to populate the event picklist on the add registration form
SELECT eventID, eventName FROM events

-- Usesd to populate the seating object picklist on the add registration form
SELECT seating_objectID, objectName FROM seating_objects
	
-- Bring up an event_registration based on a supplied first and last name, for possible search functionality
SELECT * FROM event_registrations WHERE (SELECT individualID from individuals WHERE firstName = @fNameSearch AND lastName = @lNameSearch);
-- Bring up all event registrations for a given event
SELECT * FROM event_registrations WHERE (SELECT eventID from events WHERE eventName = @eNameSearch);
/*
-- Update event registrations, allowing individual to be referred to by a combination of fname and lname, events by their name,
and seating_objects is referred to by the combination of eventName and seating_object Name. 
*/
UPDATE event_registrations
SET individualID = ((SELECT individualID from individuals WHERE firstName = @fNameUpdate AND lastName = @lNameUpdate),
	eventID = (SELECT eventID from events WHERE eventName = @eNameUpdate),
	seating_objectID = (SELECT seating_objectID from seating_objects WHERE eventID = (SELECT eventID FROM events WHERE eventName = @eNameUpdate) AND objectName = @oNameUpdate),
    objectSeat = @oSeatUpdate)
WHERE individualID = individualIDSelect AND eventID = (SELECT eventID from events WHERE eventName = @eNameSearch);
-- Delete a given event registration where the first name, last name, and event registration are supplied.
DELETE FROM event_registrations WHERE individualID = (SELECT individualID FROM individuals WHERE firstName = @fNameSelect AND lastName = @lNameSelect) AND eventID = (SELECT eventID from events WHERE eventName = @eNameSearch);
-- Delet from table
DELETE FROM event_registrations WHERE registrationID = @registrationID
