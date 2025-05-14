/*
CS340 Group 47 Project Step 2 Draft
Megan Mooers and Synzin Darkpaw 
*/


SET foreign_key_checks = 0; 
DROP TABLE IF EXISTS individuals;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS seating_objects;
DROP TABLE IF EXISTS event_registrations;

/*
Create the individuals table
*/

CREATE TABLE individuals (
  `individualID` INT AUTO_INCREMENT NOT NULL,
  `firstName` VARCHAR(45) NULL,
  `lastName` VARCHAR(45) NOT NULL,
  `email` VARCHAR(45) NULL,
  PRIMARY KEY (`individualID`));

/*
Insert test data into the individuals table 
*/

INSERT INTO individuals
(`firstName`, `lastName`, `email`)
VALUES 
( 'Stacy', 'Fakename', 'femmefatale@noir.com'),
( 'Joanna', 'Fakename', 'sister@noir.com'),
( 'Preston', 'Wilhelmena', 'peppermint@jawbreaker.com'),
( 'Chirp', 'Featherfowl', 'cousin@greenhunter.net'),
( NULL, 'Wretchrot', 'baby@babybaby.org');

/*
Create the table for the venues entity
*/

CREATE TABLE venues (
  `venueID` INT AUTO_INCREMENT NOT NULL,
  `venueName` VARCHAR(200) NOT NULL,
  `location` VARCHAR(200),
  `capacity` INT NULL,
  PRIMARY KEY (`venueID`));

/*
Enter test data into the venues table
*/

  INSERT INTO venues
  (`venueName`, `location`, `capacity`)
  VALUES
  ('Joe Amayo Community Center', '123 Metropolitan Ave Kansas City, KS 66106', 300),
  ('Recurring Zoom Meeting 1', 'https://zoom.com/gibberish/moregibberish', NULL),
  ('Recurring Zoom Meeting 2', 'https://zoom.com/recurring2/sometext', NULL),
  ('South Branch KCK Public Library Reading Room', '321 Strong Ave Kansas City, KS', 25),
  ('Pricy Downtown Hotel', '5522 12th St, KC, MO 64106', 3100);
  
/*
Create the table for the events entity
*/

CREATE TABLE events (
  `eventID` INT AUTO_INCREMENT NOT NULL,
  `eventName` VARCHAR(45) NOT NULL,
  `eventDateTime` DATETIME,
  `venueID` INT NOT NULL,
  `seatingType` VARCHAR(45),
  `description` VARCHAR(250),
  `eventCapacity` INT,
  PRIMARY KEY (`eventID`),  
  CONSTRAINT `fk_events_venues1`
    FOREIGN KEY (`venueID`) REFERENCES `venues` (`venueID`) ON DELETE CASCADE);

/*
Insert data into the events table
*/

INSERT INTO events 
(`eventName`, `eventDateTime`, `venueID`, `seatingType`, `description`, `eventCapacity`)
VALUES
('2025 Fall Gala', '2025-10-10', (SELECT venueID from venues WHERE venueName = 'Pricy Downtown Hotel'), 'banquet', 'Annual fall fundraiser at hotel ballroom', 1500),
('Thursday PM Support Group', (SELECT CAST(CONCAT((SELECT CURDATE() + INTERVAL (7 - DAYOFWEEK(CURDATE()) + 5) DAY), ' 15:00:00') AS DATETIME)), (SELECT venueID from venues WHERE venueName = 'Recurring Zoom Meeting 1'), 'GA', 'Recurring Thursday 3 p.m.', 15),
('Wednesday AM Support Group', (SELECT CAST(CONCAT((SELECT CURDATE() + INTERVAL (7 - DAYOFWEEK(CURDATE()) + 5) DAY), ' 09:00:00') AS DATETIME)), (SELECT venueID from venues WHERE venueName = 'Recurring Zoom Meeting 2'), 'GA', 'Recurring Wedneday 9 a.m.', 15),
('Saturday Support Group', (SELECT CAST(CONCAT((SELECT CURDATE() + INTERVAL (7 - DAYOFWEEK(CURDATE()) + 5) DAY), ' 11:00:00') AS DATETIME)), (SELECT venueID from venues WHERE venueName = 'Joe Amayo Community Center'), 'GA', 'Recurring in-person Saturday support group', 15),
('Board Meeting', '2025-07-05', (SELECT venueID from venues WHERE venueName = 'South Branch KCK Public Library Reading Room'), 'committee', 'Whole Board meeting', 9);

/*
Create a table for the seating_objects entity
*/

CREATE TABLE seating_objects (
  `seating_objectID` INT AUTO_INCREMENT NOT NULL,
  `eventID` INT NOT NULL,
  `objectName` VARCHAR(45) NOT NULL,
  `objectCapacity` INT,
  PRIMARY KEY (`seating_objectID`),
  CONSTRAINT `fk_seating_objects_events1`
    FOREIGN KEY (`eventID`) REFERENCES `events` (`eventID`) ON DELETE CASCADE);

/*
Populate the seating_objects table with sample data
*/

