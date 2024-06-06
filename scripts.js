//         °.° 
//         https://www.geeks3d.com/20110405/fxaa-fast-approximate-anti-aliasing-demo-glsl-opengl-test-radeon-geforce/

let log = console.log
let sin = Math.sin
let cos = Math.sin
let ssin = x => 0.5*sin(x) + 0.5

// var canvas = document.createElement('canvas');
var canvas = document.getElementById('canvas');
// const size = Math.max(window.innerWidth, window.innerHeight)
// canvas.width = size;
// canvas.height = size;
canvas.width = 3000;
canvas.height = 3000;
document.body.appendChild(canvas);

//bla

var gl = canvas.getContext('webgl2', { 
                                       preserveDrawingBuffer: true,
  antialias: false , 
                                       desynchronized: true });
var isWebGL2 = !!gl;

if(!isWebGL2) {
    document.getElementById('info').innerHTML = 'WebGL 2 is not available.  See <a href="https://www.khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">How to get a WebGL 2 implementation</a>';
}


function make_Ms(poses, scale) {
    n = poses.length

//     let transforms = new Float32Array(16*2*poses.length)

    // scale
    const s = scale
    tmpMs = []
    for (let p of poses) {
        let M = [
             s  ,  0.0 ,  0.0,  0.0,
            0.0 ,   s  ,  0.0,  0.0,
            0.0 ,  0.0 ,  1.0,  0.0,
            p[0],  p[1],  0.0,  1.0 
        ]

        tmpMs.push(M)
    }
//     log(tmpMs)
    return new Float32Array(tmpMs.flat())
}

// -- Init program
// log(vert)
// log(frag)

gl.enable(gl.BLEND);
gl.blendEquation(gl.MAX);
// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
// gl.blendFunc(gl.ZERO, gl.ONE);
// gl.blendFunc(gl.SRC_ALPHA, gl.ZERO);
// gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
// gl.blendFunc(gl.ONE, gl.ONE);

var program = createProgram(gl, vert, frag);

var after_program = createProgram(gl, fixvert, afterfrag);
var usampler_location = gl.getUniformLocation(after_program, "uSampler")

var vertexPosBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);

var vertices = new Float32Array([
   -1.0, -1.0 ,
    1.0, -1.0 ,
   -1.0,  1.0 ,
   -1.0,  1.0 ,
    1.0, -1.0 ,
    1.0,  1.0 ,
]);

gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

var uniformTransformLocation = gl.getUniformBlockIndex(program, 'Transform');
var uniformMaterialLocation  = gl.getUniformBlockIndex(program, 'Material');

gl.uniformBlockBinding(program, uniformTransformLocation, 0);
gl.uniformBlockBinding(program, uniformMaterialLocation, 1);

var uniformTransformBuffer = gl.createBuffer();
var uniformMaterialBuffer  = gl.createBuffer();


const render_texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, render_texture);
 
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
              canvas.width, canvas.height, 0,
              gl.RGBA, gl.UNSIGNED_BYTE, null);
 
// set the filtering so we don't need mips
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.bindTexture(gl.TEXTURE_2D, null);


const fb_render = gl.createFramebuffer();
const fb_color  = gl.createFramebuffer();

const rb_color = gl.createRenderbuffer();

gl.bindRenderbuffer(gl.RENDERBUFFER, rb_color);
gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 4, 
                                  gl.RGBA8, // fuck
                                  canvas.width, canvas.height);

gl.bindFramebuffer(gl.FRAMEBUFFER, fb_render)
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, rb_color)
gl.bindFramebuffer(gl.FRAMEBUFFER, null)

gl.bindFramebuffer(gl.FRAMEBUFFER, fb_color)
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, render_texture, 0)
gl.bindFramebuffer(gl.FRAMEBUFFER, null)

// gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
// gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, render_texture, 0);

function make_materials(n) {
    tmp = []
    let milli = Date.now() / 1000
    for (i=0; i<n; i++) {
        tmp.push( [1-(i/n), ssin(milli) , (i /n), 1.0] )
    }
    return new Float32Array(tmp.flat())
}

var vertexPosLocation = 0; // set with GLSL layout qualifier
gl.enableVertexAttribArray(vertexPosLocation);
gl.vertexAttribPointer(vertexPosLocation, 2, gl.FLOAT, false, 0, 0);

function render_line(transforms, materials, n) {

    // -- Render
//     gl.clearColor(0,1,1,1);
//     gl.clear(gl.COLOR_BUFFER_BIT);


    gl.bindBuffer(gl.UNIFORM_BUFFER, uniformTransformBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, transforms, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

//     log('materials', materials)
    gl.bindBuffer(gl.UNIFORM_BUFFER, uniformMaterialBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, materials, gl.STATIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uniformTransformBuffer);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, uniformMaterialBuffer);

    // first render pass 
//     gl.bindFramebuffer(gl.FRAMEBUFFER, fb_render);
//     gl.bindFramebuffer(gl.FRAMEBUFFER, fb_color);
    gl.useProgram(program);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, n);

  /*
    // Blit framebuffers before second pass
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fb_render)
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fb_color)
    gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 1.0]) //fuck?
    gl.blitFramebuffer(
        0, 0, canvas.width, canvas.height,
        0, 0, canvas.width, canvas.height,
        gl.COLOR_BUFFER_BIT, gl.NEAREST // ?fuck
    );

    // second pass
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(after_program);
  
    gl.uniform1i(usampler_location, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, render_texture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindTexture(gl.TEXTURE_2D, null);
    */

}


