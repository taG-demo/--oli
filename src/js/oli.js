function createShaderFromScriptElement(doc, glCtx, scriptId, t){
  var shaderElt   = doc.getElementById(scriptId),
      shaderSrc   = shaderElt.text,
      shader      = glCtx.createShader(t);
  glCtx.shaderSource(shader, shaderSrc);
  glCtx.compileShader(shader);
  return shader;
}

function texture( gl, path ){
  var texture = gl.createTexture(),
      img     = new Image();

  img.onload  = (function textureLoaded(){
    gl.bindTexture( gl.TEXTURE_2D, texture);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap( gl.TEXTURE_2D);
  });

  img.src = path;

  return texture;
}

(function(container){
    var canvas  = document.createElement("canvas"),
        ctx     = canvas.getContext("experimental-webgl"),
        vShader = createShaderFromScriptElement(document, ctx, "2d-vertex-shader", ctx.VERTEX_SHADER),
        fShader = createShaderFromScriptElement(document, ctx, "2d-fragment-shader", ctx.FRAGMENT_SHADER),
        program = ctx.createProgram(),
        X       = window.innerWidth,
        Y       = window.innerHeight,
        tex1    = texture(ctx, "texture2.png");

    canvas.width  = X;
    canvas.height = Y;

    ctx.viewport(0, 0, X, Y);

    ctx.attachShader(program, vShader);
    ctx.attachShader(program, fShader);

    ctx.linkProgram(program);

    ctx.useProgram(program);
    ctx.enable(ctx.BLEND);

    var posLoc    = ctx.getAttribLocation(program, "a_position"),
        buffer    = ctx.createBuffer(),
        resLoc    = ctx.getUniformLocation(program, "u_resolution"),
        timeLoc   = ctx.getUniformLocation(program, "u_t"),
        fTypeLoc  = ctx.getUniformLocation(program, "u_fType"),
        rotoLoc   = ctx.getUniformLocation(program, "u_doRoto"),
        tIntensLoc= ctx.getUniformLocation(program, "u_timeIntensity"),
        dotsLoc   = ctx.getUniformLocation(program, "u_dotsVisible"),
        REZ       = ctx.uniform2f(resLoc, X, Y);

    ctx.enableVertexAttribArray(posLoc);

    ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
    ctx.bufferData(
      ctx.ARRAY_BUFFER,
      new Float32Array([
         1,  1,
         1, -1,
         -1, -1,
        -1, 1,
         1,  1
      ]),
      ctx.STATIC_DRAW
    );

    ctx.vertexAttribPointer(posLoc, 2, ctx.FLOAT, true, 0, 0);

    ctx.uniform1i( ctx.getUniformLocation(program, "u_sampler"), 0);

    var tIntensity = 0,
        pos = 0,
        scene = [
          [1 ,  0,5,0, "Bobylito"],
          [2 ,  0,5,0, "Mr Speaker"],
          [4 ,  0,5,0, "present..."],
          [8 ,  0,5,0, ""],
          [12,  0,3,0, "A demo"],
          [12,  0,4,0],  
          [12,  0,3,0],  
          [12,  0,4,0],  
          [12,  0,2,0]  ,  
          [12,  0,2,0],  
          [12,100,2,0],  
          [12,  0,2,0]  ,  
          [8 , 10,5,1],  // ROTO
          [4 , 10,5,1],  
          [2 , 10,5,1],  
          [1 , 10,5,1],  
          [12,  0,2,1],  
          [12,100,2,1],  
          [12,  0,2,1]  ,  
          [8 , 10,5,1],  // ROTO
          [4 , 10,5,1],
          [2 , 10,5,1],
          [1 , 10,5,1],
          [10, 10,5,1]
        ],
        greetz = document.querySelector(".mq");


    requestAnimationFrame(function loop(time){
          var seqTime = actx.currentTime;
          var bar = seqTime / (n4 * 4) | 0;
          if (bar != lastBar) {
            lastBar = bar;
            var current = bar % scene.length;
            pos = seqTime + scene[current][1];
            ctx.uniform1f(dotsLoc, scene[current][0]);
            ctx.uniform1i(fTypeLoc, scene[current][2]);
            ctx.uniform1i(rotoLoc, scene[current][3]);
            if(scene[current][4]) {
              greetz.classList.remove("mq");
              greetz.innerHTML = scene[current][4];
              setTimeout(function(){
                greetz.classList.add("mq");
              },0)
            }
          }

          tIntensity = seqTime - pos;
          ctx.uniform1f(timeLoc, seqTime * 100);
          ctx.uniform1f(tIntensLoc, tIntensity);
          ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 5);
        requestAnimationFrame(loop, container);
    }, container);



    container.appendChild(canvas);
  })(document.getElementById("container"));
