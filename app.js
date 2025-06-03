/*OSU340 Spring 2025 Group 47
    Megan Mooers and Synzin Darkpaw*/
   
/*
Citation for the following code:
Date: 5/1/25
Based on: Test code from CS340, Assignment 2
Source URL: https://canvas.oregonstate.edu/courses/1999601/assignments/10006370?module_item_id=25352883
NOTE: package.json also adapted from this. 
*/


/*
    SETUP
*/

// Express
const express = require('express');
const app = express();
const session = require('express-session');
const PORT = 44543;
// Database
const db = require('./db-connector');
// Handlebars
const { engine } = require('express-handlebars');
//Time Handling


// Session
app.use(session({
    secret: 'ThisIsTortur3',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static('public'));


app.use((req, res, next) => {
    if (req.session.message) {
        res.locals.message = req.session.message;
        delete req.session.message;
    }
    if (typeof req.session.dbAltered === 'undefined') {
        req.session.dbAltered = false;
    }
    res.locals.dbAltered = req.session.dbAltered; 
    next();
});

//Handlebars

//app.engine('.hbs', engine({ extname: ".hbs" }));
//app.set('view engine', '.hbs');

const hbs = engine({
    extname: ".hbs",
    helpers: {
        json: function(context) {
            return JSON.stringify(context);
        }
    }
});
app.engine('.hbs', hbs);
app.set('view engine', '.hbs');



/*
//    ROUTES
*/

// Basic index page. 
app.get('/', async function (req, res) {
    res.render('index', {
        title: 'Event Management System',
        links: [
            { url: '/individuals', title: 'Individual Attendees', description: 'People in the database who have registered for one or more events.' },
            { url: '/venues', title: 'Venues', description: 'Physical or virtual locations where events are held.' },
            { url: '/events', title: 'Events', description: 'Major and minor events attended by individuals.' },
            { url: '/seating-objects', title: 'Event Seating', description: 'Available seating, tailored to each event.' },
            { url: '/registrations', title: 'Registrations', description: 'Registrations of people for events, including their assigned seats.' }
        ]
    });
});



/*
// INDIVIDUALS
*/ 

// Display Individuals Table
app.get('/individuals', async function (req, res) {
    try {
        const [rows, fields] = await db.query('SELECT * FROM individuals');
        res.render('individuals', { title: 'Individuals', individuals: rows });
    } catch (error) {
        console.error("Error fetching individuals:", error);
        res.status(500).send("Error fetching data.");
    }
});

// Edit Individuals Table Inline
app.post('/individuals/edit/:id', async function(req, res) {
    const individualID = req.params.id;
    const { firstName, lastName, email } = req.body;

    // require lastname
    if (!lastName) {
        return res.status(400).json({ success: false, message: 'Last Name is required.' });
    }

    try {
        // Call the stored procedure 
        const result = await db.query('CALL sp_UpdateIndividual(?, ?, ?, ?)', [
            individualID,
            firstName,
            lastName,
            email
        ]);
        console.log(`Individual with ID ${individualID} updated successfully via stored procedure.`);

        res.json({
            success: true,
            message: 'Individual updated successfully!',
            individual: { individualID, firstName, lastName, email } 
        });

    } catch (error) {
        console.error("Error updating individual:", error);
        res.status(500).json({ success: false, message: 'Error updating individual: ' + error.message });
    }
});

// Delete Individual Attendees Inline
app.delete('/individuals/:id', async function(req, res) {
    const individualID = req.params.id;

    try {
        // Call the stored procedure
        await db.query('CALL sp_DeleteIndividual(?)', [individualID]);
        console.log(`Individual with ID ${individualID} deleted successfully via stored procedure.`);

        req.session.dbAltered = true;

        res.json({
            success: true,
            message: `Individual (ID: ${individualID}) deleted successfully.`
        });

    } catch (error) {
        console.error("Error deleting individual:", error);
        res.status(500).json({
            success: false,
            message: 'Error deleting individual: ' + error.message
        });
    }
});

// Add Individual Attendees from Form
app.post('/individuals', async function(req, res) {
    const { firstName, lastName, email } = req.body;

    if (!lastName) {
        req.session.message = {
            type: 'error',
            text: 'Last Name is required for a new individual.'
        };
        return res.redirect('/individuals');
    }

    try {
        // Call the stored procedure
        await db.query('CALL sp_AddIndividual(?, ?, ?)', [firstName, lastName, email]);
        console.log("New individual added successfully.");

        req.session.dbAltered = true; 

        req.session.message = {
            type: 'success',
            text: 'Individual added successfully!'
        };
        res.redirect('/individuals'); 

    } catch (error) {
        console.error("Error adding individual:", error);
        req.session.message = {
            type: 'error',
            text: 'Error adding individual: ' + error.message
        };
        res.status(500).redirect('/individuals'); // Redirect back with an error message
    }
});


/*
// VENUES
*/

// Display Venues Table
app.get('/venues', async function (req, res) {
    try {
        const [rows, fields] = await db.query('SELECT * FROM venues');
        res.render('venues', { title: 'Venues', venues: rows });
    } catch (error) {
        console.error("Error fetching venues:", error);
        res.status(500).send("Error fetching data.");
    }
});

// Edit Venue Inline
app.post('/venues/edit/:id', async function(req, res) {
    const venueID = req.params.id;
    const { venueName, location, capacity } = req.body;

    if (!venueName || venueName.trim() === '') {
        return res.status(400).json({ success: false, message: 'Venue Name is required.' });
    }

    let parsedCapacity = null;
    if (capacity !== undefined && capacity !== null && String(capacity).trim() !== '') {
        parsedCapacity = parseInt(capacity);
        if (isNaN(parsedCapacity)) {
            return res.status(400).json({ success: false, message: 'Capacity must be a valid number.' });
        }
    }

    try {
        // Call the stored procedure to update the venue
        await db.query('CALL sp_UpdateVenue(?, ?, ?, ?)', [
            venueID,
            venueName,
            location,
            parsedCapacity 
        ]);
        console.log(`Venue with ID ${venueID} updated successfully via stored procedure.`);

        // Set dbAltered flag
        req.session.dbAltered = true;

        res.json({
            success: true,
            message: 'Venue updated successfully!',
            venue: { venueID, venueName, location, capacity: parsedCapacity }
        });

    } catch (error) {
        console.error("Error updating venue:", error);
        res.status(500).json({ success: false, message: 'Error updating venue: ' + error.message });
    }
});

// Add Venue
app.post('/venues/add', async function(req, res) {
    // Removed venueType from destructuring
    let { venueName, capacity, location } = req.body; 

    // Adjust variable names to match SP parameters 
    let p_venueName = venueName;
    let p_venueCapacity = capacity === '' ? null : parseInt(capacity); // Convert to int or null
    let p_venueLocation = location === '' ? null : location; // Use location as venueLocation

    try {
        const [rows] = await db.query(
            `CALL sp_AddVenue(?, ?, ?)`, // Adjusted parameters in call
            [p_venueName, p_venueLocation, p_venueCapacity] // Adjusted arguments
        );

        // Check if an ID was returned, indicating successful insertion
        if (rows && Array.isArray(rows[0]) && rows[0].length > 0 && rows[0][0].venueID) {
            const newVenueID = rows[0][0].venueID; // Extract the ID
            res.redirect('/venues'); // Redirects the user back to the /venues page

        } else {
            res.status(400).json({ success: false, message: "Failed to add venue. Could not retrieve new ID." });
        }

    } catch (error) {
        console.error("Error adding venue:", error);
        res.status(500).json({ success: false, message: "Database error while adding venue." });
    }
});

// Delete Venue Inline
app.delete('/venues/:venueID', async function(req, res) {
    const venueID = parseInt(req.params.venueID); // Get the ID from the URL parameter

    // Basic validation
    if (isNaN(venueID)) {
        return res.status(400).json({ success: false, message: "Invalid Venue ID provided." });
    }

    try {
        // Call the stored procedure to delete the venue
        const [result] = await db.query(`CALL sp_DeleteVenue(?)`, [venueID]);

        // Note: For DELETE operations, the result will often be an OkPacket
        // We can check affectedRows to confirm deletion
        if (result && result.affectedRows > 0) { // Directly check result.affectedRows
            res.status(200).json({ success: true, message: `Venue with ID ${venueID} deleted successfully.` });
        } else {
            // This else block will now correctly indicate a failure if the venueID didn't exist
            res.status(404).json({ success: false, message: `Venue with ID ${venueID} not found or already deleted.` });
        }

    } catch (error) {
        console.error("Error deleting venue:", error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            res.status(409).json({ success: false, message: "Cannot delete venue due to existing related data (e.g., events held at this venue). Please delete associated events first." });
        } else {
            res.status(500).json({ success: false, message: "Database error during venue deletion." });
        }
    }
});


/*
// EVENTS
*/

// Display Events Table
app.get('/events', async function(req, res) {
    try {
        const [events] = await db.query(`
            SELECT
                e.eventID,
                e.eventName,
                e.eventDateTime,
                v.venueID,
                v.venueName,
                e.seatingType,
                e.Description,
                e.eventCapacity
            FROM events e
            LEFT JOIN venues v ON e.venueID = v.venueID
            ORDER BY e.eventDateTime ASC;
        `);
        const [venues] = await db.query("SELECT venueID, venueName FROM venues ORDER BY venueName ASC");

        // Format eventDateTime for display and input
        events.forEach(event => {
            if (event.eventDateTime) {
                // event.eventDateTime is now a string like "2025-06-12 23:00:00"
                // For datetime-local input (YYYY-MM-DDTHH:mm)
                event.inputDateTime = event.eventDateTime.slice(0, 16).replace(' ', 'T'); // "2025-06-12T23:00"

                // For display (e.g., "6/12/25, 11 p.m.")
                let [datePart, timePart] = event.eventDateTime.split(' ');
                let [year, month, day] = datePart.split('-');
                let [hourStr, minuteStr] = timePart.split(':');

                let hour = parseInt(hourStr);
                let ampm = hour >= 12 ? 'p.m.' : 'a.m.';
                hour = hour % 12;
                hour = hour === 0 ? 12 : hour; // Convert 0 (midnight) to 12

                event.displayDateTime = `${parseInt(month)}/${parseInt(day)}/${year.slice(2)}, ${hour}:${minuteStr} ${ampm}`;
            } else {
                event.inputDateTime = '';
                event.displayDateTime = 'N/A';
            }
        });

        res.render('events', { events: events, venues: venues });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).send("Error fetching events.");
    }
});

// Add Event From Form
app.post('/events', async function(req, res) {
    let { eventName, eventDateTime, venueID, seatingType, description, eventCapacity } = req.body;

    let p_eventDateTime = eventDateTime && eventDateTime.trim() !== '' ? eventDateTime : null;
    
    let p_venueID = venueID !== undefined && venueID !== null && String(venueID).trim() !== '' ? parseInt(venueID) : null;
    let p_eventCapacity = eventCapacity !== undefined && eventCapacity !== null && String(eventCapacity).trim() !== '' ? parseInt(eventCapacity) : null;

    if (!eventName || eventName.trim() === '') {
        return res.status(400).json({ success: false, message: 'Event Name is required.' }); // Return JSON for AJAX
    }
    if (p_venueID !== null && isNaN(p_venueID)) {
        return res.status(400).json({ success: false, message: 'Venue ID must be a valid number.' });
    }
    if (p_eventCapacity !== null && isNaN(p_eventCapacity)) {
        return res.status(400).json({ success: false, message: 'Event Capacity must be a valid number.' });
    }

    try {
        const [result] = await db.query(
            `CALL sp_AddEvent(?, ?, ?, ?, ?, ?)`,
            [eventName, p_eventDateTime, p_venueID, seatingType, description, p_eventCapacity]
        );

        // The stored procedure now returns the newEventID
        const newEventID = result[0][0].newEventID; // Access the result from the stored procedure call

        // Re-fetch the newly added event with venueName for client display
        const [newlyAddedEventRows] = await db.query(`
            SELECT
                e.eventID,
                e.eventName,
                e.eventDateTime,
                v.venueID,
                v.venueName,
                e.seatingType,
                e.Description,
                e.eventCapacity
            FROM events e
            LEFT JOIN venues v ON e.venueID = v.venueID
            WHERE e.eventID = ?;
        `, [newEventID]);

        let newEvent = newlyAddedEventRows[0];

        // Format for display and input consistency (same logic as in app.get/app.put)
        if (newEvent && newEvent.eventDateTime) {
            newEvent.inputDateTime = newEvent.eventDateTime.slice(0, 16).replace(' ', 'T');
            let [datePart, timePart] = newEvent.eventDateTime.split(' ');
            let [year, month, day] = datePart.split('-');
            let [hourStr, minuteStr] = timePart.split(':');

            let hour = parseInt(hourStr);
            let ampm = hour >= 12 ? 'p.m.' : 'a.m.';
            hour = hour % 12;
            hour = hour === 0 ? 12 : hour;

            newEvent.displayDateTime = `${parseInt(month)}/${parseInt(day)}/${year.slice(2)}, ${hour}:${minuteStr} ${ampm}`;
        } else {
            newEvent.inputDateTime = '';
            newEvent.displayDateTime = 'N/A';
        }

        req.session.dbAltered = true;
        res.status(201).json({ // Return 201 Created status
            success: true,
            message: 'Event added successfully!',
            event: newEvent // Send the fully formatted new event object
        });

    } catch (error) {
        console.error("Error adding event:", error);
        res.status(500).json({ success: false, message: 'Error adding event to the database: ' + error.message });
    }
});

// Edit Event Inline
app.put('/events/edit/:id', async function(req, res) {
    const eventID = req.params.id;
    const { eventName, eventDateTime, venueID, eventCapacity, seatingType, Description } = req.body;

    if (!eventName || eventName.trim() === '') {
        return res.status(400).json({ success: false, message: 'Event Name is required.' });
    }

    // Use the eventDateTime string directly from the client (e.g., "2025-06-12T23:00")
    let parsedEventDateTime = eventDateTime && eventDateTime.trim() !== '' ? eventDateTime : null;
    
    let parsedVenueID = venueID !== undefined && venueID !== null && String(venueID).trim() !== '' ? parseInt(venueID) : null;
    let parsedEventCapacity = eventCapacity !== undefined && eventCapacity !== null && String(eventCapacity).trim() !== '' ? parseInt(eventCapacity) : null;

    if (parsedVenueID !== null && isNaN(parsedVenueID)) {
        return res.status(400).json({ success: false, message: 'Venue ID must be a valid number.' });
    }
    if (parsedEventCapacity !== null && isNaN(parsedEventCapacity)) {
        return res.status(400).json({ success: false, message: 'Event Capacity must be a valid number.' });
    }

    try {
        await db.query('CALL sp_UpdateEvent(?, ?, ?, ?, ?, ?, ?)', [
            eventID,
            eventName,
            parsedEventDateTime, // Pass the string directly
            parsedVenueID,
            parsedEventCapacity,
            seatingType,
            Description
        ]);
        console.log(`Event with ID ${eventID} updated successfully via stored procedure.`);

        // Re-fetch the updated event's data (eventDateTime will be a string due to dateStrings: true)
        const [updatedEventRows] = await db.query(`
            SELECT
                e.eventID,
                e.eventName,
                e.eventDateTime,
                v.venueID,
                v.venueName,
                e.seatingType,
                e.Description,
                e.eventCapacity
            FROM events e
            LEFT JOIN venues v ON e.venueID = v.venueID
            WHERE e.eventID = ?;
        `, [eventID]);

        let updatedEvent = updatedEventRows[0];
        // Format for display and input consistency, using the string directly
        if (updatedEvent && updatedEvent.eventDateTime) {
            // updatedEvent.eventDateTime is now a string like "2025-06-12 23:00:00"
            updatedEvent.inputDateTime = updatedEvent.eventDateTime.slice(0, 16).replace(' ', 'T'); // "2025-06-12T23:00"

            let [datePart, timePart] = updatedEvent.eventDateTime.split(' ');
            let [year, month, day] = datePart.split('-');
            let [hourStr, minuteStr] = timePart.split(':');

            let hour = parseInt(hourStr);
            let ampm = hour >= 12 ? 'p.m.' : 'a.m.';
            hour = hour % 12;
            hour = hour === 0 ? 12 : hour;

            updatedEvent.displayDateTime = `${parseInt(month)}/${parseInt(day)}/${year.slice(2)}, ${hour}:${minuteStr} ${ampm}`;
        } else if (updatedEvent) {
             updatedEvent.inputDateTime = '';
             updatedEvent.displayDateTime = 'N/A';
        }

        req.session.dbAltered = true;

        res.json({
            success: true,
            message: 'Event updated successfully!',
            event: updatedEvent
        });

    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ success: false, message: 'Error updating event: ' + error.message });
    }
});

