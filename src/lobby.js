import Phaser from 'phaser';
import { io } from 'socket.io-client';

import shipImg from './assets/ship.png';
import playerSprite from './assets/player.png';
import lobbyimg from './assets/new_lobby.png'
import {
  PLAYER_SPRITE_HEIGHT,
  PLAYER_SPRITE_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_START_X,
  PLAYER_START_Y,
} from './constants2';
import { movePlayer } from './movement2';
import { animateMovement } from './animation';
import MyGame from './index'

const player = {};
const otherPlayer = {};
let socket;
let pressedKeys = [];

export default class Lobby extends Phaser.Scene {
  constructor() {
    super("lobby");
  }

  preload() {
    socket = io('localhost:3000');
    this.load.image('lobby', lobbyimg);
    this.load.spritesheet('player', playerSprite, {
      frameWidth: PLAYER_SPRITE_WIDTH,
      frameHeight: PLAYER_SPRITE_HEIGHT,
    });
    this.load.spritesheet('otherPlayer', playerSprite, {
      frameWidth: PLAYER_SPRITE_WIDTH,
      frameHeight: PLAYER_SPRITE_HEIGHT,
    });
  }

  create() {
    this.socket = io();
    const lobby = this.add.image(20, 10, 'lobby');
    player.sprite = this.add.sprite(PLAYER_START_X, PLAYER_START_Y, 'player');
    player.sprite.displayHeight = PLAYER_HEIGHT;
    player.sprite.displayWidth = PLAYER_WIDTH;
    otherPlayer.sprite = this.add.sprite(
      PLAYER_START_X,
      PLAYER_START_Y,
      'otherPlayer',
    );
    otherPlayer.sprite.displayHeight = PLAYER_HEIGHT;
    otherPlayer.sprite.displayWidth = PLAYER_WIDTH;

    this.anims.create({
      key: 'running',
      frames: this.anims.generateFrameNumbers('player'),
      frameRate: 24,
      reapeat: -1,
    });

    this.input.keyboard.on('keydown', (e) => {
      if (!pressedKeys.includes(e.code)) {
        pressedKeys.push(e.code);
      }
    });
    this.input.keyboard.on('keyup', (e) => {
      pressedKeys = pressedKeys.filter((key) => key !== e.code);
    });

    socket.on('move', ({ x, y }) => {
      console.log('revieved move');
      if (otherPlayer.sprite.x > x) {
        otherPlayer.sprite.flipX = true;
      } else if (otherPlayer.sprite.x < x) {
        otherPlayer.sprite.flipX = false;
      }
      otherPlayer.sprite.x = x;
      otherPlayer.sprite.y = y;
      otherPlayer.moving = true;
    });
    socket.on('moveEnd', () => {
      console.log('revieved moveend');
      otherPlayer.moving = false;
    });
    var button = document.createElement("button");
    button.innerHTML = "Game";

    // 2. Append somewhere
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(button);

    // 3. Add event handler
    button.addEventListener ("click", function() {
      alert("did something");
      gotolobby();
    });
    const gotolobby = () => {
      this.scene.start('game')
    }
    
  }

  update() {
    this.scene.scene.cameras.main.centerOn(player.sprite.x, player.sprite.y);
    const playerMoved = movePlayer(pressedKeys, player.sprite);
    if (playerMoved) {
      socket.emit('move', { x: player.sprite.x, y: player.sprite.y });
      player.movedLastFrame = true;
    } else {
      if (player.movedLastFrame) {
        socket.emit('moveEnd');
      }
      player.movedLastFrame = false;
    }
    animateMovement(pressedKeys, player.sprite);
    // Aninamte other player
    if (otherPlayer.moving && !otherPlayer.sprite.anims.isPlaying) {
      otherPlayer.sprite.play('running');
    } else if (!otherPlayer.moving && otherPlayer.sprite.anims.isPlaying) {
      otherPlayer.sprite.stop('running');
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 450,
  scene: [Lobby,MyGame]
};

// export default Lobby
