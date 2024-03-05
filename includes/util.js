// function midiToFreq(note) {
// 	return 440 * Math.pow(2, ((note-69)/12.0));
// }

function random(min, max) {
	if (typeof min === "object") {
        // handles array input
        if (arguments.length < 2) {
            // returns a single element from array
            return min[Math.floor(Math.random()*min.length)];
        }
        else {
            // returns new array of random elements from input array
            var subset = [];
            for (var i = 0; i < max; i++) {
                var element = min[Math.floor(Math.random()*min.length)];
                subset.push(element);
            }
            return subset;
        }
	} else if (arguments.length < 2) {
        // handles single input
        // returns random float between 0 and input (exclusive)
		return Math.random() * min;
	} else {
        // handles min/max input
        // returns random float between min and max (exclusive)
	    var diff = max - min;
	    return ((Math.random() * diff) + min);
	}
}

function shuffle(array) {
    if (typeof array !== "object") {
        console.log("shuffle() input must be an array!");
        return NaN;
    }

    var currentIndex = array.length;
    var temp;
    var randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temp = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temp;
    }

    return array;
}

function theEnd() {
    play = false;

    // display ending text
    var finale = document.createElement("div");
    text = document.createTextNode("The End");
    finale.appendChild(text);
    finale.className = "splash";
	wrapper = document.createElement("div");
	wrapper.className = "wrapper";
	wrapper.id = "container";
    wrapper.appendChild(finale);
    document.body.appendChild(wrapper);
	console.log("the end");
}