// Delete Event Inline
app.delete('/events/:id', async function(req, res) {
    const eventID = req.params.id;

    try {
        const [result] = await db.query('CALL sp_DeleteEvent(?)', [eventID]);

        // For CALL statements, affectedRows might be in result[0].affectedRows or similar,
        // or you might rely on the absence of an error.
        // If the SP doesn't return anything, you can assume success if no error is thrown.
        // To be safer, you could fetch before/after or have the SP return a status.
        // For now, assuming successful CALL means deletion was attempted.

        req.session.dbAltered = true;
        res.json({ success: true, message: 'Event deleted successfully!' });

    } catch (error) {
        console.error("Error deleting event:", error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: 'Cannot delete event: It is referenced by other records (e.g., tickets, performers).' });
        }
        res.status(500).json({ success: false, message: 'Error deleting event: ' + error.message });
    }
});


/*
// SEATING OBJECTS
*/

// Display Seating Objects Table
app.get('/seating-objects', async function (req, res) {
    try {
        const [seatingObjectRows] = await db.query(`
            SELECT
                so.seating_objectID,
                e.eventName,
                so.objectName,
                so.objectCapacity,
                so.eventID /* Keep for edit functionality */
            FROM seating_objects so
            JOIN events e ON so.eventID = e.eventID
            ORDER BY e.eventName, so.objectName;
        `);
        const [eventsRows] = await db.query('SELECT eventID, eventName FROM events ORDER BY eventName'); // Fetch events for dropdown

        res.render('seating-objects', {
            title: 'Seating Objects',
            seatingobjects: seatingObjectRows,
            events: eventsRows // Pass events data to the template
        });
    } catch (error) {
        console.error("Error fetching data for seating objects page:", error);
        res.status(500).send("Error fetching data for the seating objects page.");
    }
});