INSERT INTO seating_objects
(`eventID`, `objectName`, `objectCapacity`)
VALUES
((SELECT eventID FROM events WHERE eventName = '2025 Fall Gala'), 'table 1', 10),
((SELECT eventID FROM events WHERE eventName = '2025 Fall Gala'), 'table 2', 10),
((SELECT eventID FROM events WHERE eventName = '2025 Fall Gala'), 'table 3', 10),
((SELECT eventID FROM events WHERE eventName = '2025 Fall Gala'), 'table 4', 10),
((SELECT eventID FROM events WHERE eventName = 'Wednesday AM Support Group'), 'Group1', 15),
((SELECT eventID FROM events WHERE eventName = 'Board Meeting'), 'Strategic Planning Committee', 5),
((SELECT eventID FROM events WHERE eventName = 'Board Meeting'), 'Finance Committee', 5),
((SELECT eventID FROM events WHERE eventName = 'Thursday PM Support Group'), 'Group2', 15),
((SELECT eventID FROM events WHERE eventName = 'Saturday Support Group'), 'Group1', 15);

/*
Create a table for the event_registrations entity
*/

CREATE TABLE event_registrations (
  `registrationID` INT AUTO_INCREMENT NOT NULL,
  `individualID` INT NOT NULL,
  `eventID` INT NOT NULL,
  `seating_objectID` INT NOT NULL,
  `objectSeat` INT DEFAULT NULL,
  PRIMARY KEY (`registrationID`),
  CONSTRAINT `unique_registration` UNIQUE (`individualID`, `eventID`, `seating_objectID`), 
  CONSTRAINT `fk_individuals_has_events_individuals`
    FOREIGN KEY (`individualID`) REFERENCES `individuals` (`individualID`) ON DELETE CASCADE,
  CONSTRAINT `fk_individuals_has_events_events1`
    FOREIGN KEY (`eventID`) REFERENCES `events` (`eventID`) ON DELETE CASCADE,
  CONSTRAINT `fk_event_registrations_seating_objects1`
    FOREIGN KEY (`seating_objectID`) REFERENCES `seating_objects` (`seating_objectID`) ON DELETE CASCADE);


/*
Populate the event_registrations table with sample data
*/

INSERT INTO event_registrations
(`individualID`, `eventID`, `seating_objectID`, `objectSeat`)
VALUES
(	(SELECT individualID from individuals WHERE firstName = 'Stacy' AND lastName = 'Fakename'),
	(SELECT eventID from events WHERE eventName = 'Board Meeting'),
	(SELECT seating_objectID from seating_objects WHERE eventID = (select eventID from events WHERE eventName = 'Board Meeting') and objectName = 'Strategic Planning Committee'),
    1),
(	(SELECT individualID from individuals WHERE firstName = 'Joanna' AND lastName = 'Fakename'),
	(SELECT eventID from events WHERE eventName = 'Board Meeting'),
	(SELECT seating_objectID from seating_objects WHERE eventID = (select eventID from events WHERE eventName = 'Board Meeting') and objectName = 'Finance Committee'),
    1),
(	(SELECT individualID from individuals WHERE firstName = 'Stacy' AND lastName = 'Fakename'),
	(SELECT eventID from events WHERE eventName = '2025 Fall Gala'),
	(SELECT seating_objectID from seating_objects WHERE eventID = (select eventID from events WHERE eventName = '2025 Fall Gala') and objectName = 'table 3'),
    1),
(	(SELECT individualID from individuals WHERE firstName = 'Joanna' AND lastName = 'Fakename'),
	(SELECT eventID from events WHERE eventName = '2025 Fall Gala'),
	(SELECT seating_objectID from seating_objects WHERE eventID = (select eventID from events WHERE eventName = '2025 Fall Gala') and objectName = 'table 3'),
    2),
(	(SELECT individualID from individuals WHERE firstName = 'Preston' AND lastName = 'Wilhelmena'),
	(SELECT eventID from events WHERE eventName = 'Saturday Support Group'),
	(SELECT seating_objectID from seating_objects WHERE eventID = (select eventID from events WHERE eventName = 'Saturday Support Group') and objectName = 'Group1'),
    1),
(	(SELECT individualID from individuals WHERE firstName = 'Preston' AND lastName = 'Wilhelmena'),
	(SELECT eventID from events WHERE eventName = 'Wednesday AM Support Group'),
	(SELECT seating_objectID from seating_objects WHERE eventID = (select eventID from events WHERE eventName = 'Wednesday AM Support Group') and objectName = 'Group1'),
    1),
(	(SELECT individualID from individuals WHERE firstName = 'Chirp' AND lastName = 'Featherfowl'),
	(SELECT eventID from events WHERE eventName = 'Wednesday AM Support Group'),
	(SELECT seating_objectID from seating_objects WHERE eventID = (select eventID from events WHERE eventName = 'Wednesday AM Support Group') and objectName = 'Group1'),
    2),
(	(SELECT individualID from individuals WHERE firstName is NULL AND lastName = 'Wretchrot'),
	(SELECT eventID from events WHERE eventName = 'Wednesday AM Support Group'),
	(SELECT seating_objectID from seating_objects WHERE eventID = (select eventID from events WHERE eventName = 'Wednesday AM Support Group') and objectName = 'Group1'),
    3);
