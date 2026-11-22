/* The canvas is an ellipse cut from the painting, already aligned to the
   vortex. Transport paint detail through that ellipse under its original light. */
window.createVortexRenderer = function createVortexRenderer(canvas) {
  const gl = canvas.getContext('webgl', {
    alpha: true, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: false, powerPreference: 'low-power',
  });
  if (!gl) return null;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertex = compile(gl.VERTEX_SHADER, `
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      uv = vec2(position.x, -position.y) * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }`);
  const fragment = compile(gl.FRAGMENT_SHADER, `
    precision highp float;
    uniform sampler2D painting;
    uniform sampler2D illumination;
    uniform sampler2D silhouette;
    uniform sampler2D gilt;
    uniform float time;
    uniform float spin;
    uniform float core;
    varying vec2 uv;
    const float tau = 6.2831853;

    vec2 material(float r, float angle, float age) {
      // Trace each particle backwards: it came from a wider orbit. Short,
      // overlapping ages keep differential rotation from stretching to infinity.
      float shear = mix(1.16, 0.06, smoothstep(0.13, 0.96, r));
      float angularTravel = time * (tau / 9.6) + age * shear;
      float inwardRate = mix(0.20, 0.07, smoothstep(0.18, 0.97, r));
      float sourceR = r * exp(age * inwardRate);
      float a = angle - spin * angularTravel;
      return 0.5 + 0.5 * sourceR * vec2(cos(a), sin(a));
    }
    vec3 transport(vec2 point, vec3 light) {
      vec3 ink = texture2D(painting, point).rgb;
      vec3 sourceLight = texture2D(illumination, point).rgb;
      // Preserve the direction of the light and the silhouette of the dark eye
      // while veins, knots and folds in the original artwork flow past them.
      vec3 contrast = clamp((ink + 0.065) / (sourceLight + 0.065), 0.32, 2.45);
      return light * contrast + 0.38 * (ink - sourceLight) + 0.19 * (ink - light);
    }
    void main() {
      vec2 offset = uv * 2.0 - 1.0;
      float r = length(offset);
      if (r >= 1.0 || r < core * 0.60) { gl_FragColor = vec4(0.0); return; }
      float angle = atan(offset.y, offset.x);
      vec3 light = texture2D(illumination, uv).rgb;
      float red = light.r - max(light.g, light.b);
      float inInk = smoothstep(0.004, 0.085, red);
      float eye = smoothstep(core * 0.6, core + 0.06, r);
      float edge = 1.0 - smoothstep(0.71, 0.995, r);
      float opacity = eye * edge * inInk * texture2D(silhouette, uv).a;
      if (opacity <= 0.001) { gl_FragColor = vec4(0.0); return; }

      float period = 4.8;
      float phase = fract(time / period);
      float second = fract(phase + 0.5);
      vec2 firstInk = material(r, angle, (phase - 0.5) * period);
      vec2 secondInk = material(r, angle, (second - 0.5) * period);
      float weight = 0.5 - 0.5 * cos(tau * phase);
      vec3 color = mix(transport(secondInk, light), transport(firstInk, light), weight);

      // Small knots of concentrated light follow the inward spiral. Break
      // their ridges with the transported ink so a geometric ring never forms.
      float ridge = 0.5 + 0.5 * sin(3.0 * spin * angle + 8.0 * log(max(r,0.01)) + time * (2.0 * tau / 9.6));
      float grain = max(0.0, color.r - light.r * 0.77);
      color += vec3(0.34, 0.115, 0.036) * pow(ridge, 9.0) * grain;
      // A few raised creases in the source catch amber light, then turn
      // vermilion again as the same strands descend into the eye.
      if (r > 0.20 && r < 0.62) {
        float thread = max(sqrt(weight) * texture2D(gilt, firstInk).a,
                           sqrt(1.0 - weight) * texture2D(gilt, secondInk).a);
        float sweep = 0.5 + 0.5 * cos(2.0 * spin * angle + 5.4 * log(r) + tau / 9.6 * time);
        float catchLight = smoothstep(0.18, 0.84, sweep);
        float rim = smoothstep(0.20, 0.255, r) * (1.0 - smoothstep(0.52, 0.62, r));
        float shine = thread * rim * mix(0.30, 0.96, catchLight);
        vec3 amber = mix(vec3(0.93, 0.29, 0.065), vec3(1.0, 0.72, 0.36), catchLight);
        float glintOpacity = shine * eye * edge * texture2D(silhouette, uv).a;
        float underlying = opacity * (1.0 - glintOpacity);
        opacity = underlying + glintOpacity;
        color = (color * underlying + amber * glintOpacity) / max(opacity, 0.001);
      }
      gl_FragColor = vec4(max(color, 0.0), opacity);
    }`);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  gl.useProgram(program);
  const triangle = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  function texture(name, unit) {
    const map = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, map);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, name), unit);
    return map;
  }
  const paintMap = texture('painting', 0);
  const lightMap = texture('illumination', 1);
  const matteMap = texture('silhouette', 2);
  const giltMap = texture('gilt', 3);
  const time = gl.getUniformLocation(program, 'time');
  const core = gl.getUniformLocation(program, 'core');
  const spin = gl.getUniformLocation(program, 'spin');

  function upload(map, unit, pixels) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, map);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  }
  return {
    setPainting(source, mask, glints, direction, eyeRadius) {
      const blurred = document.createElement('canvas');
      blurred.width = blurred.height = 18;
      const brush = blurred.getContext('2d');
      brush.imageSmoothingQuality = 'high';
      brush.drawImage(source, 0, 0, 18, 18);
      canvas.width = canvas.height = source.width;
      upload(paintMap, 0, source);
      upload(lightMap, 1, blurred);
      upload(matteMap, 2, mask);
      upload(giltMap, 3, glints || document.createElement('canvas'));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(core, eyeRadius);
      gl.uniform1f(spin, direction);
    },
    paint(seconds) {
      gl.uniform1f(time, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
};
