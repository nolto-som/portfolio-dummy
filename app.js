// app.js
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');


const app = express();
app.set('view engine', 'ejs');

app.use(express.static('public'));

const port = process.env.port || 1234

app.listen(port, () =>{
    console.log(`Server is Running on port ${port}`);
})

app.use(bodyParser.urlencoded({ extended: true }));
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const fs = require('fs');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/images';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const newImageName = req.body.newImageName || 'default-image-name';
        const extension = path.extname(file.originalname);
        cb(null, `${newImageName}${extension}`);
    }
});

const upload = multer({ storage: storage });

//connecting to database
const db = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    port: process.env.port,
    reconnect: true,
  connectTimeout: 10000, // Optional: 10-second timeout
})
db.connect((error) =>{
    if(error){
        console.log('Database is not Connected:', error.message)
        return
    }

    console.log('Database is Connected...')
})

function handleDisconnect() {
    connection.on('error', (err) => {
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection lost. Reconnecting...');
        // Recreate the connection
        handleDisconnect();
      } else {
        throw err;
      }
    });
  }
  
  // Initialize auto-reconnect
  handleDisconnect();

// Routes
// Home Route
app.get('/', (req, res) => {
    res.render('home'); // Renders the home 
});

// Projects Route
app.get('/projects', (req, res) => {
    const sql = "SELECT * FROM projects WHERE description NOT LIKE '%Lorem ipsum%'";
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('projects', { projects: results });
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

//

// View single Project
app.get('/project/:id', (req, res) => {
    const projectId = req.params.id;
    
    const query = 'SELECT * FROM projects WHERE id = ?';
    db.query(query, [projectId], (err, results) => {
        if (err) throw err;
        
        if (results.length > 0) {
            const project = results[0];
            res.render('project-detail', { project });
        } else {
            res.status(404).send('Project not found');
        }
    });
});

app.get('/add', (req, res) => {
    res.render('addProject');
});

// Handle project form submission with image upload
app.post('/add', upload.single('image'), (req, res) => {
    const { title, description, link } = req.body;
    const imagePath = req.file ? `${req.file.filename}` : null;

    // SQL to insert the new project
    const sql = 'INSERT INTO projects (title, description, link, image) VALUES (?, ?, ?, ?)';
    db.query(sql, [title, description, link, imagePath], (err) => {
        if (err) throw err;
        res.redirect('/projects'); // Redirect after successful insert
    });
});

// Route to display the edit form
app.get('/project/:id/edit', (req, res) => {
    const projectId = req.params.id;
    const query = 'SELECT * FROM projects WHERE id = ?';

    db.query(query, [projectId], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            res.render('edit-project', { project: results[0] });
        } else {
            res.status(404).send('Project not found');
        }
    });
});

// Route to update the project in the database
app.post('/project/:id/edit', (req, res) => {
    const projectId = req.params.id;
    const { title, description, link, image } = req.body;
    const query = 'UPDATE projects SET title = ?, description = ?, link = ?, image = ? WHERE id = ?';

    db.query(query, [title, description, link, image, projectId], (err, result) => {
        if (err) throw err;
        res.redirect(`/project/${projectId}`);
    });
});

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Route to delete a project
app.delete('/project/:id', (req, res) => {
    const projectId = req.params.id;
    const query = 'DELETE FROM projects WHERE id = ?';

    db.query(query, [projectId], (err, result) => {
        if (err) throw err;
        res.redirect('/projects');
    });
});



