//         °.° 
//         https://www.geeks3d.com/20110405/fxaa-fast-approximate-anti-aliasing-demo-glsl-opengl-test-radeon-geforce/

let log = console.log
let sin = Math.sin
let cos = Math.cos
let sqrt = Math.sqrt
let asin = Math.asin
let acos = Math.acos
let atan = Math.atan
let atan2 = Math.atan2
let ssin = x => 0.5*sin(x) + 0.5

const black = [0, 0, 0, 1]
const green = [0, 1, 0, 1]
const blue  = [0, 0, 1, 1]
const red   = [1, 0, 0, 1]

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
    const n = poses.length

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

function make_materials(n, rgba) {
    tmp = []
    let milli = Date.now() / 1000
    const [r, b, g, a] = rgba
    for (i=0; i<n; i++) {
        tmp.push( r, g, b, a )
//         tmp.push( r, g + ssin(milli), b, a )
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
    /// fuck finish teh stroke
    e.preventDefault();
    drawing = []
}

let evcount = 0
function on_pointermove(e) {
    e.preventDefault();
    if (drawing.length == 0) return;

    evcount+=1
    if ( evcount%2 == 1 && e.pressure )
        return

    const lastp = drawing[drawing.length-1]

    const p = glkoord( e.offsetX, e.offsetY)
    drawing.push(p)

    if (drawing.length >= 4) {
//         log('on_pointermove bez', drawing.length)

        /// L -- A -- B -- N

        /// tangentenpunkte an A
        const L = drawing[drawing.length-1]
        const A = drawing[drawing.length-2]
        const B = drawing[drawing.length-3]
        const N = drawing[drawing.length-4]

        /// Tb ist der Tangentenpunkt vom letzten B
//         Ta = mirror(A, Tb) // fuck mirror ist besser

        const c = 0.3*dist(...A, ...B)

//         const a2 = dist2(...L, ...A)
//         const b2 = dist2(...B, ...A)
//         const c2 = dist2(...L, ...B)
//         const a = sqrt(a2)
//         const b = sqrt(b2)
//         const alpha = acos(( c2 - a2 - b2 )/ (2*a*b))


//         const LA = diff(...L, ...A)
//         const AB = diff(...B, ...A)
//         const alpha =   atan2(AB[1], AB[0]) 
//                       - atan2(LA[1], LA[0]);

//         log('?', alpha)
//         const alpha = acos(
//         const c = 1000*dot(...La, ...AB)

        const [Ta_, Ta]  = tangentenpunkte(...L, ...A, ...B, c)


        const [Tb_, Tb]  = tangentenpunkte(...A, ...B, ...N, c)

        let poses = sample_bezier(...A, ...Ta, ...Tb_, ...B, _N-1)
//         let poses = sample_line(...A, ...B, _N-1)
        renderfu(poses)

//         rline(Ta, A, green)
//         rline(Ta_,A, green)
    } 
    else{
        /// fuck this makes teh first line twice
        log('on_pointermove lin', drawing.length)
        const poses = sample_line(...lastp, ...p, _N-1)
        renderfu(poses, red)
    }

}

function renderfu(poses, rgba = [0, 0, 0, 1], width = 0.0055) {
    let transforms = make_Ms(poses, width)
    let materials = make_materials(poses.length, rgba)
    render_line(transforms, materials, poses.length)
}

function rline(A, B, rgba = [0, 0, 0, 1], width = 0.0055) {
    var poses = sample_line(...A, ...B, _N-1)
    renderfu(poses, rgba, width)
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

const pi = 3.141592

var tcx = canvas.width/10
var tcy = canvas.height/10
// var tcx = 200
// var tcy = 200
var tr = 20
var i = 0
var n = 10
var testx = tcx + cos(2*pi*i/n) * tr
var testy = tcy + sin(2*pi*i/n) * tr
// on_pointerdown({offsetX: testx , offsetY:testy , preventDefault:()=>{}})
on_pointerdown({offsetX: tcx, offsetY:tcy, preventDefault:()=>{}})
for (let i = 1; i<= n; i++) {
    log(i, n)
    testx = tcx + cos(2*pi* i/n) * tr
    testy = tcy + sin(2*pi* i/n) * tr
    on_pointermove({offsetX: testx, offsetY: testy, preventDefault:()=>{}})
}
on_pointerup(  {offsetX: tcx, offsetY:tcy, preventDefault:()=>{}})

// let L = [-1.0, 0.8]


function test1() {
let Ps = [
[-1.8, 1.8],
[-0.6, 0.6],
[-0.4, 0.8],
[-0.6, 1.0],
]

// let Ps = []
// let tcx = -0.5
// let tcy = -0.0
// let n = 10
// let tr = 0.5
// for (let i = 1.0; i< n; i++) {
//     let x = tcx + cos(2*3.14* (i/n)) * tr
//     let y = tcy + sin(2*3.14* (i/n)) * tr
//     Ps.push([x, y])
// }

    let L = Ps[0]
    let A = Ps[1]
    let B = Ps[2]
    let N = Ps[3]

    let poses = sample_line(...L, ...A, _N-1)
    renderfu(poses)

    rline(L, A)
    rline(A, B)
    rline(B, N)

    let c = dist(...A, ...B)
    // let c = d
    // log(A, B, c)
    const [Ta_, Ta]  = tangentenpunkte(...L, ...A, ...B, c)
    const [Tb_, Tb]  = tangentenpunkte(...A, ...B, ...N, c)

    rline(Ta_, A, green)
    rline(Ta,  A, green)

    rline(Tb,  B, green)
    rline(Tb_, B, green)

    poses = sample_bezier(...A, ...Ta, ...Tb_, ...B, _N-1)
    renderfu(poses)
}
// test1()
