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

// Session
app.use(session({
    secret: 'ThisIsTortur3',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true })); 

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
app.engine('.hbs', engine({ extname: ".hbs" }));
app.set('view engine', '.hbs');


app.use(express.static('public'));



/*
    ROUTES
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

// Add New Venue
app.post('/venues', async function (req, res) {
    const { venueName, location, capacity } = req.body;

    if (!venueName || venueName.trim() === '') {
        req.session.message = {
            type: 'error',
            text: 'Venue Name is required.'
        };
        return res.redirect('/venues');
    }

    let parsedCapacity = null;
    if (capacity !== undefined && capacity !== null && String(capacity).trim() !== '') {
        parsedCapacity = parseInt(capacity);
        if (isNaN(parsedCapacity)) {
            req.session.message = {
                type: 'error',
                text: 'Capacity must be a valid number.'
            };
            return res.redirect('/venues');
        }
    }

    try {
        await db.query('INSERT INTO venues (venueName, location, capacity) VALUES (?, ?, ?)', [
            venueName,
            location || null,
            parsedCapacity
        ]);

        req.session.dbAltered = true;
        req.session.message = {
            type: 'success',
            text: 'Venue added successfully!'
        };

        res.redirect('/venues');
    } catch (error) {
        console.error("Error adding venue:", error);
        req.session.message = {
            type: 'error',
            text: 'Error adding venue: ' + error.message
        };
        res.redirect('/venues');
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

app.get('/venues/add', (req, res) => res.render('venues-add', { title: 'Add New Venue' }));

// Delete Venue
app.delete('/venues/:id', async function(req, res) {
    const venueID = req.params.id;

    try {
        // Perform the delete directly (you can create a stored procedure later if needed)
        await db.query('DELETE FROM venues WHERE venueID = ?', [venueID]);
        console.log(`Venue with ID ${venueID} deleted successfully.`);

        req.session.dbAltered = true;

        res.json({
            success: true,
            message: `Venue (ID: ${venueID}) deleted successfully.`
        });

    } catch (error) {
        console.error("Error deleting venue:", error);
        res.status(500).json({
            success: false,
            message: 'Error deleting venue: ' + error.message
        });
    }
});

/*
// EVENTS
*/

// Display Events Table
app.get('/events', async function (req, res) {
    try {
        const [eventsRows] = await db.query(`
            SELECT
                e.eventID,
                e.eventName,
                e.eventDateTime,
                v.venueName,
                e.eventCapacity,
                e.seatingType,
                e.Description,
                e.venueID /* Keep for edit functionality */
            FROM events e
            JOIN venues v ON e.venueID = v.venueID
        `);

        const [venuesRows] = await db.query('SELECT venueID, venueName FROM venues');

        res.render('events', { title: 'Events', events: eventsRows, venues: venuesRows });
    } catch (error) {
        console.error("Error fetching events or venues:", error);
        res.status(500).send("Error fetching data for the events page.");
    }
});

