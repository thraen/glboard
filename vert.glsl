window.vert = `#version 300 es

precision highp float;
precision highp int;

layout(std140, column_major) uniform;

uniform Transform
{
    mat4 MVP[${_N}];
} transform;

uniform Material
{
    vec4 color[${_N}];
} material;

layout(location = 0) in vec2 pos;

flat out int instance;

out vec2 uv;

// const float a = 3.1428/8.0;
// const float a = 0.6;
const float a = 3.1428/4.0;
// const float a = 3.1428/2.0;
// const float a = 0.0;
const mat2 rot = mat2(
   cos(a), sin(a),
  -sin(a), cos(a)
);

void main()
{
    instance = gl_InstanceID;
    gl_Position = transform.MVP[gl_InstanceID] * vec4(pos, 0.0, 1.0);

//     uv = 2.0*pos;

//     vec2 _uv = vec2(3.0*pos.x, 2.0*pos.y);
//     uv = rot*_uv;

    vec2 _uv = rot*pos;
    uv = vec2(3.0*_uv.x, 2.0*_uv.y);
}
`;


window.fixvert = `
#version 300 es

precision highp float;
precision highp int;

layout(std140, column_major) uniform;

layout(location = 0) in vec2 pos;

flat out int instance;

out vec2 uv;

void main()
{
    instance = gl_InstanceID;
    gl_Position = vec4(pos, 0.0, 1.0);
    uv = pos;
}
`;