// POST route to add new seating object
app.post('/seating-objects', async function(req, res) {
    let { eventID, objectName, objectCapacity } = req.body;

    // Validate inputs
    eventID = parseInt(eventID);
    objectCapacity = objectCapacity !== null && objectCapacity !== '' ? parseInt(objectCapacity) : null;

    if (isNaN(eventID) || !objectName || objectName.trim() === '') {
        return res.status(400).json({ success: false, message: 'Event and Object Name are required.' });
    }
    if (objectCapacity !== null && isNaN(objectCapacity)) {
        return res.status(400).json({ success: false, message: 'Object Capacity must be a valid number or left blank.' });
    }

    try {
        const [result] = await db.query(
            `CALL sp_AddSeatingObject(?, ?, ?)`,
            [eventID, objectName, objectCapacity]
        );

        const newSeatingObjectID = result[0][0].newSeatingObjectID;

        // Re-fetch the newly added seating object with event name for client
        const [newlyAddedSORows] = await db.query(`
            SELECT
                so.seating_objectID,
                e.eventName,
                so.objectName,
                so.objectCapacity,
                so.eventID
            FROM seating_objects so
            JOIN events e ON so.eventID = e.eventID
            WHERE so.seating_objectID = ?;
        `, [newSeatingObjectID]);

        const newSeatingObject = newlyAddedSORows[0];

        req.session.dbAltered = true;
        res.status(201).json({
            success: true,
            message: 'Seating object added successfully!',
            seatingObject: newSeatingObject
        });

    } catch (error) {
        console.error("Error adding seating object:", error);
        res.status(500).json({ success: false, message: 'Error adding seating object to the database: ' + error.message });
    }
});

