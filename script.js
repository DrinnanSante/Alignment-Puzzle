/* script.js */

// Constants
const MIN_COVERAGE = 2; // Each part of the image should be covered at least twice
const PIECE_WIDTH = 80;  // Adjust as needed
const PIECE_HEIGHT = 80; // Adjust as needed
const COVERAGE_CELL_SIZE = 40; // Size of each cell in the coverage map

const board = document.getElementById('board');
const piecesContainer = document.getElementById('pieces-container');
let currentZIndex = 1;

window.onload = function() {
    const referenceImage = document.getElementById('reference-image');

    // Ensure the reference image is loaded
    function initialize() {
        // Get the displayed size of the reference image
        const refImageWidth = referenceImage.clientWidth;
        const refImageHeight = referenceImage.clientHeight;

        // Set the board dimensions to match the reference image
        board.style.width = refImageWidth + 'px';
        board.style.height = refImageHeight + 'px';

        // Load the puzzle image
        const puzzleImage = new Image();
        puzzleImage.src = 'images/puzzle.jpg'; // Ensure this path is correct

        puzzleImage.onload = function() {
            sliceImage(puzzleImage);
        };
    }

    if (referenceImage.complete) {
        initialize();
    } else {
        referenceImage.onload = initialize;
    }
};

function sliceImage(image) {
    const imgWidth = image.width;
    const imgHeight = image.height;

    // Get the displayed size of the board
    const boardRect = board.getBoundingClientRect();
    const boardWidth = boardRect.width;
    const boardHeight = boardRect.height;

    // Calculate the scaling factors
    const scaleX = boardWidth / imgWidth;
    const scaleY = boardHeight / imgHeight;

    // Adjusted piece size in the original image's scale
    const adjustedPieceWidth = PIECE_WIDTH / scaleX;
    const adjustedPieceHeight = PIECE_HEIGHT / scaleY;

    // Create a coverage map to track coverage of each part of the image
    const coverageMapObj = createCoverageMap(imgWidth, imgHeight);

    const pieces = [];
    let attempts = 0;
    const maxAttempts = 50000; // Increased limit to allow more pieces

    while (!isCoverageComplete(coverageMapObj, MIN_COVERAGE) && attempts < maxAttempts) {
        attempts++;

        // Randomly select the top-left corner for the piece within the image bounds
        const maxX = imgWidth - adjustedPieceWidth;
        const maxY = imgHeight - adjustedPieceHeight;

        const startX = Math.floor(Math.random() * (maxX + 1));
        const startY = Math.floor(Math.random() * (maxY + 1));

        // Update coverage map
        updateCoverageMap(coverageMapObj, startX, startY, adjustedPieceWidth, adjustedPieceHeight);

        // Create the piece
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = PIECE_WIDTH;
        canvas.height = PIECE_HEIGHT;

        ctx.drawImage(
            image,
            startX,
            startY,
            adjustedPieceWidth,
            adjustedPieceHeight,
            0,
            0,
            PIECE_WIDTH,
            PIECE_HEIGHT
        );

        const pieceImg = new Image();
        pieceImg.src = canvas.toDataURL();

        pieces.push({
            img: pieceImg,
            pieceWidth: PIECE_WIDTH,
            pieceHeight: PIECE_HEIGHT
        });
    }

    // Shuffle the pieces
    pieces.sort(() => Math.random() - 0.5);

    // Create piece elements
    pieces.forEach((pieceObj) => {
        createPiece(pieceObj);
    });
}

function createPiece(pieceObj) {
    const { img } = pieceObj;
    const piece = document.createElement('div');
    piece.classList.add('piece');
    piece.style.width = PIECE_WIDTH + 'px';
    piece.style.height = PIECE_HEIGHT + 'px';
    piece.appendChild(img);
    piecesContainer.appendChild(piece);

    piece.addEventListener('mousedown', dragMouseDown);
}

function dragMouseDown(e) {
    e.preventDefault();
    const piece = this;
    let shiftX = e.clientX - piece.getBoundingClientRect().left;
    let shiftY = e.clientY - piece.getBoundingClientRect().top;

    // Move the piece to the body to allow free movement across the screen
    document.body.appendChild(piece);

    piece.style.position = 'absolute';
    piece.style.zIndex = currentZIndex++;

    moveAt(e.pageX, e.pageY);

    function moveAt(pageX, pageY) {
        piece.style.left = pageX - shiftX + 'px';
        piece.style.top = pageY - shiftY + 'px';
    }

    function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
    }

    function onMouseUp() {
        // Remove the event listeners when the mouse button is released
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    // Attach the event listeners to the document
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Prevent default drag behavior
    piece.ondragstart = function() {
        return false;
    };
}

piecesContainer.ondragstart = () => false; // Prevent default drag behavior

// Helper functions for coverage map
function createCoverageMap(imgWidth, imgHeight) {
    const cellWidth = COVERAGE_CELL_SIZE;
    const cellHeight = COVERAGE_CELL_SIZE;

    const rows = Math.ceil(imgHeight / cellHeight);
    const cols = Math.ceil(imgWidth / cellWidth);

    const map = [];
    for (let y = 0; y < rows; y++) {
        map[y] = [];
        for (let x = 0; x < cols; x++) {
            map[y][x] = 0; // Initialize coverage count to 0
        }
    }
    return { map, cellWidth, cellHeight };
}

function updateCoverageMap(mapObj, startX, startY, pieceWidth, pieceHeight) {
    const { map, cellWidth, cellHeight } = mapObj;
    const rows = map.length;
    const cols = map[0].length;

    const imgWidth = cols * cellWidth;
    const imgHeight = rows * cellHeight;

    const startCol = Math.floor(startX / cellWidth);
    const startRow = Math.floor(startY / cellHeight);

    const endX = Math.min(startX + pieceWidth, imgWidth);
    const endY = Math.min(startY + pieceHeight, imgHeight);

    const endCol = Math.floor((endX - 1) / cellWidth);
    const endRow = Math.floor((endY - 1) / cellHeight);

    for (let y = startRow; y <= endRow; y++) {
        for (let x = startCol; x <= endCol; x++) {
            map[y][x]++;
        }
    }
}

function isCoverageComplete(mapObj, minCoverage) {
    const { map } = mapObj;
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] < minCoverage) {
                return false;
            }
        }
    }
    return true;
}
