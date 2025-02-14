// -----------------------------------------
// 1. Array functions for the game logic
// -----------------------------------------

// Arrays to store values
let array1 = [1, 2, 3];
let array2 = [1];

// Get the buttons by ID
const botonVerde = document.getElementById('green');
const botonRojo = document.getElementById('red');
const botonAmarillo = document.getElementById('yellow');
const botonAzul = document.getElementById('blue');

// Assign click events to each button
botonVerde.addEventListener('click', () => buttonInteraction(0, 'green'));
botonRojo.addEventListener('click', () => buttonInteraction(1, 'red'));
botonAzul.addEventListener('click', () => buttonInteraction(2, 'blue'));
botonAmarillo.addEventListener('click', () => buttonInteraction(3, 'yellow'));

// Function to handle button interactions
function buttonInteraction(value, buttonId) {
    addValue(value);
    flashButton(buttonId);
}

// Function to add a value to the array
function addValue(valor) {
  array2.push(valor); // Add value to array
  
  console.log('Array actual:', array2); // Show the array in the console
  compareArrays(array1, array2);
}

// Function to flash a given button element by its ID
function flashButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    // Remove flash class if already present 
    button.classList.remove('flash');
    void button.offsetWidth; // Force reflow
  
    // Add the flash class to start the animation
    button.classList.add('flash');
  
    // Remove the class after the animation completes (0.3s here)
    setTimeout(() => {
      button.classList.remove('flash');
    }, 300);
}

function compareArrays(array1, array2) {
    let areEqual = true;


    // Compare the common elements
    for (let i = 0; i < array2.length; i++) {
        if (array1[i] !== array2[i]) {
            console.log(`Different at position ${i}: ${array1[i]} and ${array2[i]}`);
            areEqual = false;
            array2.length = 0;
            return; // Exit the function if there are differences
        }
    }

    // If all common elements are equal
    if (areEqual) {
        console.log("All common elements are equal.");
        if (array1.length === array2.length) {
            console.log("The arrays are equal. Updating arrays...");

            // Add an element to array1
            let newElement = generateRandomNumber();
            array1.push(newElement);
            console.log(`Element ${newElement} was added to array1.`);

            // Empty array2
            array2.length = 0;
            console.log("array2 was emptied.");
        }
    }

    // Show the current state of the arrays
    console.log("Current state:");
    console.log("array1:", array1);
    console.log("array2:", array2);

    return
}

// Function to generate a random number
function generateRandomNumber() {
    return Math.floor(Math.random() * 4);
}


  