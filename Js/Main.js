function HostGame(){
  let username = $('#usernameInput').val();
  let game_code = $('#gamecodeInput').val();

  if(username !== ''){
    $('#usernameInput').css({borderColor: ''});
    GetToken(username, game_code);
  } else {
    $('#usernameInput').css({borderColor: 'red'});
  }
}

function JoinGame(){
  let username = $('#usernameInput').val();
  let game_code = $('#gamecodeInput').val();

  if(username !== '' && game_code !== ''){
    $('#usernameInput').css({borderColor: ''});
    $('#gamecodeInput').css({borderColor: ''});

    GetToken(username, game_code);
  } else {
    if(username === ''){
      $('#usernameInput').css({borderColor: 'red'});
    }
    if(game_code === ''){
      $('#gamecodeInput').css({borderColor: 'red'});
    }
  }
}

function GetToken(username, game_code){
  $.ajax({
    url: `http://145.220.75.122/${game_code ? 'join-game' : 'host-game'}`,
    data: JSON.stringify({ username, game_code }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    success: (data) => {
      console.log(`${game_code ? 'join-game' : 'host-game'}`);
      ConnectToSocket(data.token);
    },
    error: (errMsg) => {
      console.log(errMsg);
    }
  });
}

function ReadyLobby(){
  if(!$('input.Active').prop('checked')){
    PlayerReady(true);
  } else {
    PlayerReady(false);
  }
}

function ReadyShips(){
  if($('input.Active').prop('checked') == false){
    ConfirmLayout([
      { "x": 0, "y": 0, "type": 0, "horizontal": true },
      { "x": 3, "y": 0, "type": 0, "horizontal": true },
      { "x": 6, "y": 0, "type": 0, "horizontal": true },
      { "x": 8, "y": 2, "type": 0, "horizontal": true },
      { "x": 0, "y": 2, "type": 1, "horizontal": true },
      { "x": 4, "y": 2, "type": 1, "horizontal": true },
      { "x": 0, "y": 4, "type": 1, "horizontal": true },
      { "x": 4, "y": 4, "type": 2, "horizontal": true },
      { "x": 0, "y": 6, "type": 2, "horizontal": true },
      { "x": 5, "y": 6, "type": 3, "horizontal": true }
    ]
    );
  }
  else{
    UnlockLayout();
  }
}

