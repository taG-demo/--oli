var tempo = 80,
  n4 = 60 / tempo,
  lastBar = -1,
  bar = 0;

var actx = window.AudioContext || window.webkitAudioContext;
if (!actx) {
	throw("No audio.");
}
actx = new actx();

(function () {

	var sr = actx.sampleRate,
  		n8 = n4 / 2,
  		n16 = n8 / 2,
      	n32 = n16 / 2,
      	n64 = n32 / 2,

		kickLen = (n4 * 1) * sr,
		kickBuffer = actx.createBuffer(1, kickLen, sr),
		kickData = kickBuffer.getChannelData(0),

		snareLen = (n16 * 1) * sr,
		snareBuf = actx.createBuffer(1, snareLen, sr),
		snareData = snareBuf.getChannelData(0),

		delayNode = actx.createDelay(),
		delayNode2 = actx.createDelay(),
		delayGain = actx.createGain();

	// Hi-hat delay
	delayNode.delayTime.value = n8;
	delayNode2.delayTime.value = n8 + n16;
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
	var synLen = (n4 * 8) * sr,
		synBuf = actx.createBuffer(1, synLen, sr),
		synBuf2 = actx.createBuffer(1, synLen, sr),
		synData = synBuf.getChannelData(0),
		synData2 = synBuf2.getChannelData(0);

	// Square wave generator
	var synNote = 47;
	for (i = 0; i < synData.length; i++) {
		synData[i] = Math.sin(i / (sr / ((synNote + 0.15) * 2 * Math.PI))) > 0 ? 1 : -1;
		synData2[i] = Math.sin(i / (sr / (((synNote * 1 + (7 * Math.pow(1/12, 2))) - 0.15) * 2 * Math.PI))) > 0 ? 1 : -1;
	}

	var Env = function (a, d, r) {
		var node = actx.createGain();
		node.gain.value = 0;
		return {
			fire: function (off) {
				//node.gain.setValueAtTime(0, off);
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
	hihatFilter.frequency.value = 2200;

	var snareEnv = Env(0.001, 0.08, 0.2);
	snareEnv.inp(snareNode);
	snareEnv.outp(hihatFilter);

	var hatEnv = Env(0.001, 0.01, 0.03);
	hatEnv.inp(snareNode);
	hatEnv.outp(hihatFilter);

	delayNode.connect(delayNode2);
	delayNode2.connect(delayGain);
	delayGain.connect(gainMaster);

	var synEnv = Env(0.02, 0.6, 0.05);
	synEnv.inp(synNode);
	synEnv.inp(synNode2);

	var synFilter = actx.createBiquadFilter();
	synFilter.type = 0;
	synFilter.Q.value = 10;

	var c = actx.currentTime;

	function addWah(off) {
		var freq = synFilter.frequency;
		var lastBeat = off,
			low = 200,
			hi = 5000;
		freq.setValueAtTime(hi, lastBeat);
		freq.linearRampToValueAtTime(low, lastBeat + (n8 * 1));
		freq.setValueAtTime(hi, lastBeat + (n8 * 2));
		freq.linearRampToValueAtTime(low, lastBeat + (n8 * 3));
		freq.setValueAtTime(hi, lastBeat + (n16 * 4));
		freq.linearRampToValueAtTime(low, lastBeat + (n8 * 5));
		freq.setValueAtTime(hi, lastBeat + (n8 * 6));
		freq.linearRampToValueAtTime(low, lastBeat + (n8 * 7));
		freq.setValueAtTime(hi, lastBeat + (n64 * 8));
		freq.linearRampToValueAtTime(low, lastBeat + (n64 * 9));
		freq.setValueAtTime(hi, lastBeat + (n64 * 10));
		freq.linearRampToValueAtTime(low, lastBeat + (n64 * 11));
		freq.setValueAtTime(hi, lastBeat + (n64 * 12));
		freq.linearRampToValueAtTime(low, lastBeat + (n64 * 13));
		// freq.setValueAtTime(700, lastBeat + (n64 * 14));
		// freq.linearRampToValueAtTime(1100, lastBeat + (n64 * 15));
	}

	var synGain = actx.createGain();
	synGain.gain.value = 0.4;

	synEnv.outp(synFilter);
	synFilter.connect(synGain);
	//synGain.connect(delayNode);
	synGain.connect(gainMaster);

	hatEnv.outp(delayNode);
	hihatFilter.connect(gainMaster);

	gainMaster.connect(actx.destination);


	var beat = [0,0,0,0];
	// Sequence up some stuffs
	for (var i = 0; i < 24; i++) {

		// Four on the floor
		for (var j = 0; j < 4; j++) {
			beat[j] = c + (i * 4 + j) * n4;
			j % 2 == 1 && kickEnv.fire(c + ((j+1) + i * 4) * n4);
		}

		// Wahhhh filter
		if (i > 3 && i % 2 === 0) {
			addWah(c + beat[0])
			addWah(c + beat[2]);
			addWah(c + beat[3] + n8);
		};

		// Synth
		synEnv.fire(c + beat[0]);
		synEnv.fire(c + beat[2]);
		synEnv.fire(c + beat[3] + n8);


		// Hats n snare
		if (i > 3) {
			hatEnv.fire(beat[0]);

			snareEnv.fire(beat[1]);
			hatEnv.fire(beat[1] + n8 + n16);

			hatEnv.fire(beat[2] + n8);

			snareEnv.fire(beat[3]);
		}
		i > 2 && hatEnv.fire(beat[3] + n8);
	}


}());