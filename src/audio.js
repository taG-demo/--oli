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
		kickData[i] = Math.sin(i / (sr / (sfreq * 2 * Math.PI)));
		sfreq -= freqDrop;
	}

	for (i = 0; i < melData.length; i++) {
		melData[i] = (Math.random() * 2 - 1) / 2;
	}

	/* Synth */
	var synLen = (n8 * 4) * sr,
		synBuf = actx.createBuffer(1, synLen, sr),
		synBuf2 = actx.createBuffer(1, synLen, sr),
		synData = synBuf.getChannelData(0),
		synData2 = synBuf2.getChannelData(0),
		synNode;

	for (i = 0; i < synData.length; i++) {
		synData[i] = Math.sin(i / (sr / (40.15 * 2 * Math.PI))) > 0 ? 0.5 : -0.5;
		synData2[i] = Math.sin(i / (sr / (39.85 * 2 * Math.PI))) > 0 ? 0.5 : -0.5;
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

	kickNode = actx.createBufferSource()
	kickNode.buffer = kickBuffer;
	kickNode.loop = true;
	kickNode.start(0);

	melNode = actx.createBufferSource()
	melNode.buffer = melBuf;
	melNode.loop = true;
	melNode.start(0);

	synNode = actx.createBufferSource();
	synNode.buffer = synBuf;
	synNode.loop = true;
	synNode.start(0);
	synNode2 = actx.createBufferSource();
	synNode2.buffer = synBuf2;
	synNode2.loop = true;
	synNode2.start(0);

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

	  var filter = actx.createBiquadFilter();
	  filter.type = 0;
	  filter.Q.value = 4;
	  filter.frequency.value = 2000;

	var melEnv = Env(0.001, 0.08, 0.2);
	melEnv.inp(melNode);
	melEnv.outp(filter);

	var hatEnv = Env(0.001, 0.01, 0.03);
	hatEnv.inp(melNode);
	hatEnv.outp(filter);


	delayNode.connect(delayNode2);
	delayNode2.connect(delayGain);
	delayGain.connect(gainMaster);

	var synEnv = Env(0.04, 0.1, 0.05);
	synEnv.inp(synNode);
	synEnv.inp(synNode2);

function createSineWaveArray(durationSeconds, freqHz, amplitude, sampleRate)
{
    var length = timeToSampleFrame(durationSeconds, sampleRate);
    var signal = new Float32Array(length);
    var omega = 2 * Math.PI * freqHz / sampleRate;
    var halfAmplitude = amplitude / 2;

    for (var k = 0; k < length; ++k) {
        signal[k] = halfAmplitude + halfAmplitude * Math.sin(omega * k);
    }

    return signal;
}


	var synFilter = actx.createBiquadFilter();
	synFilter.type = 0;
	synFilter.Q.value = 10;

	var c = actx.currentTime;

	synFilter.frequency.setValueAtTime(1800, c + n8);
	synFilter.frequency.exponentialRampToValueAtTime(200, c + n8 + n8+ 0.1);
	synFilter.frequency.setValueAtTime(1800, c + n8 + n8+ 0.2);
	synFilter.frequency.exponentialRampToValueAtTime(200, c + n8 + n8+ 0.3);
	synFilter.frequency.setValueAtTime(1800, c + n8 + n8+ 0.4);
	synFilter.frequency.exponentialRampToValueAtTime(200, c + n8+ n8 + 0.5);
	synFilter.frequency.setValueAtTime(700, c + n8+ n8 + 0.6);
	synFilter.frequency.linearRampToValueAtTime(3000, c + n8 + n8+ 0.9);

	var synGain = actx.createGain();
	synGain.gain.value = 0.6;

	synEnv.outp(synFilter);
	synFilter.connect(synGain);
	synGain.connect(gainMaster);

	hatEnv.outp(delayNode);
	filter.connect(gainMaster);

	gainMaster.connect(actx.destination);



	for (var i = 0; i < 24; i++) {
		synEnv.fire(c + (1 + i * 4) * n8 - (n32 / 4));
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