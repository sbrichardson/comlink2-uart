
var chainsaw = require('chainsaw');
var commands = require('./commands');
var log = require('../log')('session');

function session (stick) {
  var my = {stick: stick};

  /*
  stick.tap ();
  */
  function empty_tap ( ) {
    log.info('tapped');
  }

  // stick.tap(log.info.bind(log, "REQUIRED TAP, reason ???"));
  function api (saw) {

    commands.call(this);
    stick.tap(log.info.bind(log, "REQUIRED TAP, reason init"));
    /*
    stick.tap(function ( ) {
      log.info('initial tap required for unknown reason');
    });
    */
    this.open = function begin ( ) {
      stick.tap(log.info.bind(log, "REQUIRED TAP, reason OPEN"))
        .open( )
        .tap(function ( ) {
          saw.nest(false, function ( ) {
            this.status(function (err, results) {
              log.info("FINISH SESSION INIT");
              saw.next( );
            });
          });
        });
      ;
      return;
      saw.nest(false, function ( ) {
      log.info("OPENING SESSION", my, this);
      var self = this;
        stick.open(function ( ) {
            // stick.poll_signal( );
            log.info('XXX', 'DEBUG', 'self', self, 'this', this);
            /*
            */
            this.stats(function (err, results) {
              log.info("FINISH SESSION INIT", results);
              my.stats = results;
              saw.next( );
            });
            return;
            var next = saw.next;
              self.status(function (err, results) {
                log.info("FINISH SESSION INIT");
                saw.next( );
                // next( );
              });
            // saw.next( );
        });
      });
      // stick.tap(function ( ) { });
      return this;
    }

    function end ( ) {
      stick.close( );
      saw.next( );
    }
    this.end = end;

    function status (cb) {
      log.info("GET STATUS");
      // stick.tap(log.info.bind(log, "REQUIRED TAP STATUS"));
      saw.nest(false, function ( ) {
        var next = saw.next;
        stick.tap(log.info.bind(log, "REQUIRED TAP STATUS"))
             .stats(function (err, results) {
          my.stats = results;
          if (cb) cb(err, my.stats);
        }).tap(function ( ) {
          log.info("FINISHING STATS");
          next( );
        });
      });

    }
    this.status = status;

    function execute (command, cb) {
      log.info("BEGIN", "EXECUTE", command);
      stick.tap(log.info.bind(log, "REQUIRED TAP EXECUTE"));
      saw.nest(false, function ( ) {
        var next = saw.next;
        // stick.tap(log.info.bind(log, "REQUIRED TAP EXECUTE"));

        stick.tap(log.info.bind(log, "REQUIRED TAP EXECUTE"))
             .transmit(command)
          .download(command)
          .tap(function ( ) {
            cb.call(this, command);
            log.info("REMOTE", command);
            next( );
          })
          ;
      });
    }
    this.exec = execute;

    this.query = function (command, cb) {
      saw.nest(function ( ) {
        log.info("MY SERIAL", my.serial, 'my', my);
        command.serial = my.serial;
        this.exec(command, function (err, response) {
          if (cb && cb.call) cb.apply(this, arguments);
        });
      });
    }
    /*
    function model (cb) {
      var self = this;
      saw.nest(function ( ) {
        var next = saw.next;
        this.exec(ReadPumpModel(my.serial), function (err, response) {
          log.info("FETCHED PUMP MODEL", arguments);
          if (cb && cb.call) cb.apply(this, arguments);
          // next( );
        });
      });
    }
    */
    // this.model = model;

    this.serial = function (serial) {
      my.serial = serial ? serial : my.serial;
      // this.emit('serial', my.serial);
      saw.next( );
    }

  }
  return chainsaw(api);
}

module.exports = session;