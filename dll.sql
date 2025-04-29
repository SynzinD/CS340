/*
CS340 Group 47 Project Step 2 Draft
Megan Mooers and Synzin Darkpaw 
*/

CREATE SCHEMA IF NOT EXISTS `group47_project` DEFAULT CHARACTER SET utf8 ;
USE `group47_project` ;


SET foreign_key_checks = 0; 
DROP TABLE IF EXISTS group47_project.individuals;
DROP TABLE IF EXISTS group47_project.venues;
DROP TABLE IF EXISTS group47_project.events;
DROP TABLE IF EXISTS group47_project.seating_objects;
DROP TABLE IF EXISTS group47_project.event_registrations;


CREATE TABLE IF NOT EXISTS group47_project.individuals (
  `individualID` INT AUTO_INCREMENT NOT NULL,
  `firstName` VARCHAR(45) NULL,
  `lastName` VARCHAR(45) NOT NULL,
  `email` VARCHAR(45) NULL,
  PRIMARY KEY (`individualID`));
  
INSERT INTO group47_project.individuals
(`firstName`, `lastName`, `email`)
VALUES 
( 'Stacy', 'Fakename', 'femmefatale@noir.com'),
( 'Joanna', 'Fakename', 'sister@noir.com'),
( 'Preston', 'Wilhelmena', 'peppermint@jawbreaker.com'),
( 'Chirp', 'Featherfowl', 'cousin@greenhunter.net'),
( NULL, 'Wretchrot', 'baby@babybaby.org');



CREATE TABLE IF NOT EXISTS group47_project.venues (
  `venueID` INT AUTO_INCREMENT NOT NULL,
  `venueName` VARCHAR(200) NOT NULL,
  `location` VARCHAR(200),
  `capacity` INT NULL,
  PRIMARY KEY (`venueID`));
  
  INSERT INTO group47_project.venues
  (`venueName`, `location`, `capacity`)
  VALUES
  ('Joe Amayo Community Center', '123 Metropolitan Ave Kansas City, KS 66106', 300),
  ('Recurring Zoom Meeting 1', 'https://zoom.com/gibberish/moregibberish', NULL),
  ('Recurring Zoom Meeting 2', 'https://zoom.com/recurring2/sometext', NULL),
  ('South Branch KCK Public Library Reading Room', '321 Strong Ave Kansas City, KS', 25),
  ('Pricy Downtown Hotel', '5522 12th St, KC, MO 64106', 3100);
  


CREATE TABLE IF NOT EXISTS group47_project.events (
  `eventID` INT AUTO_INCREMENT NOT NULL,
  `eventName` VARCHAR(45) NOT NULL,
  `eventDateTime` DATETIME,
  `venueID` INT NOT NULL,
  `seatingType` VARCHAR(45),
  `description` VARCHAR(250),
  `eventCapacity` INT,
  PRIMARY KEY (`eventID`),
  INDEX `fk_events_venues1_idx` (`venueID` ASC) VISIBLE,
  CONSTRAINT `fk_events_venues1`
    FOREIGN KEY (`venueID`)
    REFERENCES `group47_project`.`venues` (`venueID`));
    
INSERT INTO group47_project.events 
(`eventName`, `eventDateTime`, `venueID`, `seatingType`, `description`, `eventCapacity`)
VALUES
('2025 Fall Gala', '2025-10-10', (SELECT venueID from group47_project.venues WHERE venueName LIKE '%Hotel%'), 'banquet', 'Annual fall fundraiser at hotel ballroom', 1500),
('Thursday PM Support Group', (SELECT CAST(CONCAT((SELECT CURDATE() + INTERVAL (7 - DAYOFWEEK(CURDATE()) + 5) DAY), ' 15:00:00') AS DATETIME)), (SELECT venueID from group47_project.venues WHERE venueName LIKE '%Meeting 1%'), 'GA', 'Recurring Thursday 3 p.m.', 15),
('Wednesday AM Support Group', (SELECT CAST(CONCAT((SELECT CURDATE() + INTERVAL (7 - DAYOFWEEK(CURDATE()) + 5) DAY), ' 09:00:00') AS DATETIME)), (SELECT venueID from group47_project.venues WHERE venueName LIKE '%Meeting 2%'), 'GA', 'Recurring Wedneday 9 a.m.', 15),
('Saturday Support Group', (SELECT CAST(CONCAT((SELECT CURDATE() + INTERVAL (7 - DAYOFWEEK(CURDATE()) + 5) DAY), ' 11:00:00') AS DATETIME)), (SELECT venueID from group47_project.venues WHERE venueName LIKE '%Community Center%'), 'GA', 'Recurring in-person Saturday support group', 15),
('Board Meeting', '2025-07-05', (SELECT venueID from group47_project.venues WHERE venueName LIKE '%Library%'), 'committee', 'Whole Board meeting', 9);
;


CREATE TABLE IF NOT EXISTS group47_project.seating_objects (
  `seating_objectID` INT AUTO_INCREMENT NOT NULL,
  `eventID` INT NOT NULL,
  `objectName` VARCHAR(45) NOT NULL,
  `objectCapacity` INT,
  PRIMARY KEY (`seating_objectID`),
  INDEX `fk_seating_objects_events1_idx` (`eventID` ASC) VISIBLE,
  CONSTRAINT `fk_seating_objects_events1`
    FOREIGN KEY (`eventID`)
    REFERENCES `group47_project`.`events` (`eventID`));

