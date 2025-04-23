document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elementer ---
    // ... (alle eksisterende elementer)
    const formulaSelect = document.getElementById('formula-select');
    const checkFormulaButton = document.getElementById('check-formula-button');
    const formulaResultP = document.getElementById('formula-result');

    // --- Spillets tilstand ---
    // ... (som før)

    // --- Formel Alternativer ---
    const formulaOptions = [
        // { text: "M(n) = n + 1", correct: false }, // For enkel
        { text: "M(n) = n * 2", correct: false },
        { text: "M(n) = n² - 1", correct: false }, // n^2 - 1
        // { text: "M(n) = 2n + 1", correct: false }, // Forveksling med rekursiv
        { text: "M(n) = 3^n - 1", correct: false }, // Feil base
        { text: "M(n) = 2^n - 1", correct: true }, // Riktig svar! 2^n - 1
        { text: "M(n) = 2^(n-1)", correct: false }, // Nesten riktig
        { text: "M(n) = n!", correct: false }, // Fakultet (vokser for fort)
        { text: "M(n) = 2 * (n-1) + 1", correct: false }, // Lineær feil
        { text: "M(n) = (n-1) * (n+1)", correct: false }, // Samme som n^2-1
        { text: "M(n) = 2^n + 1", correct: false } // Feil fortegn
    ];

    // --- Hjelpefunksjoner ---
    // ... (calculateMinMoves, updateMoveCounter, updateMinMovesDisplay som før)

    function populateFormulaOptions() {
        formulaSelect.innerHTML = '<option value="">-- Velg en formel --</option>'; // Tøm og legg til default

        // Bland alternativene for variasjon (Fisher-Yates shuffle)
        let shuffledOptions = [...formulaOptions];
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }

        shuffledOptions.forEach((formula, index) => {
            const option = document.createElement('option');
            // Vi lagrer om den er korrekt i en data-attributt
            // Verdien kan bare være indeksen eller selve teksten
            option.value = index; // Bruker index som verdi
            option.textContent = formula.text;
            option.dataset.correct = formula.correct; // Viktig! Lagrer bool som string
            formulaSelect.appendChild(option);
        });
    }

    function checkSelectedFormula() {
        const selectedIndex = formulaSelect.value;
        formulaResultP.textContent = ''; // Tøm forrige resultat
        formulaResultP.className = ''; // Fjern klasser

        if (selectedIndex === "") {
            formulaResultP.textContent = 'Vennligst velg et alternativ.';
            return;
        }

        const selectedOption = formulaSelect.options[formulaSelect.selectedIndex];
        const isCorrect = selectedOption.dataset.correct === 'true'; // Hent fra data-attributt

        if (isCorrect) {
            formulaResultP.textContent = '🎉 Riktig! Formelen er M(n) = 2ⁿ - 1.';
            formulaResultP.classList.add('correct');
        } else {
            formulaResultP.textContent = '🤔 Ikke helt. Se på mønsteret 1, 3, 7, 15... Prøv igjen!';
            formulaResultP.classList.add('incorrect');
        }
    }


    // --- Kjernefunksjoner ---
    // ... (createDiskElement, render, initGame, isValidMove, moveDisk, checkWinCondition, handleTowerClick som før)


    // --- Event Listeners ---
    resetButton.addEventListener('click', () => initGame(numDisks));

    diskCountSelect.addEventListener('change', (e) => {
        const newDiskCount = parseInt(e.target.value, 10);
        initGame(newDiskCount);
    });

    towerElements.forEach((towerEl, index) => {
        towerEl.addEventListener('click', () => handleTowerClick(index));
    });

    // Ny lytter for formel-sjekk knappen
    checkFormulaButton.addEventListener('click', checkSelectedFormula);


    // --- Initialiser spillet ---
    populateFormulaOptions(); // Fyll ut formelvalgene
    initGame(parseInt(diskCountSelect.value, 10)); // Start spillet

}); // Slutt på DOMContentLoaded
