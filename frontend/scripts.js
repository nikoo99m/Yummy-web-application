document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 Page Loaded - Fetching initial recipes...");
    fetchRecipes();

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    if (!searchInput || !searchButton) {
        console.error("Error: Missing searchInput or searchButton element!");
        return;
    }

    searchInput.addEventListener("keydown", function (event) {
        console.log(`🔍 Key pressed: ${event.key}`);

        if (event.key === "Enter") {
            event.preventDefault();
            console.log("Enter key detected, triggering search button click...");
            searchButton.click();
        }
    });
});



let currentPage = 1;
const recipesPerPage = 5;
let allRecipes = [];
let originalRecipes = [];

function fetchRecipes(url = "https://yum2-production.up.railway.app/api/recipes") {
    console.log("\ud83c\udf0d Fetching recipes from:", url);

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log("\u2705 Fetched data:", data);
            originalRecipes = [...data];

            allRecipes = [...originalRecipes];
            currentPage = 1;

            displayRecipes();
            updatePaginationButtons();
        })
        .catch(error => console.error("\u274c Error fetching recipes:", error));
}

function toggleSection(recipeId, section) {
    console.log(`📖 Toggling ${section} for recipe ID: ${recipeId}`);

    const sections = ["ingredients", "instructions", "details"];

    sections.forEach(sec => {
        const secDiv = document.getElementById(`${sec}-${recipeId}`);
        if (secDiv && sec !== section) {
            secDiv.style.display = "none";
        }
    });

    const sectionDiv = document.getElementById(`${section}-${recipeId}`);
    if (!sectionDiv) {
        console.error(`❌ Error: Element #${section}-${recipeId} not found!`);
        return;
    }

    if (sectionDiv.style.display === "none" || sectionDiv.innerHTML === "") {
        console.log(`🌍 Fetching ${section} for: ${recipeId}`);

        fetch(`https://yum2-production.up.railway.app/api/recipes/${recipeId}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(recipe => {
                console.log(`✅ Fetched ${section} details:`, recipe);

                if (section === "ingredients") {
                    sectionDiv.innerHTML = `
                        <p><strong>🥕 Ingredients:</strong></p>
                        <div class="scroll-container">
                            <ul class="ingredients-list">
                                ${recipe.ingredients.map(ingredient => `<li>${ingredient.trim()}</li>`).join("")}
                            </ul>
                        </div>
                    `;
                } else if (section === "instructions") {
                    console.log("📌 Debugging: Raw Instructions Array", recipe.instructions);

                    if (!recipe.instructions || !Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
                        sectionDiv.innerHTML = `<p style="color:red;">❌ No instructions found.</p>`;
                        return;
                    }

                    let mergedInstructions = [];
                    let currentSentence = "";

                    recipe.instructions.forEach((step) => {
                        step = step.trim();
                        if (!step) return;

                        if (step.endsWith(".") || step.endsWith("!") || step.endsWith(",")) {
                            currentSentence += (currentSentence ? " " : "") + step;
                            if (step.endsWith(".")) {
                                mergedInstructions.push(currentSentence.trim());
                                currentSentence = "";
                            }
                        } else {
                            currentSentence += (currentSentence ? " " : "") + step;
                        }
                    });

                    if (currentSentence) {
                        mergedInstructions.push(currentSentence.trim());
                    }

                    console.log("🔹 Fixed Instructions:", mergedInstructions);

                    // ✅ Add numbering to each step
                    const formattedInstructions = mergedInstructions
                        .map((step, index) => `<p class="instruction-item"><strong>Step ${index + 1}:</strong> ${step}</p>`)
                        .join('');

                    sectionDiv.innerHTML = `
                        <p><strong>📝 Instructions:</strong></p>
                        <div class="scroll-container">
                            <div class="instruction-list">
                                ${formattedInstructions}
                            </div>
                        </div>
                    `;
                } else if (section === "details") {
                    sectionDiv.innerHTML = `
                        <p><strong>⏳ Cooking Time:</strong> ${recipe.cooking_time} minutes</p>
                        <p><strong>🍽️ Food Type:</strong> ${recipe.food_type}</p>
                        <p><strong>🍲 Servings:</strong> ${recipe.servings ? recipe.servings : "Not specified"}</p>
                    `;
                }

                sectionDiv.style.display = "block";
            })
            .catch(error => {
                console.error(`❌ Error fetching ${section} details:`, error);
                sectionDiv.innerHTML = `<p style="color:red;">Error loading ${section}.</p>`;
            });
    } else {
        console.log(`🔽 Hiding ${section} for: ${recipeId}`);
        sectionDiv.style.display = "none";
    }
}



function displayRecipes() {
    const recipeList = document.getElementById("recipe-list");
    recipeList.innerHTML = "";

    const startIndex = (currentPage - 1) * recipesPerPage;
    const endIndex = startIndex + recipesPerPage;
    const recipesToShow = allRecipes.slice(startIndex, endIndex);

    if (recipesToShow.length === 0) {
        recipeList.innerHTML = "<p>No recipes available.</p>";
        return;
    }

    recipesToShow.forEach(recipe => {
        let li = document.createElement("li");
        li.innerHTML = `
            <img class="recipe-image" src="${recipe.image || 'placeholder.jpg'}" alt="${recipe.title}">
            <strong>\ud83c\udf7d️ ${recipe.title || "Missing Title"}</strong>
            <p>${recipe.description || "Missing Description"}</p>

            <div class="recipe-buttons">
                <button class="recipe-button" onclick="toggleSection(${recipe.id}, 'ingredients')">\ud83d\udccb Show Ingredients</button>
                <button class="recipe-button" onclick="toggleSection(${recipe.id}, 'instructions')">\ud83d\udcdd Show Instructions</button>
                <button class="recipe-button" onclick="toggleSection(${recipe.id}, 'details')">ℹ️ More Details</button>
            </div>

            <div id="ingredients-${recipe.id}" class="recipe-section" style="display: none;"></div>
            <div id="instructions-${recipe.id}" class="recipe-section" style="display: none;"></div>
            <div id="details-${recipe.id}" class="recipe-section" style="display: none;"></div>
        `;
        recipeList.appendChild(li);
    });

    updatePaginationButtons();
}

function changePage(direction) {
    console.log(`\ud83d\udd04 Preparing to change page...`);
    const totalPages = Math.ceil(allRecipes.length / recipesPerPage);

    if ((direction === -1 && currentPage === 1) || (direction === 1 && currentPage >= totalPages)) {
        console.log("\u274c No more pages available.");
        return;
    }

    console.log(`\ud83d\udcda Changing page from ${currentPage} to ${currentPage + direction}`);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    setTimeout(() => {
        currentPage += direction;
        displayRecipes();
        updatePaginationButtons();
    }, 300);
}

function updatePaginationButtons() {
    const totalPages = Math.ceil(allRecipes.length / recipesPerPage);
    document.getElementById("pageNumber").textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById("prevPage").disabled = (currentPage <= 1);
    document.getElementById("nextPage").disabled = (currentPage >= totalPages || totalPages === 0);
}

function searchRecipes() {
    const searchQuery = document.getElementById("searchInput").value.toLowerCase().trim();
    const searchType = document.getElementById("searchType").value;


    let filteredRecipes = [];

    if (searchQuery === "") {
        filteredRecipes = [...originalRecipes];
    } else {
        filteredRecipes = originalRecipes.filter(recipe => {
            if (searchType === "title") {
                return recipe.title.toLowerCase().includes(searchQuery);
            } else if (searchType === "ingredient") {
                return recipe.ingredients.some(ing => ing.toLowerCase().includes(searchQuery));
            } else if (searchType === "cooking-time") {
                const maxTime = parseInt(searchQuery);
                return !isNaN(maxTime) && recipe.cooking_time <= maxTime;
            } else if (searchType === "type") {
                const normalizedFoodType = recipe.food_type.replace(/_/g, " ").toLowerCase();
                return normalizedFoodType.includes(searchQuery);
            }
            return false;
        });
    }

    allRecipes = filteredRecipes;

    currentPage = 1;
    displayRecipes();

    if (filteredRecipes.length === 0) {
        document.getElementById("recipe-list").innerHTML = "<p>No recipes found.</p>";
    }
}

