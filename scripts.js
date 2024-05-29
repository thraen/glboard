//         °.° 

log = console.log
sin = Math.sin
ssin = x => 0.5*sin(x) + 0.5

var canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);


var gl = canvas.getContext('webgl2', { 
                                       preserveDrawingBuffer: true,
  antialias: false , 
                                       desynchronized: true });
var isWebGL2 = !!gl;

if(!isWebGL2) {
    document.getElementById('info').innerHTML = 'WebGL 2 is not available.  See <a href="https://www.khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">How to get a WebGL 2 implementation</a>';
}

function line(x, y, bx, by, n) {
    dx = (bx - x) * (1/n)
    dy = (by - y) * (1/n)

    poses = [[x,y]]
    for (i=1; i<=n; i++) {
        x += dx
        y += dy
        poses[i] = [x,y]
    }
    return poses
}

function make_Ms(poses) {
    n = poses.length

//     let Ms = new Float32Array(16*2*poses.length)

    const s = 0.0115;
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
//     log(tmpMs.flat())
    return new Float32Array(tmpMs.flat())
}

// -- Init program
// log(vert)
// log(frag)

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

var program = createProgram(gl, vert, frag);

var after_program = createProgram(gl, fixvert, afterfrag);
var usampler_location = gl.getUniformLocation(after_program, "uSampler")

var vertexPosBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);

var vertices = new Float32Array([
   -1.5, -1.0 ,
    1.5, -1.0 ,
   -1.5,  1.0 ,
   -1.5,  1.0 ,
    1.5, -1.0 ,
    1.5,  1.0 ,
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
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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

    // return new Float32Array([
    //     0.0, 0.1, 0.0, 1.0,
    //     0.0, 0.2, 0.0, 1.0,
    //     0.0, 0.3, 0.0, 1.0,
    //     0.0, 0.4, 0.0, 1.0,
    //     0.0, 0.5, 0.0, 1.0,
    //     0.0, 0.6, 0.0, 1.0,
    //     0.0, 0.7, 0.0, 1.0,
    //     0.0, 0.8, 0.0, 1.0,
    //     0.0, 0.9, 0.0, 1.0,
    //     0.0, 1.0, 1.0, 1.0
    // ]);
    return new Float32Array(tmp.flat())
}

var vertexPosLocation = 0; // set with GLSL layout qualifier
gl.enableVertexAttribArray(vertexPosLocation);
gl.vertexAttribPointer(vertexPosLocation, 2, gl.FLOAT, false, 0, 0);

function render_line(A, B) {

    // -- Render
//     gl.clearColor(0,1,1,1);
//     gl.clear(gl.COLOR_BUFFER_BIT);


    poses = line(...A, ...B, _N-1)
//     log('poses', poses)
    Ms = make_Ms(poses)

    gl.bindBuffer(gl.UNIFORM_BUFFER, uniformTransformBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, Ms, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    var materials = make_materials(_N)
//     log('materials', materials)
    gl.bindBuffer(gl.UNIFORM_BUFFER, uniformMaterialBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, materials, gl.STATIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uniformTransformBuffer);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, uniformMaterialBuffer);

    // first render pass 
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb_render);
    gl.useProgram(program);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, _N);

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

}

var drawing = false

function glkoord(winx, winy) {
//     w = canvas.clientWidth
//     h = canvas.clientHeight
    wh = 0.5*canvas.clientWidth
    hh = 0.5*canvas.clientHeight
    return [ (winx - wh) / wh, (hh-winy) / hh ]
}

function on_pointerdown(e) {
    e.preventDefault();
    drawing = true
    lastp = glkoord( e.offsetX, e.offsetY )
}

function on_pointerup(e) {
    e.preventDefault();
    drawing = false
}

function on_pointermove(e) {
    e.preventDefault();
    if (!drawing) return;

    P = glkoord( e.offsetX, e.offsetY)

    render_line(P, lastp)
    lastp = P
}

// render_line([0, 0], [-0,1])

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



