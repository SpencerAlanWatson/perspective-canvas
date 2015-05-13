'use strict';
var express = require('express'),
	morgan = require('morgan'),
	app = express(),
	fs = require('fs'),
	index = fs.readFileSync('client/index.htm', {encoding: 'utf8'}),
	js = fs.readFileSync('client/build/perspective-canvas.min.js', {encoding: 'utf8'}),
	css = fs.readFileSync('client/css/bootstrap.min.css', {encoding: 'utf8'});

app.use(morgan('dev'));

/*app.get('/', function (req, res) {
	res.type('text/html').send(index);
});
app.get('/css', function (req, res) {
	res.type('text/css').send(css);
});
app.get('/js', function (req, res) {
	res.type('text/javascript').send(js);
});*/
app.use(express.static('client'));

app.listen(3000);
console.log('Server started on port 3000');