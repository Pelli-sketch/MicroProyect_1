const colors = []
let playing = false;
let level = 0;
let clicks = 0;
let pattern = [];

// Funtions

const restart  = (() => {
    playing = false;    
    pattern = [];
    level = 0;
    $('p').text('SIMON');
});

const checkSequence = (color => {
    if(pattern[clicks] !== color) {
        alert('You lost!');
        restart();
    }
});

const animateClick = ((color, clickClass) => {
    $('#' + color).addClass(clickClass);
    setTimeout(() => {
        $('#' + color).removeClass(clickClass);
    }, 150);
});
const animateSequence = (idx => {
    let color = pattern[idx];
    setTimeout(() => {
        $('#' + color).fadeOut(200).fadein(200);
        if(++idx < patterns.length) {
            animateSequence(idx);
        }
    }, 500);
});

const nextSequence = (() =>{
    let idx = Math.floor(Math.random() * 4);
    let newColor = colors[idx];
    pattern.push(newColor);
    $('p').text(++level);
});

// Event listeners

$('.color-btn').click(e => {
    let color = e.target.id;
    let clickClass = color + '-click';
    if(playing) {
        animateClick(color, clickClass);
        checkSequence(color);
        if(clicks === level) {
            clicks = 0;
            nextSequence();
            animateSequence(0);
        }
    }   
});

$('.play-click').click(() => {
    if(!playing) {
        clicks = 0;
        playing = true;
        nextSequence();
        animateSequence(0);
    }
})