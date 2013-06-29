var tempo = 80,
  n4 = 60 / tempo,
  lastBar = -1,
  bar = 0;
  actx = window.AudioContext || window.webkitAudioContext;

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

		barSampleLength = (n4 * 8) * sr,

		snareBuf = actx.createBuffer(1, n16 * sr, sr),
		snareData = snareBuf.getChannelData(0),

		kickBuffer = actx.createBuffer(1, barSampleLength / 8, sr),
		kickData = kickBuffer.getChannelData(0),

		padLBuf = actx.createBuffer(1, barSampleLength, sr),
		padLData = padLBuf.getChannelData(0),

		padHBuf = actx.createBuffer(1, barSampleLength, sr),
		padHData = padHBuf.getChannelData(0),

		leadBuf = actx.createBuffer(1, barSampleLength, sr),
		leadData = leadBuf.getChannelData(0),

		dropLBuf = actx.createBuffer(1, barSampleLength, sr),
		dropLData = dropLBuf.getChannelData(0),

		dropHBuf = actx.createBuffer(1, barSampleLength, sr),
		dropHData = dropHBuf.getChannelData(0);

	/*

		Assign all the sample data

	*/

	// Sine wave generator
	var i, j,
		sfreq = 70,
		freqDrop = (sfreq - 50) / kickData.length;
	for (i = 0; i < kickData.length; ++i) {
		kickData[i] = Math.sin(i / (sr / (sfreq * 2 * Math.PI)));
		sfreq -= freqDrop;
	}

	// Noise generator
	for (i = 0; i < snareData.length; i++) {
		snareData[i] = (Math.random() * 2 - 1) / 2;
	}

	// Square wave generator
	var synNote = 47,
		steps = [];

	for (i = 0, j = barSampleLength; i < j; i++) {

		// Pads and drop core note
		var note = i < j / 2 ? 3.72 : 2.78;

		// Square notes
		padLData[i] = Math.sin(i / (sr / ((synNote + 0.25) * note * Math.PI))) > 0 ? 0.3 : -0.3;
		padHData[i] = Math.sin(i / (sr / ((synNote - 0.25) * note * Math.PI))) > 0 ? 0.3 : -0.3;

		// VIbrato:
		padLData[i] *= (1 + Math.sin(i * 0.8 * 0.001) * 0.6);
		padHData[i] *= (1 + Math.sin(i * 0.8 * 0.001) * 0.6);

		// Crazy rollercoaster dropnote!
		note -=  (i / (j /8)) * 0.4;
		dropLData[i] = Math.sin(i / (sr / ((synNote + 0.25) * note * Math.PI))) > 0 ? 0.4 : -0.4;
		dropHData[i] = Math.sin(i / (sr / ((synNote - 0.25) * note * Math.PI))) > 0 ? 0.4 : -0.4;

		// Set the sawtooth notes: 	115.5 = F4. -56 = F3. -28 = C4 .... -23 = C# ...-18/-19 = D. 28 = A . 55 = C5
		step = 111.5 + [-56, -28, 0, +28, 0, 55, -56, +28, 0, -28, 0, +28, 0, 55, -56, 28][i / (j / 16) | 0];
		var freq = sr / (step * 2 * Math.PI);
		leadData[i] = (((i % freq) / (freq / 2)) - 1) * 0.06;
		leadData[i] *= 1 + Math.sin(i * 0.3 * 0.001 + (Math.PI / 4)) * 0.7; // Vibrato

	}

	/*

		Create the nodes

	*/

	var kickNode = createNode(kickBuffer),
		kickEnv = Env(0.001, 0.08, 0.2),

		snareNode = createNode(snareBuf),
		snareEnv = Env(0.001, 0.04, 0.13),
		hatEnv = Env(0.001, 0.01, 0.03),

		padLNode = createNode(padLBuf),
		padHNode = createNode(padHBuf),
		padEnv = Env(0.045, 0.5, 0.05),

		leadNode = createNode(leadBuf),
		leadEnv = Env(n32, n4 + n4, n64),

		dropLNode = createNode(dropLBuf),
		dropHNode = createNode(dropHBuf),
		dropEnv = Env(0.045, 0.5, 0.05),

		delayNode = actx.createDelay(),
		delayNode2 = actx.createDelay(),
		delayNode3 = actx.createDelay(),
		delayGain = actx.createGain(),

		gainMaster = actx.createGain(),

		hatFilter = actx.createBiquadFilter(),
		leadFilter = actx.createBiquadFilter(),
		padFilter = actx.createBiquadFilter();


	/*

		Node settings

	*/

	hatFilter.type = 0;
	hatFilter.Q.value = 4;
	hatFilter.frequency.value = 2000;

	leadFilter.type = 0;
	leadFilter.Q.value = 5;
	leadFilter.frequency.value = 1700;

	padFilter.type = 0;
	padFilter.Q.value = 10;
	padFilter.frequency.value = 700;


	delayGain.gain.value = 0.2;
	delayGain.connect(gainMaster);
	delayGain.connect(delayNode);

	/*

		Join everything up together

	*/
	gainMaster.gain.value = 2.0;
	gainMaster.connect(actx.destination);

	// delay line
	delayNode.connect(delayNode2);
	delayNode2.connect(delayGain);
	delayNode.delayTime.value = n16;
	delayNode2.delayTime.value = n8;
	delayNode3.delayTime.value = n32 * 0.75;
	delayNode3.connect(leadFilter);


	kickEnv.inp(kickNode);
	kickEnv.outp(gainMaster);

	snareEnv.inp(snareNode);
	snareEnv.outp(hatFilter);

	hatEnv.inp(snareNode);
	hatEnv.outp(delayNode);
	hatEnv.outp(hatFilter);
	hatFilter.connect(gainMaster);

	padEnv.inp(padLNode);
	padEnv.inp(padHNode);

	dropEnv.inp(dropLNode);
	dropEnv.inp(dropHNode);

	leadFilter.connect(delayNode);
	leadFilter.connect(gainMaster);

	leadEnv.inp(leadNode);
	leadEnv.outp(leadFilter);
	leadEnv.outp(delayNode3);

	padFilter.connect(gainMaster);

	padEnv.outp(padFilter);
	dropEnv.outp(padFilter);

	var c = actx.currentTime,
		beat = [0,0,0,0];

	/*

		Sequence up a song

	*/

	// This many bars...
	for (var i = 0; i < 24; i++) {

		// Four on the floor
		for (var j = 0; j < 4; j++) {
			beat[j] = c + (i * 4 + j) * n4;
			j % 2 == 1 && kickEnv.fire(c + ((j+1) + i * 4) * n4);
		}

		// Pad bass
		if(i > 3) {
			if (i < 11) {
				padEnv.fire(c + beat[0]);
			} else {
				if (i === 1) {
					dropNode.start(0);
					dropNode.start(1);
				}
				padEnv.stop(c+ beat[0]);
				dropEnv.fire(c + beat[0]);
			}
		}

		// Pad bass's Wahhhh filter
		if (i > 11){
			wah(c + beat[0])
			wah(c + beat[2]);
		};

		// Twinkly lead
		if(i < 11 || i > 19) {
			leadEnv.fire(c + beat[0] - (n32 * 0.85));
		} else {
			leadEnv.stop(beat[0]);
		}

		// Hats n snare
		if (i > 3) {
			snareEnv.fire(beat[1]);
			if (i < 11 ) {
				hatEnv.fire(beat[1] + n8 + n16);
				hatEnv.fire(beat[2] + n4 + n8 + n16);
			}

			snareEnv.fire(beat[3]);
			if (i % 2 === 1) {
				//snareEnv.fire(beat[3] + n16 + n8);
				snareEnv.fire(beat[3] + n8 + n16);
			}
		}
		// Leading snare
		i == 3 && snareEnv.fire(beat[3] + n8);
	}

	/*

		Helpers and classes

	*/

	function Env(a, d, r) {
		var node = actx.createGain();
		node.gain.value = 0;
		return {
			fire: function (off) {
				node.gain.setValueAtTime(0, off);
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
			stop: function(off) {
				node.gain.setValueAtTime(0, off);
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

	function wah(off) {
		var freq = padFilter.frequency;
		var lastBeat = off,
			low = 200,
			hi = 2000;
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
	}

}());