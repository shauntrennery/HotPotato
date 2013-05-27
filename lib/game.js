(function(module, require) {
  'use strict';

  var Util = require('util'),
    _ = require('lodash');

  var games = {};

  var game = {
    init: function(socket) {
      attachSocketHandlers(socket);
    },

    // called via /clear (by admin) to reset game state
    clear: function() {
      closeAllGames();
      games = {};
    }
  };

  function attachSocketHandlers(socket) {
    // player starts or joins a game
    socket.on('login', function(data) {
      if(_.has(games, data.game)) {
        joinGame(socket, data);
      }
      else {
        createGame(socket, data);
      }
    });

    // game owner click GO
    socket.on('starting', function(gameName) {
      emitToGame(gameName, 'starting');
    });

    // countdown is complete, start the game
    socket.on('start', function(gameName) {
      startGame(gameName);
    });

    // pass the hot potato
    socket.on('pass', function(gameName) {
      passPotato(gameName);
    });

    // player has disconnected
    socket.on('disconnect', function(data) {
      leaveGame(socket);
    });
  }

  function createGame(socket, data) {
    var gameName = data.game;
    var playerName = data.player;

    var game = {
      started: false,
      players: [{
        socket: socket,
        name: playerName,
        isFounder: true
      }]
    };

    games[gameName] = game;
    socket.emit('started', data);
  }

  function joinGame(socket, data) {
    var gameName = data.game;
    var playerName = data.player;
    var game = games[gameName];

    if(game.started) {
      socket.emit('inProgress', data);
    }
    else {
      playerName = parseName(game.players, playerName);

      game.players.push({
        socket: socket,
        name: playerName,
        isFounder: false
      });

      emitToGame(gameName, 'playerJoined', {message: playerName + ' has joined.<span>Total Players: ' + (game.players.length) + '</span>', playerCount: game.players.length});
      data.count = game.players.length;
      socket.emit('joined', data);

      enableGame(gameName);
    }
  }

  function leaveGame(socket) {
    var gameClosed = false;
    var pass = false;

    _.each(_.keys(games), function(gameName) {
      var game = games[gameName];

      var players = [];
      for(var i = 0; i < game.players.length; i++) {
        var player = game.players[i];

        if(!_.isEqual(player.socket, socket)) {
          players.push(player);
        }
        else {
          if(player.isFounder) {
            gameClosed = true;
            closeGame(gameName);
          }
          else {
            if(player.isIt) {
              pass = true;
            }

            emitToGame(gameName, 'resignation', {message: player.name + ' has left.<span>Total Players: ' + (game.players.length - 1) + '</span>', playerCount: game.players.length - 1});
          }
        }
      }

      if(!gameClosed) {
        game.players = players;

        // do we have a winner?
        checkGameState(gameName);

        // player left with the potato, pass to another
        if(pass) {
          passPotato(gameName);
        }
      }
    });
  }

  function enableGame(gameName) {
    var game = games[gameName];

    if(game && game.players) {
      if(game.players.length > 1) {
        for(var i = 0; i < game.players.length; i++) {
          var player = game.players[i];

          if(player.isFounder) {
            if(player.socket) player.socket.emit('enabled', gameName);
            break;
          }
        }
      }
    }
  }

  function startGame(gameName) {
    var game = games[gameName];

    game.started = true;
    var selectedPlayer = pickRandomPlayer(gameName);

    // set game stop
    game.timeOut = setTimeout(function() {
      stopGame(gameName);
    }, _.random(5, 20) * 1000);

    if(selectedPlayer) {
      game.selectedPlayer = selectedPlayer;

      if(selectedPlayer.socket) selectedPlayer.socket.emit('youAreIt');
      emitToGame(gameName, 'atPlayer', selectedPlayer.name.toUpperCase() + ' IS IT!', selectedPlayer.name);
    }
  }

  function stopGame(gameName) {
    var game = games[gameName];

    if(game && game.selectedPlayer) {
      if(game.selectedPlayer.socket) game.selectedPlayer.socket.emit('youAreOut');
      emitToGame(gameName, 'playerIsOut', game.selectedPlayer.name.toUpperCase() + ' IS OUT!', game.selectedPlayer.name);

      // remove player
      var players = [];
      for(var i = 0; i < game.players.length; i++) {
        var player = game.players[i];

        if(player.name != game.selectedPlayer.name) {
          players.push(player);
        }
      }

      game.players = players;

      setTimeout(function() {
        passPotato(gameName);

        // set next game stop
        game.timeOut = setTimeout(function() {
          stopGame(gameName);
        }, _.random(5, 20) * 1000);

      }, 2000);
    }
  }

  function passPotato(gameName) {
    var selectedPlayer = pickRandomPlayer(gameName);

    if(selectedPlayer) {
      var game = games[gameName];
      game.selectedPlayer = selectedPlayer;

      if(selectedPlayer.socket) selectedPlayer.socket.emit('youAreIt');
      emitToGame(gameName, 'atPlayer', selectedPlayer.name.toUpperCase() + ' IS IT!', selectedPlayer.name);
    }
  }

  function closeGame(gameName) {
    var game = games[gameName];

    if(game && game.timeOut) {
      clearTimeout(game.timeOut);
    }

    emitToGame(gameName, 'closed');
    games = _.omit(games, gameName);
  }

  function closeAllGames() {
    _.each(_.keys(games), function(key) {
      closeGame(key);
    });
  }

  function checkGameState(gameName) {
    var game = games[gameName];

    if(game.started) {
      if(game.players.length == 1) {
        var winner = game.players[0];

        if(winner && winner.socket) {
          winner.socket.emit('winner');
        }

        if(game.timeOut) {
          clearTimeout(game.timeOut);
        }

        // close game
        games = _.omit(games, gameName);
      }
      else if (game.players.length == 0) {
        closeGame(gameName);
      }
    }
  }

  function pickRandomPlayer(gameName) {
    var game = games[gameName];

    if(game && game.players && game.players.length && game.started) {
      if(game.players.length > 1) {
        var randomIndex = _.random(0, game.players.length - 1);
        var player = game.players[randomIndex];

        if(player.isIt) {
          // can't pass to oneself
          return pickRandomPlayer(gameName);
        }
        else {
          // clear previous isIt player
          for(var i = 0; i < game.players.length; i++) {
            if(game.players[i].isIt) {
              game.players[i].isIt = false;
              break;
            }
          }

          player.isIt = true;
          return player;
        }
      }
      else {
        checkGameState(gameName);
        return false;
      }
    }
    else {
      closeGame(gameName);
      return false;
    }
  }

  function parseName(players, playerName) {
    for(var i = 0; i < players.length; i++) {
      if(players[i].name == playerName) {
        if(playerName.indexOf('_') > -1) {
          var parts = playerName.split('_');
          var playerCount = parseInt(parts[1], 10);

          playerCount = (_.isNumber(playerCount) ? playerCount : 0) + 1;
          playerName = parts[0] + '_' + playerCount;
        }
        else {
          playerName = playerName + '_1';
        }

        return playerName;
      }
    }

    return playerName;
  }

  function emitToGame(gameName, key, value, except) {
    var game = games[gameName];

    if(game && game.players && game.players.length) {
      for(var i = 0; i < game.players.length; i++) {
        var player = game.players[i];

        if(player.name !== except) {
          if(player.socket) player.socket.emit(key, value);
        }
      }
    }
  }

  module.exports = game;

}(module, require));