// PUT route to update an existing seating object
app.put('/seating-objects/edit/:id', async function(req, res) {
    const seatingObjectID = req.params.id;
    let { eventID, objectName, objectCapacity } = req.body;

    // Validate and parse inputs
    eventID = parseInt(eventID);
    objectCapacity = objectCapacity !== null && objectCapacity !== '' ? parseInt(objectCapacity) : null;

    if (isNaN(eventID) || !objectName || objectName.trim() === '') {
        return res.status(400).json({ success: false, message: 'Event and Object Name are required.' });
    }
    if (objectCapacity !== null && isNaN(objectCapacity)) {
        return res.status(400).json({ success: false, message: 'Object Capacity must be a valid number or left blank.' });
    }

    try {
        await db.query(
            `CALL sp_UpdateSeatingObject(?, ?, ?, ?)`,
            [seatingObjectID, eventID, objectName, objectCapacity]
        );

        // Re-fetch the updated seating object with event name for client
        const [updatedSORows] = await db.query(`
            SELECT
                so.seating_objectID,
                e.eventName,
                so.objectName,
                so.objectCapacity,
                so.eventID
            FROM seating_objects so
            JOIN events e ON so.eventID = e.eventID
            WHERE so.seating_objectID = ?;
        `, [seatingObjectID]);

        const updatedSeatingObject = updatedSORows[0];

        req.session.dbAltered = true;
        res.json({
            success: true,
            message: 'Seating object updated successfully!',
            seatingObject: updatedSeatingObject
        });

    } catch (error) {
        console.error("Error updating seating object:", error);
        res.status(500).json({ success: false, message: 'Error updating seating object: ' + error.message });
    }
});

