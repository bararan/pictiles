const showForm = function() {
    document.getElementById("tiles").classList.add("faded");
    document.getElementById("add-form").classList.remove("hidden");
}

const hideForm = function() {
    document.getElementById("add-form").classList.add("hidden");
    document.getElementById("tiles").classList.remove("faded");
}

const createGrid = function() {
    let grid = document.querySelector(".waterfall");
    waterfall(grid);
}
window.onload = function() {
    createGrid();
}