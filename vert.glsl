window.vert = `
#version 300 es

precision highp float;
precision highp int;

layout(std140, column_major) uniform;

uniform Transform
{
    mat4 MVP[${_N}];
} transform;

layout(location = 0) in vec2 pos;

flat out int instance;

out vec2 uv;

void main()
{
    instance = gl_InstanceID;
    gl_Position = transform.MVP[gl_InstanceID] * vec4(pos, 0.0, 1.0);
    uv = 2.0*pos;
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
