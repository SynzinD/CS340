/*
individuals CRUD
*/

INSERT INTO individuals
(`firstName`, `lastName`, `email`)
VALUES 
( @fNameInsert, @lNameInsert, @emailInsert);

SELECT * FROM individuals;

SELECT * FROM individuals WHERE firstName LIKE @fNameSearch;

SELECT * FROM individuals WHERE lastName LIKE @lNameSearch;

UPDATE individuals
SET firstName = @fNameUpdate, lastName = @lNameUpdate, email = @emailUpdate
WHERE individualID = (SELECT individualID FROM individuals WHERE firstName = @fNameSelect AND lastName = @lNameSelect);

DELETE FROM individuals WHERE individualID = (SELECT individualID FROM individuals WHERE firstName = @fNameSelect AND lastName = @lNameSelect);

/*
 venues CRUD
*/

INSERT INTO venues
  (`venueName`, `location`, `capacity`)
  VALUES
  (@vNameInsert, @vLocationInsert, @vCapacityInsert);

SELECT * FROM venues;

SELECT * FROM venues WHERE venueName LIKE @vNameSearch;

UPDATE venues
SET venueName = @vNameUpdate, location = @vLocationUpdate, capacity = @vCapacityUpdate
WHERE venueID = (SELECT venueID FROM venues WHERE eventName = @vNameSelect);

DELETE FROM venues WHERE venueID = (SELECT venueID FROM venues WHERE eventName = @vNameSelect);

/*
 events CRUD
*/

INSERT INTO events 
(`eventName`, `eventDateTime`, `venueID`, `seatingType`, `description`, `eventCapacity`)
VALUES
(@eNameInsert, @eDateTimeInsert, (SELECT venueID from venues WHERE venueName = @vNameInsert), @eSeatingTypeInsert, @eDescriptionInsert, @eCapacityInsert);

SELECT * FROM events;

SELECT * FROM events WHERE eventName LIKE @eNameSearch;

UPDATE events
SET eventName = @eNameUpdate, eventDateTime = @eDateTimeUpdate, eventID = (SELECT venueID from venues WHERE venueName = @vNameUpdate), seatingType = @eSeatingTypeUpdate, description = @eDescriptionUpdate, eventCapacity = @eCapacityUpdate
WHERE eventID = (SELECT eventID FROM events WHERE eventName = @eNameSelect);

DELETE FROM events WHERE eventID = (SELECT eventID FROM events WHERE eventName = @eNameSelect);

/*
 seating_objects CRUD
*/

INSERT INTO seating_objects
(`eventID`, `objectName`, `objectCapacity`)
VALUES
((SELECT eventID FROM events WHERE eventName = @eNameSelect), @oNameInsert, @oCapacityInsert);

SELECT * FROM seating_objects;

SELECT * FROM seating_objects WHERE objectName LIKE @oNameSearch;

SELECT objectName FROM seating_objects WHERE eventID = (SELECT eventID FROM events WHERE eventName = @eNameSelect);

UPDATE seating_objects
SET eventID = (SELECT eventID FROM events WHERE eventName = @eNameSelect), objectName = @oNameUpdate, objectCapacity = @oCapacityUpdate
WHERE venueID = (SELECT venueID FROM venues WHERE eventName = @vNameSelect);

DELETE FROM seating_object WHERE seating_objectID = (SELECT seating_objectID FROM seating_objects WHERE objectName = @oNameSelect);

/*
 event_registrations CRUD
*/

INSERT INTO event_registrations
(`individualID`, `eventID`, `seating_objectID`, `objectSeat`)
VALUES
	((SELECT individualID from individuals WHERE firstName = @fNameInsert AND lastName = @lNameInsert),
	(SELECT eventID from events WHERE eventName = @eNameInsert),
	(SELECT seating_objectID from seating_objects WHERE eventID = (select eventID from events WHERE eventName = @eNameInsert) and objectName = @oNameInsert),
    @oSeatInsert);

SELECT * FROM event_registrations;

SELECT * FROM event_registrations WHERE (SELECT individualID from individuals WHERE firstName = @fNameSearch AND lastName = @lNameSearch);

SELECT * FROM event_registrations WHERE (SELECT eventID from events WHERE eventName = @eNameSearch);

UPDATE event_registrations
SET individualID = ((SELECT individualID from individuals WHERE firstName = @fNameUpdate AND lastName = @lNameUpdate),
	eventID = (SELECT eventID from events WHERE eventName = @eNameUpdate),
	seating_objectID = (SELECT seating_objectID from seating_objects WHERE eventID = (SELECT eventID FROM events WHERE eventName = @eNameUpdate) AND objectName = @oNameUpdate),
    objectSeat = @oSeatUpdate)
WHERE individualID = individualIDSelect AND eventID = (SELECT eventID from events WHERE eventName = @eNameSearch);

DELETE FROM event_registrations WHERE individualID = (SELECT individualID FROM individuals WHERE firstName = @fNameSelect AND lastName = @lNameSelect) AND eventID = (SELECT eventID from events WHERE eventName = @eNameSearch);