function glkoord(winx, winy) {
//     w = canvas.clientWidth
//     h = canvas.clientHeight
    wh = 0.5*canvas.clientWidth
    hh = 0.5*canvas.clientHeight
    return [ (winx - wh) / wh, (hh-winy) / hh ]
}

let drawing = []
// let lastp = [0, 0]

function on_pointerdown(e) {
    e.preventDefault();
    lastp = glkoord( e.offsetX, e.offsetY )
    drawing = [lastp]
    log('pointerdown', lastp)
}

function on_pointerup(e) {
    e.preventDefault();
    drawing = []
}

function on_pointermove(e) {
    e.preventDefault();
    if (drawing.length == 0) return;

    const lastp = drawing[drawing.length-1]

    const p = glkoord( e.offsetX, e.offsetY)
    drawing.push(p)
//     var poses

    if (drawing.length >= 4) {
//         const tail = drawing.splice(-4)
        
        /// L -- A -- B -- N

//         /// tangentenpunkte an A
        const L = drawing[drawing.length-1]
        const A = drawing[drawing.length-2]
        const B = drawing[drawing.length-3]
        const N = drawing[drawing.length-4]

        /// Tb ist der Tangentenpunkt vom letzten B
//         Ta = mirror(A, Tb) // fuck mirror ist besser

        const [Ta_, Ta]  = tangentenpunkte(...L, ...A, ...B)
        const [Tb_, Tb]  = tangentenpunkte(...A, ...B, ...N)
//         log('bbbbbbbzzzz', A, B)
        var poses = sample_bezier(...A, ...Ta, ...Tb_, ...B, _N-1)

//         let poses = sample_line(...A, ...B, _N-1)

        renderfu(poses)

//         log('A', A, 'Ta_', Ta_, 'Ta', Ta)
//         poses = sample_line(...Ta_, ...Ta, _N-1)
    } 
    else{
        const poses = sample_line(...lastp, ...p, _N-1)

        renderfu(poses)
    }

}

function renderfu(poses) {
    let transforms = make_Ms(poses, 0.0045)
    let materials = make_materials(poses.length)
    render_line(transforms, materials, poses.length)
}

canvas.addEventListener("pointermove", on_pointermove, {/*passive: true,*/ capture:true})
canvas.addEventListener("pointerdown", on_pointerdown, {/*passive: true,*/ capture:true})
canvas.addEventListener("pointerup",   on_pointerup,   {/*passive: true,*/ capture:true})

document.ondblclick = function(e) { e.preventDefault(); }
document.addEventListener("contextmenu", (e) => {e.preventDefault()});
document.addEventListener('touchmove', (e) => {e.preventDefault()})
document.addEventListener('touchstart', (e) => {e.preventDefault()})
document.addEventListener('touchend', (e) => {e.preventDefault()})

// gl.deleteBuffer(vertexPosBuffer);
// gl.deleteBuffer(uniformTransformBuffer);
// gl.deleteBuffer(uniformMaterialBuffer);
// gl.deleteProgram(program);


// var tcx = canvas.width/3
// var tcy = canvas.height/3

var tcx = -0.10
var tcy = -0.10

// var tr = canvas.width/5
// var testx = tcx + cos( 0) * tr
// var testy = tcy + sin( 0) * tr
// on_pointerdown({offsetX: testx , offsetY:testy , preventDefault:()=>{}})
// for (let i = 1; i< 100; i++) {
//     testx = tcx + cos( i*0.0010) * tr
//     testy = tcy + sin( i*0.0010) * tr
//     on_pointermove({offsetX: testx, offsetY: testy, preventDefault:()=>{}})
// }
// on_pointerup(  {offsetX: testx + 10.04, offsetY:testy + 10.04, preventDefault:()=>{}})

let L = [-0.8, 0.8]
let A = [-0.6, 0.6]
let B = [-0.4, 0.8]
let N = [-0.6, 1.0]
let poses = sample_line(...L, ...A, _N-1)
renderfu(poses)

rline(L, A)
rline(A, B)
rline(B, N)

const [Ta_, Ta]  = tangentenpunkte(...L, ...A, ...B)
const [Tb_, Tb]  = tangentenpunkte(...A, ...B, ...N)

rline(Ta_, A)
rline(Ta,  A)

rline(Tb_, B)
rline(Tb,  B)

function rline(A, B) {
    var poses = sample_line(...A, ...B, _N-1)
    renderfu(poses)
}

poses = sample_bezier(...A, ...Ta, ...Tb_, ...B, _N-1)
renderfu(poses)