// DELETE route to delete a seating object
app.delete('/seating-objects/:id', async function(req, res) {
    const seatingObjectID = req.params.id;

    try {
        const [result] = await db.query('CALL sp_DeleteSeatingObject(?)', [seatingObjectID]);

        req.session.dbAltered = true;
        res.json({ success: true, message: 'Seating object deleted successfully!' });

    } catch (error) {
        console.error("Error deleting seating object:", error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: 'Cannot delete seating object: It is referenced by other records (e.g., in Event Registrations).' });
        }
        res.status(500).json({ success: false, message: 'Error deleting seating object: ' + error.message });
    }
});

// For the Seating-Objects picklist
app.get('/api/events/:eventID/seating-objects', async function(req, res) {
    const eventID = req.params.eventID;
    try {
        const [seatingObjects] = await db.query(`
            SELECT seating_objectID, objectName
            FROM seating_objects
            WHERE eventID = ?;
        `, [eventID]); // Directly query seating_objects using its eventID column
        res.json(seatingObjects);
    } catch (error) {
        console.error("Error fetching seating objects by event ID:", error);
        res.status(500).json({ error: 'Could not fetch seating objects' });
    }
});




/*
// EVENT REGISTRATIONS
*/

// Display Event Registrations Table
app.get('/registrations', async function (req, res) {
    try {
        const [registrationRows] = await db.query(`
            SELECT
                r.registrationID,
                e.eventName,
                CASE
                    WHEN i.firstName IS NOT NULL AND i.firstName <> '' THEN CONCAT(i.firstName, ' ', i.lastName)
                    ELSE i.lastName
                END AS individualName,
                s.objectName AS seatingObjectName,
                r.objectSeat,
                r.individualID, /* Keep for edit functionality */
                r.eventID,      /* Keep for edit functionality */
                r.seating_objectID /* Keep for edit functionality */
            FROM event_registrations r
            JOIN events e ON r.eventID = e.eventID
            JOIN individuals i ON r.individualID = i.individualID
            JOIN seating_objects s ON r.seating_objectID = s.seating_objectID
        `);
        const [individualsRows] = await db.query('SELECT individualID, firstName, lastName FROM individuals');
        const [eventsRows] = await db.query('SELECT eventID, eventName FROM events');
        const [seatingObjectsRows] = await db.query('SELECT seating_objectID, objectName FROM seating_objects');

        res.render('registrations', {
            title: 'Registrations',
            registrations: registrationRows,
            individuals: individualsRows,
            events: eventsRows,
            seatingObjects: seatingObjectsRows
        });
    } catch (error) {
        console.error("Error fetching data for registrations page:", error);
        res.status(500).send("Error fetching data for the registrations page.");
    }
});