INSERT INTO group47_project.seating_objects
(`eventID`, `objectName`, `objectCapacity`)
VALUES
((SELECT eventID FROM group47_project.events WHERE eventName = '2025 Fall Gala'), 'table 1', 10),
((SELECT eventID FROM group47_project.events WHERE eventName = '2025 Fall Gala'), 'table 2', 10),
((SELECT eventID FROM group47_project.events WHERE eventName = '2025 Fall Gala'), 'table 3', 10),
((SELECT eventID FROM group47_project.events WHERE eventName = '2025 Fall Gala'), 'table 4', 10),
((SELECT eventID FROM group47_project.events WHERE eventName = 'Wednesday AM Support Group'), 'Group1', 15),
((SELECT eventID FROM group47_project.events WHERE eventName = 'Board Meeting'), 'Strategic Planning Committee', 5),
((SELECT eventID FROM group47_project.events WHERE eventName = 'Board Meeting'), 'Finance Committee', 5),
((SELECT eventID FROM group47_project.events WHERE eventName = 'Thursday PM Support Group'), 'Group2', 15),
((SELECT eventID FROM group47_project.events WHERE eventName = 'Saturday Support Group'), 'Group1', 15);



CREATE TABLE IF NOT EXISTS group47_project.event_registrations (
  `registrationID` INT AUTO_INCREMENT NOT NULL,
  `individualID` INT NOT NULL,
  `eventID` INT NOT NULL,
  `seating_objectID` INT NOT NULL,
  `objectSeat` INT DEFAULT NULL,
  PRIMARY KEY (`registrationID`),
  INDEX `fk_individuals_has_events_events1_idx` (`eventID`),
  INDEX `fk_individuals_has_events_individuals_idx` (`individualID`),
  INDEX `fk_event_registrations_seating_objects1_idx` (`seating_objectID`),
  CONSTRAINT `unique_registration` UNIQUE (`individualID`, `eventID`, `seating_objectID`), 
  CONSTRAINT `fk_individuals_has_events_individuals`
    FOREIGN KEY (`individualID`)
    REFERENCES `group47_project`.`individuals` (`individualID`),
  CONSTRAINT `fk_individuals_has_events_events1`
    FOREIGN KEY (`eventID`)
    REFERENCES `group47_project`.`events` (`eventID`),
  CONSTRAINT `fk_event_registrations_seating_objects1`
    FOREIGN KEY (`seating_objectID`)
    REFERENCES `group47_project`.`seating_objects` (`seating_objectID`));
    
INSERT INTO group47_project.event_registrations
(`individualID`, `eventID`, `seating_objectID`, `objectSeat`)
VALUES
(	(SELECT individualID from group47_project.individuals WHERE firstName = 'Stacy' AND lastName = 'Fakename'),
	(SELECT eventID from group47_project.events WHERE eventName = 'Board Meeting'),
	(SELECT seating_objectID from group47_project.seating_objects WHERE eventID = (select eventID from group47_project.events WHERE eventName = 'Board Meeting') and objectName LIKE '%Strategic%'),
    1),
(	(SELECT individualID from group47_project.individuals WHERE firstName = 'Joanna' AND lastName = 'Fakename'),
	(SELECT eventID from group47_project.events WHERE eventName = 'Board Meeting'),
	(SELECT seating_objectID from group47_project.seating_objects WHERE eventID = (select eventID from group47_project.events WHERE eventName = 'Board Meeting') and objectName LIKE '%Finance%'),
    1),
(	(SELECT individualID from group47_project.individuals WHERE firstName = 'Stacy' AND lastName = 'Fakename'),
	(SELECT eventID from group47_project.events WHERE eventName = '2025 Fall Gala'),
	(SELECT seating_objectID from group47_project.seating_objects WHERE eventID = (select eventID from group47_project.events WHERE eventName = '2025 Fall Gala') and objectName = 'table 3'),
    1),
(	(SELECT individualID from group47_project.individuals WHERE firstName = 'Joanna' AND lastName = 'Fakename'),
	(SELECT eventID from group47_project.events WHERE eventName = '2025 Fall Gala'),
	(SELECT seating_objectID from group47_project.seating_objects WHERE eventID = (select eventID from group47_project.events WHERE eventName = '2025 Fall Gala') and objectName = 'table 3'),
    2),
(	(SELECT individualID from group47_project.individuals WHERE firstName = 'Preston' AND lastName = 'Wilhelmena'),
	(SELECT eventID from group47_project.events WHERE eventName = 'Saturday Support Group'),
	(SELECT seating_objectID from group47_project.seating_objects WHERE eventID = (select eventID from group47_project.events WHERE eventName = 'Saturday Support Group') and objectName = 'Group1'),
    1),
(	(SELECT individualID from group47_project.individuals WHERE firstName = 'Preston' AND lastName = 'Wilhelmena'),
	(SELECT eventID from group47_project.events WHERE eventName = 'Wednesday AM Support Group'),
	(SELECT seating_objectID from group47_project.seating_objects WHERE eventID = (select eventID from group47_project.events WHERE eventName = 'Wednesday AM Support Group') and objectName = 'Group1'),
    1),
(	(SELECT individualID from group47_project.individuals WHERE firstName = 'Chirp' AND lastName = 'Featherfowl'),
	(SELECT eventID from group47_project.events WHERE eventName = 'Wednesday AM Support Group'),
	(SELECT seating_objectID from group47_project.seating_objects WHERE eventID = (select eventID from group47_project.events WHERE eventName = 'Wednesday AM Support Group') and objectName = 'Group1'),
    2),
(	(SELECT individualID from group47_project.individuals WHERE firstName is NULL AND lastName = 'Wretchrot'),
	(SELECT eventID from group47_project.events WHERE eventName = 'Wednesday AM Support Group'),
	(SELECT seating_objectID from group47_project.seating_objects WHERE eventID = (select eventID from group47_project.events WHERE eventName = 'Wednesday AM Support Group') and objectName = 'Group1'),
    3)
;

