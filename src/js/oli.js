function createShaderFromScriptElement(doc, glCtx, scriptId){
  var shaderElt   = doc.getElementById(scriptId),
      shaderSrc   = shaderElt.text,
      shaderType  = (function(ctx, t){
        if(t === "x-shader/x-vertex")
          return ctx.VERTEX_SHADER;
        else if(t === "x-shader/x-fragment")
          return ctx.FRAGMENT_SHADER;
      })(glCtx, shaderElt.type),
      shader      = glCtx.createShader(shaderType);

  glCtx.shaderSource(shader, shaderSrc);
  glCtx.compileShader(shader);

  if(!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)){
      console.log("shader " + shader + " failed with error : " + glCtx.getShaderInfoLog(shader));
      throw new Error();
  }

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
        vShader = createShaderFromScriptElement(document, ctx, "2d-vertex-shader"),
        fShader = createShaderFromScriptElement(document, ctx, "2d-fragment-shader"),
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
        stepLoc   = ctx.getUniformLocation(program, "u_step"),
        resLoc    = ctx.getUniformLocation(program, "u_resolution"),
        timeLoc   = ctx.getUniformLocation(program, "u_t"),
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

//    ctx.activeTexture( ctx.TEXTURE0 );
//    ctx.bindTexture( ctx.TEXTURE_2D, tex1 );
    ctx.uniform1i( ctx.getUniformLocation(program, "u_sampler"), 0);

    //var pause = false;
    //document.addEventListener("click",function(){ pause = !pause;});
    var tIntensity = 0,
        pos = 0,
        scene = [
          [1,100],  
          [1,0],  
          [1,100],  
          [1,0],  
          [1,100],  
          [5,0],  
          [5,100],  
          [5,0],  
          [5,100],  
          [5,0],  
          [5,100],  
          [5,0],  
          [5,100],  
          [5,0],  
          [1,100],  
          [1,0],  
          [20,100]  
        ];

    requestAnimationFrame(function loop(time){
          var seqTime = actx.currentTime;
          var bar = seqTime / (n4 * 4) | 0;
          if (bar != lastBar) {
            lastBar = bar;
            console.log(bar, pos);
            if(scene[bar][1] === 0){
                pos = seqTime;
            }
            ctx.uniform1f(dotsLoc, scene[bar][0]);
          
          }
          

          tIntensity = seqTime - pos;
          ctx.uniform1f(timeLoc, seqTime * 100);
          ctx.uniform1i(stepLoc, Math.floor(time/10000));
          ctx.uniform1f(tIntensLoc, tIntensity);
          ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 5);
        requestAnimationFrame(loop, container);
    }, container);



    container.appendChild(canvas);
  })(document.getElementById("container"));
