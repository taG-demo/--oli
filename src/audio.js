(function () {

	var actx = window.AudioContext || window.webkitAudioContext;
	if (!actx) {
		console.log("No audio.");
		return;
	}
	actx = new actx();

	var sr = actx.sampleRate,
		tempo = 40,
  		n8 = (60 / tempo) / 2,
  		n16 = n8 / 2,
      	n32 = n16 / 2,
		kickLen = (n8 * 1) * sr,
		kickBuffer = actx.createBuffer(1, kickLen, sr),
		kickData = kickBuffer.getChannelData(0),
		kickNode,

		melLen = (n32 * 1) * sr,
		melBuf = actx.createBuffer(1, melLen, sr),
		melData = melBuf.getChannelData(0),
		melNode,

		delayNode = actx.createDelay(),
		delayNode2 = actx.createDelay(),
		delayGain = actx.createGain();

	delayNode.delayTime.value = n16;
	delayNode2.delayTime.value = n16 + n32;
	delayGain.gain.value = 0.1;

	var sfreq = 60,
		freqDrop = (sfreq - 40) / kickData.length;
	for (var i = 0; i < kickData.length; ++i) {
		kickData[i] = Math.sin( i / (sr / (sfreq * 2 * Math.PI)));
		sfreq -= freqDrop;
	}

	for (i = 0; i < melData.length; i++) {
		melData[i] = (Math.random() * 2 - 1) / 2;
	}

	var Env = function (a, d, r) {
		var node = actx.createGain();
		node.gain.value = 0;
		return {
			fire: function (off) {
				node.gain.linearRampToValueAtTime(0, off);
				node.gain.linearRampToValueAtTime(1, a + off);
				node.gain.linearRampToValueAtTime(0.3, d + off);
				node.gain.linearRampToValueAtTime(0, r + off);
			},
			inp: function(src) {
				src.connect(node);
			},
			outp: function(dest) {
 				node.connect(dest);
			},
		}
	};

	kickNode = actx.createBufferSource()
	kickNode.buffer = kickBuffer;
	kickNode.loop = true;
	kickNode.start(0);


	melNode = actx.createBufferSource()
	melNode.buffer = melBuf;
	melNode.loop = true;
	melNode.start(0);

	var i = "";
	for(var t in actx) {
		i+= t + ":" + actx[t] + "<Br/>";
	}
	document.body.innerHTML = i;

	var gainMaster = actx.createGain();
	gainMaster.gain.value = 2.5;

	var kickEnv = Env(0.001, 0.08, 0.2);
	kickEnv.inp(kickNode);
	kickEnv.outp(gainMaster);

	  var filter = actx.createBiquadFilter();
	  filter.type = 0;
	  filter.Q.value = 10;
	  filter.frequency.value = 1200;

	var melEnv = Env(0.001, 0.08, 0.2);
	melEnv.inp(melNode);
	melEnv.outp(filter);

	var hatEnv = Env(0.001, 0.003, 0.05);
	hatEnv.inp(melNode);
	hatEnv.outp(filter);

	delayNode.connect(delayNode2);
	delayNode2.connect(delayGain);
	delayGain.connect(gainMaster);

	hatEnv.outp(delayNode);
	filter.connect(gainMaster);

	gainMaster.connect(actx.destination);

	var c = actx.currentTime;

	for (var i = 0; i < 8; i++) {
		hatEnv.fire(c + (1 + i * 4) * n8 + n32);

		kickEnv.fire(c + (1 + i * 4) * n8);

		kickEnv.fire(c + (2 + i * 4) * n8);
		melEnv.fire(c + (2 + i * 4) * n8);

		hatEnv.fire(c + (2 + i * 4) * n8 + n16 + n32);

		kickEnv.fire(c + (3 + i * 4) * n8);

		hatEnv.fire(c + (3 + i * 4) * n8 + n16);

		kickEnv.fire(c + (4 + i * 4) * n8);
		melEnv.fire(c + (4 + i * 4) * n8);

		hatEnv.fire(c + (4 + i * 4) * n8 + n16);
	}


}());