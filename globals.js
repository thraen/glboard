window._N = 100

log = console.log

'use strict';

function createShader(gl, source, type) {
    var shader = gl.createShader(type);
    var ret = gl.shaderSource(shader, source.replace(/^\s+|\s+$/g, ''));
    var ret =  gl.compileShader(shader);
    return shader;
}

window.createProgram = function(gl, vertexShaderSource, fragmentShaderSource) {
    var program = gl.createProgram();
    var vshader = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    var fshader = createShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vshader);
    gl.deleteShader(vshader);
    gl.attachShader(program, fshader);
    gl.deleteShader(fshader);
    gl.linkProgram(program);

    var ret = gl.getProgramInfoLog(program);
    if (ret) log(ret);

    ret = gl.getShaderInfoLog(vshader);
    if (ret) log(ret);

    ret = gl.getShaderInfoLog(fshader);
    if (ret) log(ret);

    return program;
};

window.loadImage = function(url, onload) {
    var img = new Image();
    img.src = url;
    img.onload = function() {
        onload(img);
    };
    return img;
};

window.loadImages = function(urls, onload) {
    var imgs = [];
    var imgsToLoad = urls.length;

    function onImgLoad() {
        if (--imgsToLoad <= 0) {
            onload(imgs);
        }
    }

    for (var i = 0; i < imgsToLoad; ++i) {
        imgs.push(loadImage(urls[i], onImgLoad));
    }
};

window.loadObj = function(url, onload) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'text';
    xhr.onload = function(e) {
        var mesh = new OBJ.Mesh(this.response);
        onload(mesh);
    };
    xhr.send();
};
