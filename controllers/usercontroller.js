const jwt = require("jsonwebtoken");
const mysql = require('mysql2');
const dotenv = require("dotenv");
dotenv.config();
const users = require("../model/adminAdd");
const bcrypt = require('bcrypt');
const saltRounds = 10; 
const axios = require('axios');
const moment = require('moment');


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// registration
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  // Check if any of the required fields are empty
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Please fill in all required fields' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Check if the email already exists in the database
  const emailExistsQuery = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
  db.query(emailExistsQuery, [email], (err, results) => {
    if (err) {
      console.error('Error checking email existence:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const emailCount = results[0].count;

    if (emailCount > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Insert the user data into the database
    const insertQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(insertQuery, [username, email, hashedPassword], (err, results) => {
      if (err) {
        console.error('Error registering user:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.status(201).json({ message: 'User registered successfully' });
    });
  });
};


// Login
exports.login = async(req,res)=>{
  const { email, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (error, results) => {
      if (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else if (results.length > 0) {
        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          const expiresIn = '1h'; 
          const token = jwt.sign({}, 'secretKey',{expiresIn});
          res.status(200).json({ message: 'Login successful',token });
        } else {
          res.status(401).json({ error: 'Email or Password are not match' });
        }
      } else {
        res.status(401).json({ error: 'Email or Password are not match' });
      }
    }
  );
}

// post data
exports.datainsert = async (req, res) => {
  const {date,tithi,rashi,nakshtra,nakshtratime,vinchudo,panchak,festival,holiday,bankholiday,rutu,description,} = req.body;

  const query = `INSERT INTO schedule_list (date, tithi, rashi, nakshtra, nakshtratime, vinchudo, panchak, festival, holiday, bankholiday, rutu, description)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [date,tithi,rashi,nakshtra,nakshtratime,vinchudo,panchak,festival,
holiday,bankholiday,rutu,description,], (err, results) => {
    if (err) {
      console.error("Error inserting data into the database:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json({ message: "Data inserted successfully" });
    }
  });
};

// get all data
exports.all = async (req, res) => {
  const query = `SELECT * FROM schedule_list`;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error querying the database:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    // Send the JSON data directly as the response
    res.json(results); // Adjust the response structure as needed
  });
};

// update all data
exports.allUpdate = async (req, res) => {
  const { id } = req.query; // Use req.query to access query parameters
  const allUpdate = req.body; // The data you want to update

  // Build the SQL query dynamically based on the passed data
  const columnsToUpdate = Object.keys(allUpdate);
  const valuesToUpdate = Object.values(allUpdate);

  const setStatements = columnsToUpdate.map((column) => `${column} = ?`).join(', ');
  const query = `
    UPDATE schedule_list
    SET ${setStatements}
    WHERE id = ?;
  `;

  // Include the ID value at the end of the values array for the WHERE clause
  valuesToUpdate.push(id);

  db.query(query, valuesToUpdate, (err, results) => {
    if (err) {
      console.error("Error updating data in the database:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      if (results.affectedRows === 0) {
        res.status(404).json({ error: "Data not found for the given ID" });
      } else {
        res.json({ message: "Data updated successfully" });
      }
    }
  });
};

// get single date record
exports.date = async(req,res)=>{
  const { date } = req.query;
  // Assuming your database table is called 'your_table_name'
  const query = 'SELECT * FROM  schedule_list WHERE date = ?';
  db.query(query, [date], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }else{
      res.json(results);
    }
  });
}


// get all holiday
exports.holiday = async (req, res) => {
  const query = `
    SELECT id, date, holiday
    FROM schedule_list
    WHERE 
        holiday IS NOT NULL 
        AND holiday NOT LIKE 'नहीं है%'
        AND holiday NOT LIKE 'महिना का दूसरा शनिवार%'
        AND holiday NOT LIKE 'महिना का चौथा शनिवार%'
        AND holiday <> '';`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error querying the database:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    // Send the JSON data directly as the response
    res.json(results); // Adjust the response structure as needed
  });
};

// post city
exports.bankholidayadd = async (req, res) => {
  const { date, bankholiday } = req.body;

  // Insert data into the 'cities' table
  const sql = 'INSERT INTO bankholiday (date, bankholiday) VALUES (?, ?)';
  db.query(sql, [ date, bankholiday ], (err, result) => {
    if (err) {
      console.error('Error inserting data: ' + err.message);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    console.log('Inserted ID:', result.insertId);
    res.json({ message: 'bankholiday data inserted successfully' });
  });
}


// get bank holiday
exports.bankholiday = async (req, res) => {
  const query = `
    SELECT *
    FROM bankholiday`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error querying the database:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    // Send the JSON data directly as the response
    res.json(results); // Adjust the response structure as needed
  });
};

// update bank holiday
exports.updateBankholiday = async (req, res) => {
  const { id } = req.query; // Extract the "id" parameter from request params
  const allUpdate  = req.body; // Extract and validate the fields you want to update

  // Build the SQL query dynamically based on the passed data
  const columnsToUpdate = Object.keys(allUpdate);
  const valuesToUpdate = Object.values(allUpdate);

  const setStatements = columnsToUpdate.map((column) => `${column} = ?`).join(', ');

  // Construct the SQL query to update the katha record with the provided id
  const query = `
    UPDATE bankholiday
    SET ${setStatements}
    WHERE id = ?;
  `;

    // Include the ID value at the end of the values array for the WHERE clause
    valuesToUpdate.push(id);

    db.query(query, valuesToUpdate, (err, results) => {
      if (err) {
        console.error("Error updating data in the database:", err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        if (results.affectedRows === 0) {
          res.status(404).json({ error: "Data not found for the given ID" });
        } else {
          res.json({ message: "Data updated successfully" });
        }
      }
    });
};


// get all festival
exports.festival = async (req, res) => {
  const query = `SELECT id,date,festival
  FROM schedule_list
  WHERE festival IS NOT NULL AND festival != ''  
  AND festival NOT LIKE 'आज के दिन कोई त्यौहार नहीं है%' ;
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error querying the database:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    // Assuming the query was successful, you can send the results as JSON
    res.json( results ); // Adjust the response structure as needed
  });
};

// post city
exports.cityadd = async (req, res) => {
  const { name, lat, lng } = req.body;

  // Insert data into the 'cities' table
  const sql = 'INSERT INTO cities (name, lat, lng) VALUES (?, ?, ?)';
  db.query(sql, [name, lat, lng], (err, result) => {
    if (err) {
      console.error('Error inserting data: ' + err.message);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    console.log('Inserted ID:', result.insertId);
    res.json({ message: 'City data inserted successfully' });
  });
}


// get all cities 
exports.city = async (req, res) => {
  const query = `SELECT id,name
  FROM cities;
  ;
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error querying the database:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    // Assuming the query was successful, you can send the results as JSON
    res.json(results); // Adjust the response structure as needed
  });
};

// get selected city sunrise,sunset and moonrise time
exports.sunrise_sunset_moonrise = async (req, res) => {
  const cityId = req.query.cityId; // Get the cityId from the query parameter

  if (!cityId) {
    res.status(400).json({ error: 'CityId is required in the query parameter.' });
    return;
  }

  db.query(
    'SELECT lat, lng FROM cities WHERE id = ?',
    [cityId],
    async (error, results) => {
      if (error) {
        console.error('Error querying the database:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else if (results.length > 0) {
        const { lat, lng } = results[0];
        const apiKey = `e713563e7e4944648844ea977a1f550d`;
        const apiUrl = `https://api.ipgeolocation.io/astronomy?apiKey=${apiKey}&lat=${lat}&long=${lng}&formatted=0`;

        try {
          const response = await fetch(apiUrl);
          const data = await response.json();

          if (data) {
            const sunrise = data.sunrise;
            const sunset = data.sunset;
            const moonrise = data.moonrise;

            // Convert sunrise time to 12-hour format with AM and PM
            const sunriseTime = sunrise.split(':');
            let sunriseHours = parseInt(sunriseTime[0]);
            const sunriseMinutes = sunriseTime[1];
            const sunriseAMPM = sunriseHours >= 12 ? 'PM' : 'AM';

            // Adjust hours for 12-hour format
            if (sunriseHours > 12) {
              sunriseHours -= 12;
            }

            const formattedSunrise = sunriseHours + ':' + sunriseMinutes + ' ' + sunriseAMPM;

            // Convert sunset time to 12-hour format with AM and PM
            const sunsetTime = sunset.split(':');
            let sunsetHours = parseInt(sunsetTime[0]);
            const sunsetMinutes = sunsetTime[1];
            const sunsetAMPM = sunsetHours >= 12 ? 'PM' : 'AM';

            // Adjust hours for 12-hour format
            if (sunsetHours > 12) {
              sunsetHours -= 12;
            }

            const formattedSunset = sunsetHours + ':' + sunsetMinutes + ' ' + sunsetAMPM;

            // Convert moonrise time to 12-hour format with AM and PM
            const moonriseTime = moonrise.split(':');
            let moonriseHours = parseInt(moonriseTime[0]);
            const moonriseMinutes = moonriseTime[1];
            const ampm = moonriseHours >= 12 ? 'PM' : 'AM';

            // Adjust hours for 12-hour format
            if (moonriseHours > 12) {
              moonriseHours -= 12;
            }

            const formattedMoonrise = moonriseHours + ':' + moonriseMinutes + ' ' + ampm;

            res.json({
              sunrise: formattedSunrise, // Sunrise time in 12-hour format
              sunset: formattedSunset,
              moonrise: formattedMoonrise, // Sunset time in 12-hour format
            });
          } else {
            console.error('City not found or data not available.');
            res.status(404).json({ error: 'City not found or data not available' });
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          res.status(500).json({ error: 'Error fetching data' });
        }
      } else {
        console.error('City not found in the database.');
        res.status(404).json({ error: 'City not found in the database' });
      }
    }
  );
}

// get sunrise sunset moonrise time about date
exports.timeDate = async (req, res) => {
  const cityId = req.query.cityId; // Get the cityId from the query parameter
  const date = req.query.date; // Get the date from the query parameter

  if (!cityId) {
    res.status(400).json({ error: 'CityId is required in the query parameter.' });
    return;
  }

  if (!date) {
    res.status(400).json({ error: 'Date is required in the query parameter.' });
    return;
  }

  db.query(
    'SELECT lat, lng FROM cities WHERE id = ?',
    [cityId],
    async (error, results) => {
      if (error) {
        console.error('Error querying the database:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else if (results.length > 0) {
        const { lat, lng } = results[0];
        const apiKey = `e713563e7e4944648844ea977a1f550d`;
        const apiUrl = `https://api.ipgeolocation.io/astronomy?apiKey=${apiKey}&lat=${lat}&long=${lng}&formatted=0&date=${date}`;

        try {
          const response = await fetch(apiUrl);
          const data = await response.json();

          if (data) {
            const sunrise = data.sunrise;
            const sunset = data.sunset;
            const moonrise = data.moonrise;

            // Convert times to 12-hour format with AM and PM
            const formatTime = (time) => {
              const timeParts = time.split(':');
              let hours = parseInt(timeParts[0]);
              const minutes = timeParts[1];
              const ampm = hours >= 12 ? 'PM' : 'AM';

              if (hours > 12) {
                hours -= 12;
              }

              return `${hours}:${minutes} ${ampm}`;
            };

            const formattedSunrise = formatTime(sunrise);
            const formattedSunset = formatTime(sunset);
            const formattedMoonrise = formatTime(moonrise);

            res.json({
              sunrise: formattedSunrise, // Sunrise time in 12-hour format
              sunset: formattedSunset, // Sunset time in 12-hour format
              moonrise: formattedMoonrise, // Moonrise time in 12-hour format
            });
          } else {
            console.error('City not found or data not available.');
            res.status(404).json({ error: 'City not found or data not available' });
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          res.status(500).json({ error: 'Error fetching data' });
        }
      } else {
        console.error('City not found in the database.');
        res.status(404).json({ error: 'City not found in the database' });
      }
    }
  );
};


// get all katha
exports.katha = async (req, res) => {
  const query = `SELECT *
    FROM katha;`;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error querying the database:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    // Send the JSON data directly as the response
    res.json(results); // Adjust the response structure as needed
  });
};  

// update katha 
exports.updateKatha = async (req, res) => {
  const { id } = req.query; // Extract the "id" parameter from request params
  const allUpdate  = req.body; // Extract and validate the fields you want to update

  // Build the SQL query dynamically based on the passed data
  const columnsToUpdate = Object.keys(allUpdate);
  const valuesToUpdate = Object.values(allUpdate);

  const setStatements = columnsToUpdate.map((column) => `${column} = ?`).join(', ');

  // Construct the SQL query to update the katha record with the provided id
  const query = `
    UPDATE katha
    SET ${setStatements}
    WHERE id = ?;
  `;

    // Include the ID value at the end of the values array for the WHERE clause
    valuesToUpdate.push(id);

    db.query(query, valuesToUpdate, (err, results) => {
      if (err) {
        console.error("Error updating data in the database:", err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        if (results.affectedRows === 0) {
          res.status(404).json({ error: "Data not found for the given ID" });
        } else {
          res.json({ message: "Data updated successfully" });
        }
      }
    });
};


// Delete all data row
exports.alldelete = async (req, res) => {
  const id = req.query.id;

  // Check if the ID is valid (optional but recommended)
  if (!isValidId(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  // Define your SQL query to delete the data row by ID
  const query = 'DELETE FROM schedule_list WHERE id = ?';

  // Execute the query
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting data:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // Check if a row was affected (indicating a successful delete)
    if (result.affectedRows === 1) {
      res.json({ message: 'Data row deleted successfully' });
    } else {
      res.status(404).json({ error: 'Data row not found' });
    }
  });
  // Define a function to validate the ID (optional)
function isValidId(id) {
  // You can implement your own validation logic here
  // Example: return /^[0-9]+$/.test(id);
  return true; // For simplicity, assume all IDs are valid
}

}

// get rashi
exports.rashi = async (req, res) => {
  const query = `SELECT *
  FROM horoscope;`;

db.query(query, (err, results) => {
  if (err) {
    console.error("Error querying the database:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  // Send the JSON data directly as the response
  res.json(results); // Adjust the response structure as needed
});
}

// get rashi letters
exports.getLetters = async (req, res) => {
  const rashiToSearch = req.query.rashi;

  const sql = `
    SELECT horoscope.letters
    FROM schedule_list
    JOIN horoscope ON schedule_list.rashi = horoscope.rashi
    WHERE schedule_list.rashi = ?
  `;

  db.query(sql, [rashiToSearch], (error, results) => {
    if (error) {
      console.error('Error executing SQL query:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (results.length > 0) {
        // Remove \r\n from the data
        const cleanedLetters = results[0].letters.replace(/\r\n/g, '');
        res.json({ letters: cleanedLetters });
      } else {
        console.error('No matching records found for rashi:', rashiToSearch);
        res.status(404).json({ error: 'No matching records found' });
      }
    }
  });
}

// get all nakshtra 
exports.nakshtra = async (req, res) => {
  const query = `SELECT *
  FROM nakshtra;`;

db.query(query, (err, results) => {
  if (err) {
    console.error("Error querying the database:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  // Send the JSON data directly as the response
  res.json(results); // Adjust the response structure as needed
});
}

// get nakshtara time
exports.nakshtraTime = async (req, res) => {
  const { date } = req.query; // Removed ".date" since you're already destructuring "date" from req.query
  const query = `
    SELECT id,nakshtra,nakshtratime	
    FROM schedule_list
    WHERE date = ?`;
  db.query(query, [date], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'No data found for the given date' });
    } else {
      res.json(results);
    }
  });
};




// get all rutu 
exports.rutu = async (req, res) => {
  const query = `SELECT *
  FROM rutu;`;

db.query(query, (err, results) => {
  if (err) {
    console.error("Error querying the database:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  // Send the JSON data directly as the response
  res.json(results); // Adjust the response structure as needed
});
}

// Your database connection and query logic to get lat and lng values
function getLatAndLng(cityId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT lat, lng FROM cities WHERE id = ?', [cityId], (error, results) => {
      if (error) {
        reject(error);
      } else if (results.length > 0) {
        resolve(results[0]);
      } else {
        reject('City not found in the database');
      }
      
    });
  });
}

