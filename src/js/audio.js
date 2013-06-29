var tempo = 80,
  n4 = 60 / tempo,
  lastBar = -1,
  bar = 0;
  actx = window.AudioContext || window.webkitAudioContext,
  _ramp = "linearRampToValueAtTime",
  _set = "setValueAtTime";

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
      	n2b = n4 * 8,

		barSampleLength = n2b * sr,

		bufAndData = [n16, n4, n2b, n2b, n2b, n2b, n2b].map(function (len) {

			var buf = actx.createBuffer(1, len * sr, sr);
			return [buf, buf.getChannelData(0)];

		}),

		b = {
			"snare": 0,
			"kick": 1,
			"padL": 2,
			"padH": 3,
			"lead": 4,
			"dropL": 5,
			"dropH": 6
		};

	/*

		Assign all the sample data

	*/

	// Sine wave generator
	var i, j,
		sfreq = 70,
		freqDrop = (sfreq - 50) / bufAndData[b.kick][1].length;
	for (i = 0; i < bufAndData[b.kick][1].length; ++i) {
		bufAndData[b.kick][1][i] = Math.sin(i / (sr / (sfreq * 2 * Math.PI)));
		sfreq -= freqDrop;
	}

	// Noise generator
	for (i = 0; i < bufAndData[b.snare][1].length; i++) {
		bufAndData[b.snare][1][i] = (Math.random() * 2 - 1) / 2;
	}

	// Square wave generator
	var synNote = 47,
		steps = [];

	for (i = 0, j = barSampleLength; i < j; i++) {

		// Pads and drop core note
		var note = i < j / 2 ? 3.72 : 2.78;

		// Square notes
		bufAndData[b.padL][1][i] = Math.sin(i / (sr / ((synNote + 0.25) * note * Math.PI))) > 0 ? 0.3 : -0.3;
		bufAndData[b.padH][1][i] = Math.sin(i / (sr / ((synNote - 0.25) * note * Math.PI))) > 0 ? 0.3 : -0.3;

		// VIbrato:
		bufAndData[b.padL][1][i] *= (1 + Math.sin(i * 0.0007)* 0.7);
		bufAndData[b.padH][1][i] *= (1 + Math.sin(i * 0.0007) * 0.7);

		// Crazy rollercoaster dropnote!
		note -=  (i / (j /8)) * 0.4;
		bufAndData[b.dropL][1][i] = Math.sin(i / (sr / ((synNote + 0.25) * note * Math.PI))) > 0 ? 0.4 : -0.4;
		bufAndData[b.dropH][1][i] = Math.sin(i / (sr / ((synNote - 0.25) * note * Math.PI))) > 0 ? 0.4 : -0.4;

		// Set the sawtooth notes: 	115.5 = F4. -56 = F3. -28 = C4 .... -23 = C# ...-18/-19 = D. 28 = A . 55 = C5
		step = 111.5 + [-56, -28, 0, +28, 0, 55, -56, +28, 0, -28, 0, +28, 0, 55, -56, 28][i / (j / 16) | 0];
		var freq = sr / (step * 2 * Math.PI);
		bufAndData[b.lead][1][i] = (((i % freq) / (freq / 2)) - 1) * 0.06;
		bufAndData[b.lead][1][i] *= 1 + Math.sin(i * 0.3 * 0.001 + (Math.PI / 4)) * 0.7; // Vibrato

	}

	/*

		Create the nodes

	*/

	var kickNode = createNode(b.kick),
		kickEnv = Env(0.001, 0.08, 0.2),

		snareNode = createNode(b.snare),
		snareEnv = Env(0.001, 0.04, 0.13),
		hatEnv = Env(0.001, 0.01, 0.03),

		padLNode = createNode(b.padL),
		padHNode = createNode(b.padH),
		padEnv = Env(0.045, 0.5, 0.05),

		leadNode = createNode(b.lead),
		leadEnv = Env(n32, n4 + n4, n64),

		dropLNode = createNode(b.dropL),
		dropHNode = createNode(b.dropH),
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

	delayNode.delayTime.value = n16;
	delayNode2.delayTime.value = n8;
	delayNode3.delayTime.value = n32 * 0.75;

	gainMaster.gain.value = 2.0;
	delayGain.gain.value = 0.2;

	/*

		Join everything up together

	*/

	delayNode.connect(delayNode2);
	delayNode2.connect(delayGain);
	delayNode3.connect(leadFilter);
	delayGain.connect(gainMaster);
	delayGain.connect(delayNode);

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

	gainMaster.connect(actx.destination);

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
		var node = actx.createGain(),
			gain = node.gain;
		gain.value = 0;
		return {
			fire: function (off) {
				gain[_set](0, off);
				gain[_ramp](0, off);
				gain[_ramp](1, a + off);
				gain[_ramp](0.3, d + off);
				gain[_ramp](0, r + off);
			},
			inp: function(src) {
				src.connect(node);
			},
			outp: function(dest) {
 				node.connect(dest);
			},
			stop: function(off) {
				gain[_set](0, off);
			}
		}
	};

	function createNode(buffer) {
		var node = actx.createBufferSource();
		node.buffer = bufAndData[buffer][0];
		node.loop = true;
		node.start(0);
		return node;
	}

	function wah(off) {
		var freq = padFilter.frequency;

		for (var i = 0; i < 14; i+=2) {
			var tm = i < 8 ? n8 : n64;
			freq[_set](2000, off + (tm * i));
			freq[_ramp](200, off + (tm * (i + 1)));
		}

	}

}());