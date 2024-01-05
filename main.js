/********************************************
 * 
 *  This file contains the code for the 
 *  Node Server that handles the Roast From
 *  The Coast Website Functionality
 * 
 * 
 *******************************************/

//import nessesary modules
const express = require('express');
const validator = require('validator');
const util = require('util');
const { v4: uuidv4 } = require('uuid');
const transporter = require('./js/mailer');
const fs = require('fs');
const path = require('path');

// Create express app
const app = express();

//DotENV
require('dotenv').config();

app.use (express.json()); //used to parse JSON bodies
app.use (express.urlencoded({extended: true})); //Parse URL-encoded bodies


/*******************************************************
 * 
 *           MYSQL DATABASE HANDLING
 * 
 *******************************************************/

//import mysql module
const mysql = require('mysql2');

//create connection to database
const db_con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: process.env.PORT
});

//connect to database
db_con.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});
const dbQueryPromise = util.promisify(db_con.query).bind(db_con); //promisify db_con.query


/*******************************************************
 * 
 *          API HANDLING For the Subscribe Post Request
 * 
 ****************************************************** */

//api for handling the subscription post request
app.post('/subscribe', async(req, res) => { //listen for post requests
    //get data from request
    const email = req.body.email;

    console.log('Post Request Recieved ' + email); //debugging
    console.log(req.body); //debugging


    //FUNCTION TO VALIDATE EMAIL
    if (!validator.isEmail(email)) { //check if email is valid
        console.log(`${email} is not a valid email`);
        return res.status(400).json({message: `${email} is not a valid email`});
    }


    //FUNCTION TO ADD EMAIL TO DATABASE
    try {

        //Check the database to see if the subscriber table exists
        const [tableExists] = await dbQueryPromise('SHOW TABLES LIKE "subscribers"'); //check if table exists

        if (!tableExists) { //if table does not exist, create it
            const sql = 'CREATE TABLE subscribers (email VARCHAR(255), token VARCHAR(255), is_confirmed BOOLEAN DEFAULT 0)';
            await dbQueryPromise(sql); //create table
            console.log('Created subscribers table'); //debugging
        }


        const [existingUser] = await dbQueryPromise('SELECT * FROM subscribers WHERE email = ?', [email]); //check if email is in database

        if (!existingUser) { //if email is not in database, add it

            const token = uuidv4(); //generate token
            const sql = 'INSERT INTO subscribers (email, token) VALUES (?, ?)';
            const values = [email, token];

            await dbQueryPromise(sql, values); //add email to database
            console.log(`Added ${email} to the database`);

            const confirmationLink = `http://127.0.0.1/confirm.html?email=${email}&token=${token}`; // replace with confirmation link

            //send email to user
            try {

                //read HTML file for email content
                const parentDir = path.join(__dirname, '..');
                const emailContentPath = path.join(parentDir, 'email', 'confirmation_email.html');
                const emailContent = fs.readFileSync(emailContentPath, 'utf8');
                
                //Replace placeholders in HTML file with actual content
                const finalEmailContent = emailContent.replace('${confirmationLink}', confirmationLink);

                //send email
                await transporter.sendMail({
                    from: 'SENDER_EMAIL_HERE',
                    to: email,
                    subject: 'Newsletter Subscription',
                    html: finalEmailContent, // Email content as HTML
                });
                
                console.log(`Confirmation Email sent to ${email}`); //debugging
                
                return res.status(201).json({ message: `Thank you, the Email: ${email} has been subscribed to our newsletter.` }); //send success message

            } catch (error) {
                console.error('Error sending email', error); //handle any errors that occur during the request
                return res.status(500).json({ message: 'Internal server error.' });
            }

        } else {
        console.log(`${email} is already in database`); //if email is already in database, send error
        return res.status(400).json({message: `${email} has already been subscribed`});
        }

    } catch (error) {
        console.error('Error Processing Subscription', error); //handle any errors that occur during the request
        return res.status(500).json({ message: 'Internal server error.' });
    }

}); 


/*******************************************************
 * 
 *         API HANDLING For the Confirm Subscription Get Request
 * 
 * ***************************************************** */

//api for handling the confirmation get request
app.get('/confirm', async(req, res) => { //listen for get requests
    //get data from request
    const email = req.query.email;
    const token = req.query.token;

    console.log('Get Request Recieved'); //debugging
    console.log(req.query); //debugging

    //check the database to see if the email and token match
    try {
        const [existingUser] = await dbQueryPromise('SELECT * FROM subscribers WHERE email = ? AND token = ?', [email, token]); //check if email is in database

        if (existingUser) { //if email is in database, update the database to confirm the email

            const sql = 'UPDATE subscribers SET is_confirmed = 1 WHERE email = ? AND token = ?';
            const values = [email, token];

            await dbQueryPromise(sql, values); //update database


            console.log(`Updated email confirmation for ${email} in the database`);
            return res.status(200).send('Subscription confirmed.'); //send success message


        } else {
            console.log(`Email and Token are not a match in the database`);
            return res.status(400).send('Email and Token are not valid. Subscription confirmation failed.');
        }

    } catch (error) {
        console.error('Error Processing Subscription Confirmation', error); //handle any errors that occur during the request
        return res.status(500).send('Internal server error.');
    }
    
});




//Start server
const port = 3001
const host = '127.0.0.1'
app.listen(port, host)
console.log(`Listening at http://${host}:${port}`)


