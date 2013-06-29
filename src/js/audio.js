var tempo = 80,
  n4 = 60 / tempo,
  lastBar = -1,
  bar = 0,
  actx = window["AudioContext"] || window["webkitAudioContext"],
  _vat = "ValueAtTime",
  _ramp = "linearRampTo" + _vat,
  _set = "set" + _vat,
  _con = "connect",
  _create = "create",
  _c_filter = _create + "BiquadFilter",
  _c_delay = _create + "Delay",
  _c_gain = _create + "Gain",
  _c_buffer = _create + "Buffer";

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

	// TODO: remove these helpful constants!
	snare = 0,
	kick = 1,
	padL = 2,
	padH = 3,
	lead = 4,
	dropL = 5,
	dropH = 6,

	// These are the lenghts of the 7 instruments
	ins = [n16, n4, n2b, n2b, n2b, n2b, n2b].map(function (len) {

		var buf = actx[_c_buffer](1, len * sr, sr);
		return [buf, buf.getChannelData(0)];

	});

/*

	Assign all the sample data

*/

// Sine wave generator
var i, j,
	sfreq = 70,
	freqDrop = (sfreq - 50) / ins[kick][1].length;
for (i = 0; i < ins[kick][1].length; ++i) {
	ins[kick][1][i] = Math.sin(i / (sr / (sfreq * 2 * Math.PI))) * 0.6;
	sfreq -= freqDrop;
}

// Noise generator
for (i = 0; i < ins[snare][1].length; i++) {
	ins[snare][1][i] = (Math.random() * 2 - 1) / 2;
}

// Square wave generator
var synNote = 47;

// Loop for 2 full bars
for (i = 0, j = n2b * sr; i < j; i++) {

	// Pads and drop core note
	var note = i < j / 2 ? 3.72 : 2.78,
		square = function (isLeft, volume) {
			return Math.sin(i / (sr / ((synNote + (isLeft ? 0.25 : -0.25)) * note * Math.PI))) > 0 ? volume : -volume;
		};

	// Square pad notes
	ins[padL][1][i] = square(true, 0.25);
	ins[padH][1][i] = square(false, 0.25);

	// Pad vibrato:
	ins[padL][1][i] *= (1 + Math.sin(i * 0.0007)*  0.7);
	ins[padH][1][i] *= (1 + Math.sin(i * 0.0007) * 0.7);

	// Crazy rollercoaster dropnote!
	note -=  (i / (j / 8)) * 0.4;
	ins[dropL][1][i] = square(true, 0.3);
	ins[dropH][1][i] = square(false, 0.3);

	// Set the sawtooth notes: 	115.5 = F4. -56 = F3. -28 = C4 .... -23 = C# ...-18/-19 = D. 28 = A . 55 = C5
	step = 111.5 + [-56, -28, 0, +28, 0, 55, -56, +28, 0, -28, 0, +28, 0, 55, -56, 28][i / (j / 16) | 0];
	var freq = sr / (step * 2 * Math.PI);
	ins[lead][1][i] = (((i % freq) / (freq / 2)) - 1) * 0.06;
	ins[lead][1][i] *= 1 + Math.sin(i * 0.0003 + (Math.PI / 4)) * 0.7; // Vibrato

}

/*

	Create the nodes

*/

var kickNode = createNode(kick),
	kickEnv = Env(0.001, 0.08, 0.2),

	snareNode = createNode(snare),
	snareEnv = Env(0.001, 0.09, 0.33),
	hatEnv = Env(0.001, 0.01, 0.03),
	cymEnv = Env(0.1, 0.01, 0.1),

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
cymEnv[_con](snareNode);
cymEnv[_con](0, percFilter);

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
for (i = 0; i < 28; i++) {

	// Four on the floor
	for (j = 0; j < 4; j++) {
		beat[j] = c + (i * 4 + j) * n4;
		j % 2 == 1 && kickEnv.fire(c + ((j+1) + i * 4) * n4);
	}

	// Pad bass
	if(i > 7) {
		if (i < 15) {
			padEnv.fire(c + beat[0]);
		} else {
			// Pad bass's Wahhhh filter
			if(i > 15) {
				wah(c + beat[0])
				wah(c + beat[2]);
			}
			padEnv.stop(c+ beat[0]);
			dropEnv.fire(c + beat[0]);
		}

		// Hats n snare
		snareEnv.fire(beat[1]);
		snareEnv.fire(beat[3]);
		i % 2 && snareEnv.fire(beat[3] + n8 + n16); // Skippy snare
	}
		i == 7 && snareEnv.fire(beat[3] + n8); // Leading snare on bar (Can lose this if we need bytes!)

	// Twinkly lead && hihats
	if(i < 15 || i > 23) {
		leadEnv.fire(c + beat[0] - (n32 * 0.85));

		// Hta
		hatEnv.fire(beat[1] + n8 + n16);
		hatEnv.fire(beat[2] + n4 + n8 + n16);
		//cymEnv.fire(beat[3] + n8 + n16); // Leading snare on bar (Can lose this if we need bytes!)

	} else {
		leadEnv.stop(beat[0]);
	}

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
			src && src[_con](node);
			dst && node[_con](dst);

		},
		stop: function(off) {
			gain[_set](0, off);
		}
	}
};

function createNode(buffer) {
	var node = actx[_c_buffer + "Source"]();
	node.buffer = ins[buffer][0];
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

