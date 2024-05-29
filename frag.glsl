window.frag = `
#version 300 es
precision highp float;
precision highp int;
layout(std140) uniform;

uniform Material
{
    vec4 color[${_N}];
} material;

flat in int instance;
out vec4 color;

in vec2 uv;

void main()
{
//     color = material.color[instance % 2];
//     color = material.color[instance ];
//     color = vec4(gl_FragCoord.xy, 0, 1);
//     color = vec4(uv , 0, 1);

    float l = length(uv);
    float a = 1.0;
//
    a =  mix(1.0, 0.0, 3.1*(l-a));
//       a = mix(1.0, 0.0, 100.01*(l-a) * (l-a));

//         a = 1.0-step(1.0, l);
    color = vec4(
        0.0,
        0.0,
        0.0,
        a
//         1
//         smoothstep(1.0, 0.0, l*l*l*l*l*l*l*l*l*l*l*l)
//         1.0-smoothstep(0.0, 1.0, pow(l,3.1))
//         1.0-step(1.0, l)
//         1.0
        );



//     float l_ = l;
//     l_ = (l_*l_*l_*l_);
//     color = vec4(l_, l_, l_, 1.0-step(1.0, l));
//     color = vec4(1.0-smoothstep(1.0, l), 0, 0, 1.0-smoothstep(1.0, l));
}

`;

window.afterfrag = `
#version 300 es
precision highp float;
precision highp int;
layout(std140) uniform;

uniform sampler2D uSampler;

out vec4 color;
in vec2 uv;

void main()
{
//     float l = length(uv);
//     color = vec4(
//         0,
//         0,
//         0,
//         1.0-step(1.0, l));
//       color = vec4(0.0, 1.0, 1.0, 1.0);
      color = texture(uSampler, 0.5*uv + vec2(0.5, 0.5));

//       float c = 0.0001;
//       color = 
//         (
//           texture(uSampler, 0.5*uv + vec2(0.5, 0.5) ) 
//         + texture(uSampler, 0.5*uv + vec2(0.5 +c, 0.5) ) * 0.25
//         + texture(uSampler, 0.5*uv + vec2(0.5 -c, 0.5) ) * 0.25
//         + texture(uSampler, 0.5*uv + vec2(0.5,    0.5+c) ) * 0.25
//         + texture(uSampler, 0.5*uv + vec2(0.5,    0.5-c) ) * 0.25
//         ) *0.5
//         ;
}

`;
