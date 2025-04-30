var createError = require('http-errors');
var express = require('express');
const userRouter = require('./src/routes/user.route');

var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// var indexRouter = require('./src/routes/index');

// Routes
// app.use('/', indexRouter);
app.use('/api/users', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.log('error handler', err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  const statusCode = err.statusCode || 500;

  // render the error page
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
