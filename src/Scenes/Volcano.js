class Volcano extends Phaser.Scene {
    constructor() {
        super("volcano")
    }
    init() {
        this.timer = 0;
        this.ACCELERATION = 400;
        this.DRAG = 700;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -425;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2;
        this.maxvx = 300;
        this.maxvy = 1000;
        this.score = 0;
        this.boost = false;
        this.boostactive = false;
        this.jumps = false;
        this.checkpoint = { //30, 500
            x: 30,
            y: 500
        };
        this.cloud_counter = 0;
        this.cloud_velocity = 1.5;
    }
    preload() {
        this.load.image("volcanoBG", "assets/Volcano/images/Background.png");
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }
    create() {
        //Music
        if(!this.sound.get("volcano_noise"))
        {
            this.backGroundMusic = this.sound.add("volcano_noise", {loop: true, volume: 0.2});
            this.backGroundMusic.play();
        }
        
        //BG
        this.add.image(0, -800, "volcanoBG").setOrigin(0);
        this.add.image(3380, -800, "volcanoBG").setOrigin(0);
        
        
        //Map
        this.map = this.add.tilemap("volcano", 18, 18, 100, 20);
        
        this.i_tiles = this.map.addTilesetImage("I1", "industry_tiles");
        this.g_tiles = this.map.addTilesetImage("g1", "generated");
        this.spd_tiles = this.map.addTilesetImage("speedboost", "spd_tiles");
        
        this.lavaLayer = this.map.createLayer("Lava", this.g_tiles, 0, 0);
        this.groundLayer = this.map.createLayer("Ground", this.g_tiles, 0, 0);
        this.pLayer = this.map.createLayer("Passables", this.i_tiles, 0, 0);

        this.animatedTiles.init(this.map);

        
        //Collision Properties
        this.groundLayer.setCollisionByProperty({
            collides: true
        });


        //Player
        my.sprite.player = this.physics.add.sprite(30, 270, "frog-base", "idle");
        my.sprite.player.setCollideWorldBounds(false);
        my.sprite.player.setSize(18, 18).setOffset(1,1);
        cursors = this.input.keyboard.createCursorKeys();
        
        this.rKey = this.input.keyboard.addKey('R');
        this.zeroKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        

        //Movement vfx
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['flame_05.png', 'flame_06.png'],
            
            // TODO: Try: add random: true
            random: false, //Ranodmizes sprites shown
            scale: {start: 0.03, end: 0.2},
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 10, //Limits total particles
            lifespan: 200,
            // TODO: Try: gravityY: -400,
            gravityY: -500, //Makes float up
            alpha: {start: 1, end: 0.1}, 
            frequency: 100
        });
        my.vfx.walking.stop();


        //Power Up: Speed Boost
        this.powerups = this.map.createFromObjects("Collectibles", {
            name: "speedboost",
            key: "spd_sheet",
            frame: 0
        });
        this.anims.create({
            key: 'speedboost_anim', // Animation key
            frames: this.anims.generateFrameNumbers('spd_sheet', 
                {start: 0, end: 1}
            ),
            frameRate: 1,  // Higher is faster
            repeat: -1      // Loop the animation indefinitely
        });
        this.anims.play("speedboost_anim", this.powerups);
        this.physics.world.enable(this.powerups, Phaser.Physics.Arcade.STATIC_BODY);
        this.powerupGroup = this.add.group(this.powerups);


        //Speedboost vfx
        my.vfx.speedboost = this.add.particles(0, 0, "kenny-particles", {
            frame: ['light_02.png'],
            // TODO: Try: add random: true
            random: false, //Ranodmizes sprites shown
            scale: {start: 0.03, end: 0.2},
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 10, //Limits total particles
            lifespan: 100,
            // TODO: Try: gravityY: -400,
            gravityY: -500, //Makes float up
            alpha: {start: 1, end: 0.1}, 
            frequency: 100,
            repeat: 0
        });
        my.vfx.speedboost.stop();


        //Powerup collision
        this.physics.add.overlap(my.sprite.player, this.powerupGroup, (obj1, obj2) => { 
            obj2.destroy();
            this.boost = true;
        });
        

        //Death Clouds
        this.clouds = this.map.createFromObjects("Death Cloud", {
            name: "cloud",
            key: "industrial_sheet",
            frame: 42
        });
        this.physics.world.enable(this.clouds, Phaser.Physics.Arcade.STATIC_BODY);
        this.cloudGroup = this.add.group(this.clouds);
        for (let cloud of this.cloudGroup.getChildren()) {
            cloud.visible = false;
        }


        //Cloud Collision logic
        this.physics.add.overlap(my.sprite.player, this.cloudGroup, (obj1, obj2) => { 
            this.scene.restart();
        });


        //End
        this.end = this.map.createFromObjects("Collectibles", {
            name: "end",
            key: "industrial_sheet",
            frame: 73
        });
        this.physics.world.enable(this.end, Phaser.Physics.Arcade.STATIC_BODY);
        this.endGroup = this.add.group(this.end);


        //End Collision
        this.physics.add.overlap(my.sprite.player, this.endGroup, (obj1, obj2) => { 
            if(this.sound.get("volcano_noise"))
                    {
                        this.backGroundMusic.destroy();
                    }
                    this.scene.stop("volcano");
            this.scene.start("end");
        });

        //Straight to end
        this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        

        //Lava
        this.lava = this.map.createFromObjects("Death", {
            name: "lava",
            key: "generated_sheet",
            frame: 0
        });
        this.physics.world.enable(this.lava, Phaser.Physics.Arcade.STATIC_BODY);
        this.lavaGroup = this.add.group(this.lava);
        for (let lava of this.lavaGroup.getChildren()) {
            lava.visible = false;
        }


        //Lava Collision logic
        this.physics.add.overlap(my.sprite.player, this.lavaGroup, (obj1, obj2) => { 
            this.scene.restart();
        });


        // Camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        

        //Hitboxes
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);
        this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
    }   
    update() {
        //Cloud Movement pt1
        for (let cloud of this.cloudGroup.getChildren()) {
            cloud.x += this.cloud_velocity;
            cloud.body.updateFromGameObject(); // Synchronize the physics body
        }


        //Cloud movement pt2
        if (my.sprite.player.body.x >= 2160) {
            for (let cloud of this.cloudGroup.getChildren()) {
                this.cloud_velocity = 6;
            }
        }
        //Cloud Particle Counter
        this.cloud_counter ++;
        

        //Cloud Emmitter
        if (this.cloud_counter >= 10) {
            for (let cloud of this.cloudGroup.getChildren()) {
                this.dc(cloud.body);
            }
            
            this.cloud_counter = 0;
        }
        
        //Player Movement
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('hop', true);
            // Particle Following
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-5, my.sprite.player.displayHeight/2-2, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            
            my.vfx.speedboost.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-5, my.sprite.player.displayHeight/2-2, false);
            my.vfx.speedboost.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (this.boostactive) {my.vfx.speedboost.start();}
            else {my.vfx.speedboost.stop();}
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
                
            } else {
                my.vfx.walking.stop();
                my.vfx.speedboost.stop();
            }
        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('hop', true);
            // Particle Following
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-20, my.sprite.player.displayHeight/2-2, false);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            
            my.vfx.speedboost.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-20, my.sprite.player.displayHeight/2-2, false);
            my.vfx.speedboost.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            
            if (this.boostactive) {my.vfx.speedboost.start();}
            else {my.vfx.speedboost.stop();}
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
                
            } else {
                my.vfx.walking.stop();
                my.vfx.speedboost.stop();
            }
        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            //particle vfx stop
            my.vfx.walking.stop();
            my.vfx.speedboost.stop();
        }

        //Cap Player's Velocity
        let currentvx = my.sprite.player.body.velocity.x;    
        if (currentvx > this.maxvx) {
            my.sprite.player.setVelocityX(this.maxvx);
        } else if (currentvx < -this.maxvx) {
            my.sprite.player.setVelocityX(-this.maxvx);
        }
        let currentvy = my.sprite.player.body.velocity.y;
        if (currentvy > 1000) {
            my.sprite.player.setVelocityY(this.maxvy);
        } else if (currentvy < -this.maxvy) {
            my.sprite.player.setVelocityY(-this.maxvy);
        }
        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(my.sprite.player.body.blocked.down) { //Check if the player is touching the ground
            this.jumps = true; //If they have then "reset" their double jump
            if(Phaser.Input.Keyboard.JustDown(cursors.up)) { //Checks if the jump button, 
            // in this case "up" has been pressed
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY); //Makes the player "jump"
                this.jump(my.sprite.player.body); //This plays a jump particle (for juciness)
            }
        } else { //Checks if the player is not touching the ground
            my.sprite.player.anims.play('jump'); //Plays the player's jump animation when 
            // they are not touching the ground
            if(Phaser.Input.Keyboard.JustDown(cursors.up) && this.jumps == true) { //Checks if
                //the player has their double jump if they are not touching the ground and press "jump"
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY); //If so, jumps like above
                this.jumps = false; // "uses" the double jump
                this.double(my.sprite.player.body); //plays an alternate particle effect (more juice)
            }
        }
        //Could be altered so that the jump is an integer and the player could have multiple extra jumps

        //Player Boost
        if(Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.boost) {
            this.ACCELERATION *= 2;
            this.maxvx *= 2;
            this.boostactive = true;
        }
        if (Phaser.Input.Keyboard.JustUp(this.spaceKey) && this.boost) {
            this.ACCELERATION *= .5;
            this.boostactive = false;
            this.maxvx *= .5;
        }
        //Restarts
        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
        if (my.sprite.player.y > 400) {
            this.scene.restart();
        }
        if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
            if(this.sound.get("volcano_noise"))
                    {
                        this.backGroundMusic.destroy();
                    }
                    this.scene.stop("volcano");
            this.scene.start("end");
        }


        
    }
    jump(sprite) {
        this.add.particles(sprite.x+10, sprite.y+20, "kenny-particles", {
            frame: ['circle_02.png'],
            
            // TODO: Try: add random: true
            random: false, //Ranodmizes sprites shown
            scale: {start: 0.06, end: 0.12},
            rotaion: 0,
            scaleX: 2,
            scaleY: .5,
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 1, //Limits total particles
            lifespan: 1000,
            // TODO: Try: gravityY: -400,
            duration: 1000,
            gravityY: -10, //Makes float up
            alpha: {start: 1, end: 0.2}, 
            repeat:0
        });
    }
    double(sprite) {
        this.add.particles(sprite.x+10, sprite.y+20, "kenny-particles", {
            frame: ['slash_02.png'],
            
            // TODO: Try: add random: true
            random: false, //Ranodmizes sprites shown
            scale: {start: 0.06, end: 0.12},
            rotaion: 0,
            scaleX: .25,
            scaleY: .5,
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 1, //Limits total particles
            lifespan: 500,
            // TODO: Try: gravityY: -400,
            duration: 500,
            gravityY: 200, //Makes float up
            alpha: {start: 1, end: 0.2}, 
            repeat:0
        });
    }
    //DeathClouds vfx (place them 20px in front)
    dc(body) {
        const emitter = this.add.particles(body.x + 70, body.y, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_07.png', 'smoke_08.png', 'spark_01.png', 'spark_02.png'],
            // TODO: Try: add random: true
            random: true, //Ranodmizes sprites shown
            scale: {start: 0.03, end: 0.2},
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 10, //Limits total particles
            lifespan: 800,
            // TODO: Try: gravityY: -400,
            gravityY: 0, //Makes float up
            alpha: {start: 0.1, end: .5}, 
            frequency: 400,
            duration: 7000,
            blendMode: 'ADD',
            tint: 0xff0000,
            tintFill: true
        });
    }
}