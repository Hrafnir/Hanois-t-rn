document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elementer ---
    const gameArea = document.getElementById('game-area');
    const towerElements = [
        document.getElementById('tower-0'),
        document.getElementById('tower-1'),
        document.getElementById('tower-2')
    ];
    const numDisksSelect = document.getElementById('num-disks');
    const resetButton = document.getElementById('reset-button');
    const moveCountElement = document.getElementById('move-count');
    const minMovesElement = document.getElementById('min-moves');
    const winMessageElement = document.getElementById('win-message');
    const formulaSelect = document.getElementById('formula-select');
    const checkFormulaButton = document.getElementById('check-formula-button');
    const formulaFeedback = document.getElementById('formula-feedback');

    // --- Spillets Tilstand ---
    let towers = [[], [], []]; // Array av arrays som holder skivenes størrelser
    let numDisks = 3;         // Standard antall skiver
    let moveCount = 0;
    let selectedDisk = null;    // { size: number, element: HTMLElement }
    let sourceTowerIndex = -1;  // Indeks for tårnet den valgte skiven kom fra

    // --- Initialisering ---

    // Populer select dropdown for antall skiver (3 til 10)
    for (let i = 3; i <= 10; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        numDisksSelect.appendChild(option);
    }
    numDisksSelect.value = numDisks; // Sett startverdi

    // Funksjon for å starte/nullstille spillet
    function initGame(numberOfDisks) {
        numDisks = parseInt(numberOfDisks);
        towers = [[], [], []]; // Nullstill tårn-arrayene
        for (let i = numDisks; i >= 1; i--) {
            towers[0].push(i); // Legg alle skiver (største nederst) på første tårn
        }

        moveCount = 0;
        selectedDisk = null;
        sourceTowerIndex = -1;

        updateMoveCounter();
        updateMinMoves();
        renderGame(); // Tegn spillbrettet
        winMessageElement.style.display = 'none'; // Skjul vinnermelding
        formulaFeedback.textContent = ''; // Nullstill formel-feedback
        formulaFeedback.className = ''; // Fjern CSS klasser
    }

    // --- Rendring ---

    // Funksjon for å tegne spillbrettet basert på 'towers'-state
    function renderGame() {
        towerElements.forEach((towerElement, towerIndex) => {
            const disksContainer = towerElement.querySelector('.disks');
            disksContainer.innerHTML = ''; // Tøm tårnet før vi tegner på nytt

            towers[towerIndex].forEach(diskSize => {
                const diskElement = document.createElement('div');
                diskElement.classList.add('disk');
                diskElement.dataset.size = diskSize; // Lagre størrelsen
                // Bruk CSS custom property for dynamisk bredde
                diskElement.style.setProperty('--disk-size', diskSize);
                // Farge settes via CSS basert på data-size
                disksContainer.appendChild(diskElement);
            });
        });
    }

    // --- Spillogikk ---

    // Håndterer klikk på et tårn
    function handleTowerClick(clickedTowerIndex) {
        if (selectedDisk) {
            // --- Forsøker å flytte en valgt skive ---
            const targetTower = towers[clickedTowerIndex];
            const topDiskOnTarget = targetTower.length > 0 ? targetTower[targetTower.length - 1] : null;

            // Valider flyttingen
            if (clickedTowerIndex === sourceTowerIndex) {
                // Klikket på samme tårn: Avbryt valg
                deselectDisk();
            } else if (topDiskOnTarget === null || selectedDisk.size < topDiskOnTarget) {
                // Gyldig flytting: Til tomt tårn eller på større skive
                moveDisk(sourceTowerIndex, clickedTowerIndex);
                deselectDisk(); // Fjern markering etter flytting
                checkWinCondition();
            } else {
                // Ugyldig flytting: Kan ikke plassere på mindre skive
                indicateInvalidMove();
                deselectDisk(); // Avbryt valg ved ugyldig forsøk
            }
        } else {
            // --- Forsøker å velge en skive ---
            if (towers[clickedTowerIndex].length > 0) {
                selectDisk(clickedTowerIndex);
            }
        }
    }

    // Velger den øverste skiven fra et tårn
    function selectDisk(towerIndex) {
        sourceTowerIndex = towerIndex;
        const topDiskSize = towers[towerIndex][towers[towerIndex].length - 1];

        // Finn det korresponderende DOM-elementet for den øverste skiven
        const towerElement = towerElements[towerIndex];
        const diskElements = towerElement.querySelectorAll('.disk');
        const topDiskElement = diskElements[diskElements.length - 1]; // Siste element visuelt øverst

        if (topDiskElement) {
            selectedDisk = { size: topDiskSize, element: topDiskElement };
            topDiskElement.classList.add('selected'); // Visuell markering
        } else {
             console.error("Kunne ikke finne DOM-element for skive:", topDiskSize, "på tårn", towerIndex);
             sourceTowerIndex = -1; // Tilbakestill hvis feil
        }
    }

    // Fjerner markeringen fra en valgt skive
    function deselectDisk() {
        if (selectedDisk && selectedDisk.element) {
            selectedDisk.element.classList.remove('selected');
            selectedDisk.element.classList.remove('invalid-move-shake'); // Fjern eventuell risting
        }
        selectedDisk = null;
        sourceTowerIndex = -1;
    }

    // Utfører selve flyttingen av skiven i data-strukturen og oppdaterer tellingen
    function moveDisk(fromTowerIndex, toTowerIndex) {
        const diskToMove = towers[fromTowerIndex].pop(); // Fjern fra kilde
        towers[toTowerIndex].push(diskToMove); // Legg til på mål
        moveCount++;
        updateMoveCounter();
        renderGame(); // Tegn spillet på nytt etter flytting
    }

     // Indikerer et ugyldig flytteforsøk
    function indicateInvalidMove() {
        if (selectedDisk && selectedDisk.element) {
            selectedDisk.element.classList.add('invalid-move-shake');
            // Fjern animasjonsklassen etter at animasjonen er ferdig
            setTimeout(() => {
                if (selectedDisk && selectedDisk.element) { // Sjekk om den fortsatt er valgt
                   selectedDisk.element.classList.remove('invalid-move-shake');
                }
            }, 400); // Matcher CSS animasjonens varighet
        }
         // Vurder en liten lyd eller annen feedback her
    }

    // Oppdaterer trekktelleren i UI
    function updateMoveCounter() {
        moveCountElement.textContent = moveCount;
    }

    // Oppdaterer visningen av minimum antall trekk
    function updateMinMoves() {
        const minMoves = Math.pow(2, numDisks) - 1;
        minMovesElement.textContent = minMoves;
    }

    // Sjekker om spillet er vunnet
    function checkWinCondition() {
        // Spillet er vunnet hvis alle skiver er på tårn 2 eller 3 (og ikke på tårn 0)
        if (towers[0].length === 0 && (towers[1].length === numDisks || towers[2].length === numDisks)) {
            winMessageElement.style.display = 'block';
            // Optional: Disable further moves?
        } else {
            winMessageElement.style.display = 'none';
        }
    }

    // --- Formel Sjekker ---
    function checkSelectedFormula() {
        const selectedValue = formulaSelect.value;
        const correctAnswer = "2^n - 1"; // Verdien fra HTML <option>

        if (selectedValue === correctAnswer) {
            formulaFeedback.textContent = "✅ Riktig! Minimum antall trekk er gitt ved 2ⁿ - 1.";
            formulaFeedback.className = 'correct';
        } else {
             // Finn teksten til det valgte alternativet for bedre feedback
             const selectedOptionText = formulaSelect.options[formulaSelect.selectedIndex].text;
             formulaFeedback.textContent = `❌ Feil. Formelen ${selectedOptionText} gir ikke korrekt antall minimum trekk. Prøv igjen!`;
             formulaFeedback.className = 'incorrect';
        }
    }


    // --- Event Listeners ---

    // Lytt etter klikk innenfor hele spillområdet
    gameArea.addEventListener('click', (event) => {
        // Finn ut hvilket tårn (tower-container) som ble klikket, selv om man klikker på en skive eller pinnen
        const clickedTowerElement = event.target.closest('.tower-container');
        if (clickedTowerElement) {
            const clickedTowerIndex = parseInt(clickedTowerElement.id.split('-')[1]);
            handleTowerClick(clickedTowerIndex);
        }
    });

    // Lytt etter endringer i antall skiver
    numDisksSelect.addEventListener('change', (event) => {
        initGame(event.target.value);
    });

    // Lytt etter klikk på nullstill-knappen
    resetButton.addEventListener('click', () => {
        initGame(numDisks); // Nullstill med gjeldende antall skiver
    });

    // Lytt etter klikk på sjekk-formel knappen
    checkFormulaButton.addEventListener('click', checkSelectedFormula);


    // --- Start Spillet ---
    initGame(numDisks); // Start spillet med standard antall skiver

});
