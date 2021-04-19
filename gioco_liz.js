var gioco_liz = (function(undefined) {
    var public = {};//sempre avere questa variabile all'inizio

    var img = {};
    var sound = {};
    var seicento;
    var courseMap = undefined;

    var vecchi;
    var cars;
    var houses;
    var explosions;
    var bullets;
    var gifts;
    var inventory;
    var thrownGifts;
    var pgDied = false;
    var seicentoLoaded = false;
    var giftPresets;
    var dontDraw;
    var slider = null;
    var onlyWinOnce = false;
    var timer;
    var vecchiSpawnTimer;
    var giftSpawnTimer;
    var timeLastDrawn;
    var stop;

    var FRICTION = 0.004;
    var ACCELERATION = 15;
    var GRAVITY = -0.2;
    var MAX_VECCHI = 6;
    var MAX_GIFTS = 5;
    var DIST_SPAWNING = 600;
    var VECCHI_DIST = 200;
    var CAR_EXP_LATENCY = 150;
    var EXP_LETAL_TIME = 800;
    var SQRT2 = Math.sqrt(2);
    var HOUSE_SPACING = 20;
    var TIME = 91;
    var VECCHI_TIME = 2000;
    var GIFT_TIME = 3500;

    var Car = function(x1, y1, x2, y2, r, texture){
        var Wheels = function(x, y, r){
            this.x = x;
            this.y = y;
            this.r = r;
            this.vx = 1;
            this.vy = 1;
            this.a = 0;
            this.angle = 0;

            this.isNearExplosion = function(){
                if(explosions.length === 0)return false;
                for(var i=0; i<explosions.length; i++){
                    if((sqrt(sq(explosions[i].x - this.x) + sq( explosions[i].y  - this.y)) < explosions[0].getDimension() * 0.5 + this.r )&&
                            explosions[i].getTime() >= 0 && explosions[i].getTime() <= EXP_LETAL_TIME){
                        return true;
                    }
                }
                return false;
            };

            this.calcPos = function(t, dir){
                var v = createVector(this.vx, this.vy);
                var dirA = p5.Vector.fromAngle(dir);
                dirA.rotate(this.angle);
                dirA.setMag(this.a);

                v.rotate(-dir);
                v.x *= pow(1 - FRICTION, 1/t);
                v.y *= pow(1 - 3.2*FRICTION, 1/t);
                v.rotate(dir);

                v.x += dirA.x * t;
                v.y += dirA.y * t;

                var pv = courseMap.bounce(this.x, this.y, this.r, v);

                v = pv.v;

                this.vx = v.x;
                this.vy = v.y;

                this.x += pv.p.x + this.vx * t;
                this.y += pv.p.y + this.vy * t;



            };
        };

        this.time = new Timer();
        this.front = new Wheels(x1, y1, r);
        this.back = new Wheels(x2, y2, r);
        this.length = dist(x1, y1, x2, y2);
        this.isExploding = false;
        this.isDead = false;
        this.texture = texture;
        this.r = r;

        this.getDir = function(){
            return atan2(this.front.y - this.back.y, this.front.x - this.back.x);
        };

        this.calcPos = function(){
            if(!this.isExploding){
                var t = this.time.getElapsedTime() / 100;
                this.time.resetTimer();

                var dir = atan2(this.front.y - this.back.y, this.front.x - this.back.x);

                this.back.calcPos(t, dir);
                this.front.calcPos(t, dir);

                var curLength = dist(this.front.x, this.front.y, this.back.x, this.back.y);
                var scaleFactor = this.length / curLength;

                this.back.vx += (this.front.x - this.back.x) * (1 - scaleFactor) / t;
                this.back.vy += (this.front.y - this.back.y) * (1 - scaleFactor) / t;

                this.back.x = this.front.x - (this.front.x - this.back.x) * scaleFactor;
                this.back.y = this.front.y - (this.front.y - this.back.y) * scaleFactor;
            }

        };

        this.isNearExplosion = function(){
            return (!this.isExploding) && ((this.front.isNearExplosion() || this.back.isNearExplosion()));
        };

        this.explode = function(f){
            this.isExploding = true;
            new Explosion((this.front.x + this.back.x)/2,
                    (this.front.y + this.back.y)/2, CAR_EXP_LATENCY);
            setTimeout(function(car){
                car.isDead = true;
            }, 324 + CAR_EXP_LATENCY, this);
            setTimeout(f, 1460 + CAR_EXP_LATENCY);
        };

        this.isOutOfBounds = function(){
            return (this.front.x < 0 || this.front.x > 1600) ||
                   (this.front.y < 0 || this.front.y > 900);
        };

        this.getRect = function(){
            var dir = atan2(this.front.y - this.back.y, this.front.x - this.back.x);

            var a = createVector(this.front.x + SQRT2*this.r*cos(dir-PI/4),
                this.front.y + SQRT2*this.r*sin(dir-PI/4));

            var b = createVector(this.front.x + SQRT2*this.r*cos(dir+PI/4),
                this.front.y + SQRT2*this.r*sin(dir+PI/4));

            var c = createVector(this.back.x + SQRT2*this.r*cos(dir-PI-PI/4),
                this.back.y + SQRT2*this.r*sin(dir-PI-PI/4));

            var d = createVector(this.back.x + SQRT2*this.r*cos(dir-PI+PI/4),
                this.back.y + SQRT2*this.r*sin(dir-PI+PI/4));


            var r = [a, b, c, d];
            return r;
        };

        this.isPointInRect = function(m){
            var subtract = function(a, b){
                return p5.Vector.sub(a, b);
            };
            var dotP = function(a, b){
                return p5.Vector.dot(a, b);
            };
            var r = this.getRect();
            var n1 = dotP(subtract(r[1], r[0]), subtract(m, r[0]));
            var n2 = dotP(subtract(r[1], r[0]),subtract(r[1], r[0]));
            var n3 = dotP(subtract(r[2], r[1]), subtract(m, r[1]));
            var n4 =dotP(subtract(r[2], r[1]),subtract(r[2], r[1]));
            return 0 <= n1 && n1 <= n2 && 0 <= n3 && n3 <= n4;
        };

        this.hasCollided = function(){
            if(this.isExploding) return false;
            var dir = atan2(this.front.y - this.back.y, this.front.x - this.back.x);

            for(var i=0; i<cars.length; i++){
                if(cars[i] !== this && !cars[i].isDead){
                    for(var j=0; j<4; j++){
                        if(this.isPointInRect(cars[i].getRect()[j])) return true;
                        if(cars[i].isPointInRect(this.getRect()[j])) return true;
                    }
                }
            }

            return false;
        };

        this.render = function(){
            if(!this.isDead){
                var angle = atan2(this.front.y - this.back.y, this.front.x - this.back.x);
                var middle = {x:(this.front.x - this.back.x)/2 + this.back.x,
                    y:(this.front.y - this.back.y)/2 + this.back.y};
                var width = this.texture.width;
                var height = this.texture.height;
                var ratio = height/width;
                width = this.length + this.r*2;
                height = width * ratio;
                push();
                    translate(middle.x, middle.y);
                    rotate(angle);
                    image(this.texture, -width/2, -height/2, width, height);
                pop();
            }
        };
    };

    var PgCar = function(x1, y1, x2, y2, r, texture){
        this.car = new Car(x1, y1, x2, y2, r, texture);
        this.time = new Timer();

        this._checkPressedKeys = function(){

            var ascii = function(c){return c.charCodeAt(0) - 32;};

            if(keyIsDown(ascii('s')) || keyIsDown(DOWN_ARROW)){
                this.car.front.a = -ACCELERATION*2/3;
            }
            else if(keyIsDown(ascii('w')) || keyIsDown(UP_ARROW)){
                this.car.front.a = ACCELERATION;
            }
            else{
                this.car.front.a = 0;
            }

            if( (    keyIsDown(ascii('a'))  || keyIsDown(LEFT_ARROW)      ) && !(keyIsDown(ascii('d')) || keyIsDown(RIGHT_ARROW)) ){  
                this.car.front.angle = -PI/3;
            }
            else if(keyIsDown(ascii('d')) || keyIsDown(RIGHT_ARROW)){
                this.car.front.angle = PI/3;
            }
            else{
                this.car.front.angle = 0;
            }
        };

        this._calcPos = function(){
            this._checkPressedKeys();
            this.car.calcPos();
        };

        this.render = function(){
            if(this.car.isOutOfBounds())finish(false);
            if(this.car.isNearExplosion() || this.car.hasCollided())
                this.car.explode(function(){pgDied = true;});
            this._calcPos();
            this.car.render();
        };
    };

    var NpcCar = function(x1, y1, x2, y2, r, texture){
        this.car = new Car(x1, y1, x2, y2, r, texture);
        this.time = new Timer();

        this._calculate = function(){

            var angle;
            var dir = atan2(this.car.front.y - this.car.back.y, this.car.front.x - this.car.back.x);
            var a;
            var x = this.car.front.x;
            var y = this.car.front.y;
            var r = this.car.r * 4;
            var distNextCar = undefined;
            var a0 = undefined;
            var p;
            for(a = dir - PI/2; a < dir + PI/2; a+=0.02){
                p = createVector(x+r*cos(a), y+r*sin(a));
                if(red(courseMap.getPixelRGB( p.x , p.y )) === 255 &&
                   blue(courseMap.getPixelRGB( p.x , p.y )) === 0 &&
                   green(courseMap.getPixelRGB( p.x , p.y )) === 0){
                   a0 = a;
                   break;
                }
            }

            for(var d = r/2.5; d < r*1.7; d+=r/3){
                var aperture = map(d, r/2.5, r*1.7, PI/2.5, PI/20);
                for(a = dir - aperture; a < dir + aperture; a+=0.2){
                    p = createVector(x+d*cos(a), y+d*sin(a));
                    for(var i=0; i<cars.length; i++){
                        if(cars[i] !== this && cars[i].isPointInRect(p)){
                            distNextCar = d;
                            break;
                        }
                    }
                    if(distNextCar !== undefined)break;
                }
                if(distNextCar !== undefined)break;
            }

            if(a0 === undefined)angle = undefined;
            else angle = a0 - dir;

            if(angle === undefined){
                this.car.front.a = -ACCELERATION/5;
                this.car.front.angle = PI/8;
            }
            else{

                this.car.front.a = ACCELERATION/5 * max(pow(abs(cos(angle)), 3),PI/10);
                this.car.front.angle = pow(abs(angle), 0.9) * Math.sign(angle);
                if(distNextCar !== undefined){
                    var v = createVector(this.car.front.vx, this.car.front.vy);
                    var bitDir = abs(p5.Vector.angleBetween(v,p5.Vector.fromAngle(this.car.getDir()))) < PI/2 ? 1 : -1;
                    this.car.front.a = map(distNextCar, r/2.5, r*1.7, -0.4, -0.1) * v.mag() * bitDir;
                    this.car.front.angle = 0;
                }
            }
        };

        this._calcPos = function(){
            this._calculate();
            this.car.calcPos();
        };

        this._killMe = function(){
            vecchi.splice(vecchi.indexOf(this), 1);
            cars.splice(cars.indexOf(this.car), 1);
        };

        this.render = function(){
            if(this.car.isOutOfBounds())this._killMe();
            var me = this;
            if(this.car.isNearExplosion() || this.car.hasCollided()){
                this.car.explode(function(){
                    me._killMe();
                });
            }this.car.render();
            this._calcPos();

        };
    };

    var Timer = function(){

        this.t0 = new Date().getTime();

        this.getElapsedTime = function(){
            return new Date().getTime() - this.t0;
        };

        this.resetTimer = function(){
            this.t0 = new Date().getTime();
        };
    };

    var Map = function(courseMap){

        this.courseMap = courseMap;
        this.graphicMap = createImage(this.courseMap.width, this.courseMap.height);
        this.graphicMap.loadPixels();
        this.courseMap.loadPixels();
        this.spawnPoints = [];
        this.NUM_SPAWN_POINTS = MAX_GIFTS;


        this.compColors = function(c, d){
            return red(c) === red(d) &&
                   green(c) === green(d) &&
                   blue(c) === blue(d);
        };

        this.getSpawnPoint = function(){
            var isUsed = function(p){
                for(var i=gifts.length-1; i>=0 ; i--){
                    if(gifts[i].p.x === p.x && gifts[i].p.y === p.y)return true;
                }
                return false;
            };

            var p;
            do{
                p = this.spawnPoints[floor(random() * this.spawnPoints.length)];
            }while(isUsed(p));
            return p;
        };

        this.getPixelRGB = function(x, y){
            var nx = x, ny = y;
            nx = map(nx, 0, 1600, 0, this.courseMap.width);
            ny = map(ny, 0, 900, 0, this.courseMap.height);
            nx = floor(nx);
            ny = floor(ny);
            var idx = 4 * (ny * this.courseMap.width + nx);
            var r = this.courseMap.pixels[idx];
            var g = this.courseMap.pixels[idx+1];
            var b = this.courseMap.pixels[idx+2];
            var a = this.courseMap.pixels[idx+3];
            return color(r, g, b, a);
        };

        img.grass.loadPixels();
        img.road.loadPixels();
        for(var x=0; x<this.graphicMap.width; x++){
            for(var y=0; y<this.graphicMap.height; y++){
                var idx = 4 * ((y) * this.graphicMap.width + (x));
                var i=x, j=y;
                i = map(i, 0, this.graphicMap.width, 0, 1600);
                j = map(j, 0, this.graphicMap.height, 0, 900);
                if(this.compColors(this.getPixelRGB(i, j), color("black")) || this.compColors(this.getPixelRGB(i, j), color(255,0,255))){
                    var idxGrass = 4 * ((y%img.grass.height) * img.grass.width + (x%img.grass.width));
                    this.graphicMap.pixels[idx] = img.grass.pixels[idxGrass];
                    this.graphicMap.pixels[idx+1] = img.grass.pixels[idxGrass+1];
                    this.graphicMap.pixels[idx+2] = img.grass.pixels[idxGrass+2];
                    this.graphicMap.pixels[idx+3] = img.grass.pixels[idxGrass+3];
                }
                if(this.compColors(this.getPixelRGB(i, j), color("red"))){
                    this.graphicMap.pixels[idx] = 255;
                    this.graphicMap.pixels[idx+1] = 255;
                    this.graphicMap.pixels[idx+2] = 255;
                    this.graphicMap.pixels[idx+3] = 255;
                }
                if(this.compColors(this.getPixelRGB(i, j), color("white"))){
                    var idxRoad = 4 * ((y%img.road.height) * img.road.width + (x%img.road.width));
                    this.graphicMap.pixels[idx] = img.road.pixels[idxRoad];
                    this.graphicMap.pixels[idx+1] = img.road.pixels[idxRoad+1];
                    this.graphicMap.pixels[idx+2] = img.road.pixels[idxRoad+2];
                    this.graphicMap.pixels[idx+3] = img.road.pixels[idxRoad+3];
                }
            }
        }
        this.graphicMap.updatePixels();
        img.grass.pixels = [];
        img.road.pixels = [];

        this.render = function(){
            image(this.graphicMap, 0, 0, 1600, 900);
        };

        this.isDistantFromGifts = function(x, y, d){
            for(var i=0; i<this.spawnPoints.length; i++){
                if(dist(this.spawnPoints[i].x, this.spawnPoints[i].y, x, y) < d)return false;
            }
            return true;
        };
        while(this.spawnPoints.length < this.NUM_SPAWN_POINTS){
            for(var y=0; y<900 && this.spawnPoints.length < this.NUM_SPAWN_POINTS; y+=5){
                for(var nx=(y%2===0?0:-1600); nx<(y%2===0?1600:0) && this.spawnPoints.length < this.NUM_SPAWN_POINTS; nx+=5){
                    var x = abs(nx);
                    if(this.compColors(this.getPixelRGB(x, y), color("red")) &&
                        this.isDistantFromGifts(x, y, 900/this.NUM_SPAWN_POINTS*2)){
                        this.spawnPoints.push({x:x, y:y});
                    }
                }
            }
        }

        this.findHouses = function(imgHouse){
            var comp = color('magenta');
            for(var x=0; x<1600; x+=HOUSE_SPACING){
                for(var y=0; y<900; y+=HOUSE_SPACING){
                    if(this.compColors(this.getPixelRGB(x, y), comp)){console.log(houses);
                        var alreadyExists = false;
                        for(var i=0;i<houses.length && !alreadyExists; i++){
                            alreadyExists = alreadyExists || dist(x+HOUSE_SPACING, y, houses[i].x, houses[i].y) < img.house.width;
                        }
                        if(!alreadyExists){
                            new House(x+HOUSE_SPACING, y, this.getPixelRGB(x+HOUSE_SPACING, y), imgHouse);
                            y+=HOUSE_SPACING*2;
                        }
                    }
                }
            }
        };

        this.bounce = function(x, y, r, v){
            var p1 = {}, p2 = {};
            var angle = 0;
            var precision = 0.2;
            var pv = {};
            var p = createVector(0,0);
            pv.p = p;

            pv.v = v;

            while(red(this.getPixelRGB( x+r*cos(angle) , y+r*sin(angle) ))< 255 && angle < 3*PI)angle+= precision;

            while(red(this.getPixelRGB( x+r*cos(angle) , y+r*sin(angle) )) > 0 && angle < 3*PI) angle+= precision;

            if(angle >= 3*PI)return pv;

            p1.x = x+r*cos(angle);
            p1.y = y+r*sin(angle);
            while( red(this.getPixelRGB( x+r*cos(angle) , y+r*sin(angle) )) < 255)angle += precision;
            angle -= precision;

            p2.x = x+r*cos(angle);
            p2.y = y+r*sin(angle);

            angle = atan2(p2.y - p1.y, p2.x - p1.x);
            if(isNaN(angle)) return v;
            fill(255,0,0);
            stroke(4);
            line(p1.x,p1.y,p2.x,p2.y);
            noStroke();
            v.rotate(-angle);
            v.y *= -0.3;
            v.rotate(angle);
            pv.v = v;

            var r1, r2, p, sqDist;
            sqDist = pow(p1.x - p2.x, 2) + pow(p1.y - p2.y, 2);
            r1 = createVector(x - p1.x, y - p1.y);
            r2 = createVector(x - p2.x, y - p2.y);
            p = p5.Vector.add(r1, r2);
            p.setMag(sqrt(r*r - sqDist/4) / 10);
            pv.p = p;

            return pv;
        };
    };

    var Explosion = function(x, y, t){
        this.DURATION = 1460;
        this.DIMENSION = 150;
        this.t = new Timer();
        this.t0 = t;
        this.x = x - this.DIMENSION/2;
        this.y = y - this.DIMENSION/2;
        sound.explosion.play();
        explosions.push(this);

        this.getTime = function(){
            return this.t.getElapsedTime() - this.t0;
        };

        this.getDuration = function(){
            return this.DURATION;
        };

        this.getDimension = function(){
            return this.DIMENSION;
        };

        this.render = function(){
            if(this.getTime() >= this.DURATION){
                explosions.splice(explosions.indexOf(this), 1);
                return -1;
            }

            if(this.getTime() > 0){
                var expSlot = floor(map(this.getTime(), 0, this.DURATION, 0, 80));
                var expX = expSlot%9;
                var expY = floor(expSlot/9);
                var slotDim = img.explosion.width/9;

                image(img.explosion, this.x, this.y, this.DIMENSION, this.DIMENSION,
                    expX*slotDim, expY*slotDim, slotDim, slotDim);
            }
            return 0;
        };
    };

    var Bullet = function(x, y, dir, spacing){
        this.x = x + cos(dir) * spacing;
        this.y = y + sin(dir) * spacing;
        this.dir = dir;
        this.VELOCITY = 2.5;
        this.ACCELERATION = 10;
        this.width = 50;
        this.height = this.width/img.bullet.width * img.bullet.height;
        this.vx = cos(dir) * this.VELOCITY;
        this.vy = sin(dir) * this.VELOCITY;
        this.hasCollided = false;
        this.isExploding = false;
        this.isDead = false;
        this.timer = new Timer();
        bullets.push(this);

        this._calcPos = function(){
            var t = this.timer.getElapsedTime();
            this.timer.resetTimer();
            this.x += this.vx * t;
            this.y += this.vy * t;
        };

        this._checkCollision = function(){
            var r = false;
            var whsq = sq(this.height) + sq(this.width);
            var angle = acos( (whsq/2 - sq(this.height)) *2/whsq)/2;
            var mod = this.width * 0.8 / 2;
            var p1 = createVector( this.x + mod * cos(dir),
                this.y + mod * sin(dir));
            var p2 = createVector( this.x + mod * cos(dir + angle),
                this.y + mod * sin(dir + angle));
            var p3 = createVector( this.x + mod * cos(dir - angle),
                this.y + mod * sin(dir - angle));
            if(angle === undefined){
                p2 = p1.copy();
                p3 = p1.copy();
            }
            r = red(courseMap.getPixelRGB( p1.x, p1.y)) < 255 || r;
            r = red(courseMap.getPixelRGB( p2.x, p2.y)) < 255 || r;
            r = red(courseMap.getPixelRGB( p3.x, p3.y)) < 255 || r;

            for(var i=0; i<cars.length; i++){
                r = cars[i].isPointInRect(p1) || r;
                r = cars[i].isPointInRect(p2) || r;
                r = cars[i].isPointInRect(p3) || r;
            }

            return r;

        };

        this._explode = function(){
            var me = this;
            this.isExploding = true;
            new Explosion(this.x, this.y, 0);

            setTimeout(function(bul){
                bul.isDead = true;
            }, 324, this);

            setTimeout(function(){
                bullets.splice(bullets.indexOf(me), 1);
            }, 1460);
        };

        this.render = function(){
            this.hasCollided = this.hasCollided || this._checkCollision();
            if(!this.hasCollided)this._calcPos();
            else if(!this.isExploding){
                this._explode();
            }
            if(!this.isDead){
                push();
                    translate(this.x, this.y);
                    rotate(dir);
                    image(img.bullet, -this.width/2, -this.height/2,
                        this.width, this.height);
                pop();
            }
        };
    };

    var House = function(x, y, c, housePixels){
        this.x = x;
        this.y = y;
        this.c = c;
        this.PROB = 0.007;
        this.supplied = false;
        this.img = createImage(housePixels.width, housePixels.height);
        houses.push(this);

        this._setImage = function(){
            this.img.loadPixels();
            for(var x=0; x<this.img.width; x++){
                for(var y=0; y<this.img.height; y++){
                    var nr, ng, nb, na;
                    var idx = 4 * ((y) * this.img.width + (x));
                    var r = housePixels.pixels[idx];
                    var g = housePixels.pixels[idx+1];
                    var b = housePixels.pixels[idx+2];
                    var a = housePixels.pixels[idx+3];

                    nr = red(this.c) * r / 255;
                    ng = green(this.c) * g / 255;
                    nb = blue(this.c) * b / 255;
                    na = a;

                    this.img.pixels[idx] = nr;
                    this.img.pixels[idx+1] = ng;
                    this.img.pixels[idx+2] = nb;
                    this.img.pixels[idx+3] = na;
                }
            }

            this.img.updatePixels();

            var giftImg = createImage(img.gift.width, img.gift.height);
            giftImg.loadPixels();

            if(img.gift.pixels.length === 0){
                img.gift.loadPixels();
            }

            for(var x=0; x<img.gift.width; x++){
                for(var y=0; y<img.gift.height; y++){
                    var nr, ng, nb, na;
                    var idx = 4 * ((y) * img.gift.width + (x));
                    var r = img.gift.pixels[idx];
                    var g = img.gift.pixels[idx+1];
                    var b = img.gift.pixels[idx+2];
                    var a = img.gift.pixels[idx+3];

                    nr = red(this.c) * r / 255;
                    ng = green(this.c) * g / 255;
                    nb = blue(this.c) * b / 255;
                    na = a;

                    giftImg.pixels[idx] = nr;
                    giftImg.pixels[idx+1] = ng;
                    giftImg.pixels[idx+2] = nb;
                    giftImg.pixels[idx+3] = na;
                }
            }

            giftImg.updatePixels();
            giftPresets.push({img:giftImg, c:this.c});

        };

        this._setImage();

        this._spawnGift = function(){
            var p = courseMap.getSpawnPoint();
            if(dist(p.x, p.y, seicento.car.front.x, seicento.car.front.y) > DIST_SPAWNING){
                new Gift(p, this.c);
                giftSpawnTimer.resetTimer();
            }
        };

        this.render = function(){
            let alreadySpawned = false;
            let differentColors = 0;
            let qualcosa = [];
            for(let i=0;i<gifts.length;i++){
                if(red(gifts[i].c) == red(this.c) && green(gifts[i].c) == green(this.c) && blue(gifts[i].c) == blue(this.c))
                    alreadySpawned = true;
                qualcosa.push(false);
            }
            for(let i=0;i<houses.length;i++){
                if(houses[i].supplied)differentColors++;
                else{
                    let exists = 0;
                    for(let j=0;j<gifts.length;j++){
                        if(!qualcosa[j] && (red(gifts[j].c) == red(houses[i].c) && green(gifts[j].c) == green(houses[i].c) && blue(gifts[j].c) == blue(houses[i].c))){
                            qualcosa[j] = true;
                            differentColors++;
                        }
                    }
                }
            }
                if(giftSpawnTimer.getElapsedTime() >= GIFT_TIME &&
                    random() < this.PROB &&
                    gifts.length < MAX_GIFTS &&
                    !this.supplied &&
                    (!alreadySpawned || differentColors >= 4)){
                this._spawnGift();
            }
            image(this.img, this.x-this.img.width/2, this.y-this.img.height/2,
                this.img.width, this.img.height);
            if(!this.supplied){
                image(img.alert, this.x+this.img.width*0.28, this.y-this.img.width*0.2,
                this.img.width/3, this.img.height/3);
            }
        };
    };

    var Gift = function(p, c){
        this.p = createVector(p.x, p.y);
        this.ps = [];
        this.c = c;
        this.image;

        gifts.push(this);

        this._getImage = function(){
            for(var i=0; i<giftPresets.length; i++){
                if(courseMap.compColors(giftPresets[i].c, this.c)){
                    this.ps.push(createVector(p.x - giftPresets[i].img.width/2, p.y - giftPresets[i].img.height/2));
                    this.ps.push(createVector(p.x + giftPresets[i].img.width/2, p.y - giftPresets[i].img.height/2));
                    this.ps.push(createVector(p.x - giftPresets[i].img.width/2, p.y + giftPresets[i].img.height/2));
                    this.ps.push(createVector(p.x + giftPresets[i].img.width/2, p.y + giftPresets[i].img.height/2));
                    return giftPresets[i].img;
                }
            }
            return undefined;
        };

        this.image = this._getImage();

        this.render = function(car){
            var isInRange = false;
            if(this.ps.length > 0){
                for(var i=0; i<4 && !isInRange; i++){
                    isInRange = car.car.isPointInRect(this.ps[i]);
                }
            }
            else{
                isInRange = car.car.isPointInRect(this.p);
            }
            if(inventory.isEmpty() && isInRange){
                inventory.pushGift(this);
            }
            else
                image(this.image, this.p.x-this.image.width/2, this.p.y-this.image.width/2,
                    this.image.width, this.image.width);
        };
    };

    var ThrownGift = function(gift, c, x, y, v, dir){
        this.gift = gift;
        this.c = c;
        this.x = x;
        this.y = y;
        this.z = 0;
        this.vx = v * cos(dir);
        this.vy = v * sin(dir);
        this.vz = v;
        this.TOLERANCE = 40;
        this.t = new Timer();
        thrownGifts.push(this);

        this._calcPos = function(time){
            this.x += this.vx * time;
            this.y += this.vy * time;
            this.vz += GRAVITY * time;
            this.z += this.vz * time;

            if(this.z < 0){
                thrownGifts.splice(thrownGifts.indexOf(this), 1);
                for(var i=0; i<houses.length; i++){
                    if(this.x >= houses[i].x - this.TOLERANCE &&
                       this.x <= houses[i].x + houses[i].img.width + this.TOLERANCE &&
                       this.y >= houses[i].y - this.TOLERANCE &&
                       this.y <= houses[i].y + houses[i].img.height + this.TOLERANCE &&
                       red(this.c) === red(houses[i].c) &&
                       green(this.c) === green(houses[i].c) &&
                       blue(this.c) === blue(houses[i].c)){

                       houses[i].supplied = true;
                       return;
                    }
                }
            }
        };

        this.render = function(){
            this._calcPos(this.t.getElapsedTime() / 10);
            this.t.resetTimer();
            push();
                translate (this.x, this.y);
                scale(this.z/100  + 1);
                image(this.gift, -this.gift.width/2, -this.gift.height/2,
                    this.gift.width, this.gift.height);
            pop();
        };

    };

    var Inventory = function(){
        this.gift = undefined;
        this.c;



        this.render = function(){
            fill(180);
            stroke(100);
            rect(1300, 10, img.gift.width + 10, img.gift.height + 10);
            if(this.gift !== undefined && this.gift !== null){
                image(this.gift, 1300 + 5, 10 + 5);
            }
        };

        this.pushGift = function(giftImg){
            gifts.splice(gifts.indexOf(giftImg), 1);
            this.c = giftImg.c;
            this.gift = giftImg.image;
            slider = new Slider();
        };

        this.popGift = function(x, y, v, dir){
            new ThrownGift(this.gift, this.c, x, y, v, dir);
            this.gift = undefined;
            slider = null;
        };

        this.isEmpty = function(){
            return this.gift === undefined;
        };
    };

    var Slider = function(){
        this.power = 0;
        this.t = new Timer();
        this.orientation = 1;
        this.maxTime = 800;
        this.stopCalc = false;
        this.FACTOR = 8;
        this.SPEED = 0.1;
        this.TRI_HEIGHT = 15;
        this.TRI_WIDTH = 30;

        this.render = function(){
            image(img.slider, 400, 900 - 30*1.5, 800, 30);

            var time = this.t.getElapsedTime();

            if(!this.stopCalc)
                this.power = (this.orientation === 1 ? time : (this.maxTime - time)) * this.SPEED;

            var x = 400 + this.power * this.FACTOR;
            if(x <= 400 || x >= 1200){
                this.orientation *= -1;
                this.maxTime = time;
                this.t.resetTimer();
            }

            stroke(0);
            line(x, 900 - 30*1.5, x, 900 - 30*0.5);
            noStroke();

            fill(255);
            triangle(x - this.TRI_WIDTH/2, 900 - 30*1.5 - this.TRI_HEIGHT,
                     x, 900 - 30*1.5,
                     x + this.TRI_WIDTH/2, 900 - 30*1.5 - this.TRI_HEIGHT);
        };

        this.getPower = function(){
            this.stopCalc = true;
            return this.power + 0.001;
        };
    };

    function addVecchio(){
        var yesWeCan = true;
        var p1 = createVector(1400-25, 550-25);
        var p2 = createVector(1400+25, 600+25);
        for(var i=0; i<cars.length; i++){
            if(dist(p1.x, p1.y, cars[i].front.x, cars[i].front.y) < VECCHI_DIST
                || dist(p2.x, p2.y, cars[i].front.x, cars[i].front.y) < VECCHI_DIST)yesWeCan = false;
        }
        if(yesWeCan){
            vecchiSpawnTimer.resetTimer();
            var v = new NpcCar(1400, 550, 1400, 600, 25, img.vecchio);
            vecchi.push(v);
            cars.push(v.car);
        }
    };

    public.constructor = function(){
    	stop = false;
        dontDraw = true;
        seicentoLoaded = false;
        explosions = [];
        cars = [];
        vecchi = [];
        bullets = [];
        gifts = [];
        thrownGifts = [];
        onlyWinOnce = false;
        slider = null;
        inventory = new Inventory();
        pgDied = false;
        if(courseMap === undefined){
            houses = [];
            giftPresets = [];
            img.house.loadPixels();
            courseMap = new Map(img.map);
            courseMap.findHouses(img.house);
        }
        for(var i=0; i<houses.length; i++){
            houses[i].supplied = false;
        }
        seicento = new PgCar(1400, 550, 1400, 614, 40, img.seicento);
        while(cars.indexOf(seicento.car) === -1){
            cars.push(seicento.car);
        }
        sound.theme.loop();
        timer = new Timer();
        giftSpawnTimer = new Timer();
        vecchiSpawnTimer = new Timer();
        timeLastDrawn = new Date().getTime();
        dontDraw = false;

    };

    function parseTime(num){
        var string = "";
        string += ""+floor(num/60);
        string += ":";
        string += "" + (floor(num)%60<10?"0":"") + floor(num)%60;
        return string;
    }

    public.draw = function(to_redraw) {
        sound.theme.setVolume(0.2);
        
        if(timeLastDrawn < new Date().getTime() - 2500)finish(false);
        timeLastDrawn = new Date().getTime();

        if(!dontDraw){
            background(0);
            fill(255);
            noStroke();

            if(!(seicentoLoaded || cars.indexOf(seicento.car) !== -1)){
                cars.push(seicento.car);
                seicentoLoaded = true;
            }

            if(pgDied){
                pgDied = false;
                finish(false);
            }

            if(vecchi.length < MAX_VECCHI && random() > 0.9 && vecchiSpawnTimer.getElapsedTime() >= VECCHI_TIME){
                addVecchio();
            }

            push();
                var trX = 0, trY =0;
                if(explosions.length > 0){
                    var t = explosions[0].getDuration();
                    for(var i=0; i<explosions.length; i++){
                        if(explosions[i].getTime() < t){
                             t = explosions[i].getTime();
                        }
                    }
                    var amp = map(t, 0,  explosions[0].getDuration(),
                            12, 4);
                    trX = random()*amp - amp/2;
                    trY = random()*amp - amp/2;
                    translate(trX, trY);
                }

                courseMap.render();

                for(var i=0; i<houses.length; i++){
                    houses[i].render();
                }



                for(var i=0; i<gifts.length; i++){
                    gifts[i].render(seicento);
                }

                seicento.render();
                for(var i=0; i<vecchi.length; i++){
                    vecchi[i].render();
                }



                push();
                    translate(-trX, -trY);
                    for(var i=0; i<bullets.length; i++){
                        bullets[i].render();
                    }

                    for(var i=0; i<thrownGifts.length; i++){
                        thrownGifts[i].render();
                    }

                    inventory.render();

                    if(slider !== null && slider !== undefined){
                        slider.render();
                    }
                    textSize(60);
                    textAlign(CENTER);
                    fill(240);
                    text(parseTime(TIME - timer.getElapsedTime()/1000), 800, 80);

                    if(TIME - timer.getElapsedTime()/1000 <= 0)finish(false);

                pop();

                for(var i=0; i<explosions.length; i++){
                    i += explosions[i].render();
                }

            pop();

            var pgHasLost = false;
            for(var i=0; i<houses.length; i++){
                pgHasLost = pgHasLost || !houses[i].supplied;
            }
            if(!pgHasLost && !onlyWinOnce){
                onlyWinOnce = true;
                finish(true);
            }
        }
    };

    function finish(victoryState){
    	if(!stop){
        	stop = true;
            let millisecondi =round((TIME - (timer.getElapsedTime()+0.1)/1000)*1000)%1000;
            if(victoryState)alert("GG, tempo rimanente: "+parseTime(TIME - timer.getElapsedTime()/1000)+'.'+millisecondi);
            sound.theme.stop();
            gameCompleted(victoryState);
        }
    };

    public.mousePressed = function() {
        var v = slider.getPower();
        var mx = resizedMouse().x;
        var my = resizedMouse().y;

        if(!inventory.isEmpty()){
            var dir = atan2(my-seicento.car.front.y, mx-seicento.car.front.x);
            inventory.popGift(seicento.car.front.x, seicento.car.front.y, sqrt(v) + 1, dir);
        }
    };

    public.keyPressed = function() {
        if(keyIsDown(SHIFT))
           new Bullet(seicento.car.front.x, seicento.car.front.y, seicento.car.getDir(), seicento.car.r + 20);
        else
        switch(key){
            case ' ':
                new Bullet(seicento.car.front.x, seicento.car.front.y, seicento.car.getDir(), seicento.car.r + 20);
            break;
        }
    };

    public.loadRes = function(){

        img.map = loadImage("pics/gioco_liz/map.png");
        img.seicento = loadImage("pics/gioco_liz/seicento.png");
        img.vecchio = loadImage("pics/gioco_liz/vecchio.png");
        img.house = loadImage("pics/gioco_liz/house.png");
        img.gift = loadImage("pics/gioco_liz/gift.png");

        img.explosion = loadImage("pics/gioco_tanga/explosion.png");
        img.bullet = loadImage("pics/gioco_liz/bullet.png");
        img.grass = loadImage("pics/gioco_liz/grass.png");
        img.road = loadImage("pics/gioco_liz/road.png");
        img.alert = loadImage("pics/gioco_liz/alert.png");
        img.slider = loadImage("pics/gioco_liz/power_slider.png");

        sound.theme = loadSound("audio/gioco_liz/tema.mp3");
        sound.explosion = loadSound("audio/gioco_tanga/explosion.mp3");
    };

    return public;//sempre ritornare public
})();