// Add New Event
app.post('/events', async function (req, res) {
    const { eventName, eventDateTime, venueID, seatingType, description, eventCapacity } = req.body;

    if (!eventName || eventName.trim() === '') {
        req.session.message = {
            type: 'error',
            text: 'Event Name is required.'
        };
        return res.redirect('/events');
    }

    let parsedCapacity = eventCapacity ? parseInt(eventCapacity) : null;
    let parsedVenueID = venueID ? parseInt(venueID) : null;

    try {
        await db.query(
            `INSERT INTO events (eventName, eventDateTime, venueID, seatingType, description, eventCapacity)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [eventName, eventDateTime || null, parsedVenueID, seatingType || null, description || null, parsedCapacity]
        );

        req.session.dbAltered = true;
        req.session.message = {
            type: 'success',
            text: 'Event added successfully!'
        };
        res.redirect('/events');
    } catch (error) {
        console.error("Error adding event:", error);
        req.session.message = {
            type: 'error',
            text: 'Error adding event: ' + error.message
        };
        res.redirect('/events');
    }
});

// Edit Events
app.post('/events/edit/:id', async function(req, res) {
    const eventID = req.params.id;
    const { eventName, eventDateTime, venueID, eventCapacity, seatingType, Description } = req.body;


    if (!eventName || eventName.trim() === '') {
        return res.status(400).json({ success: false, message: 'Event Name is required.' });
    }

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
            parsedEventDateTime,
            parsedVenueID,
            parsedEventCapacity,
            seatingType,
            Description
            
        ]);
        console.log(`Event with ID ${eventID} updated successfully via stored procedure.`);

        let updatedVenueName = null;
        if (parsedVenueID) {
            const [venueRows] = await db.query('SELECT venueName FROM venues WHERE venueID = ?', [parsedVenueID]);
            if (venueRows.length > 0) {
                updatedVenueName = venueRows[0].venueName;
            } else {
                // venueID doesn't exist
                updatedVenueName = `Invalid Venue ID: ${parsedVenueID}`;
                console.warn(`Venue ID ${parsedVenueID} not found for event ${eventID}.`);
            }
        }

        req.session.dbAltered = true;

        res.json({
            success: true,
            message: 'Event updated successfully!',
            event: { 
                eventID,
                eventName,
                eventDateTime: parsedEventDateTime,
                venueID: parsedVenueID, 
                venueName: updatedVenueName, 
                eventCapacity: parsedEventCapacity,
                seatingType,
                Description
            }
        });

    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ success: false, message: 'Error updating event: ' + error.message });
    }
});



/*
// SEATING OBJECTS
*/

// Display Seating Objects Table
app.get('/seating-objects', async function (req, res) {
    try {
        const [seatingObjectsRows] = await db.query(`
            SELECT
                so.seating_objectID,
                e.eventName,
                so.objectName,
                so.objectCapacity,
                so.eventID /* Keep for edit functionality */
            FROM seating_objects so
            JOIN events e ON so.eventID = e.eventID
        `);

        const [eventsRows] = await db.query('SELECT eventID, eventName FROM events');

        res.render('seating-objects', {
            title: 'Seating Objects',
            seatingobjects: seatingObjectsRows,
            events: eventsRows
        });
    } catch (error) {
        console.error("Error fetching seating objects or events:", error);
        res.status(500).send("Error fetching data for the seating objects page.");
    }
});

// Add New Seating Object
app.post('/seating-objects', async function (req, res) {
    const { eventID, objectName, objectCapacity } = req.body;

    if (!objectName || objectName.trim() === '') {
        req.session.message = {
            type: 'error',
            text: 'Seating object name is required.'
        };
        return res.redirect('/seating-objects');
    }

    const parsedEventID = parseInt(eventID);
    const parsedCapacity = objectCapacity ? parseInt(objectCapacity) : null;

    try {
        await db.query(
            'INSERT INTO seating_objects (eventID, objectName, objectCapacity) VALUES (?, ?, ?)',
            [parsedEventID, objectName, parsedCapacity]
        );

        req.session.dbAltered = true;
        req.session.message = {
            type: 'success',
            text: 'Seating object added successfully!'
        };
        res.redirect('/seating-objects');
    } catch (error) {
        console.error("Error adding seating object:", error);
        req.session.message = {
            type: 'error',
            text: 'Error adding seating object: ' + error.message
        };
        res.redirect('/seating-objects');
    }
});

// Edit Seating Object
app.post('/seating-objects/edit/:id', async function (req, res) {
    const seating_objectID = req.params.id;
    const { eventID, objectName, objectCapacity } = req.body;

    if (!objectName || objectName.trim() === '') {
        return res.status(400).json({ success: false, message: 'Object Name is required.' });
    }

    const parsedEventID = parseInt(eventID);
    const parsedCapacity = objectCapacity ? parseInt(objectCapacity) : null;

    if (isNaN(parsedEventID)) {
        return res.status(400).json({ success: false, message: 'Invalid Event ID.' });
    }

    try {
        await db.query(
            `UPDATE seating_objects
             SET eventID = ?, objectName = ?, objectCapacity = ?
             WHERE seating_objectID = ?`,
            [parsedEventID, objectName, parsedCapacity, seating_objectID]
        );

        console.log(`Seating Object ${seating_objectID} updated successfully.`);
        req.session.dbAltered = true;

        res.json({
            success: true,
            message: 'Seating Object updated successfully!',
            seatingObject: {
                seating_objectID,
                eventID: parsedEventID,
                objectName,
                objectCapacity: parsedCapacity
            }
        });

    } catch (error) {
        console.error("Error updating seating object:", error);
        res.status(500).json({ success: false, message: 'Error updating seating object: ' + error.message });
    }
});

// Delete Seating Object
app.delete('/seating-objects/:id', async function (req, res) {
    const seating_objectID = req.params.id;

    try {
        await db.query('DELETE FROM seating_objects WHERE seating_objectID = ?', [seating_objectID]);
        console.log(`Seating Object ${seating_objectID} deleted successfully.`);

        req.session.dbAltered = true;

        res.json({
            success: true,
            message: `Seating Object (ID: ${seating_objectID}) deleted successfully.`
        });

    } catch (error) {
        console.error("Error deleting seating object:", error);
        res.status(500).json({
            success: false,
            message: 'Error deleting seating object: ' + error.message
        });
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



// Display seating objects in Event Registration Add picklist based on selected EventID
app.get('/api/events/:eventID/seating-objects', async function (req, res) {
    const eventID = req.params.eventID;
    try {
        const [rows] = await db.query('SELECT seating_objectID, objectName FROM seating_objects WHERE eventID = ?', [eventID]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching seating objects by event ID:", error);
        res.status(500).json({ error: 'Could not fetch seating objects' });
    }
});

// Add New Registration
app.post('/registrations', async function (req, res) {
    const { individualID, eventID, seating_objectID, objectSeat } = req.body;

    const parsedIndividualID = parseInt(individualID);
    const parsedEventID = parseInt(eventID);
    const parsedSeatingObjectID = parseInt(seating_objectID);
    const parsedSeat = objectSeat ? parseInt(objectSeat) : null;

    if (isNaN(parsedIndividualID) || isNaN(parsedEventID) || isNaN(parsedSeatingObjectID)) {
        req.session.message = {
            type: 'error',
            text: 'All selections are required.'
        };
        return res.redirect('/registrations');
    }

    try {
        await db.query(
            `INSERT INTO event_registrations (individualID, eventID, seating_objectID, objectSeat)
             VALUES (?, ?, ?, ?)`,
            [parsedIndividualID, parsedEventID, parsedSeatingObjectID, parsedSeat]
        );

        req.session.dbAltered = true;
        req.session.message = {
            type: 'success',
            text: 'Registration added successfully!'
        };
        res.redirect('/registrations');
    } catch (error) {
        console.error("Error adding registration:", error);
        req.session.message = {
            type: 'error',
            text: 'Error adding registration: ' + error.message
        };
        res.redirect('/registrations');
    }
});

// Edit Registration
app.post('/registrations/edit/:id', async function (req, res) {
    const registrationID = req.params.id;
    const { individualID, eventID, seating_objectID, objectSeat } = req.body;

    const parsedIndividualID = parseInt(individualID);
    const parsedEventID = parseInt(eventID);
    const parsedSeatingObjectID = parseInt(seating_objectID);
    const parsedSeat = objectSeat ? parseInt(objectSeat) : null;

    if ([parsedIndividualID, parsedEventID, parsedSeatingObjectID].some(isNaN)) {
        return res.status(400).json({ success: false, message: 'All selections are required and must be valid.' });
    }

    try {
        await db.query(`
            UPDATE event_registrations
            SET individualID = ?, eventID = ?, seating_objectID = ?, objectSeat = ?
            WHERE registrationID = ?`,
            [parsedIndividualID, parsedEventID, parsedSeatingObjectID, parsedSeat, registrationID]
        );

        req.session.dbAltered = true;

        res.json({
            success: true,
            message: 'Registration updated successfully!',
            registration: {
                registrationID,
                individualID: parsedIndividualID,
                eventID: parsedEventID,
                seating_objectID: parsedSeatingObjectID,
                objectSeat: parsedSeat
            }
        });

    } catch (error) {
        console.error("Error updating registration:", error);
        res.status(500).json({
            success: false,
            message: 'Error updating registration: ' + error.message
        });
    }
});

// Delete Registration
app.delete('/registrations/:id', async function (req, res) {
    const registrationID = req.params.id;

    try {
        await db.query('DELETE FROM event_registrations WHERE registrationID = ?', [registrationID]);
        console.log(`Registration ${registrationID} deleted successfully.`);

        req.session.dbAltered = true;

        res.json({
            success: true,
            message: `Registration (ID: ${registrationID}) deleted successfully.`
        });

    } catch (error) {
        console.error("Error deleting registration:", error);
        res.status(500).json({
            success: false,
            message: 'Error deleting registration: ' + error.message
        });
    }
});


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
