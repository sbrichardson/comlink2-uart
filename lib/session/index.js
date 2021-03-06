
var chainsaw = require('chainsaw');
var commands = require('./commands');
var log = require('../log')('session');

function session (stick) {
  var my = {stick: stick};

  function empty_tap ( ) {
    log.info('tapped');
  }

  function api (saw) {

    commands.call(this, saw, my);
    stick.tap(log.info.bind(log, "REQUIRED TAP, reason init"));

    // do some arbitrary logic before continuing
    this.tap = function tap (cb) {
      saw.nest(cb);
    }

    this.sync = function sync (cb) {
      saw.nest(false, function ( ) {
        var next = saw.next;
        cb.call(this, next);
      });
    }


    /*
     * OPEN
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
              self.status(function (err, results) {
                log.info("FINISH SESSION INIT");
                saw.next( );
              });
        });
      });
      return this;
    }

    /*
     * END
     */
    function end ( ) {
      stick.close( );
      saw.next( );
    }
    this.end = end;

    /*
     * STATUS
     */
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

    /*
     * execute - Exchange one remote command.
     * Most of the work happens here.
     */
    function execute (command, cb) {
      log.info("BEGIN", "EXECUTE", command);
      stick.tap(log.info.bind(log, "REQUIRED TAP EXECUTE"));
      saw.nest(false, function ( ) {
        var next = saw.next;

        stick.tap(log.info.bind(log, "REQUIRED TAP EXECUTE"))
          // transmit command
          .transmit(command)
          // wait a while
          .sleep(command.effectTime)
          // download it
          .download(command)
          .tap(function ( ) {
            var result = command.response( );
            cb.call(this, result, command);
            log.info("REMOTE", result, command);
            next( );
          })
        ;
      });
    }
    this.exec = execute;

    // query - similar to execute, but this one sets the serial number
    this.query = function (command, cb) {
      saw.nest(function ( ) {
        log.info("MY SERIAL", my.serial, 'my', my);
        command.serial = my.serial;
        this.exec(command, function (err, response) {
          if (cb && cb.call) cb.apply(this, arguments);
        });
      });
    }

    // Perform some arbitrary logic until message to end.
    this.loop = function (cb) {
      var end = false;
      saw.nest(false, function loop ( ) {
        cb.call(this, function ( ) {
          end = true;
        });
        this.tap(function ( ) {
          if (end) saw.next( );
          else loop.call(this);
        });
      });
    };

    // set serial/address of remote pump to query
    this.serial = function (serial) {
      my.serial = serial ? serial : my.serial;
      saw.next( );
    }
  }

  return chainsaw(api);
}

session.commands = commands;
module.exports = session;
