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

  img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQMAAADOtka5AAAABlBMVEX///8AAABVwtN+AAAAAWJLR0QAiAUdSAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAMdJREFUeNrt2LENgzAUQEEyASMwCqOxWkZhBMoUVggYSJEyTvRt6a5BGOkV2BhB1wEAAAAAAAAAAAAAtGJcd0lAIDqwlC5lAQEBAQEBAQGBPwX6FBjIBATaD1zfTFM+Pm7r4XkOJAGBVgLntj7N23HYAvd9qN8C+4WhqcB1DwQEYgNzPo0IfO4H78C3G4qAQEgAala8lAUEfhZYSpdyfMA0ClQRyIamA6ZRoKKHqeS9EBcYz39pAgKNBwAAAAAAAAAAAAAAgrwA1oan+T9f+l4AAAAASUVORK5CYII=";

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
          [0 ,  0,5,0, ""],
          [0 ,  0,5,0, "<h1>taG</h1>"],
          [1 ,  0,5,0 ],
          [0 ,  0,5,0, "presents"],
          [1 ,  0,5,0 ],
          [0 ,  0,5,0, "8k/no lib/no png stuff"],
          [1 ,  0,5,0],
          [0 ,  0,5,0],
          [6 ,  0,3,0, "&nbsp;&nbsp;&nbsp;}&nbsp;&nbsp;Oli"],
          [6 ,  0,4,0],
          [12,  0,3,0],
          [12,  0,4,0],
          [12,  0,2,0]  ,
          [12,  0,2,0],
          [12,100,2,0],
          [12,  0,2,0]  ,
          [8 , 10,5,1],  // ROTO
          [4 , 10,5,1],
          [6 , 10,5,1],
          [2 , 10,5,1],
          [12,  0,2,1],
          [12,100,2,1],
          [12,  0,2,1] ,
          [4 ,  0,5,1],
          [8 ,  0,5,0],
          [12 , 0,5,0],
          [12 , 0,4,0],
          [12 , 0,3,0],
          [12 ,10,5,1, "Greets!<br>DemoJS crew!<br/>/p01/RomanCortes/ehouais/ASD/farb-rausch/adinpsz!/Titeiko/J3ffrey/Tortue"],
          [10, 10,5,1],
          [6 , 10,5,1],
          [4 , 10,5,1],
          [0 , 10,5,1, "music/MrSpeaker|gfx/bobylito"],
          [0 , 10,5,1],
          [0 , 10,5,1],
          [0 , 10,5,1],
          [0 , 10,5,1, "it is finished now"]

        ],
        greetz = document.querySelector(".mq");


    requestAnimationFrame(function loop(time){
          var seqTime = actx.currentTime;
          var bar = seqTime / (n4 * 4) | 0;
          if (bar != lastBar) {
            lastBar = bar;
            var current = bar;
            pos = seqTime + scene[current][1];
            ctx.uniform1f(dotsLoc, scene[current][0]);
            ctx.uniform1i(fTypeLoc, scene[current][2]);
            ctx.uniform1i(rotoLoc, scene[current][3]);
            greetz.innerHTML = scene[current][4] || " ";
          }

          tIntensity = seqTime - pos;
          ctx.uniform1f(timeLoc, seqTime * 100);
          ctx.uniform1f(tIntensLoc, tIntensity);
          ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 5);

          greetz.style.opacity = 1 - (seqTime / (n4 * 4)) % 1;
          // Optional flasshhh! Kill if we need bytes
          if (tIntensity < 0.1) {
            greetz.style.left = (((Math.random() * 28) | 0) + 10) + "px";
          }

        requestAnimationFrame(loop, container);
    }, container);



    container.appendChild(canvas);
  })(document.getElementById("container"));
