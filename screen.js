var Point_of_scale = {x : 0.0, y : 0.0};
var Ratio_of_scale = {h : 1.0, w : 1.0};
var Aspect_ratio = {h : 900.0, w : 1600.0};
var Canvas_resized = false;

window.onresize = resizeCanvas;

function isFullScreen(){
    return (document.fullScreenElement && document.fullScreenElement !== null)
         || document.mozFullScreen
         || document.webkitIsFullScreen;
}


function requestFullScreen(element){
    if (element.requestFullscreen)
        element.requestFullscreen();
    else if (element.msRequestFullscreen)
        element.msRequestFullscreen();
    else if (element.mozRequestFullScreen)
        element.mozRequestFullScreen();
    else if (element.webkitRequestFullscreen)
        element.webkitRequestFullscreen();
}

function exitFullScreen(){
    
    if (document.exitFullscreen)
        document.exitFullscreen();
    else if (document.msExitFullscreen)
        document.msExitFullscreen();
    else if (document.mozCancelFullScreen)
        document.mozCancelFullScreen();
    else if (document.webkitExitFullscreen)
        document.webkitExitFullscreen();
    
    
}

function resizeCanvas(){
    
    if (isFullScreen()){
        canvas.resize(screen.width, screen.height);
        calcScaleAttr(screen.width, screen.height);

    }
    else{
        boddy = select('body');
        canvas.resize(window.innerWidth, window.innerHeight);
        calcScaleAttr(window.innerWidth, window.innerHeight);
    }
    
    Canvas_resized = true;
}


function toggleFullScreen(){
    if (isFullScreen())
        exitFullScreen();
    else
        requestFullScreen(document.documentElement);
}

function calcScaleAttr(w,h){
    if(w*1.0/h>Aspect_ratio.w/Aspect_ratio.h){
        Point_of_scale.y = 0.0;
        Point_of_scale.x = -(Aspect_ratio.w/Aspect_ratio.h*h - w)/2;
    }
    else{
        Point_of_scale.x = 0.0;
        Point_of_scale.y=-(Aspect_ratio.h/Aspect_ratio.w*w - h)/2;
    }
    Ratio_of_scale.h = (h-2*Point_of_scale.y)/Aspect_ratio.h;
    Ratio_of_scale.w = (w-2*Point_of_scale.x)/Aspect_ratio.w;
}

function getTranslation(){
    return Point_of_scale;
}

function getScale(){
    return Ratio_of_scale;
}

function resizedMouse(){
    return {x:(mouseX - Point_of_scale.x) / Ratio_of_scale.w, y:(mouseY - Point_of_scale.y) / Ratio_of_scale.h};
}