async function getSunriseAndSunset(cityId, selectedDate) {
  try {
    // Fetch lat and lng values from the database
    const { lat, lng } = await getLatAndLng(cityId);
    
    // Format the selectedDate as 'YYYY-MM-DD' for the API request
    const formattedDate = selectedDate.format('YYYY-MM-DD');

    const apiKey = 'e713563e7e4944648844ea977a1f550d';
    const response = await axios.get(`https://api.ipgeolocation.io/astronomy?apiKey=${apiKey}&lat=${lat}&long=${lng}&date=${formattedDate}&formatted=0`);
    
    if (response.status === 200) {
      const data = response.data;
      return { sunrise: moment(data.sunrise, 'h:mm:ss A'), sunset: moment(data.sunset, 'h:mm:ss A') };
    } else {
      console.error('API Request Failed:', response.status, response.statusText);
      throw new Error('Error fetching sunrise and sunset times');
    }
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error('Error fetching sunrise and sunset times');
  }
}


// Helper function to generate Choghadiya time slots
function generateChoghadiyaSlots(sunrise, sunset, slotDurationMinutes, limit = 8) {
  const choghadiyaSlots = [];
  let currentTime = sunrise.clone();
  let count = 0;

  while (currentTime.isBefore(sunset) && count < limit - 1) {
    const endTime = currentTime.clone().add(slotDurationMinutes, 'minutes');
    choghadiyaSlots.push({ start: currentTime.format('h:mm A'), end: endTime.format('h:mm A') });
    currentTime = endTime;
    count++;
  }

  // Add the last slot that ends at sunset
  if (count < limit) {
    choghadiyaSlots.push({ start: currentTime.format('h:mm A'), end: sunset.format('h:mm A') });
  }

  return choghadiyaSlots;
}

