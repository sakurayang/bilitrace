const createError = require('http-errors');
const express = require('express');
const path = require('path');

const logger = require('morgan');

const index = require('./routes/index');
const add = require('./routes/add');
const remove = require('./routes/remove');
const show = require('./routes/show');
const get = require('./routes/get');
const update = require('./routes/update');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/add', add);
app.use('/remove', remove);
app.use('/show', show);
app.use('/get', get);
app.use('/update', update);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;