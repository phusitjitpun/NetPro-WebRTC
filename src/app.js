let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let stream = require('./ws/stream');
let path = require('path');
let favicon = require('serve-favicon');
var mysql = require('mysql');
var session = require('express-session');
var bodyParser = require('body-parser');
const { disconnect } = require('process');
const { connect } = require('http2');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'accounts'
    
});

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.get('/index', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/auth', function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
            if (results.length > 0) {
               request.session.loggedin = true;
                request.session.username = username;
                response.redirect('/index');
            } else {
                response.send('Incorrect Username and/or Password!');
            }
            response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});


io.on('connection', (socket) =>{
    let user = {
        'username': 'user connected',
        'times': Date()
    }
    let sql = ' INSERT INTO historys SET ?'
    connection.query(sql, user)
    socket.on("disconnect", function(){
        let user = {
            'username': 'user disconnected',
            'times': Date()
        }
        let sql = ' INSERT INTO historys SET ?'
        connection.query(sql, user)
    });
     
});

io.of('/stream').on('connection', stream);

server.listen(3000, () => console.log(`Server running on port 3000`));