// POST route to add new registration
app.post('/registrations', async function(req, res) {
    let { individualID, eventID, seating_objectID, objectSeat } = req.body;

    // Validate inputs
    individualID = parseInt(individualID);
    eventID = parseInt(eventID);
    seating_objectID = parseInt(seating_objectID);
    objectSeat = objectSeat !== null && objectSeat !== '' ? parseInt(objectSeat) : null;

    if (isNaN(individualID) || isNaN(eventID) || isNaN(seating_objectID)) {
        return res.status(400).json({ success: false, message: 'Individual, Event, and Seating Object are required and must be valid numbers.' });
    }
    if (objectSeat !== null && isNaN(objectSeat)) {
        return res.status(400).json({ success: false, message: 'Seat Number must be a valid number or left blank.' });
    }

    try {
        const [result] = await db.query(
            `CALL sp_AddRegistration(?, ?, ?, ?)`,
            [individualID, eventID, seating_objectID, objectSeat]
        );

        const newRegistrationID = result[0][0].newRegistrationID;

        // Re-fetch the newly added registration with display names
        const [newlyAddedRegistrationRows] = await db.query(`
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
            WHERE r.registrationID = ?;
        `, [newRegistrationID]);

        const newRegistration = newlyAddedRegistrationRows[0];

        req.session.dbAltered = true;
        res.status(201).json({
            success: true,
            message: 'Registration added successfully!',
            registration: newRegistration
        });

    } catch (error) {
        console.error("Error adding registration:", error);
        res.status(500).json({ success: false, message: 'Error adding registration to the database: ' + error.message });
    }
});

