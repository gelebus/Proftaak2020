const socket = io('ws://localhost:3000');
//const socket = io('ws://145.220.75.122');

const GAME_STATE_LOBBY = 'lobby'
const GAME_STATE_NONE = 'none'
const GAME_STATE_SETUP = 'setup'
const GAME_STATE_ACTION = 'action'
const GAME_STATE_CONCLUDED = 'concluded'

let GameState = GAME_STATE_NONE;
let Players = [{playerName: 'Free slot',readyForAction: false,shipLayout: null},
              {playerName: 'Free slot',readyForAction: false,shipLayout: null},
              {playerName: 'Free slot',readyForAction: false,shipLayout: null},
              {playerName: 'Free slot',readyForAction: false,shipLayout: null}];
let AmountPlayers = 0;
let ActivePlayerID;

///////////////////////////////////////////////////////////
// Host or Join the lobby /////////////////////////////////
///////////////////////////////////////////////////////////

function ConnectToSocket(token) {
  socket.emit('token', token);
}

socket.on('player_joined', response => {
  Players[response.index].playerName = response.name;
  AmountPlayers++;
  $(`#Player${response.index + 1}`).text(response.name);
});

socket.on('game_info', response =>{
  GameState = GAME_STATE_LOBBY;

  $('body').load('Lobby.html', ()=>{
    history.pushState('data', `Battleships - ${GameState}`, 'Lobby');
    document.title = `Battleships - ${GameState}`;

    $('span#LobbyId').text(response.game_code);

    AmountPlayers = response.players.length;
    ActivePlayerID = response.self_index;

    $(`#Player${ActivePlayerID + 1}`).addClass('Active');
    $(`#CheckBoxPlayer${ActivePlayerID + 1}`).addClass('Active');

    for (let index = 0; index < response.players.length; index++) {
      Players[index].playerName = response.players[index].name;
      $(`#Player${index + 1}`).text(response.players[index].name);
      $(`#CheckBoxPlayer${index + 1}`).prop('checked', response.players[index].ready);
    }
  });
});

///////////////////////////////////////////////////////////
// Makes player ready -> Lobby, PlaceBoats ////////////////
///////////////////////////////////////////////////////////

function PlayerReady(data){
  socket.emit('ready', {ready: data});
}

socket.on('player_ready', response => {
  switch (GameState) {
    case GAME_STATE_LOBBY:
      $(`#CheckBoxPlayer${response.index + 1}`).prop('checked', response.ready);
      break;
    case GAME_STATE_SETUP:
      Players[response.index].readyForAction = response.ready;
  
      let count = parseInt($(`#PlayersReady #count`).text());
      let newCount = Players[response.index].readyForAction == true ? count + 1 : count - 1;

      $(`#PlayersReady #count`).text(newCount);
      break;
    default:
      break;
  }
});

///////////////////////////////////////////////////////////
// Removes player info -> Lobby, PlaceBoats, ActionPhase //
///////////////////////////////////////////////////////////

socket.on('player_disconnected', response => {
  Players[response.index].playerName = 'Free slot';
  Players[response.index].readyForAction = false;
  AmountPlayers--;

  switch (GameState) {
    case GAME_STATE_LOBBY:
      $(`#Player${response.index + 1}`).text('Free slot');
      $(`#CheckBoxPlayer${response.index + 1}`).prop('checked', false);
      break;
    case GAME_STATE_SETUP:
      break;
    default:
      break;
  }
});

///////////////////////////////////////////////////////////
// Active while in Lobby //////////////////////////////////
///////////////////////////////////////////////////////////

socket.on('game_starting', response => {
  StartTimer(response.start_at);
});

socket.on('cancel_game_start', () => { 
  StopTimer();
});

socket.on('game_start', () => {
  StopTimer();
  GameState = GAME_STATE_SETUP;

  $('body').load('PlaceBoats.html', () => {
    history.pushState('data', `Battleships - ${GameState}`, 'Game');
    document.title = `Battleships - ${GameState}`;

    $('#PlayerName').text(Players[ActivePlayerID].playerName);
    $('#PlayersReady #amount').text(AmountPlayers);
  });
});

///////////////////////////////////////////////////////////
// Active while in PlaceBoats /////////////////////////////
///////////////////////////////////////////////////////////

