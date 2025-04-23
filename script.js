document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elementer ---
    const diskCountSelect = document.getElementById('disk-count');
    const resetButton = document.getElementById('reset-button');
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

    // --- Spillets tilstand ---
    let numDisks = 3;
    let moves = 0;
    let gameState = []; // Array av arrays, f.eks. [[3, 2, 1], [], []] (største nederst)
    let selectedDisk = null; // { element: DOMElement, size: number, fromTower: number }
    let diskColorMap = {}; // For å lagre farger per skive

    // --- Hjelpefunksjoner ---
    function getDiskColors() {
        // Henter fargelisten fra CSS-variabelen
        const colorString = getComputedStyle(document.documentElement).getPropertyValue('--disk-colors').trim();
        return colorString.split(',').map(color => color.trim());
    }

    function calculateMinMoves(n) {
        return Math.pow(2, n) - 1;
    }

    function updateMoveCounter() {
        moveCountSpan.textContent = moves;
    }

    function updateMinMovesDisplay(n) {
         minMovesSpan.textContent = calculateMinMoves(n);
    }

    // --- Kjernefunksjoner ---

    function createDiskElement(size) {
        const disk = document.createElement('div');
        disk.classList.add('disk');
        disk.dataset.size = size; // Lagrer størrelsen

        // Beregn bredde basert på størrelse og maks bredde
        const minWidthFactor = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--min-disk-width-factor'));
        const maxWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-disk-width'));
        // Lineær skalering av bredde
        const widthPercentage = minWidthFactor + (1 - minWidthFactor) * (size / numDisks);
        disk.style.width = `${widthPercentage * 100}%`;
        disk.style.maxWidth = `${maxWidth * widthPercentage}px`; // For å respektere maksbredde

        // Sett farge
        if (!diskColorMap[size]) {
             const colors = getDiskColors();
             // Tildel farger syklisk hvis flere skiver enn farger
             diskColorMap[size] = colors[(size - 1) % colors.length];
        }
        disk.style.backgroundColor = diskColorMap[size];

        // Optional: Vis nummer på skiven
        // disk.textContent = size;

        return disk;
    }

    function render() {
        // 1. Tøm tårnene i DOM
        towers.forEach(tower => tower.innerHTML = '');

        // 2. Gå gjennom gameState og tegn skivene
        gameState.forEach((disks, towerIndex) => {
            // Viktig: gameState har største skive først (indeks 0),
            // men flexbox column-reverse stabler siste element øverst.
            // Så vi reverserer *ikke* her når vi legger til i DOM.
            disks.forEach(diskSize => {
                const diskElement = createDiskElement(diskSize);
                towers[towerIndex].appendChild(diskElement);
            });
        });

        // Fjern 'selected' klasse fra alle disker (i tilfelle)
        document.querySelectorAll('.disk.selected').forEach(d => d.classList.remove('selected'));
        // Nullstill valgt disk visuelt
        if (selectedDisk && selectedDisk.element) {
             // selectedDisk.element.classList.remove('selected'); // Gjort over
        }
    }

    function initGame(diskCount) {
        numDisks = diskCount;
        moves = 0;
        selectedDisk = null;
        diskColorMap = {}; // Nullstill fargekartet

        // Initialiser gameState: Alle skiver på første tårn, største nederst
        gameState = [[], [], []];
        for (let i = numDisks; i >= 1; i--) {
            gameState[0].push(i);
        }

        updateMoveCounter();
        updateMinMovesDisplay(numDisks);
        winMessageDiv.style.display = 'none'; // Skjul vinnermelding
        render(); // Tegn spillet
    }

    function isValidMove(fromTowerIdx, toTowerIdx) {
        if (fromTowerIdx === toTowerIdx) return false; // Kan ikke flytte til samme tårn

        const fromTower = gameState[fromTowerIdx];
        const toTower = gameState[toTowerIdx];

        if (fromTower.length === 0) return false; // Kan ikke flytte fra et tomt tårn

        const diskToMoveSize = fromTower[fromTower.length - 1]; // Siste element = øverste skive

        if (toTower.length === 0) return true; // Kan alltid flytte til et tomt tårn

        const topDiskOnTargetSize = toTower[toTower.length - 1];

        return diskToMoveSize < topDiskOnTargetSize; // Kan kun flytte til en større skive
    }

    function moveDisk(fromTowerIdx, toTowerIdx) {
        const diskSize = gameState[fromTowerIdx].pop(); // Fjern fra kilde (fjerner siste/øverste)
        gameState[toTowerIdx].push(diskSize); // Legg til på mål (legges til sist/øverst)
        moves++;
        updateMoveCounter();
        render(); // Tegn på nytt
        checkWinCondition();
    }

    function checkWinCondition() {
        // Vunnet hvis alle skiver er på tårn 1 eller 2 (og ikke på tårn 0)
        if (gameState[0].length === 0 && (gameState[1].length === numDisks || gameState[2].length === numDisks)) {
            winMessageDiv.style.display = 'block';
             // Optional: Sammenlign med minimum antall trekk
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
        // Hvis ingen skive er valgt ennå: Velg en skive
        if (!selectedDisk) {
            const clickedTowerState = gameState[towerIndex];
            if (clickedTowerState.length > 0) {
                const topDiskSize = clickedTowerState[clickedTowerState.length - 1];
                // Finn den øverste skiven i DOM for dette tårnet
                const topDiskElement = towers[towerIndex].lastElementChild; // Siste element pga flex-direction: column-reverse
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
        // Hvis en skive allerede er valgt: Prøv å flytte den
        else {
            const fromTowerIdx = selectedDisk.fromTower;
            const toTowerIdx = towerIndex;

            // Fjern visuell markering uansett
            if(selectedDisk.element) selectedDisk.element.classList.remove('selected');

            if (isValidMove(fromTowerIdx, toTowerIdx)) {
                moveDisk(fromTowerIdx, toTowerIdx);
            } else {
                // Ugyldig trekk - gi gjerne en visuell/lyd tilbakemelding her
                console.log("Ugyldig trekk!");
                 // Optional: rist litt på valgt skive eller tårn?
                 if(selectedDisk.element) {
                    selectedDisk.element.style.animation = 'shake 0.5s';
                    setTimeout(() => {
                         if(selectedDisk.element) selectedDisk.element.style.animation = '';
                    }, 500);
                 }
            }
            // Nullstill valget etter forsøk på flytting
            selectedDisk = null;
        }
    }

     // --- CSS for shake-animasjon (legg til i style.css eller her) ---
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-3px); }
        }
    `;
    document.head.appendChild(styleSheet);


    // --- Event Listeners ---
    resetButton.addEventListener('click', () => initGame(numDisks));

    diskCountSelect.addEventListener('change', (e) => {
        const newDiskCount = parseInt(e.target.value, 10);
        initGame(newDiskCount);
    });

    // Legg til klikk-lyttere på hvert tårn-element (ikke bare disk-området)
    towerElements.forEach((towerEl, index) => {
        towerEl.addEventListener('click', () => handleTowerClick(index));
    });

    // --- Initialiser spillet ---
    initGame(parseInt(diskCountSelect.value, 10)); // Start med verdien i selectoren
});