// PUT route to update an existing registration
app.put('/registrations/edit/:id', async function(req, res) {
    const registrationID = req.params.id;
    let { individualID, eventID, seating_objectID, objectSeat } = req.body;

    // Validate inputs
    individualID = parseInt(individualID);
    eventID = parseInt(eventID);
    seating_objectID = parseInt(seating_objectID);
    objectSeat = objectSeat !== null && objectSeat !== '' ? parseInt(objectSeat) : null; 

    if (isNaN(individualID) || isNaN(eventID) || isNaN(seating_objectID)) {
        return res.status(400).json({ success: false, message: 'Individual, Event, and Seating Object are required and must be valid numbers.' });
    }
    if (objectSeat !== null && isNaN(objectSeat)) {
        return res.status(400).json({ success: false, message: 'Seat Number must be a valid number or left blank.' });
    }

    try {
        await db.query(
            `CALL sp_UpdateRegistration(?, ?, ?, ?, ?)`,
            [registrationID, individualID, eventID, seating_objectID, objectSeat]
        );

        // Re-fetch the updated registration with display names
        const [updatedRegistrationRows] = await db.query(`
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
            WHERE r.registrationID = ?;
        `, [registrationID]);

        const updatedRegistration = updatedRegistrationRows[0];

        req.session.dbAltered = true;
        res.json({
            success: true,
            message: 'Registration updated successfully!',
            registration: updatedRegistration
        });

    } catch (error) {
        console.error("Error updating registration:", error);
        res.status(500).json({ success: false, message: 'Error updating registration: ' + error.message });
    }
});

// DELETE registration route
app.delete('/registrations/:id', async function(req, res) {
    const registrationID = req.params.id;

    try {
        const [result] = await db.query('CALL sp_DeleteRegistration(?)', [registrationID]);

        req.session.dbAltered = true;
        res.json({ success: true, message: 'Registration deleted successfully!' });

    } catch (error) {
        console.error("Error deleting registration:", error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: 'Cannot delete registration: It is referenced by other records.' });
        }
        res.status(500).json({ success: false, message: 'Error deleting registration: ' + error.message });
    }
});


/*
// RESET 
*/

// Reset the database 
app.post('/reset-database', async (req, res) => {
    const redirectUrl = req.body.redirectUrl || '/'; // Get the URL from the form, default to home if not found
    try {
        // Call the stored procedure to reset the database
        await db.query('CALL sp_ResetDatabase()');
        console.log("Database reset successfully via stored procedure.");
        res.redirect(redirectUrl); // Redirect to the page specified in the hidden input
    } catch (error) {
        console.error("Error resetting database:", error);
        res.status(500).send("Error resetting database: " + error.message);
    }
});


/*
//   LISTENER
*/

app.listen(PORT, function () {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
});