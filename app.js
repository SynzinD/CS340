/*
CS340 Group 47 Project Step 3 Draft
Megan Mooers and Synzin Darkpaw 
*/

/*
    SETUP
*/

// Express
const express = require('express');
const app = express();
const PORT = 44543;

// Database
const db = require('./db-connector');

// Handlebars
const { engine } = require('express-handlebars');

app.engine('.hbs', engine({ extname: ".hbs" }));
app.set('view engine', '.hbs');

app.use(express.static('public'));

/*
    ROUTES
*/

app.get('/', async function (req, res) {
    res.render('index', {
        title: 'Event Management System',
        links: [
            { url: '/individuals', title: 'Individual Attendees' },
            { url: '/venues', title: 'Venues' },
            { url: '/events', title: 'Events' },
            { url: '/seating-objects', title: 'Event Seating' },
            { url: '/registrations', title: 'Registrations' }
        ]
    });
});

// Dummy routes for now - we'll create the actual logic later
//app.get('/individuals', (req, res) => res.render('individuals', { title: 'Individuals' }));
app.get('/individuals', async function (req, res) {
    try {
        const [rows, fields] = await db.query('SELECT * FROM individuals');
        res.render('individuals', { title: 'Individuals', individuals: rows });
    } catch (error) {
        console.error("Error fetching individuals:", error);
        res.status(500).send("Error fetching data.");
    }
});
app.get('/individuals/add', (req, res) => res.render('individuals-add', { title: 'Add New Individual' }));
//app.get('/venues', (req, res) => res.render('venues', { title: 'Venues' }));
app.get('/venues', async function (req, res) {
    try {
        const [rows, fields] = await db.query('SELECT * FROM venues');
        res.render('venues', { title: 'Venues', venues: rows });
    } catch (error) {
        console.error("Error fetching venues:", error);
        res.status(500).send("Error fetching data.");
    }
});
app.get('/venues/add', (req, res) => res.render('venues-add', { title: 'Add New Venue' }));
//app.get('/events', (req, res) => res.render('events', { title: 'Events' }));

app.get('/events', async function (req, res) {
    try {
        const [rows, fields] = await db.query('SELECT * FROM events');
        res.render('events', { title: 'Events', events: rows });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).send("Error fetching data.");
    }
});
app.get('/events/add', (req, res) => res.render('events-add', { title: 'Add New Event' }));
//app.get('/seating-objects', (req, res) => res.render('seating-objects', { title: 'Event Seating' }));
app.get('/seating-objects', async function (req, res) {
    try {
        const [rows, fields] = await db.query('SELECT * FROM `seating_objects`');
        res.render('seating-objects', { title: 'Seating Objects', seatingobjects: rows });
    } catch (error) {
        console.error("Error fetching seating objects:", error);
        res.status(500).send("Error fetching data.");
    }
});
app.get('/seating-objects/add', (req, res) => res.render('seating-objects-add', { title: 'Add New Seating Object' }));
//app.get('/registrations', (req, res) => res.render('registrations', { title: 'Event Registrations' }));
////const [rows, fields] = await db.query('SELECT * FROM `event_registrations`');
app.get('/registrations', async function (req, res) {
    try {
        const [rows, fields] = await db.query(`
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
        res.render('registrations', { title: 'Registrations', registrations: rows });
    } catch (error) {
        console.error("Error fetching registrations with names:", error);
        res.status(500).send("Error fetching registration data.");
    }
});
app.get('/registrations/add', (req, res) => res.render('registrations-add', { title: 'Add New Registration' }));


/*
    LISTENER
*/

app.listen(PORT, function () {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
});