// Modify your API route to accept date and cityId as parameters
exports.choghadiya = async (req, res) => {
  try {
    const { cityId, date } = req.query;
    
    // Validate that both cityId and date are provided
    if (!cityId || !date) {
      res.status(400).json({ error: 'City ID and date are required parameters' });
      return;
    }

    // Parse the date parameter into a Moment.js object
    const selectedDate = moment(date, 'YYYY-MM-DD');

    // Pass the city ID and selectedDate to getSunriseAndSunset function
    const { sunrise, sunset } = await getSunriseAndSunset(cityId, selectedDate);
    const choghadiyaSlots = generateChoghadiyaSlots(sunrise, sunset, 90, 8); // Limit to 8 slots

    res.json(choghadiyaSlots);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// night choghadiya
async function getNightChoghadiyaSlots(cityId, selectedDate) {
  try {
    // Fetch lat and lng values from the database
    const { lat, lng } = await getLatAndLng(cityId);

    const apiKey = 'e713563e7e4944648844ea977a1f550d';
    const response = await axios.get(`https://api.ipgeolocation.io/astronomy?apiKey=${apiKey}&lat=${lat}&long=${lng}&formatted=0&date=${selectedDate.format('YYYY-MM-DD')}`);

    if (response.status === 200) {
      const data = response.data;
      const sunset = moment(data.sunset, 'HH:mm:ss'); // Parse the sunset time

      // Generate 7 Choghadiya slots starting from sunset time with 1-hour 29-minute duration
      const choghadiyaSlots = [];
      let currentTime = sunset.clone();
      const duration = moment.duration({ hours: 1, minutes: 30 });

      for (let i = 0; i < 7; i++) {
        const endTime = currentTime.clone().add(duration);

        choghadiyaSlots.push({
          start: currentTime.format('h:mmA'),
          end: endTime.format('h:mmA'),
        });

        currentTime = endTime;
      }

      // Calculate the next sunrise time (for the end time of the last slot)
      const nextSunrise = moment(data.sunrise, 'HH:mm:ss').add(1, 'day');

      // Set the end time of the last slot to the next day's sunrise time
      choghadiyaSlots.push({
        start: currentTime.format('h:mmA'),
        end: nextSunrise.format('h:mmA'),
      });

      return choghadiyaSlots;
    } else {
      console.error('API Request Failed:', response.status, response.statusText);
      throw new Error('Error fetching sunset time');
    }
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error('Error fetching night Choghadiya slots');
  }
}

exports.nightchoghadiya = async (req, res) => {
  try {
    // Pass the city ID and selected date to getNightChoghadiyaSlots function
    const { cityId, date } = req.query;
    
    if (!cityId || !date) {
      res.status(400).json({ error: 'City ID and date are required parameters' });
      return;
    }

    const selectedDate = moment(date, 'YYYY-MM-DD');
    const choghadiyaSlots = await getNightChoghadiyaSlots(cityId, selectedDate);

    res.json(choghadiyaSlots);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


















