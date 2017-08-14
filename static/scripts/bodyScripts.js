const showForm = function() {
    document.getElementById("tiles").classList.add("faded");
    document.getElementById("add-form").classList.remove("hidden");
}

const hideForm = function() {
    document.getElementById("add-form").classList.add("hidden");
    document.getElementById("tiles").classList.remove("faded");
}