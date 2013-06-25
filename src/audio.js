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

		snareLen = (n32 * 1) * sr,
		snareBuf = actx.createBuffer(1, snareLen, sr),
		snareData = snareBuf.getChannelData(0),

		delayNode = actx.createDelay(),
		delayNode2 = actx.createDelay(),
		delayGain = actx.createGain();

	// Hi-hat delay
	delayNode.delayTime.value = n16;
	delayNode2.delayTime.value = n16 + n32;
	delayGain.gain.value = 0.1;

	// Sine wave generator
	var sfreq = 60,
		freqDrop = (sfreq - 40) / kickData.length;
	for (var i = 0; i < kickData.length; ++i) {
		kickData[i] = Math.sin(i / (sr / (sfreq * 2 * Math.PI)));
		sfreq -= freqDrop;
	}

	// Noise generator
	for (i = 0; i < snareData.length; i++) {
		snareData[i] = (Math.random() * 2 - 1) / 2;
	}

	/* Synth */
	var synLen = (n8 * 8) * sr,
		synBuf = actx.createBuffer(1, synLen, sr),
		synBuf2 = actx.createBuffer(1, synLen, sr),
		synData = synBuf.getChannelData(0),
		synData2 = synBuf2.getChannelData(0);

	// Square wave generator
	for (i = 0; i < synData.length; i++) {
		synData[i] = Math.sin(i / (sr / (40.15 * 2 * Math.PI))) > 0 ? 1 : -1;
		synData2[i] = Math.sin(i / (sr / (39.85 * 2 * Math.PI))) > 0 ? 1 : -1;
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
			}
		}
	};

	function createNode(buffer) {
		var node = actx.createBufferSource();
		node.buffer = buffer;
		node.loop = true;
		node.start(0);
		return node;
	}

	var kickNode = createNode(kickBuffer),
		snareNode = createNode(snareBuf),
		synNode = createNode(synBuf),
		synNode2 = createNode(synBuf2);

	// var i = "";
	// for(var t in actx) {
	// 	i+= t + ":" + actx[t] + "<Br/>";
	// }
	// document.body.innerHTML = i;

	var gainMaster = actx.createGain();
	gainMaster.gain.value = 2.5;

	var kickEnv = Env(0.001, 0.08, 0.2);
	kickEnv.inp(kickNode);
	kickEnv.outp(gainMaster);

	var hihatFilter = actx.createBiquadFilter();
	hihatFilter.type = 0;
	hihatFilter.Q.value = 4;
	hihatFilter.frequency.value = 2000;

	var snareEnv = Env(0.001, 0.08, 0.2);
	snareEnv.inp(snareNode);
	snareEnv.outp(hihatFilter);

	var hatEnv = Env(0.001, 0.01, 0.03);
	hatEnv.inp(snareNode);
	hatEnv.outp(hihatFilter);


	delayNode.connect(delayNode2);
	delayNode2.connect(delayGain);
	delayGain.connect(gainMaster);

	var synEnv = Env(0.04, 0.1, 0.05);
	synEnv.inp(synNode);
	synEnv.inp(synNode2);

	var synFilter = actx.createBiquadFilter();
	synFilter.type = 0;
	synFilter.Q.value = 10;

	var c = actx.currentTime;

	function addWah(off) {
		var freq = synFilter.frequency;
		freq.setValueAtTime(1800, off + n8);
		freq.exponentialRampToValueAtTime(200, off + n8 + n8 + 0.1);
		freq.setValueAtTime(1800, off + n8 + n8+ 0.2);
		freq.exponentialRampToValueAtTime(200, off + n8 + n8 + 0.3);
		freq.setValueAtTime(1800, off + n8 + n8+ 0.4);
		freq.exponentialRampToValueAtTime(200, off + n8+ n8 + 0.5);
		freq.setValueAtTime(700, off + n8+ n8 + 0.6);
		freq.exponentialRampToValueAtTime(1300, off + n8 + n8+ 0.9);
	}

	var synGain = actx.createGain();
	synGain.gain.value = 0.6;

	synEnv.outp(synFilter);
	synFilter.connect(synGain);
	synGain.connect(gainMaster);

	hatEnv.outp(delayNode);
	hihatFilter.connect(gainMaster);

	gainMaster.connect(actx.destination);


	// Sequence up some stuffs
	for (var i = 0; i < 24; i++) {
		// Wahhhh filter
		(i > 3 && i % 2 === 0) && addWah(c + (i * n8 * 4)) ;
		// Synth
		synEnv.fire(c + (1 + i * 4) * n8 - n32 - n32);

		// Four on the floor
		for (var j = 0; j < 4; j++) {
			kickEnv.fire(c + ((j+1) + i * 4) * n8);
		}

		// Hats n snare
		if (i > 3) {
			hatEnv.fire(c + (1 + i * 4) * n8 + n32);

			snareEnv.fire(c + (2 + i * 4) * n8);

			hatEnv.fire(c + (2 + i * 4) * n8 + n16 + n32);


			hatEnv.fire(c + (3 + i * 4) * n8 + n16);

			snareEnv.fire(c + (4 + i * 4) * n8);
		}
		i > 2 && hatEnv.fire(c + (4 + i * 4) * n8 + n16);
	}


}());