function ConfirmLayout(data){
  data = [{ "x": 0, "y": 0, "type": 0, "horizontal": true },
          { "x": 3, "y": 0, "type": 0, "horizontal": true },
          { "x": 6, "y": 0, "type": 0, "horizontal": true },
          { "x": 8, "y": 2, "type": 0, "horizontal": true },
          { "x": 0, "y": 2, "type": 1, "horizontal": true },
          { "x": 4, "y": 2, "type": 1, "horizontal": true },
          { "x": 0, "y": 4, "type": 1, "horizontal": true },
          { "x": 4, "y": 4, "type": 2, "horizontal": true },
          { "x": 0, "y": 6, "type": 2, "horizontal": true },
          { "x": 5, "y": 6, "type": 3, "horizontal": true }];
  
  socket.emit('confirm_layout', data);
  Players[ActivePlayerID].shipLayout = data;
}

function UnlockLayout(){
  socket.emit('unlock_layout');
  Players[ActivePlayerID].shipLayout = null;
}

socket.on('invalid_layout', () => {
  alert('INVALID LAYOUT');
});

socket.on('action_phase_starting', response => {
  StartTimer(response.start_at);
});

socket.on('cancel_action_phase_start', () => {
  StopTimer();
});

socket.on('action_phase_start', () => {
  StopTimer();
  GameState = GAME_STATE_ACTION;

  $('body').load('ActionPhase.html', () => {
    history.pushState('data', `Battleships - ${GameState}`, 'Game');
    document.title = `Battleships - ${GameState}`;

    $('#PlayerName').text(Players[ActivePlayerID].playerName);

    AddLayoutToGrid('PlayerGrid', Players[ActivePlayerID].shipLayout);

    Players.forEach((e,i) => {
      if(i != ActivePlayerID && e.playerName != 'Free slot'){
        let anchorElement = document.createElement('a');
        anchorElement.setAttribute('opponent-id',i);
        anchorElement.innerText = e.playerName;
        anchorElement.addEventListener('click', SelectPlayer);
        document.getElementById('OpponentList').append(anchorElement);
      }
    });
  });
});

///////////////////////////////////////////////////////////
// Active while in ActionPhase ////////////////////////////
///////////////////////////////////////////////////////////
socket.on('player_eliminated', response => {
  console.log("Player Eliminated: " + response.index);
});

socket.on('player_turn', response => {
  console.log("Player Turn: " + response.index);
});

socket.on('ship_hit', response => {
  console.log("Ship hit: " + response.target_index);
  console.log(response);
  console.log("");
});

socket.on('shot_missed', response => {
  console.log("Shot missed: " + response.target_index);
  console.log(response);
  console.log("");
});

socket.on('invalid_coordinates', response => {
  console.log("Error: Invalid Coordinates");
});

socket.on('invalid_target', response => {
  console.log("Error: Invalid Target");
});

function Shoot(){
  let enemyContainer = document.getElementById('EnemyName');
  let enemyId = enemyContainer.getAttribute('opponent-id');

  let selectedCellId = document.getElementsByClassName('grid-btn cell-selected')[0].id; 
  let cellPosX = parseInt(selectedCellId.split('_')[2]) - 1;
  let cellPosY = parseInt(selectedCellId.split('_')[1]) - 1;

  let data = { "target_index": enemyId,
                "x": cellPosX,
                "y": cellPosY
              };
  socket.emit('shoot', data);
}
///////////////////////////////////////////////////////////
// Will Activate When Game is over/////////////////////////
///////////////////////////////////////////////////////////
socket.on('game_concluded', response => {
  GameState = GAME_STATE_CONCLUDED;
  console.log("Winner Index: " + response.winner_index);
  $('body').load('GameOver.html', () => {
    history.pushState('data', `Battleships - ${GameState}`, 'Game');
    document.title = `Battleships - ${GameState}`;
    if(ActivePlayerID == response.winner_index)
    {
      document.getElementById('VictoryTitle').style.display = 'block';
      document.getElementById('VictoryName').innerText = Players[ActivePlayerID].playerName;
      document.getElementById('VictoryText').style.display = 'block';      
    }
    else
    {
      document.getElementById('DefeatTitle').style.display = 'block';
      document.getElementById('DefeatName').innerText = Players[ActivePlayerID].playerName;
      document.getElementById('DefeatText').style.display = 'block';
    }
  });
});
