(function(global, undefined) {
  var _socket;
  var _game = {started: false, gameName: null, playerName: null};
  var _sound, _soundLoaded = false;
  var $home, $potato, $status, $login, $start;
  var _autoPassTimeout = null, _restartTimeout = null;
  var _isIt = false;

  var hp = global.hp = {
    init: function() {
      initSound();

      // jquery caching
      $home = $('#home');
      $potato = $home.find('.potato')
      $login = $home.find('.login');
      $status = $home.find('.status').find('h2');
      $start = $home.find('.start');

      // loading animation
      startProgress();

      // attach gesture events
      $(document).hammer({drag_lock_to_axis: true}).on("release dragleft dragright swipeleft swiperight", onGesture);

      // socket handlers
      _socket = io.connect('#{site.url}');
      _socket.on('connect', onConnect);
      _socket.on('inProgress', onGameInProgress);
      _socket.on('starting', onGameStarting);
      _socket.on('started', onGameStarted);
      _socket.on('joined', onGameJoin);
      _socket.on('playerJoined', onPlayerJoined);
      _socket.on('enabled', onGameEnabled);
      _socket.on('resignation', onResignation);
      _socket.on('closed', onGameClosed);
      _socket.on('update', onUpdate);
      _socket.on('atPlayer', onAtPlayer);
      _socket.on('playerIsOut', onPlayerIsOut);
      _socket.on('youAreIt', imIt);
      _socket.on('youAreOut', imOut);
      _socket.on('winner', onWinner);
    },

    onStartClick: onStartClick
  };

  function initSound() {
    _sound = new Howl( {
      urls: ['../sound/sounds.mp3'],
      sprite : {
        join: [0, 1290],
        silence: [1290, 774],
        background: [2064, 23000],
        tick: [25151, 200]
      }
    });

    $(document).hammer().on('touch', function(event) {
      if (_sound._loaded && !_soundLoaded) {
        _sound.play('silence');
        _soundLoaded = true;
      }
    });
  }

  function startProgress() {
    if($("#progress").length === 0) {
      $("body").append($("<div><dt/><dd/></div>").attr("id", "progress"));
      $("#progress").width((50 + Math.random() * 30) + "%");
    }
  }

  function stopProgress(callback) {
    $("#progress").width("101%").delay(500).fadeOut(400, function() {
      $(this).remove();
      callback && callback();
    });
  }

  function onConnect() {
    stopProgress(function() {
      $status.text("Connected.").fadeOut(1000, function() {
        $login.fadeIn(100, function() {
          $potato.show();

          // on search submit
          $('#player-name').on('keypress', function(e) {
            var code = e.keyCode ? e.keyCode : e.which;
            if(code == 13) {
              onLogin();
            }
          });

          $('#game-name').focus();
        });
      });
    });
  }

  function onLogin() {
    var gameName = $('#game-name').val();
    var playerName = $('#player-name').val();

    if(gameName == '' || playerName == '') {
      $login.find('input').shake();
    }
    else {
      $('#player-name').blur();
      $login.hide();
      setStatus("Connecting...");
      _socket.emit('login', {game: $.trim(gameName).toLowerCase(), player: $.trim(playerName)});
    }
  }

  function onGameInProgress() {
    setStatus('Game Already Started.<span>Why not start your own?</span>');

    $status.fadeOut(5000, function() {
      $login.fadeIn();
    });
  }

  function onGameStarted(data) {
    _game.gameName = data.game;
    _game.playerName = data.player;

    setStatus('Game On!<span>Waiting for players to join...</span>');
    if(_sound._loaded) _sound.play('join');
  }

  function onGameJoin(data) {
    _game.gameName = data.game;
    _game.playerName = data.player;

    setStatus('Welcome!<span>You are player #' + data.count + '.<br/>Please wait for game to start...</span>');
    if(_sound._loaded) _sound.play('join');
  }

  function onPlayerJoined(data) {
    setStatus(data.message);
    if(_sound._loaded) _sound.play('join');
  }

  function onGameEnabled() {
    $start.show();
    $('#start-button').attr('href', 'javascript:hp.onStartClick()');
  }

  function onStartClick() {
    $('#start-button').attr('href', 'javascript:;');
    _socket.emit('starting', _game.gameName);

    setTimeout(function() {
      _game.started = true;
      _socket.emit('start', _game.gameName);
    }, 6000);
  }

  function onGameStarting() {
    $start.show();

    var $btn = $('#start-button');
    $btn.html('On Your Marks...');
    var startingIndex = 5;

    var countDown = setInterval(function() {
      startingIndex = startingIndex -1;
      if(_sound._loaded) _sound.play('tick');

      if(startingIndex == 4) {
        $btn.html('Get Set...');
      }
      else if(startingIndex == 0) {
        $btn.html('GO!');
        clearInterval(countDown);

        // animate logo out
        movePotato('left');
        if(_sound._loaded) _sound.play('background');

        setTimeout(function() {
          $start.hide();
        }, 1000);
      }
      else {
        $btn.html(startingIndex);
      }
    }, 1000);
  }

  function onAtPlayer(message) {
    setStatus(message);
    if(_sound._loaded) _sound.play('tick');
  }

  function onPlayerIsOut(message) {
    if(_sound._loaded) {
      _sound.stop();
      _sound.play('tick');
    }

    $potato.hide();
    setStatus(message);

    _restartTimeout = setTimeout(function() {
      if(_sound._loaded) {
        _sound.play('background');
      }
    }, 2000);
  }

  function onGameClosed() {
    _game = {started: false, gameName: null, playerName: null};
    setStatus('Game Closed!');
    if(_sound._loaded) _sound.stop();

    $potato.hide();
    $status.fadeOut(2000, function() {
      movePotato('home', function() {
        $login.fadeIn();
      });
    });
  }

  function onResignation(data) {
    setStatus(data.message);
  }

  function imIt() {
    _isIt = true;
    movePotato('home');

    setStatus('Quick! You\'re It!<span>Swipe left or right.</span>');

    // auto pass if player is asleep
    _autoPassTimeout = setTimeout(function() {
      movePotato('right', function() {
        _isIt = false;
        _socket.emit('pass', _game.gameName);
      });
    }, 5000);
  }

  function imOut() {
    clearTimeout(_autoPassTimeout);
    _game = {started: false, gameName: null, playerName: null};
    _isIt = false;

    if(_sound._loaded) {
      _sound.stop();
    }

    $potato.hide();
    setStatus('You\'re Out!');

    $status.fadeOut(5000, function() {
      movePotato('home', function() {
        $login.fadeIn();
      });
    });
  }

  function onGesture(ev) {
    ev.gesture.preventDefault();

    if(!_isIt) return;

    var direction = false;

    switch(ev.type) {
      case 'swipeleft':
        direction = 'left';
        break;

      case 'swiperight':
        direction = 'right';
        break;
    }

    if(direction) {
      ev.gesture.stopDetect();

      movePotato(direction, function() {
        _isIt = false;
        _socket.emit('pass', _game.gameName);
      });

      if(_autoPassTimeout) {
        clearTimeout(_autoPassTimeout);
      }
    }
  }

  function movePotato(direction, callback) {
    var left = '-5%';
    var scale = 0.1;

    switch(direction) {
      case 'right':
        left = '105%';
        break;

      case 'home':
        left = '50%';
        scale = 1;
        break;
    }

    $potato.show();

    TweenMax.to($potato, 1, {css: {left: left, scale: scale}, onComplete: function() {
      callback && callback();
    }});
  }

  function onWinner() {
    clearTimeout(_autoPassTimeout);
    clearTimeout(_restartTimeout);

    _game = {started: false, gameName: null, playerName: null};
    _isIt = false;

    if(_sound._loaded) {
      _sound.stop();
    }

    $potato.hide();
    setStatus('Congratulations!<span>Your are the Winner!</span>');
    $status.shake();

    $status.fadeOut(10000, function() {
      movePotato('home', function() {
        $login.fadeIn();
      });
    });
  }

  function onUpdate(data) {
    setStatus(data);
  }

  function setStatus(text) {
    $status.show().html(text);
  }

  // ready
  $(function() {hp.init();});

}(this));