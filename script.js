document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elementer ---
    const diskCountSelect = document.getElementById('disk-count');
    const resetButton = document.getElementById('reset-button'); // Sikrer at denne er definert
    const moveCountSpan = document.getElementById('move-count');
    const minMovesSpan = document.getElementById('min-moves');
    const winMessageDiv = document.getElementById('win-message');
    const towers = [
        document.getElementById('tower-0').querySelector('.disks'),
        document.getElementById('tower-1').querySelector('.disks'),
        document.getElementById('tower-2').querySelector('.disks')
    ];
    const towerElements = [
        document.getElementById('tower-0'),
        document.getElementById('tower-1'),
        document.getElementById('tower-2')
    ];
    const formulaSelect = document.getElementById('formula-select');
    const checkFormulaButton = document.getElementById('check-formula-button');
    const formulaResultP = document.getElementById('formula-result');

    // --- Spillets tilstand ---
    let numDisks = 3;
    let moves = 0;
    let gameState = []; // Array av arrays, f.eks. [[3, 2, 1], [], []] (største nederst)
    let selectedDisk = null; // { element: DOMElement, size: number, fromTower: number }
    let diskColorMap = {}; // For å lagre farger per skive

    // --- Formel Alternativer ---
    const formulaOptions = [
        { text: "M(n) = n * 2", correct: false },
        { text: "M(n) = n² - 1", correct: false }, // n^2 - 1
        { text: "M(n) = 3ⁿ - 1", correct: false }, // Feil base (bruker n istedenfor ^n for enkel visning)
        { text: "M(n) = 2ⁿ - 1", correct: true }, // Riktig svar! 2^n - 1 (bruker n istedenfor ^n)
        { text: "M(n) = 2ⁿ⁻¹", correct: false }, // Nesten riktig (bruker n-1 istedenfor ^(n-1))
        { text: "M(n) = n!", correct: false }, // Fakultet (vokser for fort)
        { text: "M(n) = 2 * (n-1) + 1", correct: false }, // Lineær feil
        { text: "M(n) = (n-1) * (n+1)", correct: false }, // Samme som n^2-1
        { text: "M(n) = 2ⁿ + 1", correct: false } // Feil fortegn (bruker n istedenfor ^n)
        // Note: Using 'n' instead of superscript for simplicity in the dropdown text.
        // The check logic relies on the 'correct' boolean, not parsing the text.
    ];

    // --- Hjelpefunksjoner ---
    function getDiskColors() {
        const colorString = getComputedStyle(document.documentElement).getPropertyValue('--disk-colors').trim();
        return colorString.split(',').map(color => color.trim());
    }

    function calculateMinMoves(n) {
        // Bruker Math.pow for 2^n
        return Math.pow(2, n) - 1;
    }

    function updateMoveCounter() {
        moveCountSpan.textContent = moves;
    }

    function updateMinMovesDisplay(n) {
         minMovesSpan.textContent = calculateMinMoves(n);
    }

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
            option.value = index; // Bruker index som verdi for enkel referanse
            option.textContent = formula.text;
            option.dataset.correct = formula.correct; // Lagrer boolsk verdi som string
            formulaSelect.appendChild(option);
        });
    }

    function checkSelectedFormula() {
        const selectedIndex = formulaSelect.value;
        formulaResultP.textContent = ''; // Tøm forrige resultat
        formulaResultP.className = ''; // Fjern CSS klasser

        if (selectedIndex === "") {
            formulaResultP.textContent = 'Vennligst velg et alternativ.';
            return;
        }

        // Finn det valgte <option> elementet for å lese data-attributten
        const selectedOptionElement = formulaSelect.options[formulaSelect.selectedIndex];
        const isCorrect = selectedOptionElement.dataset.correct === 'true'; // Sammenlign med string 'true'

        if (isCorrect) {
            formulaResultP.textContent = '🎉 Riktig! Formelen er M(n) = 2ⁿ - 1.';
            formulaResultP.classList.add('correct');
        } else {
            formulaResultP.textContent = '🤔 Ikke helt. Se på mønsteret 1, 3, 7, 15... Prøv igjen!';
            formulaResultP.classList.add('incorrect');
        }
    }

    // --- Kjernefunksjoner ---

    function createDiskElement(size) {
        const disk = document.createElement('div');
        disk.classList.add('disk');
        disk.dataset.size = size; // Lagrer størrelsen

        // Beregn bredde basert på størrelse og maks bredde
        const minWidthFactor = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--min-disk-width-factor'));
        const maxWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-disk-width'));
        const widthPercentage = minWidthFactor + (1 - minWidthFactor) * (size / numDisks);
        disk.style.width = `${widthPercentage * 100}%`;
        disk.style.maxWidth = `${maxWidth * widthPercentage}px`;

        // Sett farge
        if (!diskColorMap[size]) {
             const colors = getDiskColors();
             diskColorMap[size] = colors[(size - 1) % colors.length];
        }
        disk.style.backgroundColor = diskColorMap[size];

        return disk;
    }

    function render() {
        // 1. Tøm tårnene i DOM
        towers.forEach(tower => tower.innerHTML = '');

        // 2. Gå gjennom gameState og tegn skivene
        gameState.forEach((disks, towerIndex) => {
            disks.forEach(diskSize => {
                const diskElement = createDiskElement(diskSize);
                towers[towerIndex].appendChild(diskElement); // Legger til nederst, CSS flex-reverse fikser visning
            });
        });

        // Fjern 'selected' klasse fra alle disker
        document.querySelectorAll('.disk.selected').forEach(d => d.classList.remove('selected'));
    }

    function initGame(diskCount) {
        numDisks = diskCount;
        moves = 0;
        selectedDisk = null;
        diskColorMap = {}; // Nullstill fargekartet

        // Initialiser gameState: Alle skiver på første tårn, største nederst i arrayet
        gameState = [[], [], []];
        for (let i = numDisks; i >= 1; i--) {
            gameState[0].push(i); // Største legges til først -> blir på indeks 0
        }

        updateMoveCounter();
        updateMinMovesDisplay(numDisks);
        winMessageDiv.style.display = 'none'; // Skjul vinnermelding
        formulaResultP.textContent = ''; // Tøm formelresultat
        formulaResultP.className = '';
        // Optionally reset formula selection:
        // formulaSelect.value = "";
        render(); // Tegn spillet
    }

    function isValidMove(fromTowerIdx, toTowerIdx) {
        if (fromTowerIdx === toTowerIdx) return false;

        const fromTower = gameState[fromTowerIdx];
        const toTower = gameState[toTowerIdx];

        if (fromTower.length === 0) return false; // Kan ikke flytte fra tomt tårn

        // Siste element i arrayet er den øverste skiven
        const diskToMoveSize = fromTower[fromTower.length - 1];

        if (toTower.length === 0) return true; // Kan alltid flytte til tomt tårn

        const topDiskOnTargetSize = toTower[toTower.length - 1];

        return diskToMoveSize < topDiskOnTargetSize; // Kan kun flytte til større skive
    }

    function moveDisk(fromTowerIdx, toTowerIdx) {
        // Fjern øverste skive fra kildetårnet (siste element)
        const diskSize = gameState[fromTowerIdx].pop();
        // Legg til skiven øverst på måltårnet (som siste element)
        gameState[toTowerIdx].push(diskSize);
        moves++;
        updateMoveCounter();
        render(); // Tegn på nytt
        checkWinCondition();
    }

    function checkWinCondition() {
        // Vunnet hvis alle skiver er på tårn 1 eller 2
        if (gameState[0].length === 0 && (gameState[1].length === numDisks || gameState[2].length === numDisks)) {
            winMessageDiv.style.display = 'block';
            const minMoves = calculateMinMoves(numDisks);
            if (moves === minMoves) {
                winMessageDiv.textContent = `🎉 Perfekt! Du klarte det på ${moves} trekk (minimum)! 🎉`;
            } else {
                 winMessageDiv.textContent = `🎉 Gratulerer! Du klarte det på ${moves} trekk! (Minimum er ${minMoves}) 🎉`;
            }
        } else {
            winMessageDiv.style.display = 'none';
        }
    }

    function handleTowerClick(towerIndex) {
        // Hvis ingen skive er valgt ennå: Velg den øverste fra klikket tårn
        if (!selectedDisk) {
            const clickedTowerState = gameState[towerIndex];
            if (clickedTowerState.length > 0) {
                const topDiskSize = clickedTowerState[clickedTowerState.length - 1];
                // Finn den øverste skiven i DOM for dette tårnet
                const topDiskElement = towers[towerIndex].lastElementChild;
                if(topDiskElement){
                    selectedDisk = {
                        element: topDiskElement,
                        size: topDiskSize,
                        fromTower: towerIndex
                    };
                    topDiskElement.classList.add('selected'); // Visuelt valg
                }
            }
        }
        // Hvis en skive allerede er valgt: Prøv å flytte den til klikket tårn
        else {
            const fromTowerIdx = selectedDisk.fromTower;
            const toTowerIdx = towerIndex;

            // Fjern visuell markering uansett
            if(selectedDisk.element) selectedDisk.element.classList.remove('selected');

            if (isValidMove(fromTowerIdx, toTowerIdx)) {
                moveDisk(fromTowerIdx, toTowerIdx);
            } else {
                // Ugyldig trekk - gi tilbakemelding
                console.log("Ugyldig trekk!");
                 if(selectedDisk.element && fromTowerIdx !== toTowerIdx) { // Unngå shake ved klikk på samme tårn
                    selectedDisk.element.style.animation = 'shake 0.4s';
                    // Fjern animasjonen etter den er ferdig for å kunne kjøre igjen
                    setTimeout(() => {
                         if(selectedDisk && selectedDisk.element) { // Sjekk om den fortsatt eksisterer
                            selectedDisk.element.style.animation = '';
                         }
                    }, 400);
                 }
            }
            // Nullstill valget etter forsøk på flytting (både gyldig og ugyldig)
            selectedDisk = null;
        }
    }

     // --- CSS for shake-animasjon (bør egentlig være i CSS-fil, men ok her for enkelhet) ---
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
        }
    `;
    document.head.appendChild(styleSheet);

    // --- Event Listeners ---
    resetButton.addEventListener('click', () => {
        // Leser verdien fra selectoren på nytt ved reset
        const currentDiskCount = parseInt(diskCountSelect.value, 10);
        initGame(currentDiskCount);
    });

    diskCountSelect.addEventListener('change', (e) => {
        const newDiskCount = parseInt(e.target.value, 10);
        initGame(newDiskCount);
    });

    towerElements.forEach((towerEl, index) => {
        towerEl.addEventListener('click', () => handleTowerClick(index));
    });

    // Lytter for formel-sjekk knappen
    checkFormulaButton.addEventListener('click', checkSelectedFormula);

    // --- Initialiser spillet ---
    populateFormulaOptions(); // Fyll ut formelvalgene
    initGame(parseInt(diskCountSelect.value, 10)); // Start spillet med standard antall skiver

}); // Slutt på DOMContentLoaded
