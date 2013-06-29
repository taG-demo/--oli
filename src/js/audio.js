var tempo = 80,
  n4 = 60 / tempo,
  lastBar = -1,
  bar = 0;
  actx = window.AudioContext || window.webkitAudioContext,
  _ramp = "linearRampToValueAtTime",
  _set = "setValueAtTime",
  _con = "connect",
  _c_filter = "createBiquadFilter",
  _c_delay = "createDelay",
  _c_gain = "createGain";

if (!actx) {
	throw("No audio.");
}
actx = new actx();


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

	// TODO: remove these helpful constants!
	snare = 0,
	kick = 1,
	padL = 2,
	padH = 3,
	lead = 4,
	dropL = 5,
	dropH = 6;

/*

	Assign all the sample data

*/

// Sine wave generator
var i, j,
	sfreq = 70,
	freqDrop = (sfreq - 50) / bufAndData[kick][1].length;
for (i = 0; i < bufAndData[kick][1].length; ++i) {
	bufAndData[kick][1][i] = Math.sin(i / (sr / (sfreq * 2 * Math.PI)));
	sfreq -= freqDrop;
}

// Noise generator
for (i = 0; i < bufAndData[snare][1].length; i++) {
	bufAndData[snare][1][i] = (Math.random() * 2 - 1) / 2;
}

// Square wave generator
var synNote = 47;

for (i = 0, j = barSampleLength; i < j; i++) {

	// Pads and drop core note
	var note = i < j / 2 ? 3.72 : 2.78;

	// Square notes
	bufAndData[padL][1][i] = Math.sin(i / (sr / ((synNote + 0.25) * note * Math.PI))) > 0 ? 0.3 : -0.3;
	bufAndData[padH][1][i] = Math.sin(i / (sr / ((synNote - 0.25) * note * Math.PI))) > 0 ? 0.3 : -0.3;

	// VIbrato:
	bufAndData[padL][1][i] *= (1 + Math.sin(i * 0.0007)* 0.7);
	bufAndData[padH][1][i] *= (1 + Math.sin(i * 0.0007) * 0.7);

	// Crazy rollercoaster dropnote!
	note -=  (i / (j /8)) * 0.4;
	bufAndData[dropL][1][i] = Math.sin(i / (sr / ((synNote + 0.25) * note * Math.PI))) > 0 ? 0.4 : -0.4;
	bufAndData[dropH][1][i] = Math.sin(i / (sr / ((synNote - 0.25) * note * Math.PI))) > 0 ? 0.4 : -0.4;

	// Set the sawtooth notes: 	115.5 = F4. -56 = F3. -28 = C4 .... -23 = C# ...-18/-19 = D. 28 = A . 55 = C5
	step = 111.5 + [-56, -28, 0, +28, 0, 55, -56, +28, 0, -28, 0, +28, 0, 55, -56, 28][i / (j / 16) | 0];
	var freq = sr / (step * 2 * Math.PI);
	bufAndData[lead][1][i] = (((i % freq) / (freq / 2)) - 1) * 0.06;
	bufAndData[lead][1][i] *= 1 + Math.sin(i * 0.3 * 0.001 + (Math.PI / 4)) * 0.7; // Vibrato

}

/*

	Create the nodes

*/

var kickNode = createNode(kick),
	kickEnv = Env(0.001, 0.08, 0.2),

	snareNode = createNode(snare),
	snareEnv = Env(0.001, 0.09, 0.33),
	hatEnv = Env(0.001, 0.01, 0.03),

	padLNode = createNode(padL),
	padHNode = createNode(padH),
	padEnv = Env(0.045, 0.5, 0.05),

	leadNode = createNode(lead),
	leadEnv = Env(n32, n4 + n4, n64),

	dropLNode = createNode(dropL),
	dropHNode = createNode(dropH),
	dropEnv = Env(0.045, 0.5, 0.05),

	delayNode = actx[_c_delay](),
	delayNode2 = actx[_c_delay](),
	delayNode3 = actx[_c_delay](),

	delayGain = actx[_c_gain](),
	gainMaster = actx[_c_gain](),

	percFilter = actx[_c_filter](),
	leadFilter = actx[_c_filter](),
	padFilter = actx[_c_filter]();


/*

	Node settings

*/

percFilter.type = 0;
percFilter.Q.value = 8;
percFilter.frequency.value = 2200;

leadFilter.type = 0;
leadFilter.Q.value = 5;
leadFilter.frequency.value = 1800;

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

delayNode[_con](delayNode2);
delayNode2[_con](delayGain);
delayNode3[_con](leadFilter);
delayGain[_con](gainMaster);
delayGain[_con](delayNode);

kickEnv[_con](kickNode);
kickEnv[_con](0, gainMaster);

snareEnv[_con](snareNode);
snareEnv[_con](0, percFilter);

hatEnv[_con](snareNode);
hatEnv[_con](0, delayNode);
hatEnv[_con](0, percFilter);
percFilter[_con](gainMaster);

padEnv[_con](padLNode);
padEnv[_con](padHNode);

dropEnv[_con](dropLNode);
dropEnv[_con](dropHNode);

leadFilter[_con](delayNode);
leadFilter[_con](gainMaster);

leadEnv[_con](leadNode);
leadEnv[_con](0, leadFilter);
leadEnv[_con](0, delayNode3);

padFilter[_con](gainMaster);

padEnv[_con](0, padFilter);
dropEnv[_con](0, padFilter);

gainMaster[_con](actx.destination);

var c = actx.currentTime,
	beat = [0,0,0,0];

/*

	Sequence up a song

*/

// This many bars...
for (i = 0; i < 24; i++) {

	// Four on the floor
	for (j = 0; j < 4; j++) {
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
	var node = actx[_c_gain](),
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
		// Dodgy "double use" functions. saves a call to "function" ;)
		connect: function(src, dst) {
			src && src.connect(node);
			dst && node.connect(dst);

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

